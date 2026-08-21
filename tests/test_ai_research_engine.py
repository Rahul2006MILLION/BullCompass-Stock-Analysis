import os
import tempfile
import shutil
import unittest
from unittest.mock import MagicMock
from fastapi.testclient import TestClient

from app.api.main import app
from app.models.fundamentals import (
    IncomeStatementData,
    BalanceSheetData,
    CashFlowData,
    KeyRatiosData,
    HistoricalTrendSignals,
    DecisionRating,
    ValuationStatus,
    ConfidenceLevel,
    RiskSeverity,
)
from app.services.research_coordinator import ResearchCoordinatorService
from app.services.decision_engine import InvestmentDecisionEngine
from app.services.valuation_analyzer import ValuationAnalyzer
from app.services.fundamental_service import FundamentalDataService
from app.services.historical_analyzer import HistoricalFundamentalAnalyzer
from app.database.news_repository import NewsRepository
from app.database.portfolio_repository import PortfolioRepository
from app.services.canonical_valuation_service import CanonicalValuationService
from app.services.market_session import MarketSessionManager


class TestAIResearchEngine(unittest.TestCase):
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
        self.coordinator = ResearchCoordinatorService()

    def test_earnings_quality_healthy_conversion(self):
        """Test healthy CFO/PAT conversion without red flags."""
        inc = IncomeStatementData(
            years=["FY22", "FY23", "FY24"],
            revenue={"FY22": 1000.0, "FY23": 1200.0, "FY24": 1500.0},
            operating_income={"FY22": 200.0, "FY23": 250.0, "FY24": 320.0},
            operating_margin={"FY22": 20.0, "FY23": 20.8, "FY24": 21.3},
            ebitda={"FY22": 220.0, "FY23": 270.0, "FY24": 350.0},
            ebitda_margin={"FY22": 22.0, "FY23": 22.5, "FY24": 23.3},
            net_income={"FY22": 150.0, "FY23": 180.0, "FY24": 230.0},
            net_margin={"FY22": 15.0, "FY23": 15.0, "FY24": 15.3},
            eps={"FY22": 15.0, "FY23": 18.0, "FY24": 23.0},
            revenue_cagr_3y=22.5,
            net_profit_cagr_3y=23.8,
        )
        cf = CashFlowData(
            years=["FY22", "FY23", "FY24"],
            is_applicable=True,
            operating_cash_flow={"FY22": 160.0, "FY23": 200.0, "FY24": 260.0},
            capital_expenditure={"FY22": 30.0, "FY23": 40.0, "FY24": 50.0},
            free_cash_flow={"FY22": 130.0, "FY23": 160.0, "FY24": 210.0},
            fcf_conversion=91.3,
            cash_flow_quality_flag="HEALTHY",
        )
        eq = self.coordinator._evaluate_earnings_quality(inc, cf, is_bank=False)
        self.assertEqual(eq.quality_status, "HIGH_QUALITY_CONVERTING")
        self.assertGreaterEqual(eq.cfo_to_pat_ratio, 1.0)
        self.assertEqual(len(eq.warning_flags), 0)

    def test_earnings_quality_divergence_warning(self):
        """Test CFO significantly lagging reported Net Profit."""
        inc = IncomeStatementData(
            years=["FY22", "FY23", "FY24"],
            revenue={"FY22": 1000.0, "FY23": 1200.0, "FY24": 1500.0},
            operating_income={"FY22": 200.0, "FY23": 250.0, "FY24": 300.0},
            operating_margin={"FY22": 20.0, "FY23": 20.8, "FY24": 20.0},
            ebitda={"FY22": 220.0, "FY23": 270.0, "FY24": 320.0},
            ebitda_margin={"FY22": 22.0, "FY23": 22.5, "FY24": 21.3},
            net_income={"FY22": 150.0, "FY23": 180.0, "FY24": 240.0},
            net_margin={"FY22": 15.0, "FY23": 15.0, "FY24": 16.0},
            eps={"FY22": 15.0, "FY23": 18.0, "FY24": 24.0},
            revenue_cagr_3y=22.5,
            net_profit_cagr_3y=26.5,
        )
        cf = CashFlowData(
            years=["FY22", "FY23", "FY24"],
            is_applicable=True,
            operating_cash_flow={"FY22": 100.0, "FY23": 90.0, "FY24": 80.0},  # CFO only 80 vs PAT 240
            capital_expenditure={"FY22": 100.0, "FY23": 120.0, "FY24": 150.0},
            free_cash_flow={"FY22": 0.0, "FY23": -30.0, "FY24": -70.0},
            fcf_conversion=-29.2,
            cash_flow_quality_flag="WEAK_NEGATIVE_FCF",
        )
        eq = self.coordinator._evaluate_earnings_quality(inc, cf, is_bank=False)
        self.assertEqual(eq.quality_status, "EARNINGS_QUALITY_WARNING")
        self.assertLess(eq.cfo_to_pat_ratio, 0.5)
        self.assertGreater(len(eq.warning_flags), 0)

    def test_price_momentum_technical_stance(self):
        """Test technical stance determination based on momentum."""
        m_overheated = self.coordinator._compute_price_momentum("TCS", 4000.0)
        self.assertIsNotNone(m_overheated.technical_stance)
        self.assertIn(m_overheated.technical_stance, [
            "OVERHEATED", "PULLBACK_ENTRY", "MOMENTUM_EXPANDING", "NEUTRAL", "HEAVY_SELLING"
        ])

    def test_valuation_rationale_synthesis(self):
        """Test valuation assessment and rationale multi-factor synthesis."""
        ratios = KeyRatiosData(
            pe_ratio=18.5,
            forward_pe=16.0,
            pb_ratio=2.8,
            ev_to_ebitda=11.2,
            roe=22.0,
            roce=24.5,
            roa=12.0,
            debt_to_equity=0.1,
            operating_margin=22.0,
            net_margin=16.0,
            revenue_growth_yoy=15.0,
            earnings_growth_yoy=18.0,
            dividend_yield=1.8,
        )
        inc = IncomeStatementData(
            years=["FY22", "FY23", "FY24"],
            revenue={"FY22": 1000.0, "FY23": 1200.0, "FY24": 1500.0},
            operating_income={"FY22": 200.0, "FY23": 250.0, "FY24": 320.0},
            operating_margin={"FY22": 20.0, "FY23": 20.8, "FY24": 21.3},
            ebitda={"FY22": 220.0, "FY23": 270.0, "FY24": 350.0},
            ebitda_margin={"FY22": 22.0, "FY23": 22.5, "FY24": 23.3},
            net_income={"FY22": 150.0, "FY23": 180.0, "FY24": 230.0},
            net_margin={"FY22": 15.0, "FY23": 15.0, "FY24": 15.3},
            eps={"FY22": 15.0, "FY23": 18.0, "FY24": 23.0},
            revenue_cagr_3y=22.5,
            net_profit_cagr_3y=23.8,
        )
        bq = self.coordinator._evaluate_business_quality(
            {"market_cap_cr": 50000.0},
            inc,
            ratios,
            HistoricalTrendSignals("STRONG_GROWTH", "EXPANDING", "EXPANDING", "CONSISTENT_HIGH", "DEBT_FREE_OR_NEGLIGIBLE", "CONSISTENT_GENERATOR")
        )
        val = self.coordinator._evaluate_valuation_rationale(ratios, inc, bq, ValuationStatus.UNDERVALUED)
        self.assertEqual(val.valuation_tier, ValuationStatus.UNDERVALUED)
        self.assertIn("P/E", val.valuation_rationale)
        self.assertIsNotNone(val.peg_ratio)

    def test_full_report_generation_for_live_stock(self):
        """Test full research report pipeline execution for a bluechip stock."""
        report = self.coordinator.generate_research_report("TCS", force_refresh=True)
        self.assertEqual(report.ticker, "TCS")
        self.assertIsNotNone(report.price_momentum)
        self.assertIsNotNone(report.business_quality)
        self.assertIsNotNone(report.financial_health)
        self.assertIsNotNone(report.earnings_quality)
        self.assertIsNotNone(report.valuation_assessment)
        self.assertIsNotNone(report.scenario_analysis)
        self.assertIsNotNone(report.risk_matrix)
        self.assertIsNotNone(report.thesis_invalidation)
        self.assertIsNotNone(report.portfolio_context)
        self.assertIsNotNone(report.final_verdict)

        # Scenarios check
        self.assertIsNotNone(report.scenario_analysis.bull_case)
        self.assertIsNotNone(report.scenario_analysis.base_case)
        self.assertIsNotNone(report.scenario_analysis.bear_case)

        # Risks check
        self.assertGreater(len(report.risk_matrix.risks), 0)

        # Invalidation check
        self.assertGreater(len(report.thesis_invalidation.quantifiable_thresholds), 0)

    def test_api_comprehensive_research_endpoint(self):
        """Test API endpoint serialization of all structured sections."""
        res = self.client.get("/api/research/TCS")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["ticker"], "TCS")
        self.assertIn("price_momentum", data)
        self.assertIn("business_quality", data)
        self.assertIn("financial_health", data)
        self.assertIn("earnings_quality", data)
        self.assertIn("valuation_assessment", data)
        self.assertIn("scenario_analysis", data)
        self.assertIn("risk_matrix", data)
        self.assertIn("thesis_invalidation", data)
        self.assertIn("portfolio_context", data)
        self.assertIn("final_verdict", data)
        self.assertEqual(data["final_verdict"]["time_horizon"], "1-3 years")


if __name__ == "__main__":
    unittest.main()
