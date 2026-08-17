from app.database.database import Database


class PortfolioTransactionRepository:

    def __init__(self):
        self.database = Database()

    def save_transaction(
        self,
        ticker: str,
        transaction_type: str,
        quantity: float,
        price: float,
        average_cost: float,
        total_amount: float,
        profit_loss: float,
        transaction_date: str,
    ):
        cursor = self.database.connection.cursor()

        cursor.execute("""
            INSERT INTO portfolio_transactions (
                ticker,
                transaction_type,
                quantity,
                price,
                average_cost,
                total_amount,
                profit_loss,
                transaction_date
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            ticker,
            transaction_type,
            quantity,
            price,
            average_cost,
            total_amount,
            profit_loss,
            transaction_date
        ))

        self.database.connection.commit()

    def get_all_transactions(self):
        cursor = self.database.connection.cursor()

        cursor.execute("""
            SELECT *
            FROM portfolio_transactions
            ORDER BY transaction_date DESC
        """)

        return cursor.fetchall()

    def get_transactions_by_ticker(self, ticker: str):
        cursor = self.database.connection.cursor()

        cursor.execute("""
            SELECT *
            FROM portfolio_transactions
            WHERE ticker = ?
            ORDER BY transaction_date DESC
        """, (ticker,))

        return cursor.fetchall()

    def get_realized_profit(self):
        cursor = self.database.connection.cursor()

        cursor.execute("""
            SELECT COALESCE(SUM(profit_loss), 0)
            FROM portfolio_transactions
            WHERE transaction_type = 'SELL'
        """)

        return cursor.fetchone()[0]