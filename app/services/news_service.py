from typing import List, Optional, Dict, Any
from app.models.news import NewsItem
from app.database.news_repository import NewsRepository
from app.services.news.aggregator import NewsAggregator


class NewsService:
    """
    High-level domain service for fetching, aggregating, storing, and querying market news.
    """

    def __init__(self, repository: Optional[NewsRepository] = None, aggregator: Optional[NewsAggregator] = None):
        self.repository = repository or NewsRepository()
        self.aggregator = aggregator or NewsAggregator()

    def sync_news(self, limit_per_provider: int = 25) -> int:
        """
        Pull news from all free providers, deduplicate, and persist to database.
        Returns count of new articles ingested.
        """
        items = self.aggregator.aggregate(limit_per_provider=limit_per_provider)
        inserted_count = self.repository.save_news_batch(items)
        return inserted_count

    def get_news_feed(
        self,
        limit: int = 50,
        offset: int = 0,
        category: Optional[str] = None,
        importance: Optional[str] = None,
        source: Optional[str] = None,
        search: Optional[str] = None,
        ticker: Optional[str] = None,
        auto_sync_if_empty: bool = True,
    ) -> List[NewsItem]:
        """
        Retrieve news feed from local database. If empty and auto_sync is enabled, triggers an initial sync.
        """
        count = self.repository.get_news_count()
        if count == 0 and auto_sync_if_empty:
            self.sync_news()

        return self.repository.get_recent_news(
            limit=limit,
            offset=offset,
            category=category,
            importance=importance,
            source=source,
            search=search,
            ticker=ticker,
        )

    def get_news_by_id(self, news_id: str) -> Optional[NewsItem]:
        return self.repository.get_news_by_id(news_id)

    def get_filter_metadata(self) -> Dict[str, Any]:
        return {
            "sources": self.repository.get_sources(),
            "categories": self.repository.get_categories(),
            "total_count": self.repository.get_news_count(),
        }
