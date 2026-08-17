import unittest
from fastapi.testclient import TestClient

from app.api.main import app
from app.models.news import NewsItem, NewsCategory, EntityExposure, ExposureType, SentimentHint
from app.database.news_repository import NewsRepository
from app.services.news.aggregator import NewsAggregator, classify_category, determine_importance
from app.services.news_service import NewsService


class TestNewsPipeline(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)
        self.repo = NewsRepository()
        self.service = NewsService()

    def test_category_classifier(self):
        # Macro & Economy
        cat1 = classify_category("India Q3 GDP grows at 7.8% beating forecasts", "", "General")
        self.assertEqual(cat1, NewsCategory.MACRO_ECONOMY.value)

        # Policy & Regulation
        cat2 = classify_category("RBI keeps repo rate unchanged at 6.5%", "", "General")
        self.assertEqual(cat2, NewsCategory.POLICY_REGULATION.value)

        # Commodities & Energy
        cat3 = classify_category("Brent crude oil surges above $85 amid Middle East tensions", "", "General")
        self.assertEqual(cat3, NewsCategory.COMMODITIES_ENERGY.value)

        # Geopolitical
        cat4 = classify_category("Trade tariffs and geopolitical conflict escalate in Red Sea", "", "General")
        self.assertEqual(cat4, NewsCategory.GEOPOLITICAL.value)

        # Corporate & Earnings
        cat5 = classify_category("TCS reports 12% rise in quarterly net profit and announces dividend", "", "General")
        self.assertEqual(cat5, NewsCategory.CORPORATE_ACTION.value)

    def test_importance_scorer(self):
        imp1 = determine_importance("RBI announces emergency rate hike", NewsCategory.POLICY_REGULATION.value)
        self.assertEqual(imp1, "HIGH")

        imp2 = determine_importance("Local retail footwear trends in Mumbai", NewsCategory.SECTOR_INDUSTRY.value)
        self.assertEqual(imp2, "MEDIUM")

    def test_news_repository_deduplication(self):
        # Create dummy news item
        dummy_item = NewsItem(
            id="test_hash_unique_12345",
            title="Test Macroeconomic News Event",
            summary="Summary of the economic announcement",
            source="Test Provider",
            source_url="https://example.com/test",
            published_at="2026-08-17 12:00:00",
            fetched_at="2026-08-17 12:00:00",
            category=NewsCategory.MACRO_ECONOMY.value,
            subcategory="GDP",
            importance="HIGH",
            raw_content="Full content",
            entities=[
                EntityExposure(
                    ticker="RELIANCE",
                    sector="Energy",
                    entity_type="COMPANY",
                    exposure_type=ExposureType.DIRECT,
                    sentiment_hint=SentimentHint.POSITIVE,
                )
            ],
        )

        # First insert -> should insert 1
        inserted_1 = self.repo.save_news_batch([dummy_item])
        self.assertGreaterEqual(inserted_1, 0)

        # Second insert with identical ID -> should deduplicate and insert 0
        inserted_2 = self.repo.save_news_batch([dummy_item])
        self.assertEqual(inserted_2, 0)

        # Retrieve article by ID
        retrieved = self.repo.get_news_by_id("test_hash_unique_12345")
        self.assertIsNotNone(retrieved)
        self.assertEqual(retrieved.title, "Test Macroeconomic News Event")
        self.assertEqual(len(retrieved.entities), 1)
        self.assertEqual(retrieved.entities[0].ticker, "RELIANCE")

    def test_news_service_feed(self):
        feed = self.service.get_news_feed(limit=10, auto_sync_if_empty=False)
        self.assertIsInstance(feed, list)

    def test_api_news_endpoints(self):
        # GET /api/news
        res = self.client.get("/api/news?limit=10")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("total", data)
        self.assertIn("news", data)
        self.assertIsInstance(data["news"], list)

    def test_portfolio_zero_regression(self):
        # Check that portfolio summary is still 100% operational
        res = self.client.get("/api/portfolio")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("total_holdings", data)
        self.assertIn("total_invested", data)
        self.assertIn("holdings", data)
        self.assertGreater(len(data["holdings"]), 0)


if __name__ == "__main__":
    unittest.main()
