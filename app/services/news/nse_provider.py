import hashlib
import xml.etree.ElementTree as ET
from datetime import datetime
from typing import List
import requests
from bs4 import BeautifulSoup

from app.models.news import NewsItem, NewsCategory
from app.services.news.base_provider import BaseNewsProvider
from app.services.news.rss_provider import clean_html, parse_date_string


NSE_REGULATORY_FEEDS = [
    {
        "source": "NSE & Regulatory Disclosures",
        "url": "https://news.google.com/rss/search?q=NSE+OR+SEBI+OR+RBI+India+when:2d&hl=en-IN&gl=IN&ceid=IN:en",
        "category": NewsCategory.POLICY_REGULATION.value,
    },
    {
        "source": "Indian Corporate Actions & Results",
        "url": "https://news.google.com/rss/search?q=Nifty+stocks+earnings+OR+dividend+OR+acquisition+when:2d&hl=en-IN&gl=IN&ceid=IN:en",
        "category": NewsCategory.CORPORATE_ACTION.value,
    },
]


class NSENewsProvider(BaseNewsProvider):
    """
    Ingests public regulatory filings, SEBI notices, RBI policy news, and corporate actions.
    """

    @property
    def provider_name(self) -> str:
        return "NSE_Regulatory_Announcements"

    def fetch_news(self, limit: int = 30) -> List[NewsItem]:
        items: List[NewsItem] = []
        now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        headers = {
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "application/rss+xml, application/xml, text/xml, */*",
        }

        for feed in NSE_REGULATORY_FEEDS:
            try:
                response = requests.get(feed["url"], headers=headers, timeout=8)
                if response.status_code != 200:
                    continue

                root = ET.fromstring(response.content)
                channel = root.find("channel")
                if channel is None:
                    continue

                for elem in channel.findall("item"):
                    title_elem = elem.find("title")
                    link_elem = elem.find("link")
                    pub_date_elem = elem.find("pubDate")
                    source_elem = elem.find("source")

                    title = clean_html(title_elem.text if title_elem is not None and title_elem.text else "")
                    link = link_elem.text.strip() if link_elem is not None and link_elem.text else ""
                    pub_date = parse_date_string(pub_date_elem.text if pub_date_elem is not None else "")
                    publisher = source_elem.text.strip() if source_elem is not None and source_elem.text else feed["source"]

                    if not title or len(title) < 10:
                        continue

                    id_raw = f"{publisher}:{title.lower().strip()}:{pub_date}"
                    news_id = hashlib.sha256(id_raw.encode("utf-8")).hexdigest()[:16]

                    items.append(
                        NewsItem(
                            id=news_id,
                            title=title,
                            summary=f"Public disclosure & market report from {publisher}",
                            source=publisher,
                            source_url=link,
                            published_at=pub_date,
                            fetched_at=now_str,
                            category=feed["category"],
                            subcategory="Regulatory / Corporate",
                            importance="HIGH" if ("RBI" in title or "SEBI" in title or "Budget" in title) else "MEDIUM",
                            raw_content=title,
                            entities=[],
                        )
                    )

                    if len(items) >= limit:
                        break

            except Exception:
                continue

            if len(items) >= limit:
                break

        return items
