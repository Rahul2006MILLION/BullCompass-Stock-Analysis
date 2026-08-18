import unittest
import sqlite3
from fastapi.testclient import TestClient

from app.api.main import app
from app.database.database import Database
from app.database.watchlist_repository import WatchlistRepository
from app.database.portfolio_repository import PortfolioRepository
from app.models.portfolio import PortfolioHolding
from app.services.watchlist_service import WatchlistService


class TestWatchlistFeature(unittest.TestCase):
    def setUp(self):
        # Create an in-memory SQLite database for isolated unit testing
        self.db = Database(":memory:")
        self.repo = WatchlistRepository(self.db)
        self.portfolio_repo = PortfolioRepository()
        self.portfolio_repo.db = self.db
        self.service = WatchlistService(
            repository=self.repo,
            portfolio_repo=self.portfolio_repo,
        )
        self.client = TestClient(app)

    def test_normalize_ticker(self):
        self.assertEqual(WatchlistService.normalize_ticker("hdfcbank"), "HDFCBANK")
        self.assertEqual(WatchlistService.normalize_ticker("HDFCBANK.NS"), "HDFCBANK")
        self.assertEqual(WatchlistService.normalize_ticker(" infy.ns "), "INFY")
        self.assertEqual(WatchlistService.normalize_ticker("TCS"), "TCS")

    def test_add_valid_stock(self):
        result = self.service.add_to_watchlist("HDFCBANK")
        self.assertEqual(result["ticker"], "HDFCBANK")
        self.assertIn("HDFC Bank", result["company_name"])
        self.assertGreater(result["current_price"], 0)

        # Check repository state
        items = self.repo.get_all()
        self.assertEqual(len(items), 1)
        self.assertEqual(items[0].ticker, "HDFCBANK")

    def test_add_duplicate_stock(self):
        self.service.add_to_watchlist("HDFCBANK")
        with self.assertRaises(ValueError) as ctx:
            self.service.add_to_watchlist("HDFCBANK")
        self.assertIn("already in your watchlist", str(ctx.exception).lower())

        # Test duplicate with .NS suffix
        with self.assertRaises(ValueError) as ctx2:
            self.service.add_to_watchlist("HDFCBANK.NS")
        self.assertIn("already in your watchlist", str(ctx2.exception).lower())

    def test_add_invalid_ticker(self):
        with self.assertRaises(ValueError) as ctx:
            self.service.add_to_watchlist("PCJEWELLERS")
        self.assertIn("couldn't find a listed stock", str(ctx.exception).lower())

        with self.assertRaises(ValueError) as ctx2:
            self.service.add_to_watchlist("XYZABC123")
        self.assertIn("couldn't find a listed stock", str(ctx2.exception).lower())

        # Verify nothing was added
        self.assertEqual(len(self.repo.get_all()), 0)

    def test_get_watchlist_and_delete(self):
        self.service.add_to_watchlist("INFY")
        self.service.add_to_watchlist("TCS")

        watchlist = self.service.get_watchlist()
        self.assertEqual(len(watchlist), 2)

        tickers = [item["ticker"] for item in watchlist]
        self.assertIn("INFY", tickers)
        self.assertIn("TCS", tickers)

        # Delete INFY
        self.service.delete_from_watchlist("INFY.NS")
        remaining = self.service.get_watchlist()
        self.assertEqual(len(remaining), 1)
        self.assertEqual(remaining[0]["ticker"], "TCS")

    def test_portfolio_watchlist_relationship(self):
        # Add TCS to portfolio
        self.portfolio_repo.add_holding(
            PortfolioHolding(id=None, ticker="TCS", quantity=10.0, average_buy_price=3500.0)
        )

        # Add TCS and INFY to watchlist
        res_tcs = self.service.add_to_watchlist("TCS")
        res_infy = self.service.add_to_watchlist("INFY")

        self.assertTrue(res_tcs["is_owned"])
        self.assertFalse(res_infy["is_owned"])

        watchlist = self.service.get_watchlist()
        tcs_item = next(item for item in watchlist if item["ticker"] == "TCS")
        infy_item = next(item for item in watchlist if item["ticker"] == "INFY")

        self.assertTrue(tcs_item["is_owned"])
        self.assertFalse(infy_item["is_owned"])

    def test_api_watchlist_endpoints(self):
        # Test GET empty
        res = self.client.get("/api/watchlist")
        self.assertEqual(res.status_code, 200)

        # Test POST valid
        post_res = self.client.post("/api/watchlist", json={"ticker": "HDFCBANK"})
        self.assertIn(post_res.status_code, [200, 400])  # 400 if already exists in active DB

        # Test POST invalid
        invalid_res = self.client.post("/api/watchlist", json={"ticker": "PCJEWELLERS"})
        self.assertEqual(invalid_res.status_code, 404)
        self.assertIn("couldn't find a listed stock", invalid_res.json()["detail"].lower())

        # Test DELETE
        del_res = self.client.delete("/api/watchlist/HDFCBANK")
        self.assertIn(del_res.status_code, [200, 404])


if __name__ == "__main__":
    unittest.main()
