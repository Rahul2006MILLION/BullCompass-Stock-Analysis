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

        # News Articles table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS news_articles (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                summary TEXT,
                source TEXT NOT NULL,
                source_url TEXT,
                published_at TEXT NOT NULL,
                fetched_at TEXT NOT NULL,
                category TEXT NOT NULL,
                subcategory TEXT,
                importance TEXT DEFAULT 'MEDIUM',
                raw_content TEXT
            )
        """)

        # News Entity & Sector Tagging
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS news_entities (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                news_id TEXT NOT NULL,
                ticker TEXT,
                sector TEXT,
                entity_type TEXT NOT NULL,
                exposure_type TEXT NOT NULL,
                sentiment_hint TEXT,
                FOREIGN KEY (news_id) REFERENCES news_articles(id) ON DELETE CASCADE
            )
        """)

        # News Impact Analysis table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS news_impact_analysis (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                news_id TEXT NOT NULL,
                event_summary TEXT NOT NULL,
                why_it_matters TEXT NOT NULL,
                exposed_sectors TEXT NOT NULL,
                exposed_companies TEXT NOT NULL,
                time_horizon TEXT NOT NULL,
                financial_variables TEXT,
                assumptions TEXT,
                unknowns TEXT,
                created_at TEXT NOT NULL,
                FOREIGN KEY (news_id) REFERENCES news_articles(id) ON DELETE CASCADE
            )
        """)

        # Company Fundamentals cache table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS company_fundamentals (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                ticker TEXT NOT NULL,
                period TEXT NOT NULL,
                income_statement TEXT NOT NULL,
                balance_sheet TEXT NOT NULL,
                cash_flow TEXT NOT NULL,
                ratios TEXT NOT NULL,
                fetched_at TEXT NOT NULL
            )
        """)

        # AI Research Reports archive table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS ai_research_reports (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                ticker TEXT NOT NULL,
                company_name TEXT NOT NULL,
                news_ids TEXT,
                executive_summary TEXT NOT NULL,
                what_happened TEXT NOT NULL,
                why_it_matters TEXT NOT NULL,
                company_impact TEXT NOT NULL,
                fundamental_health TEXT NOT NULL,
                valuation_summary TEXT NOT NULL,
                key_risks TEXT NOT NULL,
                bull_case TEXT NOT NULL,
                bear_case TEXT NOT NULL,
                thesis_invalidation TEXT NOT NULL,
                long_term_thesis TEXT NOT NULL,
                confidence_level TEXT NOT NULL,
                sources TEXT NOT NULL,
                created_at TEXT NOT NULL
            )
        """)

        # Watchlist table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS watchlist (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                ticker TEXT NOT NULL UNIQUE,
                company_name TEXT NOT NULL,
                added_at TEXT NOT NULL
            )
        """)

        self.connection.commit()