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

        print("=" * 50)
        print("Saving Portfolio Snapshot")
        print("Timestamp:", timestamp)
        print("Invested:", invested_amount)
        print("Net Worth:", net_worth)
        print("Profit:", profit)
        print("Return %:", return_percentage)
        print("=" * 50)

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

        print("Snapshot Saved!")

    def get_history(self):

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
            ORDER BY timestamp
            """
        )

        rows = cursor.fetchall()

        history = []

        for row in rows:

            history.append(

                PortfolioHistory(
                    id=row[0],
                    timestamp=row[1],
                    invested_amount=row[2],
                    net_worth=row[3],
                    profit=row[4],
                    return_percentage=row[5],
                )

            )

        return history