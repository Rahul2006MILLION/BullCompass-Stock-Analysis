import unittest
from fastapi.testclient import TestClient
from app.api.main import app
from app.services.fundamental_service import FundamentalDataService
from app.services.historical_analyzer import HistoricalFundamentalAnalyzer
from app.services.valuation_analyzer import ValuationAnalyzer
from app.services.decision_engine import InvestmentDecisionEngine


class TestFundamentalsEngine(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)
        cls.fund_service = FundamentalDataService()
        cls.hist_analyzer = HistoricalFundamentalAnalyzer()
        cls.val_analyzer = ValuationAnalyzer()
        cls.decision_engine = InvestmentDecisionEngine()

    def test_hdfc_bank_fundamentals(self):
        meta, inc, bs, cf, ratios = self.fund_service.fetch_fundamentals("HDFCBANK")
        self.assertTrue(bs.is_financial_institution)
        self.assertFalse(cf.is_applicable)
        self.assertGreater(len(inc.years), 0)
        self.assertIsNotNone(meta["current_price"])

        trends = self.hist_analyzer.analyze_trends(inc, bs, cf, ratios)
        val_status = self.val_analyzer.evaluate_valuation(ratios, bs.is_financial_institution)
        decision = self.decision_engine.evaluate(meta, inc, bs, cf, ratios, trends, val_status, [])

        self.assertIn(decision.decision.value, ["STRONG BUY CANDIDATE", "BUY CANDIDATE", "HOLD / WATCH", "AVOID"])
        self.assertGreaterEqual(decision.fundamental_score, 0.0)
        self.assertLessEqual(decision.fundamental_score, 100.0)

    def test_tcs_fundamentals(self):
        meta, inc, bs, cf, ratios = self.fund_service.fetch_fundamentals("TCS")
        self.assertFalse(bs.is_financial_institution)
        self.assertTrue(cf.is_applicable)
        self.assertGreater(len(inc.years), 0)

        trends = self.hist_analyzer.analyze_trends(inc, bs, cf, ratios)
        val_status = self.val_analyzer.evaluate_valuation(ratios, bs.is_financial_institution)
        decision = self.decision_engine.evaluate(meta, inc, bs, cf, ratios, trends, val_status, [])

        self.assertIn(decision.decision.value, ["STRONG BUY CANDIDATE", "BUY CANDIDATE", "HOLD / WATCH", "AVOID"])
        self.assertGreater(decision.fundamental_score, 50.0)  # TCS is high quality

    def test_api_research_endpoint(self):
        res = self.client.post("/api/research/analyze", json={"ticker": "INFY"})
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["ticker"], "INFY")
        self.assertIn("income_statement", data)
        self.assertIn("balance_sheet", data)
        self.assertIn("cash_flow", data)
        self.assertIn("ratios", data)
        self.assertIn("decision", data)
        self.assertIn("fundamental_score", data["decision"])
        self.assertIn("ai_thesis_report", data)


if __name__ == "__main__":
    unittest.main()
