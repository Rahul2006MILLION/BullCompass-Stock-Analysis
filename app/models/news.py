from dataclasses import dataclass, field
from typing import Optional, List
from enum import Enum


class NewsCategory(str, Enum):
    MACRO_ECONOMY = "Macro & Economy"
    POLICY_REGULATION = "Policy & Regulation"
    COMMODITIES_ENERGY = "Commodities & Energy"
    GEOPOLITICAL = "Geopolitical & Trade"
    SECTOR_INDUSTRY = "Sector & Industry"
    CORPORATE_ACTION = "Corporate & Earnings"
    GLOBAL_MARKETS = "Global Markets"
    GENERAL = "General Market"


class ExposureType(str, Enum):
    DIRECT = "DIRECT"
    UPSTREAM = "UPSTREAM"
    DOWNSTREAM = "DOWNSTREAM"
    SENSITIVE = "SENSITIVE"


class SentimentHint(str, Enum):
    POSITIVE = "POSITIVE"
    NEGATIVE = "NEGATIVE"
    MIXED = "MIXED"
    NEUTRAL = "NEUTRAL"


@dataclass
class EntityExposure:
    ticker: Optional[str]
    sector: Optional[str]
    entity_type: str  # 'COMPANY', 'SECTOR', 'COMMODITY', 'POLICY'
    exposure_type: ExposureType
    sentiment_hint: SentimentHint


@dataclass
class NewsItem:
    id: str  # SHA-256 hash of (source + title + published_at)
    title: str
    summary: Optional[str]
    source: str
    source_url: Optional[str]
    published_at: str
    fetched_at: str
    category: str
    subcategory: Optional[str] = None
    importance: str = "MEDIUM"  # 'HIGH', 'MEDIUM', 'LOW'
    raw_content: Optional[str] = None
    entities: List[EntityExposure] = field(default_factory=list)
