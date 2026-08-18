from typing import List, Dict, Any, Optional
from datetime import datetime, timezone, timedelta
import pandas as pd
import yfinance as yf

from app.models.company import Company
from app.services.ticker_service import TickerService


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

    def get_batch_quotes(self, tickers: List[str]) -> Dict[str, Dict[str, Any]]:
        """
        Fetches quotes in a single batch call using yf.download.
        Returns a dict keyed by the requested ticker with current price, previous close, change, and change %.
        """
        if not tickers:
            return {}

        resolved_map: Dict[str, str] = {}
        for t in tickers:
            clean = t.strip().upper()
            if not clean:
                continue
            if "." in clean or clean.startswith("^"):
                resolved = clean
            else:
                resolved = f"{clean}.NS"
            resolved_map[clean] = resolved

        unique_resolved = list(set(resolved_map.values()))
        results: Dict[str, Dict[str, Any]] = {}
        data = None

        try:
            data = yf.download(unique_resolved, period="5d", progress=False)
        except Exception:
            data = None

        iso_timestamp = datetime.now(timezone.utc).isoformat()

        for orig, resolved in resolved_map.items():
            curr_price: Optional[float] = None
            prev_close: Optional[float] = None
            change: float = 0.0
            pct_change: float = 0.0

            if data is not None and not data.empty and "Close" in data:
                try:
                    close_obj = data["Close"]
                    closes = None
                    if isinstance(close_obj, pd.DataFrame):
                        if resolved in close_obj.columns:
                            closes = close_obj[resolved].dropna()
                        else:
                            for col in close_obj.columns:
                                if str(col).upper() == resolved.upper():
                                    closes = close_obj[col].dropna()
                                    break
                    elif isinstance(close_obj, pd.Series):
                        closes = close_obj.dropna()

                    if closes is not None and not closes.empty:
                        if len(closes) >= 2:
                            prev_close = float(closes.iloc[-2])
                            curr_price = float(closes.iloc[-1])
                            change = curr_price - prev_close
                            pct_change = (change / prev_close) * 100.0 if prev_close > 0 else 0.0
                        else:
                            curr_price = float(closes.iloc[-1])
                except Exception:
                    pass

            # Fallback if download missed this ticker
            if curr_price is None or curr_price <= 0.0:
                try:
                    fallback_price = self.get_current_price(resolved)
                    if fallback_price > 0.0:
                        curr_price = fallback_price
                except Exception:
                    pass

            results[orig] = {
                "ticker": orig,
                "resolved_ticker": resolved,
                "current_price": round(curr_price, 2) if curr_price is not None else None,
                "previous_close": round(prev_close, 2) if prev_close is not None else None,
                "change": round(change, 2) if change is not None else 0.0,
                "change_percent": round(pct_change, 2) if pct_change is not None else 0.0,
                "timestamp": iso_timestamp,
            }

        return results

    @staticmethod
    def is_indian_market_open() -> Dict[str, Any]:
        """
        Determines whether the Indian stock market (NSE/BSE) is currently open.
        Regular hours: Monday-Friday 09:15 to 15:30 IST.
        """
        ist = timezone(timedelta(hours=5, minutes=30))
        now_ist = datetime.now(ist)
        weekday = now_ist.weekday()  # 0=Monday, 6=Sunday

        is_weekday = weekday < 5
        current_time = now_ist.time()

        from datetime import time
        pre_market_start = time(9, 0)
        market_open = time(9, 15)
        market_close = time(15, 30)
        post_market_end = time(16, 0)

        if not is_weekday:
            status = "CLOSED"
            is_open = False
        elif market_open <= current_time <= market_close:
            status = "OPEN"
            is_open = True
        elif pre_market_start <= current_time < market_open:
            status = "PRE_OPEN"
            is_open = False
        elif market_close < current_time <= post_market_end:
            status = "POST_CLOSE"
            is_open = False
        else:
            status = "CLOSED"
            is_open = False

        return {
            "is_open": is_open,
            "status": status,
            "current_time_ist": now_ist.strftime("%Y-%m-%d %H:%M:%S IST"),
            "timezone": "Asia/Kolkata (IST)",
        }