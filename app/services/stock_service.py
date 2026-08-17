from app.models.company import Company
from app.services.ticker_service import TickerService

import yfinance as yf


class StockService:

    def get_company_info(self, ticker: str) -> Company:
        ticker = TickerService.resolve(ticker)

        info = yf.Ticker(ticker).info

        return Company(
            ticker=ticker,
            name=info.get("longName", ""),
            sector=info.get("sector", ""),
            industry=info.get("industry", ""),
            country=info.get("country", ""),
            currency=info.get("currency", ""),
            market_cap=info.get("marketCap", 0),
            current_price=info.get("currentPrice", 0.0),
        )

    def get_current_price(self, ticker: str) -> float:
        ticker = TickerService.resolve(ticker)

        stock = yf.Ticker(ticker)

        history = stock.history(period="1d")

        if history.empty:
            raise ValueError(f"Could not fetch price for {ticker}")

        return float(history["Close"].iloc[-1])