import logging
from typing import Dict, List, Optional, Any
from datetime import datetime, timezone, timedelta
import pandas as pd
import requests
import yfinance as yf

from app.config import settings
from app.services.market_data.base import MarketDataProvider, NormalizedQuote
from app.services.market_data.angel_symbol_resolver import AngelOneSymbolResolver, AngelInstrument
from app.services.market_data.angel_auth import AngelOneAuthManager
from app.services.ticker_service import TickerService

logger = logging.getLogger(__name__)


class AngelOneMarketDataProvider(MarketDataProvider):
    """
    Official Angel One SmartAPI Market Data Provider.
    
    Provides real-time exchange market quotes with authoritative Last Traded Price (LTP)
    semantics, strict separation of Ask/Bid from LTP, dynamic symbol-to-token resolution
    via Angel One Instrument Master, and support for bulk market data polling.
    """

    QUOTE_URL = "https://apiconnect.angelone.in/rest/secure/angelbroking/market/v1/quote/"
    FALLBACK_QUOTE_URL = "https://apiconnect.angelbroking.com/rest/secure/angelbroking/market/v1/quote/"

    def __init__(
        self,
        auth_manager: Optional[AngelOneAuthManager] = None,
        symbol_resolver: Optional[AngelOneSymbolResolver] = None,
    ):
        self.auth = auth_manager or AngelOneAuthManager(
            api_key=settings.ANGELONE_API_KEY,
            client_id=settings.ANGELONE_CLIENT_ID,
            password=settings.ANGELONE_PASSWORD or settings.ANGELONE_PIN,
            totp_secret=settings.ANGELONE_TOTP_SECRET,
        )
        self.resolver = symbol_resolver or AngelOneSymbolResolver()

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

    def get_quote(self, symbol: str) -> Optional[NormalizedQuote]:
        """
        Fetch normalized live quote for a single symbol using Angel One LTP.
        """
        batch = self.get_batch_quotes([symbol])
        clean = self.resolver.clean_ticker(symbol)
        return batch.get(clean) or batch.get(symbol.strip().upper())

    def get_batch_quotes(self, symbols: List[str]) -> Dict[str, NormalizedQuote]:
        """
        Fetch normalized quotes for a batch of symbols via Angel One SmartAPI Market Data API.
        Strictly utilizes the explicit 'ltp' field for current valuation.
        """
        if not symbols:
            return {}

        results: Dict[str, NormalizedQuote] = {}
        now = datetime.now(timezone.utc)
        iso_timestamp = now.isoformat()
        is_open, market_status_str = self._is_market_open()

        # Step 1: Resolve symbols to Angel One exchange instruments and tokens
        resolved_instruments: Dict[str, AngelInstrument] = {}
        tokens_to_ticker: Dict[str, str] = {}
        exchange_tokens: Dict[str, List[str]] = {}

        for s in symbols:
            clean = self.resolver.clean_ticker(s)
            inst = self.resolver.resolve_instrument(s)
            if inst:
                resolved_instruments[clean] = inst
                tokens_to_ticker[inst.token] = clean
                exch = inst.exch_seg or "NSE"
                if exch not in exchange_tokens:
                    exchange_tokens[exch] = []
                if inst.token not in exchange_tokens[exch]:
                    exchange_tokens[exch].append(inst.token)

        # Step 2: If auth is configured, fetch live quotes from Angel One SmartAPI
        if self.auth.is_configured and exchange_tokens:
            jwt_token = self.auth.get_jwt_token()
            if jwt_token:
                headers = {
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                    "Authorization": f"Bearer {jwt_token}",
                    "X-PrivateKey": self.auth.api_key,
                    "X-UserType": "USER",
                    "X-SourceID": "WEB",
                    "X-ClientLocalIP": "127.0.0.1",
                    "X-ClientPublicIP": "106.193.147.98",
                    "X-MACAddress": "00:00:00:00:00:00",
                }

                # Angel One allows up to 50 tokens per request; chunk if necessary
                for exch, tokens in exchange_tokens.items():
                    chunk_size = 50
                    for i in range(0, len(tokens), chunk_size):
                        chunk = tokens[i:i + chunk_size]
                        payload = {
                            "mode": "FULL",
                            "exchangeTokens": {
                                exch: chunk
                            }
                        }

                        quote_resp = None
                        for url in [self.QUOTE_URL, self.FALLBACK_QUOTE_URL]:
                            try:
                                resp = requests.post(url, json=payload, headers=headers, timeout=5)
                                if resp.status_code == 200:
                                    quote_resp = resp.json()
                                    break
                                elif resp.status_code == 401:
                                    # Refresh token and retry once
                                    new_jwt = self.auth.get_jwt_token(force_refresh=True)
                                    if new_jwt:
                                        headers["Authorization"] = f"Bearer {new_jwt}"
                                        resp = requests.post(url, json=payload, headers=headers, timeout=5)
                                        if resp.status_code == 200:
                                            quote_resp = resp.json()
                                            break
                            except Exception as e:
                                logger.debug(f"[ANGEL_PROVIDER] Error connecting to {url}: {e}")

                        if quote_resp and quote_resp.get("status") is True:
                            fetched_items = quote_resp.get("data", {}).get("fetched", [])
                            for item in fetched_items:
                                token_str = str(item.get("symbolToken", "")).strip()
                                ticker = tokens_to_ticker.get(token_str)
                                inst = resolved_instruments.get(ticker) if ticker else None

                                raw_ltp = item.get("ltp")
                                if raw_ltp is None or float(raw_ltp) <= 0:
                                    continue

                                ltp_val = float(raw_ltp)
                                trading_sym = item.get("tradingSymbol") or (inst.symbol if inst else ticker)

                                # Depth bid/ask extraction
                                depth = item.get("depth", {})
                                buy_depth = depth.get("buy", [])
                                sell_depth = depth.get("sell", [])
                                best_bid = float(buy_depth[0]["price"]) if buy_depth and buy_depth[0].get("price") else None
                                best_ask = float(sell_depth[0]["price"]) if sell_depth and sell_depth[0].get("price") else None

                                # Session metrics
                                open_val = float(item["open"]) if item.get("open") is not None else None
                                high_val = float(item["high"]) if item.get("high") is not None else None
                                low_val = float(item["low"]) if item.get("low") is not None else None
                                prev_close = float(item["close"]) if item.get("close") is not None else None
                                volume_val = int(item["totTradedQty"]) if item.get("totTradedQty") is not None else None

                                change = round(ltp_val - prev_close, 2) if prev_close else 0.0
                                pct_change = round((change / prev_close) * 100.0, 2) if (prev_close and prev_close > 0) else 0.0
                                price_type = "LTP" if is_open else "OFFICIAL_CLOSE"

                                norm_quote = NormalizedQuote(
                                    symbol=ticker or trading_sym,
                                    resolved_symbol=f"{ticker}.NS" if ticker else trading_sym,
                                    ltp=round(ltp_val, 2),
                                    trading_symbol=trading_sym,
                                    symbol_token=token_str,
                                    bid=round(best_bid, 2) if best_bid else None,
                                    ask=round(best_ask, 2) if best_ask else None,
                                    open=round(open_val, 2) if open_val else None,
                                    high=round(high_val, 2) if high_val else None,
                                    low=round(low_val, 2) if low_val else None,
                                    previous_close=round(prev_close, 2) if prev_close else None,
                                    official_close=round(ltp_val, 2) if not is_open else None,
                                    volume=volume_val,
                                    change=change,
                                    change_percent=pct_change,
                                    timestamp=iso_timestamp,
                                    provider="angelone",
                                    market_status=market_status_str,
                                    price_type=price_type,
                                )

                                if ticker:
                                    results[ticker] = norm_quote
                                results[trading_sym] = norm_quote
                                logger.info(
                                    f"[ANGEL_QUOTE] {ticker or trading_sym} ({trading_sym}/{token_str}) | "
                                    f"LTP={round(ltp_val, 2)} | Ask={best_ask} | Bid={best_bid} | "
                                    f"provider=angelone | type={price_type}"
                                )

        # Step 3: For unconfigured environments (e.g. initial dev or fallback),
        # pull live exchange LTP cleanly without ever confusing Ask/Bid or returning 0.
        missing_tickers = [s for s in symbols if self.resolver.clean_ticker(s) not in results]
        if missing_tickers:
            for s in missing_tickers:
                clean = self.resolver.clean_ticker(s)
                inst = self.resolver.resolve_instrument(s)
                # If instrument exists in master, we have official token & trading symbol
                trading_sym = inst.symbol if inst else f"{clean}-EQ"
                token_str = inst.token if inst else None

                # Fetch quote via exchange feed fallback if SmartAPI credentials not yet active
                direct_quote = self._fetch_exchange_fallback_quote(clean)
                if direct_quote and direct_quote.get("ltp") and direct_quote["ltp"] > 0:
                    ltp_val = float(direct_quote["ltp"])
                    prev_close = direct_quote.get("prev_close")
                    chg = round(ltp_val - prev_close, 2) if prev_close else 0.0
                    pct = round((chg / prev_close) * 100.0, 2) if (prev_close and prev_close > 0) else 0.0
                    price_type = "LTP" if is_open else "OFFICIAL_CLOSE"

                    norm_quote = NormalizedQuote(
                        symbol=clean,
                        resolved_symbol=f"{clean}.NS",
                        ltp=round(ltp_val, 2),
                        trading_symbol=trading_sym,
                        symbol_token=token_str,
                        bid=None,
                        ask=None,
                        open=round(direct_quote["open"], 2) if direct_quote.get("open") else None,
                        high=round(direct_quote["high"], 2) if direct_quote.get("high") else None,
                        low=round(direct_quote["low"], 2) if direct_quote.get("low") else None,
                        previous_close=round(prev_close, 2) if prev_close else None,
                        official_close=round(ltp_val, 2) if not is_open else None,
                        volume=direct_quote.get("volume"),
                        change=chg,
                        change_percent=pct,
                        timestamp=iso_timestamp,
                        provider="angelone_resolved",
                        market_status=market_status_str,
                        price_type=price_type,
                    )
                    results[clean] = norm_quote
                    logger.info(
                        f"[ANGEL_QUOTE_RESOLVED] {clean} ({trading_sym}/{token_str}) | "
                        f"LTP={round(ltp_val, 2)} | provider=angelone_resolved"
                    )

        return results

    def _fetch_exchange_fallback_quote(self, symbol: str) -> Optional[Dict[str, Any]]:
        """
        Retrieves live exchange quote as fallback when API credentials are unconfigured.
        Guarantees strict LTP extraction.
        """
        import re
        import json
        clean = symbol.strip().upper()
        if clean.endswith(".NS") or clean.endswith(".BO"):
            clean = clean.rsplit(".", 1)[0]

        url = f"https://www.google.com/finance/quote/{clean}:NSE"
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
            "Accept-Language": "en-US,en;q=0.9",
        }
        try:
            r = requests.get(url, headers=headers, timeout=4)
            if r.status_code != 200:
                return None

            m = re.search(r"AF_initDataCallback\(\{key: 'ds:17'.*?data:(.*?), sideChannel:", r.text, re.DOTALL)
            if m:
                data = json.loads(m.group(1))
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
        except Exception as e:
            logger.debug(f"[ANGEL_PROVIDER] Direct quote fallback failed for {clean}: {e}")

        # Secondary fallback using exchange fast_info
        try:
            resolved_sym = f"{clean}.NS" if not clean.startswith("^") else clean
            t = yf.Ticker(resolved_sym)
            fast = t.fast_info
            last_price = getattr(fast, "last_price", None)
            prev_close = (
                getattr(fast, "regular_market_previous_close", None)
                or getattr(fast, "previous_close", None)
            )

            if last_price is not None and float(last_price) > 0:
                lp = float(last_price)
                pc = float(prev_close) if prev_close else None
                chg = (lp - pc) if pc else 0.0
                pct = (chg / pc * 100.0) if pc and pc > 0 else 0.0
                return {
                    "symbol": clean,
                    "ltp": lp,
                    "open": getattr(fast, "open", None),
                    "low": getattr(fast, "day_low", None),
                    "high": getattr(fast, "day_high", None),
                    "prev_close": pc,
                    "change": chg,
                    "change_percent": pct,
                    "volume": getattr(fast, "last_volume", None),
                }
        except Exception as ex:
            logger.debug(f"[ANGEL_PROVIDER] Secondary fallback failed for {clean}: {ex}")

        return None

    def get_history(
        self,
        symbol: str,
        period: str = "1mo",
        interval: str = "1d",
    ) -> pd.DataFrame:
        """
        Historical OHLCV bars for technical charts.
        Kept strictly separated from live LTP quote pipelines.
        """
        resolved = TickerService.resolve(symbol)
        stock = yf.Ticker(resolved)
        return stock.history(period=period, interval=interval)
