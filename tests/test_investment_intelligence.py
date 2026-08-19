import os
import tempfile
import shutil
import unittest
from unittest.mock import patch, MagicMock
from app.models.intelligence import (
    RecommendationType,
    EventDirection,
    NewsEventExtraction,
    QuantitativeFactors,
    ScoreBreakdown,
    HardGateTrigger,
    InvestmentOpportunity,
)
from app.services.intelligence.evaluator import OpportunityEvaluator
from app.services.intelligence.impact_analyzer import NewsImpactAnalyzer
from app.services.intelligence.universe import StockUniverseRegistry
from app.database.database import Database
from app.database.intelligence_repository import IntelligenceRepository
from app.services.market_session import MarketSessionManager
from app.services.canonical_valuation_service import CanonicalValuationService
from fastapi.testclient import TestClient
from app.api.main import app


class TestInvestmentIntelligence(unittest.TestCase):
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
        self.evaluator = OpportunityEvaluator()
        self.analyzer = NewsImpactAnalyzer()
        self.repo = IntelligenceRepository()

    def tearDown(self):
        MarketSessionManager.reset_instance()
        CanonicalValuationService.reset_instance()

    def test_stock_universe_registry(self):
        """Test universe mappings and keyword discovery."""
        all_tickers = StockUniverseRegistry.get_all_tickers()
        self.assertIn("HDFCBANK", all_tickers)
        self.assertIn("TCS", all_tickers)
        self.assertIn("RELIANCE", all_tickers)
        self.assertIn("LAURUSLABS", all_tickers)

        # Keyword mapping
        infra_candidates = StockUniverseRegistry.find_candidates_from_keywords(["infrastructure", "cement"])
        infra_tickers = [c["ticker"] for c in infra_candidates]
        self.assertTrue(any(t in ["LT", "ULTRACEMCO", "AMBUJACEM", "NITCO"] for t in infra_tickers))

    def test_news_impact_analyzer_fallback(self):
        """Test that heuristic analyzer gracefully extracts event details when Ollama is mocked/offline."""
        title = "Government announces massive ₹10,000 Cr highway and infrastructure expansion"
        summary = "New budgetary allocation to boost cement, engineering and road construction companies."
        
        # Test heuristic fallback directly
        extraction = self.analyzer._heuristic_fallback(title, summary)
        self.assertEqual(extraction.direction, EventDirection.POSITIVE)
        self.assertTrue(any("Infrastructure" in s for s in extraction.affected_sectors))
        self.assertGreaterEqual(extraction.impact_strength, 5)

    def test_hard_gate_extreme_valuation_blocks_buy(self):
        """
        Hard Gate 1: Extreme P/E ratio (e.g. 95x) must block BUY even when fundamentals and news are positive.
        """
        metrics = QuantitativeFactors(
            revenue_cagr_3y=25.0,
            profit_cagr_3y=30.0,
            operating_margin=24.0,
            net_margin=18.0,
            roe=22.0,
            roce=25.0,
            debt_to_equity=0.1,
            pe_ratio=95.0,  # Extreme Valuation
            pb_ratio=14.0,
            ev_to_ebitda=45.0,
            cfo_to_pat_ratio=1.1,
            price_change_5d=1.5,
            current_price=2500.0,
            market_cap_cr=80000.0,
        )
        news_event = NewsEventExtraction(
            event_type="Contract Win",
            event_summary="Secured landmark multi-year export contract",
            affected_sectors=["Information Technology"],
            affected_tickers=["TCS"],
            direction=EventDirection.POSITIVE,
            impact_strength=8,
            time_horizon="1-3 years",
            mechanism="Boosts international order backlog",
            potential_beneficiaries=["TCS"],
            potential_losers=[],
            key_risks=[],
            confidence=85,
        )

        scores = self.evaluator._compute_scores(metrics, None, news_event)
        self.assertLessEqual(scores.valuation_score, 25)

        rec, gates = self.evaluator._determine_recommendation_and_gates(
            metrics=metrics,
            scores=scores,
            news_event=news_event,
            is_owned=False,
            port_allocation_pct=0.0,
        )

        # Must NOT be BUY
        self.assertEqual(rec, RecommendationType.WATCH)
        self.assertTrue(any(g.gate_name == "EXTREME_VALUATION_BLOCK" for g in gates))

    def test_hard_gate_cash_flow_divergence(self):
        """
        Hard Gate 2: Severe cash flow divergence (CFO/PAT < 0.5) must block aggressive buying.
        """
        metrics = QuantitativeFactors(
            revenue_cagr_3y=18.0,
            profit_cagr_3y=22.0,
            operating_margin=16.0,
            net_margin=12.0,
            roe=16.0,
            roce=18.0,
            debt_to_equity=0.4,
            pe_ratio=22.0,
            pb_ratio=2.5,
            ev_to_ebitda=12.0,
            cfo_to_pat_ratio=0.30,  # Poor cash conversion
            price_change_5d=2.0,
            current_price=500.0,
            market_cap_cr=12000.0,
        )
        news_event = NewsEventExtraction(
            event_type="Capacity Expansion",
            event_summary="New production line commissioned",
            affected_sectors=["Manufacturing"],
            affected_tickers=["NITCO"],
            direction=EventDirection.POSITIVE,
            impact_strength=7,
            time_horizon="1-3 years",
            mechanism="Capacity increase",
            potential_beneficiaries=[],
            potential_losers=[],
            key_risks=[],
            confidence=80,
        )

        scores = self.evaluator._compute_scores(metrics, None, news_event)
        self.assertLessEqual(scores.earnings_quality_score, 35)

        rec, gates = self.evaluator._determine_recommendation_and_gates(
            metrics=metrics,
            scores=scores,
            news_event=news_event,
            is_owned=False,
            port_allocation_pct=0.0,
        )

        self.assertEqual(rec, RecommendationType.WATCH)
        self.assertTrue(any(g.gate_name == "CASH_FLOW_DIVERGENCE" for g in gates))

    def test_discover_stocks_outside_portfolio(self):
        """
        Requirement: The engine must discover and recommend attractive stocks not currently owned.
        """
        metrics = QuantitativeFactors(
            revenue_cagr_3y=22.0,
            profit_cagr_3y=26.0,
            operating_margin=25.0,
            net_margin=19.0,
            roe=24.0,
            roce=28.0,
            debt_to_equity=0.05,
            pe_ratio=26.0,
            pb_ratio=5.0,
            ev_to_ebitda=16.0,
            cfo_to_pat_ratio=1.05,
            price_change_5d=1.0,
            current_price=3500.0,
            market_cap_cr=1200000.0,
        )
        news_event = NewsEventExtraction(
            event_type="Earnings Outperformance",
            event_summary="Quarterly profit surges 28% with expanding international deal wins",
            affected_sectors=["Information Technology"],
            affected_tickers=["TCS"],
            direction=EventDirection.POSITIVE,
            impact_strength=9,
            time_horizon="3-5 years",
            mechanism="Operating leverage and large-scale deal expansion",
            potential_beneficiaries=["TCS"],
            potential_losers=[],
            key_risks=["Global IT spending slowdown"],
            confidence=90,
        )

        scores = self.evaluator._compute_scores(metrics, None, news_event)
        self.assertGreaterEqual(scores.fundamental_score, 70)
        self.assertGreaterEqual(scores.overall_conviction, 70)

        rec, gates = self.evaluator._determine_recommendation_and_gates(
            metrics=metrics,
            scores=scores,
            news_event=news_event,
            is_owned=False,
            port_allocation_pct=0.0,
        )

        self.assertEqual(rec, RecommendationType.BUY)
        self.assertEqual(len(gates), 0)

    def test_portfolio_overallocation_cap(self):
        """
        Requirement: High allocation in existing portfolio caps BUY MORE to HOLD.
        """
        metrics = QuantitativeFactors(
            revenue_cagr_3y=20.0,
            profit_cagr_3y=24.0,
            operating_margin=22.0,
            net_margin=16.0,
            roe=20.0,
            roce=22.0,
            debt_to_equity=0.1,
            pe_ratio=24.0,
            pb_ratio=4.0,
            ev_to_ebitda=14.0,
            cfo_to_pat_ratio=1.0,
            price_change_5d=1.0,
            current_price=1800.0,
            market_cap_cr=45000.0,
        )
        news_event = NewsEventExtraction(
            event_type="USFDA Approval",
            event_summary="Receives key ANDA approval for high-margin formulation",
            affected_sectors=["Pharmaceuticals & Healthcare"],
            affected_tickers=["LAURUSLABS"],
            direction=EventDirection.POSITIVE,
            impact_strength=8,
            time_horizon="1-3 years",
            mechanism="Exclusive market access in US market",
            potential_beneficiaries=["LAURUSLABS"],
            potential_losers=[],
            key_risks=[],
            confidence=88,
        )

        scores = self.evaluator._compute_scores(metrics, None, news_event)
        rec, gates = self.evaluator._determine_recommendation_and_gates(
            metrics=metrics,
            scores=scores,
            news_event=news_event,
            is_owned=True,
            port_allocation_pct=39.5,  # Heavy concentration
        )

        self.assertEqual(rec, RecommendationType.HOLD)
        self.assertTrue(any(g.gate_name == "PORTFOLIO_CONCENTRATION_LIMIT" for g in gates))

    def test_api_intelligence_endpoints(self):
        """Test API endpoints for investment intelligence."""
        # 1. Opportunities endpoint
        resp = self.client.get("/api/intelligence/opportunities")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertIn("total", data)
        self.assertIn("opportunities", data)


if __name__ == "__main__":
    unittest.main()
