from typing import List, Optional
from datetime import datetime, timezone
from app.database.database import Database
from app.models.watchlist import WatchlistItem


class WatchlistRepository:
    def __init__(self, db: Optional[Database] = None):
        self.db = db or Database()

    def add_stock(self, ticker: str, company_name: str, added_at: Optional[str] = None) -> WatchlistItem:
        if not added_at:
            added_at = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")

        cursor = self.db.connection.cursor()
        cursor.execute(
            """
            INSERT INTO watchlist (ticker, company_name, added_at)
            VALUES (?, ?, ?)
            """,
            (ticker.strip().upper(), company_name.strip(), added_at),
        )
        self.db.connection.commit()
        item_id = cursor.lastrowid

        return WatchlistItem(
            id=item_id,
            ticker=ticker.strip().upper(),
            company_name=company_name.strip(),
            added_at=added_at,
        )

    def get_all(self) -> List[WatchlistItem]:
        cursor = self.db.connection.cursor()
        cursor.execute(
            """
            SELECT id, ticker, company_name, added_at
            FROM watchlist
            ORDER BY id DESC
            """
        )
        rows = cursor.fetchall()

        items = []
        for row in rows:
            items.append(
                WatchlistItem(
                    id=row[0],
                    ticker=row[1],
                    company_name=row[2],
                    added_at=row[3],
                )
            )
        return items

    def get_by_ticker(self, ticker: str) -> Optional[WatchlistItem]:
        cursor = self.db.connection.cursor()
        cursor.execute(
            """
            SELECT id, ticker, company_name, added_at
            FROM watchlist
            WHERE ticker = ?
            """,
            (ticker.strip().upper(),),
        )
        row = cursor.fetchone()
        if row is None:
            return None

        return WatchlistItem(
            id=row[0],
            ticker=row[1],
            company_name=row[2],
            added_at=row[3],
        )

    def exists(self, ticker: str) -> bool:
        cursor = self.db.connection.cursor()
        cursor.execute(
            """
            SELECT 1 FROM watchlist WHERE ticker = ?
            """,
            (ticker.strip().upper(),),
        )
        return cursor.fetchone() is not None

    def delete_by_ticker(self, ticker: str) -> bool:
        cursor = self.db.connection.cursor()
        cursor.execute(
            """
            DELETE FROM watchlist WHERE ticker = ?
            """,
            (ticker.strip().upper(),),
        )
        self.db.connection.commit()
        return cursor.rowcount > 0
