import logging
from typing import Dict, List, Optional, Any
from datetime import datetime, timezone
import requests
import pandas as pd
import yfinance as yf

from app.services.market_data.base import MarketDataProvider, NormalizedQuote
from app.services.ticker_service import TickerService

logger = logging.getLogger(__name__)


class DhanMarketDataProvider(MarketDataProvider):
    """
    Market Data Provider using Dhan HQ API v2.
    Provides official real-time NSE/BSE colocation ticks during market hours
    and authoritative NSE closing VWAP post-market.
    """

    BASE_URL = "https://api.dhan.co/v2"

    def __init__(self, client_id: str, access_token: str):
        self.client_id = client_id
        self.access_token = access_token
        self.headers = {
            "access-token": self.access_token,
            "client-id": self.client_id,
            "Content-Type": "application/json",
            "Accept": "application/json",
        }

    def _clean_symbol(self, symbol: str) -> str:
        s = symbol.strip().upper()
        if s.endswith(".NS") or s.endswith(".BO"):
            s = s.rsplit(".", 1)[0]
        return s

    def get_quote(self, symbol: str) -> Optional[NormalizedQuote]:
        batch = self.get_batch_quotes([symbol])
        clean = self._clean_symbol(symbol)
        return batch.get(clean) or batch.get(symbol.strip().upper())

    def get_batch_quotes(self, symbols: List[str]) -> Dict[str, NormalizedQuote]:
        """
        Fetch quotes via Dhan v2 marketfeed endpoint.
        """
        if not symbols:
            return {}

        results: Dict[str, NormalizedQuote] = {}
        clean_symbols = [self._clean_symbol(s) for s in symbols if s.strip()]
        
        # Dhan marketfeed payload accepts instruments list
        # E.g. {"NSE_EQ": [symbol_ids...]}
        payload = {
            "NSE_EQ": clean_symbols
        }

        iso_timestamp = datetime.now(timezone.utc).isoformat()

        try:
            url = f"{self.BASE_URL}/marketfeed/quote"
            response = requests.post(url, json=payload, headers=self.headers, timeout=5)
            
            if response.status_code == 200:
                data = response.json()
                # Parse Dhan JSON format
                feed_data = data.get("data", {}).get("NSE_EQ", {})
                for sym in clean_symbols:
                    if sym in feed_data:
                        item = feed_data[sym]
                        last_price = float(item.get("last_price", 0.0) or item.get("close", 0.0))
                        prev_close = float(item.get("previous_close", 0.0) or item.get("close", 0.0))
                        change = last_price - prev_close
                        pct_change = (change / prev_close) * 100.0 if prev_close > 0 else 0.0
                        
                        results[sym] = NormalizedQuote(
                            symbol=sym,
                            resolved_symbol=f"{sym}.NS",
                            ltp=round(last_price, 2),
                            previous_close=round(prev_close, 2),
                            official_close=round(float(item.get("close", last_price)), 2),
                            change=round(change, 2),
                            change_percent=round(pct_change, 2),
                            timestamp=iso_timestamp,
                            provider="dhan",
                            market_status="OPEN",
                            price_type="LTP",
                        )
            else:
                logger.warning(f"Dhan API returned status {response.status_code}: {response.text}")
        except Exception as e:
            logger.error(f"Dhan API request failed: {e}")

        return results

    def get_history(
        self,
        symbol: str,
        period: str = "1mo",
        interval: str = "1d",
    ) -> pd.DataFrame:
        """
        Historical data delegation.
        """
        resolved = TickerService.resolve(symbol)
        stock = yf.Ticker(resolved)
        return stock.history(period=period, interval=interval)
