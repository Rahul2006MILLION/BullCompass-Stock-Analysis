import logging
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone, timedelta
import pandas as pd
import yfinance as yf

from app.config import settings
from app.models.company import Company
from app.services.ticker_service import TickerService
from app.services.market_data.base import MarketDataProvider, NormalizedQuote
from app.services.market_data.factory import get_market_data_provider
from app.services.canonical_valuation_service import CanonicalValuationService
from app.services.market_session import MarketSessionManager

logger = logging.getLogger(__name__)


class StockService:
    """
    Core stock service in BullCompass.
    Delegates all quote acquisition to the CanonicalValuationService, ensuring
    strict session freezing when the market is closed, identical pricing across endpoints,
    and authoritative Angel One LTP valuation when the market is open.
    """

    def __init__(
        self,
        provider: Optional[MarketDataProvider] = None,
        canonical_service: Optional[CanonicalValuationService] = None,
    ):
        self.provider = provider or get_market_data_provider()
        if canonical_service is not None:
            self.canonical_service = canonical_service
        elif provider is not None:
            self.canonical_service = CanonicalValuationService(provider=self.provider)
        else:
            self.canonical_service = CanonicalValuationService.get_instance()
        self.session_manager = self.canonical_service.session_manager

    def get_company_info(self, ticker: str) -> Company:
        """
        Fetch company metadata and current live market valuation.
        """
        resolved_ticker = TickerService.resolve(ticker)
        
        # 1. Fetch live quote through canonical market data provider
        quote = self.provider.get_quote(ticker)
        current_price = quote.ltp if quote and quote.ltp and quote.ltp > 0 else None

        # 2. Fetch company profile metadata via yfinance
        stock = yf.Ticker(resolved_ticker)
        info = stock.info or {}
        if not isinstance(info, dict):
            info = {}

        name = info.get("longName") or info.get("shortName") or ""
        market_cap = info.get("marketCap", 0) or 0

        # Fallback for price if provider was unavailable
        if current_price is None or current_price <= 0.0:
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
        """
        Fetch single stock current price.
        """
        quotes_dict, _, _ = self.canonical_service.get_canonical_quotes([ticker])
        clean = ticker.strip().upper()
        if clean in quotes_dict and quotes_dict[clean].get("current_price"):
            return float(quotes_dict[clean]["current_price"])

        quote = self.provider.get_quote(ticker)
        if quote and quote.ltp and quote.ltp > 0:
            return float(quote.ltp)

        # Fallback to history
        resolved = TickerService.resolve(ticker)
        df = self.provider.get_history(resolved, period="5d")
        if df.empty or "Close" not in df:
            raise ValueError(f"Could not fetch price for {ticker}")

        price = float(df["Close"].dropna().iloc[-1])
        if price <= 0.0:
            raise ValueError(f"Invalid price {price} for {ticker}")

        return price

    def get_batch_quotes(self, tickers: List[str]) -> Dict[str, Dict[str, Any]]:
        """
        Fetches quotes through the CanonicalValuationService.
        Guarantees that when market is closed, quotes remain locked and frozen.
        """
        if not tickers:
            return {}
        quotes_dict, _, _ = self.canonical_service.get_canonical_quotes(tickers)
        return quotes_dict

    @staticmethod
    def is_indian_market_open() -> Dict[str, Any]:
        """
        Determines whether the Indian stock market (NSE/BSE) is currently open via MarketSessionManager.
        """
        session_info = MarketSessionManager.get_instance().get_session_info()
        return {
            "is_open": session_info.is_open,
            "status": session_info.status,
            "current_time_ist": session_info.current_time_ist,
            "timezone": "Asia/Kolkata (IST)",
            "session_id": session_info.session_id,
            "is_frozen": session_info.is_frozen,
            "next_session_start_ist": session_info.next_session_start_ist,
        }