from typing import Optional, List
from datetime import datetime, timedelta
from app.database.database import Database
from app.models.portfolio_history import PortfolioHistory


class PortfolioHistoryRepository:

    def __init__(self):
        self.db = Database()

    def save_snapshot(
        self,
        timestamp: str,
        invested_amount: float,
        net_worth: float,
        profit: float,
        return_percentage: float,
    ):

        cursor = self.db.connection.cursor()

        cursor.execute(
            """
            INSERT INTO portfolio_history
            (
                timestamp,
                invested_amount,
                net_worth,
                profit,
                return_percentage
            )
            VALUES (?, ?, ?, ?, ?)
            """,
            (
                timestamp,
                invested_amount,
                net_worth,
                profit,
                return_percentage,
            ),
        )

        self.db.connection.commit()

    def get_history(self, range_str: Optional[str] = None) -> List[PortfolioHistory]:
        cursor = self.db.connection.cursor()

        cursor.execute(
            """
            SELECT
                id,
                timestamp,
                invested_amount,
                net_worth,
                profit,
                return_percentage
            FROM portfolio_history
            ORDER BY timestamp ASC
            """
        )

        rows = cursor.fetchall()

        history = [
            PortfolioHistory(
                id=row[0],
                timestamp=row[1],
                invested_amount=row[2],
                net_worth=row[3],
                profit=row[4],
                return_percentage=row[5],
            )
            for row in rows
        ]

        if not history or not range_str or range_str.upper() == "ALL":
            return history

        range_clean = range_str.upper()
        days_map = {"1W": 7, "1M": 30, "3M": 90}
        days = days_map.get(range_clean)
        if not days:
            return history

        parsed = []
        for item in history:
            try:
                dt = datetime.strptime(item.timestamp, "%Y-%m-%d %H:%M:%S")
            except Exception:
                try:
                    dt = datetime.fromisoformat(item.timestamp)
                except Exception:
                    dt = datetime.now()
            parsed.append((dt, item))

        latest_dt = max(dt for dt, _ in parsed)
        ref_dt = max(datetime.now(), latest_dt)
        cutoff = ref_dt - timedelta(days=days)

        filtered = [item for dt, item in parsed if dt >= cutoff]
        return filtered if filtered else [history[-1]]