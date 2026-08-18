from app.models.company import Company
from app.services.ticker_service import TickerService

import yfinance as yf


class StockService:

    def get_company_info(self, ticker: str) -> Company:
        resolved_ticker = TickerService.resolve(ticker)
        stock = yf.Ticker(resolved_ticker)
        info = stock.info or {}

        if not isinstance(info, dict):
            info = {}

        name = info.get("longName") or info.get("shortName") or ""
        
        current_price = (
            info.get("currentPrice")
            or info.get("regularMarketPrice")
            or info.get("previousClose")
            or info.get("open")
        )

        if current_price is None or float(current_price) <= 0.0:
            try:
                current_price = self.get_current_price(resolved_ticker)
            except Exception:
                current_price = 0.0

        market_cap = info.get("marketCap", 0) or 0

        # Strict validation: listed stock must have a valid company name and positive price
        if not name or float(current_price) <= 0.0:
            raise ValueError(f"We couldn't find a listed stock matching '{ticker}'.")

        return Company(
            ticker=resolved_ticker,
            name=name,
            sector=info.get("sector", "N/A"),
            industry=info.get("industry", "N/A"),
            country=info.get("country", "India"),
            currency=info.get("currency", "INR"),
            market_cap=market_cap,
            current_price=float(current_price),
        )

    def get_current_price(self, ticker: str) -> float:
        resolved_ticker = TickerService.resolve(ticker)
        stock = yf.Ticker(resolved_ticker)

        history = stock.history(period="1d")

        if history.empty:
            raise ValueError(f"Could not fetch price for {ticker}")

        price = float(history["Close"].iloc[-1])
        if price <= 0.0:
            raise ValueError(f"Invalid price {price} for {ticker}")

        return price