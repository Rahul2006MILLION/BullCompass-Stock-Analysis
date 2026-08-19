import logging
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass, asdict
from datetime import datetime, timezone

from app.services.market_data.base import MarketDataProvider, NormalizedQuote
from app.services.market_data.factory import get_market_data_provider
from app.services.market_session import MarketSessionManager, MarketSessionInfo
from app.models.portfolio import PortfolioHolding

logger = logging.getLogger(__name__)


@dataclass
class HoldingTelemetry:
    symbol: str
    symbol_token: str
    ltp: Optional[float]
    close: Optional[float]
    exch_feed_time: str
    exch_trade_time: str
    api_response_timestamp: str
    server_timestamp: str
    quote_source: str
    cache_timestamp: str
    session_state: str
    session_id: str
    price_used_for_valuation: Optional[float]
    authenticated: bool = False
    fallback_used: bool = False


@dataclass
class HoldingValuation:
    holding: PortfolioHolding
    current_price: Optional[float]
    invested: float
    current_value: float
    profit: float
    returns: float
    telemetry: HoldingTelemetry


@dataclass
class PortfolioValuationResult:
    total_holdings: int
    total_invested: float
    total_current_value: float
    total_unrealized_profit: float
    total_return_percentage: float
    session_info: MarketSessionInfo
    holdings: List[HoldingValuation]
    valuation_source: str  # "LIVE_SESSION" or "FROZEN_SESSION"


class CanonicalValuationService:
    """
    CANONICAL VALUATION SERVICE - SINGLE SOURCE OF TRUTH.
    
    Guarantees that:
    1. During MARKET OPEN: Uses authoritative live Angel One LTP ticks.
    2. During MARKET CLOSED: Freezes the completed trading session's final valid LTP
       and guarantees identical, unchanging valuation across all endpoints and polling cycles.
    3. Mathematical Invariant: Total Current Value - Total Invested == Total Unrealized P&L.
    4. One single valuation service used by Dashboard, Portfolio, Market Quotes, and Diagnostics.
    """

    _instance: Optional["CanonicalValuationService"] = None

    def __init__(
        self,
        provider: Optional[MarketDataProvider] = None,
        session_manager: Optional[MarketSessionManager] = None,
    ):
        self.provider = provider or get_market_data_provider()
        self.session_manager = session_manager or MarketSessionManager.get_instance()
        # In-memory session quotes cache
        self._live_session_quotes: Dict[str, NormalizedQuote] = {}
        self._last_live_poll_time: Optional[datetime] = None

    @classmethod
    def get_instance(cls) -> "CanonicalValuationService":
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    @classmethod
    def reset_instance(cls) -> None:
        """Reset the singleton instance (used for test isolation)."""
        cls._instance = None

    def get_canonical_quotes(
        self,
        symbols: List[str],
        force_refresh: bool = False
    ) -> Tuple[Dict[str, Dict[str, Any]], MarketSessionInfo, str]:
        """
        Fetch canonical quotes for symbols adhering strictly to session rules.
        
        Returns:
            (quotes_dict, session_info, valuation_source)
        """
        if not symbols:
            session_info = self.session_manager.get_session_info()
            return {}, session_info, "EMPTY"

        session_info = self.session_manager.get_session_info()
        clean_symbols = [s.strip().upper() for s in symbols if s.strip()]
        now_utc = datetime.now(timezone.utc)
        server_ts = now_utc.isoformat()

        # Case 1: MARKET IS CLOSED (or POST_CLOSE / PRE_OPEN)
        if not session_info.is_open:
            # Check if we have frozen session quotes for this session
            frozen_quotes = self.session_manager.get_frozen_session_quotes(session_info.session_id) or {}
            missing = [s for s in clean_symbols if s not in frozen_quotes]

            if not missing:
                logger.debug(f"[CANONICAL_VALUATION] Serving {len(clean_symbols)} frozen session quotes for {session_info.session_id}")
                res = {s: frozen_quotes[s] for s in clean_symbols if s in frozen_quotes}
                return res, session_info, "FROZEN_SESSION"

            # If missing symbols exist, fetch only the missing symbols and freeze them
            logger.info(f"[CANONICAL_VALUATION] Capturing {len(missing)} missing session quotes for closed session {session_info.session_id}")
            fresh_quotes = self.provider.get_batch_quotes(missing)
            clean_dict: Dict[str, Dict[str, Any]] = {}
            for ticker in missing:
                raw = ticker.rsplit(".", 1)[0] if ("." in ticker and not ticker.startswith("^")) else ticker
                nq = fresh_quotes.get(raw) or fresh_quotes.get(ticker)
                if nq:
                    d = nq.to_dict()
                    d["session_state"] = session_info.status
                    d["session_id"] = session_info.session_id
                    d["is_frozen"] = True
                    d["cache_timestamp"] = server_ts
                    clean_dict[raw] = d
                elif raw in self._live_session_quotes:
                    d = self._live_session_quotes[raw].to_dict()
                    d["session_state"] = session_info.status
                    d["session_id"] = session_info.session_id
                    d["is_frozen"] = True
                    d["cache_timestamp"] = server_ts
                    clean_dict[raw] = d

            # Freeze and persist (existing frozen quotes are preserved immutably)
            self.session_manager.freeze_session_quotes(session_info.session_id, clean_dict)
            all_frozen = self.session_manager.get_frozen_session_quotes(session_info.session_id) or {}
            res = {s: all_frozen[s] for s in clean_symbols if s in all_frozen}
            return res, session_info, "FROZEN_SESSION"

        # Case 2: MARKET IS OPEN
        # Query live provider for latest Angel One LTP
        fresh_quotes = self.provider.get_batch_quotes(clean_symbols)
        results: Dict[str, Dict[str, Any]] = {}
        for ticker in clean_symbols:
            raw = ticker.rsplit(".", 1)[0] if ("." in ticker and not ticker.startswith("^")) else ticker
            nq = fresh_quotes.get(raw) or fresh_quotes.get(ticker)
            if nq:
                self._live_session_quotes[raw] = nq
                d = nq.to_dict()
                d["session_state"] = "OPEN"
                d["session_id"] = session_info.session_id
                d["is_frozen"] = False
                d["cache_timestamp"] = server_ts
                results[raw] = d
            elif raw in self._live_session_quotes:
                d = self._live_session_quotes[raw].to_dict()
                d["session_state"] = "OPEN"
                d["session_id"] = session_info.session_id
                d["is_frozen"] = False
                d["cache_timestamp"] = server_ts
                results[raw] = d

        return results, session_info, "LIVE_SESSION"

    def evaluate_portfolio(
        self,
        holdings: List[PortfolioHolding],
        force_refresh: bool = False
    ) -> PortfolioValuationResult:
        """
        Canonical evaluation of portfolio holdings.
        
        Guarantees exact mathematical precision and identical output for all callers.
        """
        if not holdings:
            session_info = self.session_manager.get_session_info()
            return PortfolioValuationResult(
                total_holdings=0,
                total_invested=0.0,
                total_current_value=0.0,
                total_unrealized_profit=0.0,
                total_return_percentage=0.0,
                session_info=session_info,
                holdings=[],
                valuation_source="EMPTY",
            )

        tickers = [h.ticker for h in holdings]
        quotes_dict, session_info, source = self.get_canonical_quotes(tickers, force_refresh=force_refresh)
        server_ts = datetime.now(timezone.utc).isoformat()

        holding_valuations: List[HoldingValuation] = []
        total_invested = 0.0
        total_current_value = 0.0

        for h in holdings:
            clean = h.ticker.strip().upper()
            q = quotes_dict.get(clean, {})

            # Exact LTP extraction
            raw_ltp = q.get("current_price") or q.get("ltp")
            canonical_price = float(raw_ltp) if raw_ltp is not None and float(raw_ltp) > 0 else None

            invested = round(h.quantity * h.average_buy_price, 2)
            current_val = round(h.quantity * canonical_price, 2) if canonical_price is not None else 0.0
            profit = round(current_val - invested, 2)
            returns = round((profit / invested * 100.0), 2) if invested > 0 else 0.0

            total_invested += invested
            total_current_value += current_val

            # Determine authentication and fallback status cleanly
            quote_source = q.get("provider", "nse_official")
            is_authenticated = (quote_source == "angelone") and getattr(self.provider, "auth", None) is not None and getattr(self.provider.auth, "is_configured", False)
            is_fallback = (quote_source == "angelone_resolved")

            # Build rich telemetry for diagnostics (Safe: never logs credentials or secrets)
            telemetry = HoldingTelemetry(
                symbol=clean,
                symbol_token=str(q.get("symbol_token") or ""),
                ltp=canonical_price,
                close=q.get("previous_close"),
                exch_feed_time=str(q.get("timestamp") or server_ts),
                exch_trade_time=str(q.get("timestamp") or server_ts),
                api_response_timestamp=str(q.get("timestamp") or server_ts),
                server_timestamp=server_ts,
                quote_source=quote_source,
                cache_timestamp=str(q.get("cache_timestamp") or server_ts),
                session_state=session_info.status,
                session_id=session_info.session_id,
                price_used_for_valuation=canonical_price,
                authenticated=is_authenticated,
                fallback_used=is_fallback,
            )

            logger.info(
                f"[TELEMETRY] ticker={clean} token={telemetry.symbol_token} provider={self.provider.__class__.__name__} "
                f"authenticated={is_authenticated} fallback_used={is_fallback} ltp={canonical_price} "
                f"close={telemetry.close} price_type={session_info.status}"
            )

            holding_valuations.append(
                HoldingValuation(
                    holding=h,
                    current_price=canonical_price,
                    invested=invested,
                    current_value=current_val,
                    profit=profit,
                    returns=returns,
                    telemetry=telemetry,
                )
            )

        total_invested = round(total_invested, 2)
        total_current_value = round(total_current_value, 2)
        total_unrealized_profit = round(total_current_value - total_invested, 2)
        total_return_pct = round((total_unrealized_profit / total_invested * 100.0), 2) if total_invested > 0 else 0.0

        return PortfolioValuationResult(
            total_holdings=len(holding_valuations),
            total_invested=total_invested,
            total_current_value=total_current_value,
            total_unrealized_profit=total_unrealized_profit,
            total_return_percentage=total_return_pct,
            session_info=session_info,
            holdings=holding_valuations,
            valuation_source=source,
        )
