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
from app.services.intelligence.universe import StockUniverseRegistry

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
        news_sources: Optional[List[str]] = None,
        related_headlines: Optional[List[str]] = None,
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

        # 3. Multi-day Price Reaction (1D, 5D, 20D, 52W High Distance)
        p1d, p5d, p20d, dist_52w = self._compute_price_momentum(clean_ticker)

        # 4. Cash Flow to Net Profit Ratio (Earnings Quality Indicator)
        cfo_to_pat = None
        latest_year = inc.years[-1] if inc.years else None
        latest_net_income = inc.net_income.get(latest_year) if latest_year else None
        latest_cfo = cf.operating_cash_flow.get(latest_year) if latest_year and cf.operating_cash_flow else None

        if not is_bank and latest_net_income and latest_net_income > 0 and latest_cfo is not None:
            cfo_to_pat = round(latest_cfo / latest_net_income, 2)

        # 5. Valuation Tier Classification
        valuation_tier = self._classify_valuation_tier(ratios.pe_ratio, ratios.pb_ratio, inc.revenue_cagr_3y)

        # 6. Build Quantitative Factors object
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
            price_change_5d=p5d,
            current_price=meta.get("current_price", 0.0),
            market_cap_cr=meta.get("market_cap_cr", 0.0),
            is_financial_institution=is_bank,
            price_change_1d=p1d,
            price_change_20d=p20d,
            distance_from_52w_high_pct=dist_52w,
            valuation_tier=valuation_tier,
        )

        # 7. Portfolio Context Overlay
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

        # 8. Compute Deterministic Scores
        scores = self._compute_scores(metrics, trends, news_event)

        # 9. Apply Multi-Factor Decision Logic & Hard Risk Gates
        recommendation, hard_gates = self._determine_recommendation_and_gates(
            metrics=metrics,
            scores=scores,
            news_event=news_event,
            is_owned=is_owned,
            port_allocation_pct=port_allocation_pct,
        )

        # 10. LLM Synthesis for Qualitative Investment Thesis & Invalidation Triggers
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

        src_list = news_sources if news_sources else ([news_source] if news_source else [])
        hl_list = related_headlines if related_headlines else ([news_title] if news_title else [])

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
            valuation_tier=valuation_tier,
            catalyst_durability=news_event.catalyst_durability,
            news_sources=src_list,
            related_headlines=hl_list,
        )

    def _compute_price_momentum(self, ticker: str) -> Tuple[Optional[float], Optional[float], Optional[float], Optional[float]]:
        """
        Computes 1D, 5D, 20D price changes (%) and distance from 52-week high (%) deterministically.
        """
        p1d = 0.0
        p5d = 0.0
        p20d = 0.0
        dist_52w = None

        try:
            resolved = TickerService.resolve(ticker)
            stock = yf.Ticker(resolved)
            hist = stock.history(period="1mo")
            if not hist.empty and len(hist) >= 2:
                current_c = float(hist["Close"].iloc[-1])
                # 1-day change
                prev_1d = float(hist["Close"].iloc[-2])
                if prev_1d > 0:
                    p1d = round(((current_c - prev_1d) / prev_1d) * 100.0, 2)

                # 5-day change
                idx_5d = max(0, len(hist) - 6)
                prev_5d = float(hist["Close"].iloc[idx_5d])
                if prev_5d > 0:
                    p5d = round(((current_c - prev_5d) / prev_5d) * 100.0, 2)

                # 20-day change
                prev_20d = float(hist["Close"].iloc[0])
                if prev_20d > 0:
                    p20d = round(((current_c - prev_20d) / prev_20d) * 100.0, 2)

                # 52w high distance from info or history
                high_52w = stock.info.get("fiftyTwoWeekHigh") if stock.info else None
                if high_52w and high_52w > 0:
                    dist_52w = round(((current_c - high_52w) / high_52w) * 100.0, 2)
        except Exception:
            pass

        return p1d, p5d, p20d, dist_52w

    def _classify_valuation_tier(
        self,
        pe: Optional[float],
        pb: Optional[float],
        rev_cagr: Optional[float]
    ) -> str:
        if pe is not None and pe > 0:
            if pe > 85.0:
                return "EXTREMELY_OVERVALUED"
            if pe > 45.0:
                # If growth is exceptional (>25%), fairly valued, else expensive
                return "FAIRLY_VALUED" if (rev_cagr and rev_cagr > 25.0) else "EXPENSIVE"
            if pe >= 22.0:
                return "FAIRLY_VALUED"
            return "UNDERVALUED"

        if pb is not None and pb > 0:
            if pb > 8.0:
                return "EXTREMELY_OVERVALUED"
            if pb > 4.5:
                return "EXPENSIVE"
            if pb >= 1.8:
                return "FAIRLY_VALUED"
            return "UNDERVALUED"

        return "FAIRLY_VALUED"

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
        price_rec_score = 60
        chg = metrics.price_change_5d or 0.0
        chg20 = metrics.price_change_20d or 0.0

        if chg <= 2.0 and chg >= -4.0:
            price_rec_score = 85  # Subdued reaction, great entry opportunity
        elif chg > 2.0 and chg <= 8.0:
            price_rec_score = 70  # Normal reaction
        elif chg > 15.0 or chg20 > 25.0:
            price_rec_score = 30  # Already surged, chasing risk
        elif chg < -10.0:
            price_rec_score = 45  # Heavy selling pressure

        # E. News Catalyst Score (0 - 100)
        cat_score = 50
        if news_event.direction == EventDirection.POSITIVE:
            cat_score = min(95, 50 + news_event.impact_strength * 4)
            if news_event.catalyst_durability == "STRUCTURAL":
                cat_score = min(98, cat_score + 5)
        elif news_event.direction == EventDirection.NEGATIVE:
            cat_score = max(10, 50 - news_event.impact_strength * 4)
            if news_event.catalyst_durability == "STRUCTURAL":
                cat_score = max(5, cat_score - 5)
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
        recent_surge = (metrics.price_change_5d or 0.0) >= 15.0 or (metrics.price_change_20d or 0.0) >= 25.0
        overallocation = is_owned and port_allocation_pct >= 20.0
        high_leverage = not metrics.is_financial_institution and (metrics.debt_to_equity or 0.0) > 2.0

        if extreme_valuation:
            hard_gates.append(
                HardGateTrigger(
                    gate_name="EXTREME_VALUATION_BLOCK",
                    description=f"P/E ratio of {metrics.pe_ratio or 'N/A'}x is severely stretched relative to historical risk/reward.",
                    impact_on_decision="Blocks BUY recommendations; caps at WATCH or HOLD.",
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

        if high_leverage:
            hard_gates.append(
                HardGateTrigger(
                    gate_name="HIGH_DEBT_GATE",
                    description=f"Debt/Equity ratio of {metrics.debt_to_equity}x exceeds safe non-banking thresholds (>2.0x).",
                    impact_on_decision="Blocks BUY; increases downside vulnerability.",
                )
            )

        if severe_fundamental_weakness:
            hard_gates.append(
                HardGateTrigger(
                    gate_name="FUNDAMENTAL_WEAKNESS",
                    description=f"Quality score ({scores.fundamental_score}/100) reflects high debt, negative growth, or sub-par return on capital.",
                    impact_on_decision="Disallows BUY; triggers AVOID, REDUCE, or SELL.",
                )
            )

        if overallocation:
            hard_gates.append(
                HardGateTrigger(
                    gate_name="PORTFOLIO_CONCENTRATION_LIMIT",
                    description=f"Holding currently represents {port_allocation_pct}% of total portfolio value (limit: 20%).",
                    impact_on_decision="Prevents BUY MORE; restricts to HOLD or REDUCE.",
                )
            )

        if recent_surge:
            hard_gates.append(
                HardGateTrigger(
                    gate_name="PRICE_OVEREXTENDED_GATE",
                    description=f"Stock has surged {metrics.price_change_5d}% (5D) / {metrics.price_change_20d}% (20D), indicating the catalyst is already priced in.",
                    impact_on_decision="Blocks BUY chasing; instructs WATCH / WAIT FOR ENTRY on pullbacks.",
                )
            )

        # ----------------------------------------------------
        # MULTI-FACTOR RECOMMENDATION SYNTHESIS
        # ----------------------------------------------------
        # Scenario 1: Severe Fundamental Weakness OR Negative News Event
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

        # Scenario 4: Price Surged (>15%) on news (Overextended)
        if recent_surge:
            if is_owned:
                return RecommendationType.HOLD, hard_gates
            else:
                return RecommendationType.WATCH, hard_gates

        # Scenario 5: High Leverage Gate
        if high_leverage:
            if is_owned:
                return RecommendationType.HOLD, hard_gates
            else:
                return RecommendationType.WATCH, hard_gates

        # Scenario 6: High Quality + Favorable Catalyst + Reasonable Valuation
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

        # Scenario 7: Moderate Quality or Neutral News
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
- Valuation Tier: {metrics.valuation_tier} (P/E: {metrics.pe_ratio or 'N/A'}x, P/B: {metrics.pb_ratio or 'N/A'}x)
- Cash Conversion: {scores.earnings_quality_score}/100 (CFO/PAT: {metrics.cfo_to_pat_ratio or 'N/A'})
- 3Y Revenue CAGR: {metrics.revenue_cagr_3y or 'N/A'}%, 3Y Net Profit CAGR: {metrics.profit_cagr_3y or 'N/A'}%
- Operating Margin: {metrics.operating_margin or 'N/A'}%, ROCE: {metrics.roce or 'N/A'}%
- Price Reaction: 1D: {metrics.price_change_1d or '0.0'}%, 5D: {metrics.price_change_5d or '0.0'}%, 20D: {metrics.price_change_20d or '0.0'}%
- Distance from 52W High: {metrics.distance_from_52w_high_pct or 'N/A'}%
- Triggering Catalyst: {news_event.event_summary}
- Catalyst Durability: {news_event.catalyst_durability}
- Transmission Mechanism: {news_event.mechanism}
- Active Hard Risk Gates: {', '.join(g.gate_name for g in hard_gates) if hard_gates else 'None (All Gates Cleared)'}
- Currently in Portfolio: {'Yes' if is_owned else 'No'}

Respond with ONLY a valid JSON object matching this schema (no markdown formatting, no preamble):
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
                    "invalidation_triggers": [str(t) for t in parsed.get("invalidation_triggers", []) if t][:3] or news_event.thesis_invalidation_triggers or [
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
                f"with {news_event.catalyst_durability.lower()} impact durability while fundamental quality is scored at {scores.fundamental_score}/100."
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
            "invalidation_triggers": news_event.thesis_invalidation_triggers or [
                "Operating cash flow turning negative for 2 consecutive quarters",
                "Sudden adverse regulatory or tariff changes impacting unit economics",
            ],
        }
