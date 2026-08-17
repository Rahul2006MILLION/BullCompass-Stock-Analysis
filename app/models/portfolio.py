from dataclasses import dataclass


@dataclass
class PortfolioHolding:
    id: int | None
    ticker: str
    quantity: float
    average_buy_price: float


@dataclass
class PortfolioSummary:
    ticker: str

    quantity: float
    average_buy_price: float

    current_price: float

    investment: float

    current_value: float

    profit: float

    return_percent: float