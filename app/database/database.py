import sqlite3


class Database:

    def __init__(self, db_name: str = "bullcompass.db"):
        self.connection = sqlite3.connect(db_name, check_same_thread=False)
        self.create_tables()

    def create_tables(self):
        cursor = self.connection.cursor()

        # Portfolio table (Current Holdings)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS portfolio (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                ticker TEXT NOT NULL,
                quantity REAL NOT NULL,
                average_buy_price REAL NOT NULL
            )
        """)

        # Portfolio History table (Net Worth Snapshots)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS portfolio_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT NOT NULL,
                invested_amount REAL NOT NULL,
                net_worth REAL NOT NULL,
                profit REAL NOT NULL,
                return_percentage REAL NOT NULL
            )
        """)

        # Portfolio Transactions table (Every Buy & Sell)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS portfolio_transactions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                ticker TEXT NOT NULL,
                transaction_type TEXT NOT NULL,
                quantity REAL NOT NULL,
                price REAL NOT NULL,
                average_cost REAL,
                total_amount REAL NOT NULL,
                profit_loss REAL,
                transaction_date TEXT NOT NULL
            )
        """)

        self.connection.commit()