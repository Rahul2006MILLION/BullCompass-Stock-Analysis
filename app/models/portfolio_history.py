from dataclasses import dataclass


@dataclass
class PortfolioHistory:
    id: int | None
    timestamp: str
    invested_amount: float
    net_worth: float
    profit: float
    return_percentage: float