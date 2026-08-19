import logging
import math
from typing import Optional, Dict, Any, List, Tuple
from datetime import datetime, timezone
import yfinance as yf

from app.models.intelligence import (
    InvestmentOpportunity,
    RecommendationType,
    NewsEventExtraction,
    QuantitativeFactors,
    ScoreBreakdown,
    HardGateTrigger,
    EventDirection,
)
from app.services.fundamental_service import FundamentalDataService
from app.services.historical_analyzer import HistoricalFundamentalAnalyzer
from app.services.valuation_analyzer import ValuationAnalyzer
from app.services.ticker_service import TickerService
from app.services.market_data import get_market_data_provider
from app.database.portfolio_repository import PortfolioRepository
from app.services.canonical_valuation_service import CanonicalValuationService
from app.services.ollama_service import OllamaService

logger = logging.getLogger(__name__)


class OpportunityEvaluator:
    """
    Multi-Factor Investment Evaluator with Deterministic Math & Hard Risk Gates.
    Combines news catalyst, multi-year audited fundamentals, cash conversion quality,
    valuation multiples, price reaction, and portfolio overlay.
    """

    def __init__(
        self,
        fundamental_service: Optional[FundamentalDataService] = None,
        historical_analyzer: Optional[HistoricalFundamentalAnalyzer] = None,
        valuation_analyzer: Optional[ValuationAnalyzer] = None,
        portfolio_repo: Optional[PortfolioRepository] = None,
        ollama: Optional[OllamaService] = None,
    ):
        self.fundamental_service = fundamental_service or FundamentalDataService()
        self.historical_analyzer = historical_analyzer or HistoricalFundamentalAnalyzer()
        self.valuation_analyzer = valuation_analyzer or ValuationAnalyzer()
        self.portfolio_repo = portfolio_repo or PortfolioRepository()
        self.ollama = ollama or OllamaService()

    def evaluate_candidate(
        self,
        ticker: str,
        news_event: NewsEventExtraction,
        news_id: Optional[str] = None,
        news_title: str = "",
        news_source: str = "",
        news_published_at: str = "",
    ) -> Optional[InvestmentOpportunity]:
        clean_ticker = ticker.strip().upper()

        # 1. Deterministic Fundamentals Extraction
        try:
            meta, inc, bs, cf, ratios = self.fundamental_service.fetch_fundamentals(clean_ticker)
        except Exception as e:
            logger.debug(f"[EVALUATOR] Failed to fetch fundamentals for {clean_ticker}: {e}")
            return None

        # 2. Historical Trends & Cash Flow Quality
        trends = self.historical_analyzer.analyze_trends(inc, bs, cf, ratios)
        is_bank = bs.is_financial_institution

        # 3. 5-Day Price Reaction
        price_change_5d = self._compute_5d_price_change(clean_ticker)

        # 4. Cash Flow to Net Profit Ratio (Earnings Quality Indicator)
        cfo_to_pat = None
        latest_year = inc.years[-1] if inc.years else None
        latest_net_income = inc.net_income.get(latest_year) if latest_year else None
        latest_cfo = cf.operating_cash_flow.get(latest_year) if latest_year and cf.operating_cash_flow else None

        if not is_bank and latest_net_income and latest_net_income > 0 and latest_cfo is not None:
            cfo_to_pat = round(latest_cfo / latest_net_income, 2)

        # 5. Build Quantitative Factors object
        metrics = QuantitativeFactors(
            revenue_cagr_3y=inc.revenue_cagr_3y,
            profit_cagr_3y=inc.net_profit_cagr_3y,
            operating_margin=ratios.operating_margin,
            net_margin=ratios.net_margin,
            roe=ratios.roe,
            roce=ratios.roce,
            debt_to_equity=ratios.debt_to_equity,
            pe_ratio=ratios.pe_ratio,
            pb_ratio=ratios.pb_ratio,
            ev_to_ebitda=ratios.ev_to_ebitda,
            cfo_to_pat_ratio=cfo_to_pat,
            price_change_5d=price_change_5d,
            current_price=meta.get("current_price", 0.0),
            market_cap_cr=meta.get("market_cap_cr", 0.0),
            is_financial_institution=is_bank,
        )

        # 6. Portfolio Context Overlay
        portfolio_holdings = self.portfolio_repo.get_holdings()
        owned_holding = next((h for h in portfolio_holdings if h.ticker.upper() == clean_ticker), None)
        is_owned = owned_holding is not None

        portfolio_qty = owned_holding.quantity if owned_holding else None
        portfolio_avg_buy = owned_holding.average_buy_price if owned_holding else None

        # Calculate allocation percentage in portfolio
        canonical_val = CanonicalValuationService.get_instance().evaluate_portfolio(portfolio_holdings)
        total_port_val = canonical_val.total_current_value
        port_allocation_pct = 0.0
        if is_owned and owned_holding and total_port_val > 0:
            port_allocation_pct = round((owned_holding.quantity * metrics.current_price / total_port_val) * 100.0, 2)

        # 7. Compute Deterministic Scores
        scores = self._compute_scores(metrics, trends, news_event)

        # 8. Apply Multi-Factor Decision Logic & Hard Risk Gates
        recommendation, hard_gates = self._determine_recommendation_and_gates(
            metrics=metrics,
            scores=scores,
            news_event=news_event,
            is_owned=is_owned,
            port_allocation_pct=port_allocation_pct,
        )

        # 9. LLM Synthesis for Qualitative Investment Thesis & Invalidation Triggers
        thesis_memo = self._synthesize_investment_thesis(
            ticker=clean_ticker,
            company_name=meta.get("name", clean_ticker),
            sector=meta.get("sector", "General"),
            recommendation=recommendation,
            scores=scores,
            metrics=metrics,
            news_event=news_event,
            hard_gates=hard_gates,
            is_owned=is_owned,
        )

        # Standardized Universe Metadata Overlay
        uni_meta = StockUniverseRegistry.get_company_meta(clean_ticker)
        company_name = (uni_meta.get("name") if uni_meta else None) or meta.get("name") or clean_ticker
        sector_name = (uni_meta.get("sector") if uni_meta else None) or meta.get("sector") or "General"
        industry_name = (uni_meta.get("sub") if uni_meta else None) or meta.get("industry") or "General"

        return InvestmentOpportunity(
            id=None,
            ticker=clean_ticker,
            company_name=company_name,
            sector=sector_name,
            industry=industry_name,
            recommendation=recommendation,
            conviction_score=scores.overall_conviction,
            time_horizon=news_event.time_horizon,
            current_price=metrics.current_price,
            news_id=news_id,
            news_title=news_title,
            news_source=news_source,
            news_published_at=news_published_at,
            event_summary=news_event.event_summary,
            impact_direction=news_event.direction.value,
            impact_strength=news_event.impact_strength,
            transmission_mechanism=news_event.mechanism,
            scores=scores,
            metrics=metrics,
            hard_gates_triggered=hard_gates,
            is_owned=is_owned,
            portfolio_quantity=portfolio_qty,
            portfolio_avg_buy_price=portfolio_avg_buy,
            portfolio_allocation_pct=port_allocation_pct,
            investment_thesis=thesis_memo["thesis"],
            key_catalysts=thesis_memo["catalysts"],
            key_risks=thesis_memo["risks"],
            thesis_invalidation_triggers=thesis_memo["invalidation_triggers"],
            created_at=datetime.now(timezone.utc).isoformat(),
        )

    def _compute_5d_price_change(self, ticker: str) -> Optional[float]:
        try:
            resolved = TickerService.resolve(ticker)
            stock = yf.Ticker(resolved)
            hist = stock.history(period="7d")
            if len(hist) >= 2:
                first_close = float(hist["Close"].iloc[0])
                last_close = float(hist["Close"].iloc[-1])
                if first_close > 0:
                    return round(((last_close - first_close) / first_close) * 100.0, 2)
        except Exception:
            pass
        return 0.0

    def _compute_scores(
        self,
        metrics: QuantitativeFactors,
        trends: Any,
        news_event: NewsEventExtraction,
    ) -> ScoreBreakdown:
        # A. Fundamental Score (0 - 100)
        fund_score = 50.0
        # 1. Growth (+/- 15)
        if metrics.revenue_cagr_3y is not None:
            if metrics.revenue_cagr_3y >= 18.0:
                fund_score += 10.0
            elif metrics.revenue_cagr_3y >= 10.0:
                fund_score += 6.0
            elif metrics.revenue_cagr_3y < 0:
                fund_score -= 8.0

        if metrics.profit_cagr_3y is not None:
            if metrics.profit_cagr_3y >= 20.0:
                fund_score += 8.0
            elif metrics.profit_cagr_3y >= 12.0:
                fund_score += 4.0
            elif metrics.profit_cagr_3y < 0:
                fund_score -= 8.0

        # 2. Profitability (+/- 15)
        if metrics.operating_margin is not None:
            if metrics.operating_margin >= 20.0:
                fund_score += 8.0
            elif metrics.operating_margin >= 12.0:
                fund_score += 4.0
            elif metrics.operating_margin < 6.0:
                fund_score -= 6.0

        if metrics.roce is not None:
            if metrics.roce >= 22.0:
                fund_score += 10.0
            elif metrics.roce >= 15.0:
                fund_score += 5.0
            elif metrics.roce < 8.0:
                fund_score -= 6.0

        # 3. Solvency & Balance Sheet (+/- 12)
        if not metrics.is_financial_institution:
            if metrics.debt_to_equity is None or metrics.debt_to_equity <= 0.2:
                fund_score += 10.0  # Negligible debt
            elif metrics.debt_to_equity <= 0.6:
                fund_score += 5.0
            elif metrics.debt_to_equity > 1.5:
                fund_score -= 10.0

        fund_score = max(10, min(95, int(fund_score)))

        # B. Earnings Quality & Cash Flow Score (0 - 100)
        eq_score = 70
        if metrics.cfo_to_pat_ratio is not None:
            if metrics.cfo_to_pat_ratio >= 1.0:
                eq_score = 90  # Stellar cash conversion
            elif metrics.cfo_to_pat_ratio >= 0.75:
                eq_score = 75
            elif metrics.cfo_to_pat_ratio < 0.5:
                eq_score = 30  # Warning: Aggressive accruals / low cash conversion
            elif metrics.cfo_to_pat_ratio < 0.0:
                eq_score = 15  # Burning cash despite positive PAT

        # C. Valuation Score (0 - 100)
        # Higher score = more attractive / cheaper; Lower score = more expensive / stretched
        val_score = 55
        if metrics.pe_ratio is not None and metrics.pe_ratio > 0:
            if metrics.pe_ratio < 18.0:
                val_score = 85
            elif metrics.pe_ratio <= 32.0:
                val_score = 65
            elif metrics.pe_ratio <= 55.0:
                val_score = 45
            elif metrics.pe_ratio > 85.0:
                val_score = 20  # Extreme valuation
        elif metrics.pb_ratio is not None and metrics.pb_ratio > 0:
            if metrics.pb_ratio < 1.5:
                val_score = 80
            elif metrics.pb_ratio > 8.0:
                val_score = 25

        # D. Price Reaction Score (0 - 100)
        # Higher score = attractive entry (not chased); Lower score = overextended short-term
        price_rec_score = 60
        chg = metrics.price_change_5d or 0.0
        if chg <= 2.0 and chg >= -4.0:
            price_rec_score = 85  # Subdued reaction, great entry opportunity
        elif chg > 2.0 and chg <= 8.0:
            price_rec_score = 70  # Normal reaction
        elif chg > 15.0:
            price_rec_score = 30  # Already surged, chasing risk
        elif chg < -10.0:
            price_rec_score = 45  # Heavy selling pressure

        # E. News Catalyst Score (0 - 100)
        cat_score = 50
        if news_event.direction == EventDirection.POSITIVE:
            cat_score = min(95, 50 + news_event.impact_strength * 4)
        elif news_event.direction == EventDirection.NEGATIVE:
            cat_score = max(10, 50 - news_event.impact_strength * 4)
        elif news_event.direction == EventDirection.MIXED:
            cat_score = 50

        # Overall Conviction (Weighted composite)
        conviction = int(
            fund_score * 0.30
            + eq_score * 0.20
            + val_score * 0.20
            + cat_score * 0.20
            + price_rec_score * 0.10
        )
        conviction = max(15, min(95, conviction))

        return ScoreBreakdown(
            fundamental_score=fund_score,
            earnings_quality_score=eq_score,
            valuation_score=val_score,
            price_reaction_score=price_rec_score,
            news_catalyst_score=cat_score,
            overall_conviction=conviction,
        )

    def _determine_recommendation_and_gates(
        self,
        metrics: QuantitativeFactors,
        scores: ScoreBreakdown,
        news_event: NewsEventExtraction,
        is_owned: bool,
        port_allocation_pct: float,
    ) -> Tuple[RecommendationType, List[HardGateTrigger]]:
        hard_gates: List[HardGateTrigger] = []

        # ----------------------------------------------------
        # HARD RISK GATES CHECK
        # ----------------------------------------------------
        extreme_valuation = scores.valuation_score <= 25 or (metrics.pe_ratio and metrics.pe_ratio > 85.0)
        cash_flow_red_flag = scores.earnings_quality_score <= 35
        severe_fundamental_weakness = scores.fundamental_score <= 38
        recent_surge = (metrics.price_change_5d or 0.0) >= 15.0
        overallocation = is_owned and port_allocation_pct >= 20.0

        if extreme_valuation:
            hard_gates.append(
                HardGateTrigger(
                    gate_name="EXTREME_VALUATION_BLOCK",
                    description=f"P/E ratio of {metrics.pe_ratio or 'N/A'}x is severely stretched relative to historical risk/reward.",
                    impact_on_decision="Blocks BUY recommendations; caps at WATCH/HOLD.",
                )
            )

        if cash_flow_red_flag:
            hard_gates.append(
                HardGateTrigger(
                    gate_name="CASH_FLOW_DIVERGENCE",
                    description=f"Operating cash flow conversion (CFO/PAT: {metrics.cfo_to_pat_ratio or 'N/A'}) shows aggressive accruals or working capital drag.",
                    impact_on_decision="Downgrades conviction; blocks aggressive buying.",
                )
            )

        if severe_fundamental_weakness:
            hard_gates.append(
                HardGateTrigger(
                    gate_name="FUNDAMENTAL_WEAKNESS",
                    description=f"Quality score ({scores.fundamental_score}/100) reflects high debt, negative growth, or sub-par return on capital.",
                    impact_on_decision="Disallows BUY; triggers AVOID or REDUCE.",
                )
            )

        if overallocation:
            hard_gates.append(
                HardGateTrigger(
                    gate_name="PORTFOLIO_CONCENTRATION_LIMIT",
                    description=f"Holding currently represents {port_allocation_pct}% of total portfolio value.",
                    impact_on_decision="Prevents BUY MORE; restricts to HOLD.",
                )
            )

        if recent_surge:
            hard_gates.append(
                HardGateTrigger(
                    gate_name="PRICE_EXTENSION_ALERT",
                    description=f"Stock has surged {metrics.price_change_5d}% in the last 5 sessions, increasing mean-reversion risk.",
                    impact_on_decision="Encourages staggered entry or WATCH rather than market chasing.",
                )
            )

        # ----------------------------------------------------
        # MULTI-FACTOR RECOMMENDATION SYNTHESIS
        # ----------------------------------------------------
        # Scenario 1: Severe Fundamental Weakness or Negative News
        if severe_fundamental_weakness or news_event.direction == EventDirection.NEGATIVE:
            if is_owned:
                if severe_fundamental_weakness and news_event.direction == EventDirection.NEGATIVE:
                    return RecommendationType.SELL, hard_gates
                else:
                    return RecommendationType.REDUCE, hard_gates
            else:
                return RecommendationType.AVOID, hard_gates

        # Scenario 2: Severe Cash Flow Divergence Warning
        if cash_flow_red_flag:
            if is_owned:
                return RecommendationType.HOLD, hard_gates
            else:
                return RecommendationType.WATCH, hard_gates

        # Scenario 3: Extreme Valuation Gate
        if extreme_valuation:
            if is_owned:
                return RecommendationType.HOLD, hard_gates
            else:
                return RecommendationType.WATCH, hard_gates

        # Scenario 4: Price Surged (>15%) on news
        if recent_surge:
            if is_owned:
                return RecommendationType.HOLD, hard_gates
            else:
                return RecommendationType.WATCH, hard_gates

        # Scenario 5: High Quality + Favorable Catalyst + Reasonable Valuation
        if scores.fundamental_score >= 68 and news_event.direction == EventDirection.POSITIVE:
            if is_owned:
                if overallocation:
                    return RecommendationType.HOLD, hard_gates
                else:
                    return RecommendationType.BUY_MORE, hard_gates
            else:
                if scores.overall_conviction >= 70:
                    return RecommendationType.BUY, hard_gates
                else:
                    return RecommendationType.WATCH, hard_gates

        # Scenario 6: Moderate Quality or Neutral News
        if is_owned:
            return RecommendationType.HOLD, hard_gates
        else:
            if scores.overall_conviction >= 65:
                return RecommendationType.WATCH, hard_gates
            else:
                return RecommendationType.AVOID, hard_gates

    def _synthesize_investment_thesis(
        self,
        ticker: str,
        company_name: str,
        sector: str,
        recommendation: RecommendationType,
        scores: ScoreBreakdown,
        metrics: QuantitativeFactors,
        news_event: NewsEventExtraction,
        hard_gates: List[HardGateTrigger],
        is_owned: bool,
    ) -> Dict[str, Any]:
        prompt = f"""You are a senior equities research director at an institutional asset management firm.
Synthesize a concise, evidence-grounded long-term investment research thesis for {company_name} ({ticker}) in {sector}.

DATA FACTS:
- Final Recommendation: {recommendation.value}
- Overall Conviction Score: {scores.overall_conviction}/100
- Fundamental Quality Score: {scores.fundamental_score}/100
- Valuation Score: {scores.valuation_score}/100 (P/E: {metrics.pe_ratio or 'N/A'}x, P/B: {metrics.pb_ratio or 'N/A'}x)
- Cash Conversion Score: {scores.earnings_quality_score}/100 (CFO/PAT: {metrics.cfo_to_pat_ratio or 'N/A'})
- 3Y Revenue CAGR: {metrics.revenue_cagr_3y or 'N/A'}%, 3Y Net Profit CAGR: {metrics.profit_cagr_3y or 'N/A'}%
- Operating Margin: {metrics.operating_margin or 'N/A'}%, ROCE: {metrics.roce or 'N/A'}%
- 5-Day Price Reaction: {metrics.price_change_5d or '0.0'}%
- Triggering Catalyst: {news_event.event_summary}
- Transmission Mechanism: {news_event.mechanism}
- Active Hard Risk Gates: {', '.join(g.gate_name for g in hard_gates) if hard_gates else 'None'}
- Currently in Portfolio: {'Yes' if is_owned else 'No'}

Respond with ONLY a valid JSON object matching this schema (no markdown formatting, no other text):
{{
  "thesis": "string (2-3 crisp sentences explaining the structural long-term investment rationale, connecting the news catalyst to financial earnings power)",
  "catalysts": ["string (Key structural growth driver 1)", "string (Key catalyst 2)", "string (Key catalyst 3)"],
  "risks": ["string (Primary operating or valuation risk 1)", "string (Risk 2)"],
  "invalidation_triggers": ["string (Concrete quantifiable event that would invalidate this thesis 1)", "string (Invalidation trigger 2)"]
}}"""

        try:
            raw = self.ollama.chat(prompt)
            clean = raw.strip()
            if "{" in clean and "}" in clean:
                start = clean.find("{")
                end = clean.rfind("}")
                clean = clean[start : end + 1]
                import json
                parsed = json.loads(clean)
                return {
                    "thesis": str(parsed.get("thesis") or f"{company_name} presents a {recommendation.value} opportunity based on {news_event.event_summary}."),
                    "catalysts": [str(c) for c in parsed.get("catalysts", []) if c][:3] or [news_event.mechanism],
                    "risks": [str(r) for r in parsed.get("risks", []) if r][:3] or news_event.key_risks,
                    "invalidation_triggers": [str(t) for t in parsed.get("invalidation_triggers", []) if t][:3] or [
                        "Deterioration in operating margins by >300 bps",
                        "Substantial loss in market share to competitors",
                    ],
                }
        except Exception as e:
            logger.debug(f"[EVALUATOR] Ollama thesis synthesis fallback: {e}")

        # Deterministic fallback
        return {
            "thesis": (
                f"{company_name} ({ticker}) has received a {recommendation.value} rating with conviction {scores.overall_conviction}/100. "
                f"The core catalyst ({news_event.event_summary}) transmits via {news_event.mechanism.lower()} "
                f"while fundamental quality remains scored at {scores.fundamental_score}/100."
            ),
            "catalysts": [
                news_event.mechanism,
                f"3-year revenue expansion rate of {metrics.revenue_cagr_3y or 12.0}%",
                f"Operating margin health at {metrics.operating_margin or 15.0}%",
            ],
            "risks": news_event.key_risks or [
                "Macroeconomic input cost volatility",
                "Execution delays on planned capital expansion",
            ],
            "invalidation_triggers": [
                "Operating cash flow turning negative for 2 consecutive quarters",
                "Sudden adverse regulatory or tariff changes impacting unit economics",
            ],
        }
