import hashlib
import xml.etree.ElementTree as ET
from datetime import datetime
from typing import List, Dict
import requests
import re
from bs4 import BeautifulSoup

from app.models.news import NewsItem, NewsCategory
from app.services.news.base_provider import BaseNewsProvider


FREE_RSS_FEEDS: List[Dict[str, str]] = [
    {
        "source": "Economic Times - Markets",
        "url": "https://economictimes.indiatimes.com/markets/rssfeeds/1977021501.cms",
        "category": NewsCategory.SECTOR_INDUSTRY.value,
    },
    {
        "source": "Economic Times - Economy",
        "url": "https://economictimes.indiatimes.com/news/economy/rssfeeds/1373380680.cms",
        "category": NewsCategory.MACRO_ECONOMY.value,
    },
    {
        "source": "Livemint - Markets",
        "url": "https://www.livemint.com/rss/markets",
        "category": NewsCategory.SECTOR_INDUSTRY.value,
    },
    {
        "source": "Livemint - Companies",
        "url": "https://www.livemint.com/rss/companies",
        "category": NewsCategory.CORPORATE_ACTION.value,
    },
    {
        "source": "Moneycontrol - Markets",
        "url": "https://www.moneycontrol.com/rss/marketreports.xml",
        "category": NewsCategory.GLOBAL_MARKETS.value,
    },
    {
        "source": "Moneycontrol - Business",
        "url": "https://www.moneycontrol.com/rss/business.xml",
        "category": NewsCategory.SECTOR_INDUSTRY.value,
    },
]


def clean_html(raw_html: str) -> str:
    if not raw_html:
        return ""
    try:
        soup = BeautifulSoup(raw_html, "html.parser")
        return soup.get_text(separator=" ").strip()
    except Exception:
        cleanr = re.compile("<.*?>")
        return re.sub(cleanr, "", raw_html).strip()


def parse_date_string(date_str: str) -> str:
    """Normalize RFC 822 or common RSS date strings to standard ISO format."""
    if not date_str:
        return datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    formats = [
        "%a, %d %b %Y %H:%M:%S %z",
        "%a, %d %b %Y %H:%M:%S %Z",
        "%a, %d %b %Y %H:%M:%S GMT",
        "%d %b %Y %H:%M:%S",
        "%Y-%m-%dT%H:%M:%S%z",
        "%Y-%m-%d %H:%M:%S",
    ]
    for fmt in formats:
        try:
            dt = datetime.strptime(date_str.strip(), fmt)
            return dt.strftime("%Y-%m-%d %H:%M:%S")
        except Exception:
            continue
    return datetime.now().strftime("%Y-%m-%d %H:%M:%S")


class RSSNewsProvider(BaseNewsProvider):
    """
    Ingests public financial news via free and legal RSS feeds using requests.
    """

    @property
    def provider_name(self) -> str:
        return "Free_RSS_Aggregator"

    def fetch_news(self, limit: int = 40) -> List[NewsItem]:
        items: List[NewsItem] = []
        now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        headers = {
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "application/rss+xml, application/xml, text/xml, */*",
        }

        for feed_config in FREE_RSS_FEEDS:
            try:
                response = requests.get(feed_config["url"], headers=headers, timeout=8)
                if response.status_code != 200:
                    continue

                root = ET.fromstring(response.content)
                channel = root.find("channel")
                if channel is None:
                    continue

                for elem in channel.findall("item"):
                    title_elem = elem.find("title")
                    link_elem = elem.find("link")
                    desc_elem = elem.find("description")
                    pub_date_elem = elem.find("pubDate")

                    title = clean_html(title_elem.text if title_elem is not None and title_elem.text else "")
                    link = link_elem.text.strip() if link_elem is not None and link_elem.text else ""
                    summary = clean_html(desc_elem.text if desc_elem is not None and desc_elem.text else "")
                    pub_date = parse_date_string(pub_date_elem.text if pub_date_elem is not None else "")

                    if not title or len(title) < 10:
                        continue

                    # Stable unique ID
                    id_raw = f"{feed_config['source']}:{title.lower().strip()}:{pub_date}"
                    news_id = hashlib.sha256(id_raw.encode("utf-8")).hexdigest()[:16]

                    items.append(
                        NewsItem(
                            id=news_id,
                            title=title,
                            summary=summary,
                            source=feed_config["source"],
                            source_url=link,
                            published_at=pub_date,
                            fetched_at=now_str,
                            category=feed_config["category"],
                            subcategory=None,
                            importance="MEDIUM",
                            raw_content=summary,
                            entities=[],
                        )
                    )

                    if len(items) >= limit:
                        break

            except Exception:
                # Isolated failure: Continue gracefully with other feeds
                continue

            if len(items) >= limit:
                break

        return items
