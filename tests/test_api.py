import os
import tempfile
import shutil
import unittest
from fastapi.testclient import TestClient
from app.api.main import app
from app.services.market_session import MarketSessionManager
from app.services.canonical_valuation_service import CanonicalValuationService


class TestApiEndpoints(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.temp_dir = tempfile.mkdtemp()
        os.environ["BULLCOMPASS_SESSION_STORAGE_DIR"] = cls.temp_dir
        MarketSessionManager.reset_instance()
        CanonicalValuationService.reset_instance()
        cls.client = TestClient(app)

    @classmethod
    def tearDownClass(cls):
        shutil.rmtree(cls.temp_dir, ignore_errors=True)
        if "BULLCOMPASS_SESSION_STORAGE_DIR" in os.environ:
            del os.environ["BULLCOMPASS_SESSION_STORAGE_DIR"]
        MarketSessionManager.reset_instance()
        CanonicalValuationService.reset_instance()

    def setUp(self):
        MarketSessionManager.reset_instance()
        CanonicalValuationService.reset_instance()

    def tearDown(self):
        MarketSessionManager.reset_instance()
        CanonicalValuationService.reset_instance()

    def test_root_endpoint(self):
        response = self.client.get("/")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "online")
        self.assertEqual(data["app"], "BullCompass")

    def test_portfolio_summary_endpoint(self):
        response = self.client.get("/api/portfolio")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("total_holdings", data)
        self.assertIn("total_invested", data)
        self.assertIn("total_current_value", data)
        self.assertIn("total_unrealized_profit", data)
        self.assertIn("total_return_percentage", data)
        self.assertIn("total_realized_profit", data)
        self.assertIsInstance(data["holdings"], list)

    def test_portfolio_history_endpoint(self):
        response = self.client.get("/api/portfolio/history")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIsInstance(data, list)

    def test_portfolio_history_ranges(self):
        for r in ["1W", "1M", "3M", "ALL"]:
            response = self.client.get(f"/api/portfolio/history?range={r}")
            self.assertEqual(response.status_code, 200)
            data = response.json()
            self.assertIsInstance(data, list)
            if len(data) > 0:
                self.assertIn("net_worth", data[0])
                self.assertIn("timestamp", data[0])

    def test_transactions_endpoint(self):
        response = self.client.get("/api/portfolio/transactions")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIsInstance(data, list)

    def test_realized_profit_endpoint(self):
        response = self.client.get("/api/portfolio/realized-profit")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("realized_profit", data)

    def test_market_quote_valid(self):
        response = self.client.get("/api/market/quote/HDFCBANK")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertNotEqual(data["name"], "")
        self.assertGreater(data["current_price"], 0)
        self.assertGreater(data["market_cap"], 0)

    def test_market_quote_invalid(self):
        # Invalid ticker PCJEWELLERS must return 404 and never return 0 values
        response = self.client.get("/api/market/quote/PCJEWELLERS")
        self.assertEqual(response.status_code, 404)
        data = response.json()
        self.assertIn("detail", data)
        self.assertIn("We couldn't find a listed stock matching 'PCJEWELLERS'.", data["detail"])

        # Random invalid ticker XYZABC123 must also return 404
        response = self.client.get("/api/market/quote/XYZABC123")
        self.assertEqual(response.status_code, 404)

    def test_market_status_endpoint(self):
        response = self.client.get("/api/market/status")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("is_open", data)
        self.assertIn("status", data)
        self.assertIn("current_time_ist", data)
        self.assertIn("timezone", data)

    def test_batch_quotes_post_endpoint(self):
        response = self.client.post("/api/quotes/batch", json={"tickers": ["TCS", "INFY", "^NSEI"]})
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("quotes", data)
        self.assertIn("market_status", data)
        quotes = data["quotes"]
        self.assertIn("TCS", quotes)
        self.assertIn("INFY", quotes)
        self.assertIsNotNone(quotes["TCS"]["current_price"])
        self.assertGreater(quotes["TCS"]["current_price"], 0)

    def test_batch_quotes_get_endpoint(self):
        response = self.client.get("/api/quotes/batch?symbols=TCS,INFY")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("quotes", data)
        quotes = data["quotes"]
        self.assertIn("TCS", quotes)
        self.assertIn("INFY", quotes)


if __name__ == "__main__":
    unittest.main()


