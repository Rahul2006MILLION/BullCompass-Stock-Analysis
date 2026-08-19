import os
import json
import logging
from typing import Dict, Optional, Tuple, Any
from dataclasses import dataclass
from datetime import datetime, timezone, timedelta, time

logger = logging.getLogger(__name__)

IST = timezone(timedelta(hours=5, minutes=30))


@dataclass
class MarketSessionInfo:
    session_id: str
    is_open: bool
    status: str  # "OPEN", "POST_CLOSE", "PRE_OPEN", "CLOSED"
    current_time_ist: str
    session_date: str
    next_session_start_ist: str
    is_frozen: bool


class MarketSessionManager:
    """
    Manages Indian Stock Market (NSE/BSE) trading session lifecycle and session freezing.
    
    Session Rules (IST = UTC+5:30):
      - PRE_OPEN:    09:00 to 09:15 IST (Mon-Fri)
      - MARKET_OPEN: 09:15 to 15:30 IST (Mon-Fri)
      - POST_CLOSE:  15:30 to 16:00 IST (Mon-Fri) - Closing settlement
      - CLOSED:      16:00 to 09:15 next business day, plus all weekends and holidays.
    
    When a trading session closes at 15:30 IST, all portfolio valuation LTPs are captured
    and locked for that session_id (e.g. 'NSE-2026-08-19'). While the market is closed,
    no polling or API response changes are allowed to mutate portfolio valuations.
    """

    PRE_MARKET_START = time(9, 0)
    MARKET_OPEN_TIME = time(9, 15)
    MARKET_CLOSE_TIME = time(15, 30)
    POST_MARKET_END_TIME = time(16, 0)

    _instance: Optional["MarketSessionManager"] = None

    def __init__(self, storage_dir: Optional[str] = None):
        self._frozen_sessions: Dict[str, Dict[str, Any]] = {}
        env_storage = os.environ.get("BULLCOMPASS_SESSION_STORAGE_DIR")
        self.storage_dir = storage_dir or env_storage or os.path.join(
            os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
            "data",
            "sessions"
        )
        try:
            os.makedirs(self.storage_dir, exist_ok=True)
        except Exception:
            pass

    @classmethod
    def get_instance(cls) -> "MarketSessionManager":
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    @classmethod
    def reset_instance(cls) -> None:
        """Reset the singleton instance (used for test isolation)."""
        cls._instance = None

    def get_current_time_ist(self, dt: Optional[datetime] = None) -> datetime:
        if dt is None:
            return datetime.now(IST)
        if dt.tzinfo is None:
            return dt.replace(tzinfo=IST)
        return dt.astimezone(IST)

    def get_session_info(self, dt: Optional[datetime] = None) -> MarketSessionInfo:
        """
        Determines current session ID, status, and whether this session should be frozen.
        """
        now_ist = self.get_current_time_ist(dt)
        weekday = now_ist.weekday()  # 0=Mon, 4=Fri, 5=Sat, 6=Sun
        current_time = now_ist.time()

        is_weekday = weekday < 5

        if is_weekday and self.MARKET_OPEN_TIME <= current_time <= self.MARKET_CLOSE_TIME:
            status = "OPEN"
            is_open = True
            session_date = now_ist.date().isoformat()
            is_frozen = False
        elif is_weekday and self.PRE_MARKET_START <= current_time < self.MARKET_OPEN_TIME:
            status = "PRE_OPEN"
            is_open = False
            session_date = now_ist.date().isoformat()
            is_frozen = True
        elif is_weekday and self.MARKET_CLOSE_TIME < current_time <= self.POST_MARKET_END_TIME:
            status = "POST_CLOSE"
            is_open = False
            session_date = now_ist.date().isoformat()
            is_frozen = True
        else:
            status = "CLOSED"
            is_open = False
            # For closed markets, find the last completed session date
            if is_weekday and current_time > self.POST_MARKET_END_TIME:
                session_date = now_ist.date().isoformat()
            else:
                # Find previous weekday
                offset = 1
                while True:
                    prev_day = now_ist - timedelta(days=offset)
                    if prev_day.weekday() < 5:
                        session_date = prev_day.date().isoformat()
                        break
                    offset += 1
            is_frozen = True

        session_id = f"NSE-{session_date}"

        # Calculate next session start
        next_session_date = now_ist.date()
        if not is_weekday or current_time >= self.MARKET_CLOSE_TIME:
            # Advance to next weekday
            days_ahead = 1
            if weekday == 4:  # Friday -> Monday
                days_ahead = 3
            elif weekday == 5:  # Saturday -> Monday
                days_ahead = 2
            next_session_date = now_ist.date() + timedelta(days=days_ahead)

        next_session_start = datetime.combine(
            next_session_date,
            self.MARKET_OPEN_TIME,
            tzinfo=IST
        )

        return MarketSessionInfo(
            session_id=session_id,
            is_open=is_open,
            status=status,
            current_time_ist=now_ist.strftime("%Y-%m-%d %H:%M:%S IST"),
            session_date=session_date,
            next_session_start_ist=next_session_start.strftime("%Y-%m-%d %H:%M:%S IST"),
            is_frozen=is_frozen,
        )

    def is_session_frozen(self, session_id: str) -> bool:
        """
        Check if a given session ID has a frozen quote snapshot.
        """
        if session_id in self._frozen_sessions:
            return True
        file_path = os.path.join(self.storage_dir, f"{session_id}.json")
        return os.path.exists(file_path)

    def get_frozen_session_quotes(self, session_id: str) -> Optional[Dict[str, Any]]:
        """
        Retrieve frozen quotes for a session.
        """
        if session_id in self._frozen_sessions:
            return self._frozen_sessions[session_id]

        file_path = os.path.join(self.storage_dir, f"{session_id}.json")
        if os.path.exists(file_path):
            try:
                with open(file_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    self._frozen_sessions[session_id] = data
                    return data
            except Exception as e:
                logger.warning(f"[MARKET_SESSION] Error reading frozen session file {file_path}: {e}")
        return None

    def freeze_session_quotes(self, session_id: str, quotes: Dict[str, Any]) -> None:
        """
        Freeze and persist the final valid session quotes.
        Once a symbol is locked for a session, its price is IMMUTABLE and cannot be overwritten
        by subsequent post-close fetches.
        """
        if not quotes:
            return

        existing = self.get_frozen_session_quotes(session_id) or {}

        # Sanitize incoming dictionary values
        incoming: Dict[str, Any] = {}
        for ticker, q in quotes.items():
            if isinstance(q, dict):
                incoming[ticker] = q
            elif hasattr(q, "to_dict"):
                incoming[ticker] = q.to_dict()

        # Immutability rule: Existing frozen session quotes strictly take priority!
        final_quotes = {**incoming, **existing}

        self._frozen_sessions[session_id] = final_quotes

        file_path = os.path.join(self.storage_dir, f"{session_id}.json")
        try:
            with open(file_path, "w", encoding="utf-8") as f:
                json.dump(final_quotes, f, indent=2)
            logger.info(f"[MARKET_SESSION] Successfully locked {len(final_quotes)} immutable quotes for session {session_id}")
        except Exception as e:
            logger.warning(f"[MARKET_SESSION] Could not write session file {file_path}: {e}")
