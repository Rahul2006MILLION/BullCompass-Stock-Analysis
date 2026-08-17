from app.database.database import Database
from app.models.portfolio import PortfolioHolding


class PortfolioRepository:
    def __init__(self):
        self.db = Database()

    def add_holding(self, holding: PortfolioHolding):
        cursor = self.db.connection.cursor()

        cursor.execute(
            """
            INSERT INTO portfolio (ticker, quantity, average_buy_price)
            VALUES (?, ?, ?)
            """,
            (
                holding.ticker,
                holding.quantity,
                holding.average_buy_price,
            ),
        )

        self.db.connection.commit()

    def get_holdings(self) -> list[PortfolioHolding]:
        cursor = self.db.connection.cursor()

        cursor.execute(
            """
            SELECT id, ticker, quantity, average_buy_price
            FROM portfolio
            """
        )

        rows = cursor.fetchall()

        holdings = []

        for row in rows:
            holdings.append(
                PortfolioHolding(
                    id=row[0],
                    ticker=row[1],
                    quantity=row[2],
                    average_buy_price=row[3],
                )
            )

        return holdings

    def get_holding_by_ticker(self, ticker: str):
        cursor = self.db.connection.cursor()

        cursor.execute(
            """
            SELECT id, ticker, quantity, average_buy_price
            FROM portfolio
            WHERE ticker = ?
            """,
            (ticker,),
        )

        row = cursor.fetchone()

        if row is None:
            return None

        return PortfolioHolding(
            id=row[0],
            ticker=row[1],
            quantity=row[2],
            average_buy_price=row[3],
        )

    def update_holding(
        self,
        holding_id: int,
        quantity: float,
        average_buy_price: float,
    ):
        cursor = self.db.connection.cursor()

        cursor.execute(
            """
            UPDATE portfolio
            SET quantity = ?,
                average_buy_price = ?
            WHERE id = ?
            """,
            (
                quantity,
                average_buy_price,
                holding_id,
            ),
        )

        self.db.connection.commit()

    def update_quantity_and_average(
        self,
        ticker: str,
        quantity: float,
        average_buy_price: float,
    ):
        cursor = self.db.connection.cursor()

        cursor.execute(
            """
            UPDATE portfolio
            SET quantity = ?,
                average_buy_price = ?
            WHERE ticker = ?
            """,
            (
                quantity,
                average_buy_price,
                ticker,
            ),
        )

        self.db.connection.commit()

    def delete_holding(self, holding_id: int):
        cursor = self.db.connection.cursor()

        cursor.execute(
            """
            DELETE FROM portfolio
            WHERE id = ?
            """,
            (holding_id,),
        )

        self.db.connection.commit()

    def delete_holding_by_ticker(self, ticker: str):
        cursor = self.db.connection.cursor()

        cursor.execute(
            """
            DELETE FROM portfolio
            WHERE ticker = ?
            """,
            (ticker,),
        )

        self.db.connection.commit()

    def get_holding_by_id(self, holding_id: int):
        cursor = self.db.connection.cursor()

        cursor.execute(
            """
            SELECT id, ticker, quantity, average_buy_price
            FROM portfolio
            WHERE id = ?
            """,
            (holding_id,),
        )

        row = cursor.fetchone()

        if row is None:
            return None

        return PortfolioHolding(
            id=row[0],
            ticker=row[1],
            quantity=row[2],
            average_buy_price=row[3],
        )