import logging
from typing import Dict, List, Optional, Any
from datetime import datetime, timezone
import pandas as pd
import yfinance as yf

from app.services.market_data.base import MarketDataProvider, NormalizedQuote
from app.services.ticker_service import TickerService

logger = logging.getLogger(__name__)


class YahooFinanceProvider(MarketDataProvider):
    """
    Standard Yahoo Finance Provider.
    Primary use: Historical OHLCV datasets for charting / fundamental analytics,
    and fallback quote provider.
    """

    def get_quote(self, symbol: str) -> Optional[NormalizedQuote]:
        batch = self.get_batch_quotes([symbol])
        clean = symbol.strip().upper()
        if clean.endswith(".NS") or clean.endswith(".BO"):
            clean = clean.rsplit(".", 1)[0]
        return batch.get(clean) or batch.get(symbol.strip().upper())

    def get_batch_quotes(self, symbols: List[str]) -> Dict[str, NormalizedQuote]:
        if not symbols:
            return {}

        resolved_map: Dict[str, str] = {}
        for s in symbols:
            clean = s.strip().upper()
            if not clean:
                continue
            if clean.endswith(".NS") or clean.endswith(".BO"):
                raw = clean.rsplit(".", 1)[0]
                resolved_map[raw] = clean
            elif "." in clean or clean.startswith("^"):
                resolved_map[clean] = clean
            else:
                resolved_map[clean] = f"{clean}.NS"

        unique_resolved = list(set(resolved_map.values()))
        results: Dict[str, NormalizedQuote] = {}
        iso_timestamp = datetime.now(timezone.utc).isoformat()

        try:
            tickers_obj = yf.Tickers(" ".join(unique_resolved))
            for orig, resolved in resolved_map.items():
                try:
                    t = tickers_obj.tickers.get(resolved) or yf.Ticker(resolved)
                    fast = t.fast_info
                    last_price = getattr(fast, "last_price", None)
                    prev_close = (
                        getattr(fast, "regular_market_previous_close", None)
                        or getattr(fast, "previous_close", None)
                    )

                    if last_price is None or last_price <= 0:
                        info = t.info or {}
                        last_price = info.get("currentPrice") or info.get("regularMarketPrice")
                        prev_close = info.get("previousClose")

                    if last_price is not None and float(last_price) > 0:
                        lp = float(last_price)
                        pc = float(prev_close) if prev_close else None
                        chg = (lp - pc) if pc else 0.0
                        pct = (chg / pc * 100.0) if pc and pc > 0 else 0.0

                        results[orig] = NormalizedQuote(
                            symbol=orig,
                            resolved_symbol=resolved,
                            ltp=round(lp, 2),
                            previous_close=round(pc, 2) if pc else None,
                            official_close=round(lp, 2),
                            change=round(chg, 2),
                            change_percent=round(pct, 2),
                            timestamp=iso_timestamp,
                            provider="yfinance",
                            market_status="UNKNOWN",
                            price_type="DELAYED_TICK",
                        )
                except Exception as ex:
                    logger.debug(f"[YF_PROVIDER] Failed to fetch {orig}: {ex}")

        except Exception as e:
            logger.error(f"[YF_PROVIDER] Batch download error: {e}")

        return results

    def get_history(
        self,
        symbol: str,
        period: str = "1mo",
        interval: str = "1d",
    ) -> pd.DataFrame:
        resolved = TickerService.resolve(symbol)
        stock = yf.Ticker(resolved)
        return stock.history(period=period, interval=interval)
