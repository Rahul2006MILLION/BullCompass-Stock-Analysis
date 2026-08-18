from dataclasses import dataclass
from typing import Optional


@dataclass
class WatchlistItem:
    id: Optional[int]
    ticker: str
    company_name: str
    added_at: str
