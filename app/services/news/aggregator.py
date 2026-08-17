import re
from typing import List, Dict
from app.models.news import NewsItem, NewsCategory
from app.services.news.base_provider import BaseNewsProvider
from app.services.news.rss_provider import RSSNewsProvider
from app.services.news.nse_provider import NSENewsProvider
from app.services.news.yf_news_provider import YFNewsProvider


CATEGORY_PRIORITY_ORDER = [
    (
        NewsCategory.MACRO_ECONOMY,
        [
            "gdp", "inflation", "cpi", "wpi", "fiscal deficit", "forex", "rupee",
            "inr", "macroeconomic", "economic growth", "sovereign yield",
        ],
    ),
    (
        NewsCategory.POLICY_REGULATION,
        [
            "rbi", "sebi", "union budget", "finance minister", "tax", "gst", "tariff",
            "customs duty", "pli scheme", "subsidies", "regulatory", "court", "tribunal",
            "repo rate",
        ],
    ),
    (
        NewsCategory.COMMODITIES_ENERGY,
        [
            "crude", "brent", "oil", "natural gas", "gold", "silver", "metals", "steel",
            "copper", "aluminium", "coal", "opec", "energy prices",
        ],
    ),
    (
        NewsCategory.GEOPOLITICAL,
        [
            "war", "conflict", "geopolitical", "sanctions", "trade war", "tariffs", "middle east",
            "red sea", "taiwan", "russia", "ukraine", "us-china", "iran", "israel",
        ],
    ),
    (
        NewsCategory.CORPORATE_ACTION,
        [
            "quarterly results", "q1 results", "q2 results", "q3 results", "q4 results",
            "q1 profit", "q2 profit", "q3 profit", "q4 profit", "net profit", "revenue up",
            "revenue down", "dividend", "acquisition", "merger", "stake sale", "resigns",
            "appointed", "rating downgrade", "rating upgrade", "insider trading", "promoter",
        ],
    ),
    (
        NewsCategory.GLOBAL_MARKETS,
        [
            "fed", "federal reserve", "wall street", "nasdaq", "dow jones", "s&p 500", "global cues",
            "asian markets", "european markets", "treasury yield",
        ],
    ),
    (
        NewsCategory.SECTOR_INDUSTRY,
        [
            "banking", "nbfc", "automobile", "auto sales", "it sector", "pharma", "infrastructure",
            "real estate", "fmcg", "power sector", "renewable energy", "telecom", "defence",
        ],
    ),
]


def classify_category(title: str, summary: str, default_cat: str) -> str:
    combined_text = f"{title} {summary}".lower()

    for category, keywords in CATEGORY_PRIORITY_ORDER:
        for kw in keywords:
            if re.search(r"\b" + re.escape(kw) + r"\b", combined_text):
                return category.value

    return default_cat or NewsCategory.GENERAL.value


def determine_importance(title: str, category: str) -> str:
    t_lower = title.lower()
    high_impact_keywords = [
        "rbi", "rate cut", "rate hike", "war", "crude spikes", "budget", "sebi ban",
        "sanctions", "fraud", "investigation", "acquisition", "emergency", "crisis",
    ]
    for kw in high_impact_keywords:
        if kw in t_lower:
            return "HIGH"

    if category in [
        NewsCategory.MACRO_ECONOMY.value,
        NewsCategory.POLICY_REGULATION.value,
        NewsCategory.GEOPOLITICAL.value,
    ]:
        return "HIGH"

    return "MEDIUM"


class NewsAggregator:
    """
    Orchestrates multiple news providers, deduplicates by content hash,
    classifies categories, and normalizes news streams.
    """

    def __init__(self, providers: List[BaseNewsProvider] = None):
        self.providers = providers or [
            RSSNewsProvider(),
            NSENewsProvider(),
            YFNewsProvider(),
        ]

    def aggregate(self, limit_per_provider: int = 25) -> List[NewsItem]:
        all_items: List[NewsItem] = []
        seen_ids = set()

        for provider in self.providers:
            try:
                fetched = provider.fetch_news(limit=limit_per_provider)
                for item in fetched:
                    if item.id in seen_ids:
                        continue
                    seen_ids.add(item.id)

                    # Refine category & importance with NLP keyword classifier
                    refined_cat = classify_category(item.title, item.summary or "", item.category)
                    item.category = refined_cat
                    item.importance = determine_importance(item.title, refined_cat)

                    all_items.append(item)
            except Exception:
                continue

        # Sort newest first
        all_items.sort(key=lambda x: x.published_at, reverse=True)
        return all_items
