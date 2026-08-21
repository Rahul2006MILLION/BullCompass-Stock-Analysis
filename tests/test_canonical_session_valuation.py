import unittest
from unittest.mock import MagicMock, patch
from datetime import datetime, timezone, timedelta, time
import tempfile
import shutil

from app.models.portfolio import PortfolioHolding
from app.services.market_data.base import MarketDataProvider, NormalizedQuote
from app.services.market_session import MarketSessionManager, MarketSessionInfo, IST
from app.services.canonical_valuation_service import CanonicalValuationService


class MockMarketDataProvider(MarketDataProvider):
    def __init__(self):
        self.mock_quotes = {
            "MRF": NormalizedQuote(
                symbol="MRF",
                resolved_symbol="MRF.NS",
                ltp=133500.0,
                trading_symbol="MRF-EQ",
                symbol_token="2277",
                previous_close=133505.0,
                provider="angelone",
                timestamp="2026-08-19T15:29:50+05:30",
            ),
            "NITCO": NormalizedQuote(
                symbol="NITCO",
                resolved_symbol="NITCO.NS",
                ltp=89.80,
                trading_symbol="NITCO-EQ",
                symbol_token="13300",
                previous_close=91.81,
                provider="angelone",
                timestamp="2026-08-19T15:29:50+05:30",
            ),
            "ASHOKLEY": NormalizedQuote(
                symbol="ASHOKLEY",
                resolved_symbol="ASHOKLEY.NS",
                ltp=173.10,
                trading_symbol="ASHOKLEY-EQ",
                symbol_token="212",
                previous_close=175.0,
                provider="angelone",
                timestamp="2026-08-19T15:29:50+05:30",
            ),
        }

    def get_quote(self, symbol: str):
        clean = symbol.strip().upper()
        return self.mock_quotes.get(clean)

    def get_batch_quotes(self, symbols):
        res = {}
        for s in symbols:
            clean = s.strip().upper()
            if clean in self.mock_quotes:
                res[clean] = self.mock_quotes[clean]
        return res

    def get_history(self, symbol, period="1mo", interval="1d"):
        import pandas as pd
        return pd.DataFrame({"Close": [100.0, 105.0]})


class TestCanonicalSessionValuation(unittest.TestCase):

    def setUp(self):
        MarketSessionManager.reset_instance()
        CanonicalValuationService.reset_instance()
        self.temp_dir = tempfile.mkdtemp()
        self.session_manager = MarketSessionManager(storage_dir=self.temp_dir)
        self.mock_provider = MockMarketDataProvider()
        self.canonical_service = CanonicalValuationService(
            provider=self.mock_provider,
            session_manager=self.session_manager,
        )

        self.sample_holdings = [
            PortfolioHolding(id=1, ticker="MRF", quantity=1.0, average_buy_price=130000.0),
            PortfolioHolding(id=2, ticker="NITCO", quantity=100.0, average_buy_price=80.0),
            PortfolioHolding(id=3, ticker="ASHOKLEY", quantity=10.0, average_buy_price=170.0),
        ]

    def tearDown(self):
        shutil.rmtree(self.temp_dir, ignore_errors=True)
        MarketSessionManager.reset_instance()
        CanonicalValuationService.reset_instance()

    def test_market_open_ltp_updates(self):
        """
        Requirement 16.1: During MARKET OPEN, incoming Angel One ticks update portfolio valuation.
        """
        # Simulate Wednesday 11:30 AM IST (Market Open)
        open_time_ist = datetime(2026, 8, 19, 11, 30, 0, tzinfo=IST)
        with patch.object(self.session_manager, "get_current_time_ist", return_value=open_time_ist):
            val1 = self.canonical_service.evaluate_portfolio(self.sample_holdings)
            self.assertEqual(val1.session_info.status, "OPEN")
            self.assertEqual(val1.valuation_source, "LIVE_SESSION")
            self.assertEqual(val1.total_invested, 139700.0)  # 130000 + 8000 + 1700
            # Current value: 133500 + 8980 + 1731 = 144211.0
            self.assertEqual(val1.total_current_value, 144211.0)
            self.assertEqual(val1.total_unrealized_profit, 4511.0)

            # Simulate new market tick: ASHOKLEY rises to 180.0
            self.mock_provider.mock_quotes["ASHOKLEY"] = NormalizedQuote(
                symbol="ASHOKLEY",
                resolved_symbol="ASHOKLEY.NS",
                ltp=180.0,
                trading_symbol="ASHOKLEY-EQ",
                symbol_token="212",
                previous_close=175.0,
                provider="angelone",
                timestamp="2026-08-19T11:31:00+05:30",
            )

            val2 = self.canonical_service.evaluate_portfolio(self.sample_holdings)
            self.assertEqual(val2.total_current_value, 144280.0)  # 133500 + 8980 + 1800
            self.assertEqual(val2.total_unrealized_profit, 4580.0)

    def test_market_closed_ltp_remains_frozen(self):
        """
        Requirement 16.2: During MARKET CLOSED (e.g. 5:23 PM IST), portfolio valuation freezes.
        Upstream mutations or repeated queries MUST NOT change the valuation.
        """
        # Simulate Wednesday 17:23 PM IST (Market Closed)
        closed_time_ist = datetime(2026, 8, 19, 17, 23, 0, tzinfo=IST)
        with patch.object(self.session_manager, "get_current_time_ist", return_value=closed_time_ist):
            val1 = self.canonical_service.evaluate_portfolio(self.sample_holdings)
            self.assertEqual(val1.session_info.status, "CLOSED")
            self.assertTrue(val1.session_info.is_frozen)
            self.assertEqual(val1.total_current_value, 144211.0)
            self.assertEqual(val1.total_unrealized_profit, 4511.0)

            # Even if an external scraper or upstream source starts returning erratic numbers post-close:
            self.mock_provider.mock_quotes["ASHOKLEY"] = NormalizedQuote(
                symbol="ASHOKLEY",
                resolved_symbol="ASHOKLEY.NS",
                ltp=999.0,  # Erroneous post-market tick
                trading_symbol="ASHOKLEY-EQ",
                symbol_token="212",
                previous_close=175.0,
                provider="angelone",
            )

            # Re-evaluating 10 times simulated polling
            for _ in range(10):
                val_poll = self.canonical_service.evaluate_portfolio(self.sample_holdings)
                # Value MUST remain strictly frozen at the session close value (144211.0), NOT 999.0!
                self.assertEqual(val_poll.total_current_value, 144211.0)
                self.assertEqual(val_poll.total_unrealized_profit, 4511.0)
                ashok_val = next(h for h in val_poll.holdings if h.holding.ticker == "ASHOKLEY")
                self.assertEqual(ashok_val.current_price, 173.10)

    def test_new_trading_session_unfreezes(self):
        """
        Requirement 16.3: When next business day opens (Thursday 09:15 AM IST), session unfreezes.
        """
        # 1. Closed session on Wednesday 17:30 IST
        wed_closed = datetime(2026, 8, 19, 17, 30, 0, tzinfo=IST)
        with patch.object(self.session_manager, "get_current_time_ist", return_value=wed_closed):
            val_wed = self.canonical_service.evaluate_portfolio(self.sample_holdings)
            self.assertEqual(val_wed.session_info.session_id, "NSE-2026-08-19")
            self.assertEqual(val_wed.total_current_value, 144211.0)

        # 2. Advance time to Thursday 09:20 AM IST (New Session Opening)
        thu_open = datetime(2026, 8, 20, 9, 20, 0, tzinfo=IST)
        # Update provider with Thursday morning price
        self.mock_provider.mock_quotes["ASHOKLEY"] = NormalizedQuote(
            symbol="ASHOKLEY",
            resolved_symbol="ASHOKLEY.NS",
            ltp=178.0,
            trading_symbol="ASHOKLEY-EQ",
            symbol_token="212",
            previous_close=173.10,
            provider="angelone",
            timestamp="2026-08-20T09:20:00+05:30",
        )

        with patch.object(self.session_manager, "get_current_time_ist", return_value=thu_open):
            val_thu = self.canonical_service.evaluate_portfolio(self.sample_holdings)
            self.assertEqual(val_thu.session_info.session_id, "NSE-2026-08-20")
            self.assertEqual(val_thu.session_info.status, "OPEN")
            self.assertEqual(val_thu.valuation_source, "LIVE_SESSION")
            self.assertEqual(val_thu.total_current_value, 144260.0)  # 133500 + 8980 + 1780

    def test_mathematical_invariant_pnl(self):
        """
        Requirement 16.5: Total Current Value - Total Invested == Total Unrealized P&L
        must strictly hold for every valuation and every holding.
        """
        closed_time_ist = datetime(2026, 8, 19, 17, 23, 0, tzinfo=IST)
        with patch.object(self.session_manager, "get_current_time_ist", return_value=closed_time_ist):
            val = self.canonical_service.evaluate_portfolio(self.sample_holdings)
            self.assertAlmostEqual(
                val.total_current_value - val.total_invested,
                val.total_unrealized_profit,
                places=2
            )
            for h in val.holdings:
                self.assertAlmostEqual(
                    h.current_value - h.invested,
                    h.profit,
                    places=2
                )

    def test_dashboard_and_portfolio_endpoints_identical_valuation(self):
        """
        Requirement 16.4: Dashboard (/api/portfolio) and Reconciliation (/api/portfolio/reconciliation)
        must return 100% identical Total Invested, Total Current Value, and Unrealized P&L.
        """
        from fastapi.testclient import TestClient
        from app.api.main import app
        from app.api.routes import get_portfolio_repo

        mock_repo = MagicMock()
        mock_repo.get_holdings.return_value = self.sample_holdings

        app.dependency_overrides[get_portfolio_repo] = lambda: mock_repo
        client = TestClient(app)

        with patch("app.services.canonical_valuation_service.CanonicalValuationService.get_instance", return_value=self.canonical_service):
            resp_portfolio = client.get("/api/portfolio")
            resp_recon = client.get("/api/portfolio/reconciliation")

            self.assertEqual(resp_portfolio.status_code, 200)
            self.assertEqual(resp_recon.status_code, 200)

            data_port = resp_portfolio.json()
            data_recon = resp_recon.json()

            self.assertEqual(data_port["total_invested"], data_recon["total_invested"])
            self.assertEqual(data_port["total_current_value"], data_recon["total_current_value"])
            self.assertEqual(data_port["total_unrealized_profit"], data_recon["total_unrealized_profit"])
            self.assertEqual(data_port["total_return_percentage"], data_recon["total_return_percentage"])
            self.assertEqual(data_port["total_holdings"], data_recon["total_holdings"])

    def test_closed_session_immutability_against_interleaved_queries(self):
        """
        Regression Test: Proves that when market is CLOSED, interleaved queries for other
        symbols (e.g. Header index quotes ^NSEI, Watchlist items) and upstream mutations
        NEVER alter or overwrite the frozen session valuation for existing portfolio holdings.
        """
        closed_time_ist = datetime(2026, 8, 19, 17, 35, 0, tzinfo=IST)
        with patch.object(self.session_manager, "get_current_time_ist", return_value=closed_time_ist):
            # 1. Initial portfolio valuation freezes sample holdings
            val_initial = self.canonical_service.evaluate_portfolio(self.sample_holdings)
            initial_val = val_initial.total_current_value
            initial_profit = val_initial.total_unrealized_profit
            self.assertEqual(initial_val, 144211.0)
            self.assertEqual(initial_profit, 4511.0)

            # 2. Interleaved index query from Header.tsx arrives
            self.mock_provider.mock_quotes["^NSEI"] = NormalizedQuote(
                symbol="^NSEI",
                resolved_symbol="^NSEI",
                ltp=24500.0,
                trading_symbol="NIFTY",
                symbol_token="9999",
                previous_close=24400.0,
                provider="angelone",
            )
            quotes_idx, _, _ = self.canonical_service.get_canonical_quotes(["^NSEI"])
            self.assertIn("^NSEI", quotes_idx)

            # 3. Upstream provider returns mutated/tampered prices for original holdings
            self.mock_provider.mock_quotes["MRF"] = NormalizedQuote(
                symbol="MRF",
                resolved_symbol="MRF.NS",
                ltp=999999.0,  # Erroneous mutated tick
                trading_symbol="MRF-EQ",
                symbol_token="2277",
                previous_close=133505.0,
                provider="angelone",
            )
            self.mock_provider.mock_quotes["NITCO"] = NormalizedQuote(
                symbol="NITCO",
                resolved_symbol="NITCO.NS",
                ltp=1.0,  # Erroneous mutated tick
                trading_symbol="NITCO-EQ",
                symbol_token="13300",
                previous_close=91.81,
                provider="angelone",
            )

            # 4. Perform 20 subsequent polling/refresh requests
            for cycle in range(20):
                val_subsequent = self.canonical_service.evaluate_portfolio(self.sample_holdings)
                self.assertEqual(val_subsequent.total_current_value, initial_val)
                self.assertEqual(val_subsequent.total_unrealized_profit, initial_profit)
                self.assertEqual(val_subsequent.session_info.status, "CLOSED")
                self.assertTrue(val_subsequent.session_info.is_frozen)

    def test_individual_holdings_sum_equals_total_current_value(self):
        """
        Requirement 18.2: Verify that sum(all holding current_value) == total_current_value
        and sum(all holding invested) == total_invested exactly across both open and closed states.
        """
        # Test during market open
        open_time = datetime(2026, 8, 19, 10, 0, 0, tzinfo=IST)
        with patch.object(self.session_manager, "get_current_time_ist", return_value=open_time):
            val_open = self.canonical_service.evaluate_portfolio(self.sample_holdings)
            sum_current = round(sum(h.current_value for h in val_open.holdings), 2)
            sum_invested = round(sum(h.invested for h in val_open.holdings), 2)
            self.assertEqual(sum_current, val_open.total_current_value)
            self.assertEqual(sum_invested, val_open.total_invested)
            self.assertEqual(round(val_open.total_current_value - val_open.total_invested, 2), val_open.total_unrealized_profit)

        # Test during market closed
        closed_time = datetime(2026, 8, 19, 18, 0, 0, tzinfo=IST)
        with patch.object(self.session_manager, "get_current_time_ist", return_value=closed_time):
            val_closed = self.canonical_service.evaluate_portfolio(self.sample_holdings)
            sum_current_closed = round(sum(h.current_value for h in val_closed.holdings), 2)
            sum_invested_closed = round(sum(h.invested for h in val_closed.holdings), 2)
            self.assertEqual(sum_current_closed, val_closed.total_current_value)
            self.assertEqual(sum_invested_closed, val_closed.total_invested)
            self.assertEqual(round(val_closed.total_current_value - val_closed.total_invested, 2), val_closed.total_unrealized_profit)

    def test_closed_market_uses_nse_official_close(self):
        """
        Requirement: Verify that during closed market, the official NSE closing settlement price
        is used rather than pre-close intraday ticks or Google Finance scrapes.
        """
        from app.services.market_data.nse_provider import NSEMarketDataProvider

        # Full 12 holdings
        portfolio_holdings = [
            PortfolioHolding(id=1, ticker="LAURUSLABS", quantity=20.0, average_buy_price=442.82),
            PortfolioHolding(id=2, ticker="LTF", quantity=50.0, average_buy_price=173.23),
            PortfolioHolding(id=3, ticker="NITCO", quantity=100.0, average_buy_price=79.21),
            PortfolioHolding(id=4, ticker="EDELWEISS", quantity=54.0, average_buy_price=80.00),
            PortfolioHolding(id=5, ticker="LEMONTREE", quantity=50.0, average_buy_price=144.06),
            PortfolioHolding(id=6, ticker="VISL", quantity=150.0, average_buy_price=36.59),
            PortfolioHolding(id=7, ticker="SUZLON", quantity=80.0, average_buy_price=68.64),
            PortfolioHolding(id=8, ticker="VEDPOWER", quantity=100.0, average_buy_price=41.20),
            PortfolioHolding(id=9, ticker="ADANIPOWER", quantity=11.0, average_buy_price=174.21),
            PortfolioHolding(id=10, ticker="ASHOKLEY", quantity=9.0, average_buy_price=212.14),
            PortfolioHolding(id=11, ticker="PCJEWELLER", quantity=140.0, average_buy_price=10.14),
            PortfolioHolding(id=12, ticker="ALLCARGO", quantity=38.0, average_buy_price=7.65),
        ]

        nse_provider = NSEMarketDataProvider()
        mock_12_quotes = {
            "LAURUSLABS": NormalizedQuote(symbol="LAURUSLABS", resolved_symbol="LAURUSLABS.NS", ltp=1801.80, previous_close=1801.80, timestamp="2026-08-19T15:30:00+05:30", provider="nse"),
            "LTF": NormalizedQuote(symbol="LTF", resolved_symbol="LTF.NS", ltp=263.20, previous_close=263.20, timestamp="2026-08-19T15:30:00+05:30", provider="nse"),
            "NITCO": NormalizedQuote(symbol="NITCO", resolved_symbol="NITCO.NS", ltp=91.81, previous_close=91.81, timestamp="2026-08-19T15:30:00+05:30", provider="nse"),
            "EDELWEISS": NormalizedQuote(symbol="EDELWEISS", resolved_symbol="EDELWEISS.NS", ltp=120.40, previous_close=120.40, timestamp="2026-08-19T15:30:00+05:30", provider="nse"),
            "LEMONTREE": NormalizedQuote(symbol="LEMONTREE", resolved_symbol="LEMONTREE.NS", ltp=134.60, previous_close=134.60, timestamp="2026-08-19T15:30:00+05:30", provider="nse"),
            "VISL": NormalizedQuote(symbol="VISL", resolved_symbol="VISL.NS", ltp=38.40, previous_close=38.40, timestamp="2026-08-19T15:30:00+05:30", provider="nse"),
            "SUZLON": NormalizedQuote(symbol="SUZLON", resolved_symbol="SUZLON.NS", ltp=66.50, previous_close=66.50, timestamp="2026-08-19T15:30:00+05:30", provider="nse"),
            "VEDPOWER": NormalizedQuote(symbol="VEDPOWER", resolved_symbol="VEDPOWER.NS", ltp=42.10, previous_close=42.10, timestamp="2026-08-19T15:30:00+05:30", provider="nse"),
            "ADANIPOWER": NormalizedQuote(symbol="ADANIPOWER", resolved_symbol="ADANIPOWER.NS", ltp=542.20, previous_close=542.20, timestamp="2026-08-19T15:30:00+05:30", provider="nse"),
            "ASHOKLEY": NormalizedQuote(symbol="ASHOKLEY", resolved_symbol="ASHOKLEY.NS", ltp=175.00, previous_close=175.00, timestamp="2026-08-19T15:30:00+05:30", provider="nse"),
            "PCJEWELLER": NormalizedQuote(symbol="PCJEWELLER", resolved_symbol="PCJEWELLER.NS", ltp=11.20, previous_close=11.20, timestamp="2026-08-19T15:30:00+05:30", provider="nse"),
            "ALLCARGO": NormalizedQuote(symbol="ALLCARGO", resolved_symbol="ALLCARGO.NS", ltp=8.10, previous_close=8.10, timestamp="2026-08-19T15:30:00+05:30", provider="nse"),
        }
        closed_time = datetime(2026, 8, 19, 18, 0, 0, tzinfo=IST)
        with patch.object(self.session_manager, "get_current_time_ist", return_value=closed_time), \
             patch.object(nse_provider, "get_batch_quotes", return_value=mock_12_quotes):
            canonical_svc = CanonicalValuationService(
                provider=nse_provider,
                session_manager=self.session_manager,
            )
            result = canonical_svc.evaluate_portfolio(portfolio_holdings, force_refresh=True)

            # Check LAURUSLABS specifically
            laurus = next(h for h in result.holdings if h.holding.ticker == "LAURUSLABS")
            self.assertEqual(laurus.current_price, 1801.80)
            self.assertEqual(laurus.current_value, 36036.00)

            # Check portfolio total matches evaluated holdings total
            expected_current_val = round(sum(h.current_value for h in result.holdings), 2)
            self.assertEqual(result.total_invested, 57597.47)
            self.assertEqual(result.total_current_value, expected_current_val)
            self.assertEqual(result.total_unrealized_profit, round(expected_current_val - 57597.47, 2))

    def test_sync_data_does_not_change_closed_market_valuation(self):
        """
        Requirement: Verify that repeated 'Sync Data' calls while the market is closed
        return identical frozen canonical numbers without mutating holding valuations.
        """
        closed_time = datetime(2026, 8, 19, 18, 0, 0, tzinfo=IST)
        with patch.object(self.session_manager, "get_current_time_ist", return_value=closed_time):
            val1 = self.canonical_service.evaluate_portfolio(self.sample_holdings)
            val2 = self.canonical_service.evaluate_portfolio(self.sample_holdings)
            val3 = self.canonical_service.evaluate_portfolio(self.sample_holdings)

            self.assertEqual(val1.total_current_value, val2.total_current_value)
            self.assertEqual(val2.total_current_value, val3.total_current_value)
            self.assertEqual(val1.total_unrealized_profit, val3.total_unrealized_profit)

    def test_mock_quotes_cannot_pollute_production_session_storage(self):
        """
        Requirement: Verify that mock test quotes (e.g. NITCO=89.80, MRF=133500)
        are written ONLY to the isolated temporary test directory and NEVER to production
        data/sessions/.
        """
        import json
        import os

        closed_time = datetime(2026, 8, 19, 18, 0, 0, tzinfo=IST)
        with patch.object(self.session_manager, "get_current_time_ist", return_value=closed_time):
            val = self.canonical_service.evaluate_portfolio(self.sample_holdings)

            # Assert that the session file was created in isolated test temp_dir
            session_id = val.session_info.session_id
            test_file = os.path.join(self.temp_dir, f"{session_id}.json")
            self.assertTrue(os.path.exists(test_file))

            with open(test_file, "r") as f:
                test_data = json.load(f)
                self.assertIn("NITCO", test_data)
                self.assertEqual(test_data["NITCO"]["ltp"], 89.80)
                self.assertIn("MRF", test_data)

            # Assert that production data/sessions/ directory does NOT contain MRF from this test
            prod_dir = os.path.join(
                os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                "data",
                "sessions",
            )
            prod_file = os.path.join(prod_dir, f"{session_id}.json")
            if os.path.exists(prod_file):
                with open(prod_file, "r") as pf:
                    prod_data = json.load(pf)
                    self.assertNotIn("MRF", prod_data, "MRF test quote leaked into production session storage!")


if __name__ == "__main__":
    unittest.main()

