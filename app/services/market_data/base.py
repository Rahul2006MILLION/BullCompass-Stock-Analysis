from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Dict, List, Optional, Any
import pandas as pd


@dataclass
class NormalizedQuote:
    """
    Standardized market quote model.
    Strictly distinguishes Last Traded Price (LTP) from Bid, Ask, and Historical Closes.
    """
    symbol: str
    resolved_symbol: str
    ltp: float                              # Last Traded Price (LTP) ONLY
    trading_symbol: Optional[str] = None    # Angel One / Broker Trading Symbol (e.g. "MRF-EQ")
    symbol_token: Optional[str] = None      # Angel One / Broker Symbol Token (e.g. "2277")
    bid: Optional[float] = None             # Highest current buyer bid
    ask: Optional[float] = None             # Lowest current seller ask
    open: Optional[float] = None            # Session open
    high: Optional[float] = None            # Session day high
    low: Optional[float] = None             # Session day low
    previous_close: Optional[float] = None  # Previous session official close
    official_close: Optional[float] = None  # Official session close / settlement VWAP
    volume: Optional[int] = None            # Session traded volume
    change: float = 0.0                     # ltp - previous_close
    change_percent: float = 0.0             # (change / previous_close) * 100
    timestamp: str = ""                     # ISO 8601 UTC
    provider: str = "unknown"               # Active data provider name
    market_status: str = "CLOSED"           # "OPEN", "CLOSED", "PRE_OPEN", "POST_CLOSE"
    price_type: str = "LTP"                 # "LTP", "OFFICIAL_CLOSE", "DELAYED_TICK"

    def to_dict(self) -> Dict[str, Any]:
        return {
            "ticker": self.symbol,
            "resolved_ticker": self.resolved_symbol,
            "trading_symbol": self.trading_symbol or self.resolved_symbol,
            "symbol_token": self.symbol_token,
            "current_price": self.ltp,
            "ltp": self.ltp,
            "bid": self.bid,
            "ask": self.ask,
            "open": self.open,
            "high": self.high,
            "low": self.low,
            "previous_close": self.previous_close,
            "official_close": self.official_close,
            "volume": self.volume,
            "change": self.change,
            "change_percent": self.change_percent,
            "timestamp": self.timestamp,
            "provider": self.provider,
            "market_status": self.market_status,
            "price_type": self.price_type,
        }


class MarketDataProvider(ABC):
    """
    Abstract interface for market data providers in BullCompass.
    Separates live quote acquisition from historical analysis.
    """

    @abstractmethod
    def get_quote(self, symbol: str) -> Optional[NormalizedQuote]:
        """
        Fetch a normalized live/closing quote for a single symbol using LTP.
        """
        pass

    @abstractmethod
    def get_batch_quotes(self, symbols: List[str]) -> Dict[str, NormalizedQuote]:
        """
        Fetch normalized quotes for a batch of symbols in an optimized manner using LTP.
        """
        pass

    @abstractmethod
    def get_history(
        self,
        symbol: str,
        period: str = "1mo",
        interval: str = "1d",
    ) -> pd.DataFrame:
        """
        Fetch historical OHLCV bar data for charts and indicators.
        """
        pass
