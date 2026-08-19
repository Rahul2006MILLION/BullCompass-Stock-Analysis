import os
import json
import logging
import time
from typing import Dict, Optional, List, Any
from dataclasses import dataclass
import requests

logger = logging.getLogger(__name__)


@dataclass
class AngelInstrument:
    token: str
    symbol: str
    name: str
    expiry: str = ""
    strike: str = ""
    lotsize: str = "1"
    instrumenttype: str = ""
    exch_seg: str = "NSE"
    tick_size: float = 0.05

    @property
    def trading_symbol(self) -> str:
        return self.symbol


class AngelOneSymbolResolver:
    """
    Symbol Resolution Layer for Angel One SmartAPI.
    
    Downloads and caches the official Angel One Instrument Master (OpenAPIScripMaster.json)
    and provides O(1) in-memory resolution of NSE equity stock tickers and market indices
    to their authoritative trading symbols and exchange symbol tokens.
    """

    SCRIP_MASTER_URL = "https://margincalculator.angelbroking.com/OpenAPI_File/files/OpenAPIScripMaster.json"
    DEFAULT_CACHE_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))), "data", "angel_one_instruments.json")
    CACHE_MAX_AGE_SECONDS = 86400  # 24 hours

    def __init__(self, cache_file_path: Optional[str] = None):
        self.cache_file_path = cache_file_path or self.DEFAULT_CACHE_PATH
        self._nse_equities_map: Dict[str, AngelInstrument] = {}
        self._tokens_map: Dict[str, AngelInstrument] = {}
        self._is_loaded = False

    def _ensure_loaded(self) -> None:
        """
        Loads instrument master into memory, fetching fresh data if cache is missing or stale.
        """
        if self._is_loaded:
            return

        os.makedirs(os.path.dirname(self.cache_file_path), exist_ok=True)
        need_download = True

        if os.path.exists(self.cache_file_path):
            file_age = time.time() - os.path.getmtime(self.cache_file_path)
            if file_age < self.CACHE_MAX_AGE_SECONDS and os.path.getsize(self.cache_file_path) > 1000000:
                need_download = False

        if need_download:
            try:
                logger.info(f"[ANGEL_RESOLVER] Downloading fresh instrument master from {self.SCRIP_MASTER_URL}...")
                resp = requests.get(self.SCRIP_MASTER_URL, timeout=20)
                if resp.status_code == 200 and len(resp.content) > 1000000:
                    with open(self.cache_file_path, "w", encoding="utf-8") as f:
                        f.write(resp.text)
                    logger.info(f"[ANGEL_RESOLVER] Saved {len(resp.content)} bytes to {self.cache_file_path}")
                else:
                    logger.warning(f"[ANGEL_RESOLVER] Download returned code {resp.status_code}. Using local cache if available.")
            except Exception as e:
                logger.warning(f"[ANGEL_RESOLVER] Failed to download instrument master ({e}). Using local cache if available.")

        if not os.path.exists(self.cache_file_path):
            logger.error(f"[ANGEL_RESOLVER] No instrument master cache found at {self.cache_file_path}")
            return

        try:
            with open(self.cache_file_path, "r", encoding="utf-8") as f:
                instruments = json.load(f)

            for item in instruments:
                exch = item.get("exch_seg")
                sym = item.get("symbol", "")
                token = str(item.get("token", "")).strip()
                name = item.get("name", "").strip().upper()
                itype = item.get("instrumenttype", "")

                if not token or not sym:
                    continue

                instrument_obj = AngelInstrument(
                    token=token,
                    symbol=sym,
                    name=name,
                    expiry=item.get("expiry", ""),
                    strike=item.get("strike", ""),
                    lotsize=str(item.get("lotsize", "1")),
                    instrumenttype=itype,
                    exch_seg=exch,
                    tick_size=float(item.get("tick_size", 0.05)) if item.get("tick_size") else 0.05,
                )

                self._tokens_map[token] = instrument_obj

                if exch == "NSE":
                    # Equity shares: e.g. "MRF-EQ", "NITCO-EQ", "HDFCBANK-EQ"
                    if sym.endswith("-EQ"):
                        base = sym[:-3].upper()
                        self._nse_equities_map[base] = instrument_obj
                        self._nse_equities_map[f"{base}.NS"] = instrument_obj
                        self._nse_equities_map[sym.upper()] = instrument_obj
                    elif itype == "AMXIDX" or "INDEX" in itype:
                        # Index instruments: e.g. "Nifty 50", "Nifty Bank"
                        self._nse_equities_map[sym.upper()] = instrument_obj
                        if name:
                            self._nse_equities_map[name] = instrument_obj
                            self._nse_equities_map[f"^{name}"] = instrument_obj

            # Explicit well-known index mappings
            index_aliases = {
                "^NSEI": "99926000",
                "NIFTY": "99926000",
                "NIFTY50": "99926000",
                "NIFTY 50": "99926000",
                "^NSEBANK": "99926009",
                "BANKNIFTY": "99926009",
                "NIFTY BANK": "99926009",
            }
            for alias, token in index_aliases.items():
                if token in self._tokens_map:
                    self._nse_equities_map[alias.upper()] = self._tokens_map[token]

            self._is_loaded = True
            logger.info(f"[ANGEL_RESOLVER] Indexed {len(self._nse_equities_map)} NSE symbols & indices from scrip master.")
        except Exception as e:
            logger.error(f"[ANGEL_RESOLVER] Error parsing instrument master: {e}")

    def clean_ticker(self, symbol: str) -> str:
        """
        Normalizes any input ticker representation (e.g. 'MRF.NS', ' mrf ', 'MRF-EQ' -> 'MRF').
        """
        s = symbol.strip().upper()
        if s.endswith(".NS") or s.endswith(".BO"):
            s = s.rsplit(".", 1)[0]
        if s.endswith("-EQ"):
            s = s[:-3]
        return s

    def resolve_instrument(self, symbol: str) -> Optional[AngelInstrument]:
        """
        Resolves a symbol to an AngelInstrument with token and tradingSymbol.
        """
        self._ensure_loaded()
        clean = symbol.strip().upper()
        if not clean:
            return None

        # 1. Direct lookup
        if clean in self._nse_equities_map:
            return self._nse_equities_map[clean]

        # 2. Cleaned ticker lookup
        base = self.clean_ticker(clean)
        if base in self._nse_equities_map:
            return self._nse_equities_map[base]

        # 3. Check with -EQ suffix
        eq_sym = f"{base}-EQ"
        if eq_sym in self._nse_equities_map:
            return self._nse_equities_map[eq_sym]

        return None

    def resolve_batch(self, symbols: List[str]) -> Dict[str, AngelInstrument]:
        """
        Resolves a batch of symbols, mapping clean ticker -> AngelInstrument.
        """
        self._ensure_loaded()
        results: Dict[str, AngelInstrument] = {}
        for s in symbols:
            inst = self.resolve_instrument(s)
            if inst:
                clean = self.clean_ticker(s)
                results[clean] = inst
                results[s.strip().upper()] = inst
        return results

    def get_by_token(self, token: str) -> Optional[AngelInstrument]:
        self._ensure_loaded()
        return self._tokens_map.get(str(token).strip())
