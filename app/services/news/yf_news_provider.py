import hashlib
from datetime import datetime
from typing import List, Optional
import yfinance as yf

from app.models.news import NewsItem, NewsCategory
from app.services.news.base_provider import BaseNewsProvider
from app.services.ticker_service import TickerService


DEFAULT_MONITORED_TICKERS = [
    "RELIANCE",
    "TCS",
    "INFY",
    "HDFCBANK",
    "TATAMOTORS",
    "ASIANPAINT",
    "ONGC",
    "ICICIBANK",
    "SBIN",
    "BHARTIARTL",
    "ITC",
    "LT",
]


class YFNewsProvider(BaseNewsProvider):
    """
    Ingests market news directly from public stock ticker news streams via yfinance.
    """

    def __init__(self, tickers: Optional[List[str]] = None):
        self.tickers = tickers or DEFAULT_MONITORED_TICKERS

    @property
    def provider_name(self) -> str:
        return "Yahoo_Finance_Ticker_News"

    def fetch_news(self, limit: int = 30) -> List[NewsItem]:
        items: List[NewsItem] = []
        now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        for symbol in self.tickers:
            try:
                resolved_ticker = TickerService.resolve(symbol)
                ticker_obj = yf.Ticker(resolved_ticker)
                raw_news = ticker_obj.news or []

                for item in raw_news:
                    title = item.get("title") or ""
                    link = item.get("link") or ""
                    publisher = item.get("publisher") or "Market Wire"
                    pub_time_stamp = item.get("providerPublishTime")

                    if not title or len(title) < 10:
                        continue

                    if pub_time_stamp:
                        pub_date = datetime.fromtimestamp(pub_time_stamp).strftime("%Y-%m-%d %H:%M:%S")
                    else:
                        pub_date = now_str

                    id_raw = f"{publisher}:{title.lower().strip()}:{pub_date}"
                    news_id = hashlib.sha256(id_raw.encode("utf-8")).hexdigest()[:16]

                    items.append(
                        NewsItem(
                            id=news_id,
                            title=title,
                            summary=f"Market news related to {symbol.upper()}",
                            source=publisher,
                            source_url=link,
                            published_at=pub_date,
                            fetched_at=now_str,
                            category=NewsCategory.CORPORATE_ACTION.value,
                            subcategory=symbol.upper(),
                            importance="MEDIUM",
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
