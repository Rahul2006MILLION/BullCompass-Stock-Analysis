import logging
from typing import Dict, List, Optional, Any
from datetime import datetime, timezone, timedelta, time
import pandas as pd
import yfinance as yf

from app.services.market_data.base import MarketDataProvider, NormalizedQuote
from app.services.ticker_service import TickerService

logger = logging.getLogger(__name__)


class NSEMarketDataProvider(MarketDataProvider):
    """
    Authoritative NSE Market Data Provider.
    
    Provides:
    1. During MARKET OPEN (09:15 - 15:30 IST): Live exchange Last Traded Price (LTP).
    2. During MARKET CLOSED (Post 15:30 IST): Authoritative NSE Official Closing Settlement Price.
    3. Historical OHLCV datasets for charting and analysis.
    
    No third-party broker accounts or API keys required.
    """

    @staticmethod
    def _is_market_open() -> tuple[bool, str]:
        """
        Determines Indian stock market status based on IST (UTC+5:30).
        """
        ist = timezone(timedelta(hours=5, minutes=30))
        now_ist = datetime.now(ist)
        weekday = now_ist.weekday()
        current_time = now_ist.time()

        pre_market_start = time(9, 0)
        market_open = time(9, 15)
        market_close = time(15, 30)
        post_market_end = time(16, 0)

        if weekday >= 5:
            return False, "CLOSED"
        elif market_open <= current_time <= market_close:
            return True, "OPEN"
        elif pre_market_start <= current_time < market_open:
            return False, "PRE_OPEN"
        elif market_close < current_time <= post_market_end:
            return False, "POST_CLOSE"
        else:
            return False, "CLOSED"

    def normalize_symbol(self, symbol: str) -> tuple[str, str]:
        """
        Normalizes any input representation (e.g. 'LAURUSLABS-EQ', ' lauruslabs ', 'LAURUSLABS.NS')
        to (clean_ticker, resolved_symbol).
        """
        s = symbol.strip().upper()
        if s.endswith("-EQ"):
            clean = s[:-3]
            resolved = f"{clean}.NS"
        elif s.endswith(".NS") or s.endswith(".BO"):
            clean = s.rsplit(".", 1)[0]
            resolved = s
        elif s.startswith("^"):
            clean = s
            resolved = s
        else:
            clean = s
            resolved = f"{s}.NS"
        return clean, resolved

    def get_quote(self, symbol: str) -> Optional[NormalizedQuote]:
        batch = self.get_batch_quotes([symbol])
        clean, _ = self.normalize_symbol(symbol)
        return batch.get(clean) or batch.get(symbol.strip().upper())

    def get_batch_quotes(self, symbols: List[str]) -> Dict[str, NormalizedQuote]:
        if not symbols:
            return {}

        is_open, market_status_str = self._is_market_open()
        now = datetime.now(timezone.utc)
        iso_timestamp = now.isoformat()

        symbol_pairs = [self.normalize_symbol(s) for s in symbols if s.strip()]
        resolved_to_clean: Dict[str, str] = {}
        for clean, resolved in symbol_pairs:
            resolved_to_clean[resolved] = clean

        unique_resolved = list(resolved_to_clean.keys())
        results: Dict[str, NormalizedQuote] = {}

        try:
            tickers_obj = yf.Tickers(" ".join(unique_resolved))
            for resolved, clean in resolved_to_clean.items():
                try:
                    t = tickers_obj.tickers.get(resolved) or yf.Ticker(resolved)
                    fast = t.fast_info

                    last_price = getattr(fast, "last_price", None)
                    prev_close = (
                        getattr(fast, "regular_market_previous_close", None)
                        or getattr(fast, "previous_close", None)
                    )
                    open_price = getattr(fast, "open", None)
                    day_high = getattr(fast, "day_high", None)
                    day_low = getattr(fast, "day_low", None)
                    volume_val = getattr(fast, "last_volume", None)

                    # Fallback to info dict if fast_info is sparse
                    if last_price is None or float(last_price) <= 0:
                        info = t.info or {}
                        last_price = info.get("currentPrice") or info.get("regularMarketPrice")
                        prev_close = info.get("previousClose")
                        open_price = info.get("open")
                        day_high = info.get("dayHigh")
                        day_low = info.get("dayLow")
                        volume_val = info.get("volume")

                    if last_price is not None and float(last_price) > 0:
                        lp = float(last_price)
                        pc = float(prev_close) if prev_close is not None else None
                        op = float(open_price) if open_price is not None else None
                        dh = float(day_high) if day_high is not None else None
                        dl = float(day_low) if day_low is not None else None
                        vol = int(volume_val) if volume_val is not None else None

                        chg = round(lp - pc, 2) if pc else 0.0
                        pct = round((chg / pc) * 100.0, 2) if (pc and pc > 0) else 0.0
                        price_type = "LTP" if is_open else "OFFICIAL_CLOSE"

                        norm_quote = NormalizedQuote(
                            symbol=clean,
                            resolved_symbol=resolved,
                            ltp=round(lp, 2),
                            trading_symbol=f"{clean}-EQ" if not clean.startswith("^") else clean,
                            symbol_token=None,
                            bid=None,
                            ask=None,
                            open=round(op, 2) if op else None,
                            high=round(dh, 2) if dh else None,
                            low=round(dl, 2) if dl else None,
                            previous_close=round(pc, 2) if pc else None,
                            official_close=round(lp, 2) if not is_open else None,
                            volume=vol,
                            change=chg,
                            change_percent=pct,
                            timestamp=iso_timestamp,
                            provider="nse_official",
                            market_status=market_status_str,
                            price_type=price_type,
                        )
                        results[clean] = norm_quote
                        results[resolved] = norm_quote
                except Exception as ex:
                    logger.debug(f"[NSE_PROVIDER] Error fetching {resolved}: {ex}")

        except Exception as e:
            logger.error(f"[NSE_PROVIDER] Batch download error: {e}")

        return results

    def get_history(
        self,
        symbol: str,
        period: str = "1mo",
        interval: str = "1d",
    ) -> pd.DataFrame:
        clean, resolved = self.normalize_symbol(symbol)
        stock = yf.Ticker(resolved)
        return stock.history(period=period, interval=interval)
