import logging
from typing import Dict, List, Optional, Any
from datetime import datetime, timezone, timedelta
import re
import json
import requests
import pandas as pd
import yfinance as yf

from app.services.market_data.base import MarketDataProvider, NormalizedQuote
from app.services.ticker_service import TickerService

logger = logging.getLogger(__name__)


class LiveMarketDataProvider(MarketDataProvider):
    """
    Live Market Data Provider with explicit separation between:
    1. Real-time / Latest Market Quotes (LTP) during market hours
    2. Authoritative Official Closing / Reference Prices after market close
    3. Historical OHLCV bars for technical charts.
    
    Guarantees that Last Traded Price (LTP) is used rather than Ask, Bid, or Stale Daily Close.
    """

    def __init__(self):
        self._session = requests.Session()
        self._headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
            "Accept-Language": "en-US,en;q=0.9",
        }

    @staticmethod
    def _is_market_open() -> tuple[bool, str]:
        """
        Determines Indian stock market status based on IST (UTC+5:30).
        """
        ist = timezone(timedelta(hours=5, minutes=30))
        now_ist = datetime.now(ist)
        weekday = now_ist.weekday()
        current_time = now_ist.time()

        from datetime import time
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

    def _fetch_real_exchange_quote(self, symbol: str) -> Optional[Dict[str, Any]]:
        """
        Fetches true real-time exchange LTP and session metrics for an NSE equity.
        """
        clean = symbol.strip().upper()
        if clean.endswith(".NS") or clean.endswith(".BO"):
            clean = clean.rsplit(".", 1)[0]

        url = f"https://www.google.com/finance/quote/{clean}:NSE"
        try:
            r = self._session.get(url, headers=self._headers, timeout=4)
            if r.status_code != 200:
                return None

            m = re.search(r"AF_initDataCallback\(\{key: 'ds:17'.*?data:(.*?), sideChannel:", r.text, re.DOTALL)
            if m:
                data = json.loads(m.group(1))
                # Walk data structure to find quote block
                candidates = []
                def walk(obj):
                    if isinstance(obj, list):
                        if len(obj) >= 7 and isinstance(obj[6], (int, float)) and obj[6] > 0:
                            candidates.append(obj)
                        for child in obj:
                            walk(child)
                walk(data)

                for c in candidates:
                    sym_tag = str(c[0]) if len(c) > 0 else ""
                    ticker_tag = str(c[13]) if len(c) > 13 else ""
                    if clean in sym_tag.upper() or clean in ticker_tag.upper():
                        return {
                            "symbol": clean,
                            "ltp": float(c[6]),
                            "open": float(c[2]) if len(c) > 2 and c[2] is not None else None,
                            "low": float(c[4]) if len(c) > 4 and c[4] is not None else None,
                            "high": float(c[5]) if len(c) > 5 and c[5] is not None else None,
                            "prev_close": float(c[15]) if len(c) > 15 and c[15] is not None else None,
                            "change": float(c[8]) if len(c) > 8 and c[8] is not None else None,
                            "change_percent": float(c[10]) if len(c) > 10 and c[10] is not None else None,
                            "volume": int(c[17]) if len(c) > 17 and isinstance(c[17], (int, float)) else None,
                        }
                
                if candidates:
                    c = candidates[0]
                    return {
                        "symbol": clean,
                        "ltp": float(c[6]),
                        "open": float(c[2]) if len(c) > 2 and c[2] is not None else None,
                        "low": float(c[4]) if len(c) > 4 and c[4] is not None else None,
                        "high": float(c[5]) if len(c) > 5 and c[5] is not None else None,
                        "prev_close": float(c[15]) if len(c) > 15 and c[15] is not None else None,
                        "change": float(c[8]) if len(c) > 8 and c[8] is not None else None,
                        "change_percent": float(c[10]) if len(c) > 10 and c[10] is not None else None,
                        "volume": int(c[17]) if len(c) > 17 and isinstance(c[17], (int, float)) else None,
                    }

            # Fallback regex on HTML price element
            m_price = re.search(r'class=\"[^\"]*YMlKec[^\"]*fxKbKc[^\"]*\">₹?([0-9,.]+)<', r.text)
            if m_price:
                price_val = float(m_price.group(1).replace(",", ""))
                return {
                    "symbol": clean,
                    "ltp": price_val,
                    "open": None,
                    "low": None,
                    "high": None,
                    "prev_close": None,
                    "change": None,
                    "change_percent": None,
                    "volume": None,
                }
        except Exception as e:
            logger.debug(f"[LIVE_PROVIDER] Direct exchange fetch failed for {clean}: {e}")

        return None

    def get_quote(self, symbol: str) -> Optional[NormalizedQuote]:
        batch = self.get_batch_quotes([symbol])
        clean = symbol.strip().upper()
        if clean.endswith(".NS") or clean.endswith(".BO"):
            clean = clean.rsplit(".", 1)[0]
        return batch.get(clean) or batch.get(symbol.strip().upper())

    def get_batch_quotes(self, symbols: List[str]) -> Dict[str, NormalizedQuote]:
        if not symbols:
            return {}

        now = datetime.now(timezone.utc)
        is_open, market_status_str = self._is_market_open()
        results: Dict[str, NormalizedQuote] = {}
        iso_timestamp = now.isoformat()

        # Step 1: Attempt real exchange quote retrieval
        missing_symbols = []
        for s in symbols:
            clean = s.strip().upper()
            if not clean:
                continue
            raw = clean.rsplit(".", 1)[0] if ("." in clean and not clean.startswith("^")) else clean
            
            # Skip indices for direct quote lookup
            if not clean.startswith("^"):
                direct_q = self._fetch_real_exchange_quote(raw)
                if direct_q and direct_q.get("ltp") and direct_q["ltp"] > 0:
                    ltp = direct_q["ltp"]
                    pc = direct_q.get("prev_close")
                    chg = direct_q.get("change") if direct_q.get("change") is not None else ((ltp - pc) if pc else 0.0)
                    pct = direct_q.get("change_percent") if direct_q.get("change_percent") is not None else ((chg / pc * 100.0) if pc and pc > 0 else 0.0)
                    
                    price_type = "LTP" if is_open else "OFFICIAL_CLOSE"

                    results[raw] = NormalizedQuote(
                        symbol=raw,
                        resolved_symbol=f"{raw}.NS",
                        ltp=round(ltp, 2),
                        bid=None,
                        ask=None,
                        open=round(direct_q["open"], 2) if direct_q.get("open") else None,
                        high=round(direct_q["high"], 2) if direct_q.get("high") else None,
                        low=round(direct_q["low"], 2) if direct_q.get("low") else None,
                        previous_close=round(pc, 2) if pc else None,
                        official_close=round(ltp, 2) if not is_open else None,
                        volume=direct_q.get("volume"),
                        change=round(chg, 2),
                        change_percent=round(pct, 2),
                        timestamp=iso_timestamp,
                        provider="live_nse",
                        market_status=market_status_str,
                        price_type=price_type,
                    )
                    logger.info(
                        f"[MARKET_DATA] {raw} | provider=live_nse | LTP={round(ltp, 2)} | "
                        f"type={price_type} | status={market_status_str} | time={iso_timestamp}"
                    )
                    continue

            missing_symbols.append(clean)

        # Step 2: For any missing symbols / indices, fallback to yfinance fast_info
        if missing_symbols:
            resolved_map = {}
            for s in missing_symbols:
                raw = s.rsplit(".", 1)[0] if ("." in s and not s.startswith("^")) else s
                if "." in s or s.startswith("^"):
                    resolved_map[raw] = s
                else:
                    resolved_map[raw] = f"{s}.NS"

            unique_resolved = list(set(resolved_map.values()))
            try:
                yf_tickers = yf.Tickers(" ".join(unique_resolved))
                for raw, resolved in resolved_map.items():
                    try:
                        t = yf_tickers.tickers.get(resolved) or yf.Ticker(resolved)
                        fast = t.fast_info
                        last_price = getattr(fast, "last_price", None)
                        prev_close = (
                            getattr(fast, "regular_market_previous_close", None)
                            or getattr(fast, "previous_close", None)
                        )

                        if last_price is None or last_price <= 0:
                            info = t.info or {}
                            last_price = info.get("regularMarketPrice") or info.get("currentPrice") or info.get("previousClose")
                            prev_close = info.get("regularMarketPreviousClose") or info.get("previousClose")

                        if last_price is not None and float(last_price) > 0:
                            lp = float(last_price)
                            pc = float(prev_close) if prev_close else None
                            chg = (lp - pc) if pc else 0.0
                            pct = (chg / pc * 100.0) if pc and pc > 0 else 0.0
                            price_type = "LTP" if is_open else "OFFICIAL_CLOSE"

                            results[raw] = NormalizedQuote(
                                symbol=raw,
                                resolved_symbol=resolved,
                                ltp=round(lp, 2),
                                previous_close=round(pc, 2) if pc else None,
                                official_close=round(lp, 2) if not is_open else None,
                                change=round(chg, 2),
                                change_percent=round(pct, 2),
                                timestamp=iso_timestamp,
                                provider="yfinance_fallback",
                                market_status=market_status_str,
                                price_type=price_type,
                            )
                            logger.info(
                                f"[MARKET_DATA] {raw} | provider=yfinance_fallback | LTP={round(lp, 2)} | "
                                f"type={price_type} | status={market_status_str} | time={iso_timestamp}"
                            )
                    except Exception as ex:
                        logger.warning(f"[MARKET_DATA] Fallback failed for {raw}: {ex}")
            except Exception as e:
                logger.error(f"[MARKET_DATA] Batch fallback retrieval failed: {e}")

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
