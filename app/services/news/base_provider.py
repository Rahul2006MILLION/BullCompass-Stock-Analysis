from abc import ABC, abstractmethod
from typing import List
from app.models.news import NewsItem


class BaseNewsProvider(ABC):
    """
    Abstract base class for all news providers.
    Enables adding new free/public news sources without rewriting application logic.
    """

    @property
    @abstractmethod
    def provider_name(self) -> str:
        """Name of the news provider (e.g. 'RSS_EconomicTimes', 'NSE_Announcements')"""
        pass

    @abstractmethod
    def fetch_news(self, limit: int = 30) -> List[NewsItem]:
        """
        Fetch and normalize news items from the source.
        Must handle its own network errors and return empty list on failure.
        """
        pass
