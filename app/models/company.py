from dataclasses import dataclass


@dataclass
class Company:
    ticker: str
    name: str
    sector: str
    industry: str
    country: str
    currency: str
    market_cap: int
    current_price: float