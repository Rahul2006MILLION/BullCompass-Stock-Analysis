import json
import logging
import time
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional, Tuple

import yfinance as yf

from app.models.fundamentals import (
    ComprehensiveResearchReport,
    DecisionRating,
    ValuationStatus,
    ConfidenceLevel,
    MarginOfSafety,
    RiskSeverity,
    IncomeStatementData,
    BalanceSheetData,
    CashFlowData,
    KeyRatiosData,
    HistoricalTrendSignals,
    PriceMomentumContext,
    BusinessQualityAssessment,
    FinancialHealthAssessment,
    EarningsQualityAssessment,
    ValuationAssessment,
    NewsCausalItem,
    SectorMacroContext,
    ScenarioCase,
    ScenarioAnalysis,
    RiskItem,
    RiskAnalysisMatrix,
    ThesisInvalidationTriggers,
    PortfolioContext,
    FinalVerdict,
)
from app.services.fundamental_service import FundamentalDataService
from app.services.historical_analyzer import HistoricalFundamentalAnalyzer
from app.services.valuation_analyzer import ValuationAnalyzer
from app.services.decision_engine import InvestmentDecisionEngine
from app.services.ticker_service import TickerService
from app.services.intelligence.universe import StockUniverseRegistry
from app.services.intelligence.impact_analyzer import NewsImpactAnalyzer
from app.database.news_repository import NewsRepository
from app.database.portfolio_repository import PortfolioRepository
from app.services.canonical_valuation_service import CanonicalValuationService
from app.services.ollama_service import OllamaService

logger = logging.getLogger(__name__)

# In-memory research report cache with 10-minute TTL
_RESEARCH_REPORT_CACHE: Dict[str, Tuple[float, ComprehensiveResearchReport]] = {}
_CACHE_TTL_SECONDS = 600.0  # 10 minutes


class ResearchCoordinatorService:
    """
    Structured Institutional Long-Term Investment Research Engine.
    Executes a 16-stage pipeline synthesizing audited statements, earnings quality,
    valuation multiples, price momentum, company-specific macro context, news causal
    transmission, bull/base/bear scenarios, risk matrix, thesis invalidation, and portfolio context.
    """

    def __init__(
        self,
        fundamental_service: Optional[FundamentalDataService] = None,
        historical_analyzer: Optional[HistoricalFundamentalAnalyzer] = None,
        valuation_analyzer: Optional[ValuationAnalyzer] = None,
        decision_engine: Optional[InvestmentDecisionEngine] = None,
        news_repository: Optional[NewsRepository] = None,
        portfolio_repo: Optional[PortfolioRepository] = None,
        impact_analyzer: Optional[NewsImpactAnalyzer] = None,
        ollama: Optional[OllamaService] = None,
    ):
        self.fundamental_service = fundamental_service or FundamentalDataService()
        self.historical_analyzer = historical_analyzer or HistoricalFundamentalAnalyzer()
        self.valuation_analyzer = valuation_analyzer or ValuationAnalyzer()
        self.decision_engine = decision_engine or InvestmentDecisionEngine()
        self.news_repository = news_repository or NewsRepository()
        self.portfolio_repo = portfolio_repo or PortfolioRepository()
        self.impact_analyzer = impact_analyzer or NewsImpactAnalyzer()
        self.ollama = ollama or OllamaService()

    def generate_research_report(self, ticker: str, force_refresh: bool = False) -> ComprehensiveResearchReport:
        clean_ticker = ticker.strip().upper()

        # Cache check
        now = time.time()
        if not force_refresh and clean_ticker in _RESEARCH_REPORT_CACHE:
            cached_time, cached_report = _RESEARCH_REPORT_CACHE[clean_ticker]
            if now - cached_time < _CACHE_TTL_SECONDS:
                logger.debug(f"[RESEARCH_COORDINATOR] Returning cached report for {clean_ticker}")
                return cached_report

        # 1. Fetch multi-year audited statements & ratios
        meta, inc, bs, cf, ratios = self.fundamental_service.fetch_fundamentals(clean_ticker)

        # Standardized Universe Metadata Overlay
        uni_meta = StockUniverseRegistry.get_company_meta(clean_ticker)
        company_name = (uni_meta.get("name") if uni_meta else None) or meta.get("name") or clean_ticker
        sector_name = (uni_meta.get("sector") if uni_meta else None) or meta.get("sector") or "General"
        industry_name = (uni_meta.get("sub") if uni_meta else None) or meta.get("industry") or "General"

        # 2. Analyze historical multi-year trends
        trends = self.historical_analyzer.analyze_trends(inc, bs, cf, ratios)

        # 3. Assess valuation status
        val_status = self.valuation_analyzer.evaluate_valuation(ratios, bs.is_financial_institution)

        # 4. Multi-Timeframe Price Momentum & Technical Position
        price_momentum = self._compute_price_momentum(clean_ticker, meta.get("current_price", 0.0))

        # 5. Deterministic Earnings Quality & Cash Flow Diagnosis
        earnings_quality = self._evaluate_earnings_quality(inc, cf, bs.is_financial_institution)

        # 6. Deterministic Business Quality & Financial Health
        business_quality = self._evaluate_business_quality(meta, inc, ratios, trends)
        financial_health = self._evaluate_financial_health(bs, ratios, meta.get("is_bank", False))

        # 7. Valuation Assessment & Multi-Factor Rationale
        valuation_assessment = self._evaluate_valuation_rationale(ratios, inc, business_quality, val_status)

        # 8. Portfolio Context Overlay
        portfolio_context = self._evaluate_portfolio_context(clean_ticker, meta.get("current_price", 0.0))

        # 9. Company News & Causal Transmission Analysis
        news_items = self.news_repository.get_recent_news(limit=6, ticker=clean_ticker)
        if not news_items:
            # Fallback to general market news matching sector/ticker
            news_items = self.news_repository.get_recent_news(limit=4)

        recent_news_dicts = [
            {
                "title": n.title,
                "source": n.source,
                "published_at": n.published_at,
                "importance": n.importance,
                "summary": n.summary[:200] + "..." if n.summary and len(n.summary) > 200 else (n.summary or n.title),
            }
            for n in news_items
        ]
        news_causal_items = self._analyze_news_causality(recent_news_dicts, clean_ticker, sector_name)

        # 10. Sector & Macro Context
        sector_macro = self._extract_sector_macro_context(clean_ticker, sector_name, uni_meta)

        # 11. Deterministic Investment Decision & Scoring
        decision_result = self.decision_engine.evaluate(
            meta, inc, bs, cf, ratios, trends, val_status, recent_news_dicts
        )

        # 12. Build Deterministic JSON Fact Pack for LLM
        fact_pack = self._build_comprehensive_fact_pack(
            meta=meta,
            company_name=company_name,
            sector_name=sector_name,
            industry_name=industry_name,
            inc=inc,
            bs=bs,
            cf=cf,
            ratios=ratios,
            trends=trends,
            price_momentum=price_momentum,
            earnings_quality=earnings_quality,
            business_quality=business_quality,
            financial_health=financial_health,
            valuation_assessment=valuation_assessment,
            portfolio_context=portfolio_context,
            sector_macro=sector_macro,
            news_causal=news_causal_items,
            decision=decision_result,
        )

        # 13. Synthesize Structured Research Report via Ollama (or deterministic fallback)
        structured_synthesis, ai_thesis_text, ollama_status = self._synthesize_structured_ai_research(
            clean_ticker=clean_ticker,
            company_name=company_name,
            fact_pack=fact_pack,
            decision_result=decision_result,
            price_momentum=price_momentum,
            business_quality=business_quality,
            financial_health=financial_health,
            earnings_quality=earnings_quality,
            valuation_assessment=valuation_assessment,
            sector_macro=sector_macro,
            news_causal_items=news_causal_items,
            portfolio_context=portfolio_context,
        )

        report = ComprehensiveResearchReport(
            ticker=clean_ticker,
            company_name=company_name,
            sector=sector_name,
            industry=industry_name,
            currency=meta.get("currency", "INR"),
            current_price=meta.get("current_price", 0.0),
            market_cap=meta.get("market_cap_cr", 0.0),
            income_statement=inc,
            balance_sheet=bs,
            cash_flow=cf,
            ratios=ratios,
            historical_trends=trends,
            decision=decision_result,
            recent_news=recent_news_dicts,
            ai_thesis_report=ai_thesis_text,
            generated_at=datetime.now(timezone.utc).isoformat(),
            ollama_status=ollama_status,
            price_momentum=price_momentum,
            business_quality=business_quality,
            financial_health=financial_health,
            earnings_quality=earnings_quality,
            valuation_assessment=valuation_assessment,
            news_causal_analysis=news_causal_items,
            sector_macro=sector_macro,
            scenario_analysis=structured_synthesis["scenario_analysis"],
            risk_matrix=structured_synthesis["risk_matrix"],
            thesis_invalidation=structured_synthesis["thesis_invalidation"],
            portfolio_context=portfolio_context,
            final_verdict=structured_synthesis["final_verdict"],
        )

        # Save to in-memory cache
        _RESEARCH_REPORT_CACHE[clean_ticker] = (now, report)
        return report

    def _compute_price_momentum(self, ticker: str, current_price: float) -> PriceMomentumContext:
        p1d = 0.0
        p5d = 0.0
        p20d = 0.0
        high_52w = None
        low_52w = None
        dist_52w = None

        try:
            resolved = TickerService.resolve(ticker)
            stock = yf.Ticker(resolved)
            hist = stock.history(period="1mo")
            if not hist.empty and len(hist) >= 2:
                current_c = float(hist["Close"].iloc[-1])
                prev_1d = float(hist["Close"].iloc[-2])
                if prev_1d > 0:
                    p1d = round(((current_c - prev_1d) / prev_1d) * 100.0, 2)

                idx_5d = max(0, len(hist) - 6)
                prev_5d = float(hist["Close"].iloc[idx_5d])
                if prev_5d > 0:
                    p5d = round(((current_c - prev_5d) / prev_5d) * 100.0, 2)

                prev_20d = float(hist["Close"].iloc[0])
                if prev_20d > 0:
                    p20d = round(((current_c - prev_20d) / prev_20d) * 100.0, 2)

            info = stock.info or {}
            high_52w = info.get("fiftyTwoWeekHigh")
            low_52w = info.get("fiftyTwoWeekLow")
            if high_52w and high_52w > 0 and current_price > 0:
                dist_52w = round(((current_price - high_52w) / high_52w) * 100.0, 2)
        except Exception as e:
            logger.debug(f"[RESEARCH_COORDINATOR] Momentum calculation fallback for {ticker}: {e}")

        # Determine technical stance
        if p5d >= 15.0 or p20d >= 25.0:
            stance = "OVERHEATED"
            interp = f"Stock has surged {p5d}% (5D) / {p20d}% (20D), indicating the catalyst is largely priced in. Risk of short-term mean-reversion is elevated."
        elif dist_52w is not None and dist_52w <= -20.0 and p5d > -5.0:
            stance = "PULLBACK_ENTRY"
            interp = f"Trading at a {abs(dist_52w)}% discount from 52-week highs with stabilizing short-term price action, presenting an attractive entry window."
        elif p5d < -10.0:
            stance = "HEAVY_SELLING"
            interp = f"Experiencing acute selling pressure ({p5d}% over 5 sessions); wait for volume stabilization before initiating fresh positions."
        elif p20d >= 5.0 and p5d >= 0.0:
            stance = "MOMENTUM_EXPANDING"
            interp = f"Positive upward momentum across multi-week timeframes (+{p20d}% 20D) supported by institutional accumulation."
        else:
            stance = "NEUTRAL"
            interp = "Price trading within normal historical volatility bands without severe technical overextension."

        return PriceMomentumContext(
            current_price=current_price,
            price_change_1d=p1d,
            price_change_5d=p5d,
            price_change_20d=p20d,
            fifty_two_week_high=high_52w,
            fifty_two_week_low=low_52w,
            distance_from_52w_high_pct=dist_52w,
            technical_stance=stance,
            interpretation=interp,
        )

    def _evaluate_earnings_quality(
        self, inc: IncomeStatementData, cf: CashFlowData, is_bank: bool
    ) -> EarningsQualityAssessment:
        if is_bank or not cf.is_applicable:
            return EarningsQualityAssessment(
                quality_status="HIGH_QUALITY_CONVERTING",
                cfo_to_pat_ratio=None,
                fcf_conversion_pct=None,
                pat_vs_cfo_trend="Banking institution: Earnings analyzed via ROA/ROE and credit provisioning.",
                margin_vs_revenue_trajectory="Regulated financial intermediary.",
                warning_flags=[],
                summary="Banking business model does not report traditional operating cash flows; earnings quality is evaluated via asset quality and provisioning.",
            )

        latest_yr = inc.years[-1] if inc.years else None
        net_prof = inc.net_income.get(latest_yr) if latest_yr else None
        latest_cfo = cf.operating_cash_flow.get(latest_yr) if latest_yr else None
        latest_fcf = cf.free_cash_flow.get(latest_yr) if latest_yr else None

        cfo_to_pat = None
        if net_prof and net_prof > 0 and latest_cfo is not None:
            cfo_to_pat = round(latest_cfo / net_prof, 2)

        fcf_conversion = cf.fcf_conversion
        warnings: List[str] = []

        # Divergence rules
        if net_prof and net_prof > 0 and latest_cfo is not None:
            if latest_cfo < 0:
                status = "CRITICAL_CASH_DIVERGENCE"
                pat_cfo_trend = "PAT is positive but Operating Cash Flow is NEGATIVE"
                warnings.append("Severe earnings quality red flag: Burning cash operations despite reporting accounting profits.")
            elif latest_cfo < (0.5 * net_prof):
                status = "EARNINGS_QUALITY_WARNING"
                pat_cfo_trend = f"CFO ({latest_cfo} Cr) significantly lags reported Net Profit ({net_prof} Cr)"
                warnings.append("Aggressive revenue recognition or rising working capital lock-in (CFO/PAT < 0.5x).")
            elif cfo_to_pat and cfo_to_pat >= 1.0:
                status = "HIGH_QUALITY_CONVERTING"
                pat_cfo_trend = "Operating cash flow exceeds net profit (CFO/PAT >= 1.0x)"
            else:
                status = "MODERATE"
                pat_cfo_trend = "Operating cash flow broadly tracks reported net income"
        else:
            status = "MODERATE"
            pat_cfo_trend = "Sufficient historical cash flow alignment"

        if inc.revenue_cagr_3y and inc.revenue_cagr_3y > 10.0 and inc.net_profit_cagr_3y and inc.net_profit_cagr_3y < 0:
            warnings.append("Top-line expansion accompanied by severe net profit margin compression.")
            margin_traj = "Revenue increasing but margins deteriorating"
        elif inc.revenue_cagr_3y and inc.revenue_cagr_3y > 0 and inc.net_profit_cagr_3y and inc.net_profit_cagr_3y > inc.revenue_cagr_3y:
            margin_traj = "Operating leverage expanding: Profit growth outpacing revenue growth"
        else:
            margin_traj = "Stable margin trajectory"

        if latest_fcf is not None and latest_fcf < 0 and not warnings:
            warnings.append("Free Cash Flow is negative due to heavy capital reinvestment cycle.")

        summary = (
            f"Earnings quality classified as {status}. "
            f"CFO to PAT conversion ratio stands at {cfo_to_pat or 'N/A'}x with FCF conversion of {fcf_conversion or 'N/A'}%. "
            f"{'Warning flags identified: ' + '; '.join(warnings) if warnings else 'Cash flow generation robustly validates audited reported earnings.'}"
        )

        return EarningsQualityAssessment(
            quality_status=status,
            cfo_to_pat_ratio=cfo_to_pat,
            fcf_conversion_pct=fcf_conversion,
            pat_vs_cfo_trend=pat_cfo_trend,
            margin_vs_revenue_trajectory=margin_traj,
            warning_flags=warnings,
            summary=summary,
        )

    def _evaluate_business_quality(
        self, meta: Dict[str, Any], inc: IncomeStatementData, ratios: KeyRatiosData, trends: HistoricalTrendSignals
    ) -> BusinessQualityAssessment:
        score = 7.0
        moat = "NARROW_MOAT"

        mcap = meta.get("market_cap_cr", 0.0)
        if mcap > 100_000:
            score += 1.5
            moat = "WIDE_MOAT"
        elif mcap > 25_000:
            score += 0.8

        if ratios.roce and ratios.roce >= 22.0:
            score += 1.2
            moat = "WIDE_MOAT"
        elif ratios.roce and ratios.roce >= 15.0:
            score += 0.5

        if inc.revenue_cagr_3y and inc.revenue_cagr_3y >= 15.0:
            rev_cons = "EXCELLENT"
            score += 0.5
        elif inc.revenue_cagr_3y and inc.revenue_cagr_3y >= 7.0:
            rev_cons = "GOOD"
        elif inc.revenue_cagr_3y and inc.revenue_cagr_3y < 0:
            rev_cons = "POOR"
            score -= 1.5
            moat = "NO_MOAT"
        else:
            rev_cons = "GOOD"

        if trends.margin_trend == "EXPANDING":
            margin_stab = "STABLE_EXPANDING"
        elif trends.margin_trend == "COMPRESSING":
            margin_stab = "COMPRESSING"
            score -= 0.8
        else:
            margin_stab = "STABLE"

        score = min(10.0, max(2.0, round(score, 1)))

        summary = (
            f"Business Quality scored at {score}/10 with {moat.replace('_', ' ').title()} status. "
            f"Characterized by {rev_cons.lower()} revenue consistency and {margin_stab.lower().replace('_', ' ')} margins, "
            f"supported by return on capital of {ratios.roce or ratios.roe or 'N/A'}%."
        )

        return BusinessQualityAssessment(
            score=score,
            revenue_consistency=rev_cons,
            margin_stability=margin_stab,
            capital_intensity="LOW_ASSET_LIGHT" if (ratios.roce or 0) > 20.0 else "MODERATE",
            cyclicality="NON_CYCLICAL_DEFENSIVE" if (inc.revenue_cagr_3y or 0) > 12.0 else "MODERATELY_CYCLICAL",
            moat_rating=moat,
            summary=summary,
        )

    def _evaluate_financial_health(
        self, bs: BalanceSheetData, ratios: KeyRatiosData, is_bank: bool
    ) -> FinancialHealthAssessment:
        if is_bank:
            return FinancialHealthAssessment(
                solvency_score=85.0,
                total_debt_cr=None,
                cash_and_equivalents_cr=None,
                net_debt_cr=None,
                debt_to_equity=None,
                current_ratio=None,
                interest_coverage=None,
                balance_sheet_stance="HEALTHY",
                summary="Regulated financial balance sheet with managed capital adequacy ratios.",
            )

        latest_yr = bs.years[-1] if bs.years else None
        total_debt = bs.total_debt.get(latest_yr) if latest_yr else 0.0
        cash = bs.cash_and_equivalents.get(latest_yr) if latest_yr else 0.0
        net_debt = bs.net_debt.get(latest_yr) if latest_yr else 0.0
        de = ratios.debt_to_equity

        score = 80.0
        if de is None or de <= 0.1:
            score = 98.0
            stance = "FORTRESS_CASH_RICH"
        elif de <= 0.5:
            score = 88.0
            stance = "HEALTHY_DELEVERAGED"
        elif de <= 1.2:
            score = 70.0
            stance = "MODERATE_LEVERAGE"
        else:
            score = 40.0
            stance = "HIGH_RISK_OVERLEVERAGED"

        summary = (
            f"Balance sheet classified as {stance.replace('_', ' ').title()} (Solvency Score: {score}/100). "
            f"Debt-to-Equity is {de or 'N/A'}x with total debt of ₹{total_debt or 0:,.2f} Cr vs cash reserves of ₹{cash or 0:,.2f} Cr."
        )

        return FinancialHealthAssessment(
            solvency_score=score,
            total_debt_cr=total_debt,
            cash_and_equivalents_cr=cash,
            net_debt_cr=net_debt,
            debt_to_equity=de,
            current_ratio=bs.current_ratio,
            interest_coverage=None,
            balance_sheet_stance=stance,
            summary=summary,
        )

    def _evaluate_valuation_rationale(
        self, ratios: KeyRatiosData, inc: IncomeStatementData, bq: BusinessQualityAssessment, val_status: ValuationStatus
    ) -> ValuationAssessment:
        pe = ratios.pe_ratio
        pb = ratios.pb_ratio
        ev_ebitda = ratios.ev_to_ebitda
        fwd_pe = ratios.forward_pe
        div_yield = ratios.dividend_yield
        growth = inc.net_profit_cagr_3y or inc.revenue_cagr_3y or 10.0

        # PEG ratio calculation
        peg = None
        if pe and pe > 0 and growth > 0:
            peg = round(pe / growth, 2)

        # Multi-factor explanation
        if pe and pe > 85.0:
            tier = ValuationStatus.EXTREMELY_OVERVALUED
            rationale = (
                f"P/E ratio of {pe}x is severely stretched relative to historical risk/reward, "
                f"requiring flawless long-term execution and leaving negligible margin of safety."
            )
        elif pe and pe > 45.0:
            if growth >= 25.0 and bq.score >= 8.0:
                tier = ValuationStatus.FAIRLY_VALUED
                rationale = (
                    f"P/E multiple of {pe}x trades at a premium, but is justified by durable compound growth "
                    f"({growth}% 3Y CAGR), wide economic moat ({bq.moat_rating}), and exceptional return on capital."
                )
            else:
                tier = ValuationStatus.EXPENSIVE
                rationale = (
                    f"P/E multiple of {pe}x is expensive compared to top-line expansion ({inc.revenue_cagr_3y or 'N/A'}%), "
                    f"exposing investors to multiple-compression risk during operational slowdowns."
                )
        elif pe and pe <= 22.0:
            tier = ValuationStatus.UNDERVALUED
            rationale = (
                f"P/E ratio of {pe}x represents an attractive entry multiple offering a significant margin of safety "
                f"against audited return metrics (ROCE/ROE: {ratios.roce or ratios.roe or 'N/A'}%)."
            )
        else:
            tier = ValuationStatus.FAIRLY_VALUED
            rationale = (
                f"P/E multiple of {pe or 'N/A'}x reflects fair market equilibrium balancing earnings visibility, "
                f"balance sheet stability, and industry competitive dynamics."
            )

        return ValuationAssessment(
            valuation_tier=tier,
            pe_ratio=pe,
            forward_pe=fwd_pe,
            pb_ratio=pb,
            ev_to_ebitda=ev_ebitda,
            peg_ratio=peg,
            dividend_yield=div_yield,
            valuation_rationale=rationale,
        )

    def _evaluate_portfolio_context(self, ticker: str, current_price: float) -> PortfolioContext:
        portfolio_holdings = self.portfolio_repo.get_holdings()
        owned = next((h for h in portfolio_holdings if h.ticker.upper() == ticker.upper()), None)

        if not owned:
            return PortfolioContext(
                is_owned=False,
                quantity=None,
                average_buy_price=None,
                current_price=current_price,
                invested_value=None,
                current_value=None,
                unrealized_pnl=None,
                unrealized_pnl_pct=None,
                portfolio_allocation_pct=0.0,
                concentration_risk_flag=False,
                recommended_action="WATCH",
                action_reasoning="Stock is not currently held in your portfolio. Evaluate for fresh accumulation based on conviction score and margin of safety.",
            )

        qty = owned.quantity
        avg_buy = owned.average_buy_price
        invested = round(qty * avg_buy, 2)
        curr_val = round(qty * current_price, 2)
        pnl = round(curr_val - invested, 2)
        pnl_pct = round((pnl / invested) * 100.0, 2) if invested > 0 else 0.0

        canonical_val = CanonicalValuationService.get_instance().evaluate_portfolio(portfolio_holdings)
        total_port_val = canonical_val.total_current_value
        alloc_pct = round((curr_val / total_port_val) * 100.0, 2) if total_port_val > 0 else 0.0
        concentration = alloc_pct >= 20.0

        if concentration:
            action = "HOLD"
            reason = f"Position currently represents {alloc_pct}% of total portfolio value. Capped at HOLD to prevent excessive single-stock concentration risk."
        elif pnl_pct < -15.0:
            action = "HOLD"
            reason = f"Position is currently running an unrealized loss of {pnl_pct}%. Verify fundamental thesis before averaging down."
        else:
            action = "BUY MORE"
            reason = f"Holding represents {alloc_pct}% of portfolio with {pnl_pct}% unrealized return. Safe headroom available for compounding."

        return PortfolioContext(
            is_owned=True,
            quantity=qty,
            average_buy_price=avg_buy,
            current_price=current_price,
            invested_value=invested,
            current_value=curr_val,
            unrealized_pnl=pnl,
            unrealized_pnl_pct=pnl_pct,
            portfolio_allocation_pct=alloc_pct,
            concentration_risk_flag=concentration,
            recommended_action=action,
            action_reasoning=reason,
        )

    def _analyze_news_causality(
        self, news_dicts: List[Dict[str, Any]], ticker: str, sector: str
    ) -> List[NewsCausalItem]:
        causal_items: List[NewsCausalItem] = []
        for n in news_dicts[:3]:
            title = n.get("title", "")
            summary = n.get("summary", "")
            source = n.get("source", "Market Wire")
            published = n.get("published_at", "")
            importance = n.get("importance", "MEDIUM")

            try:
                extraction = self.impact_analyzer.analyze_news_impact(title, summary, source)
                causal_items.append(
                    NewsCausalItem(
                        headline=title,
                        source=source,
                        published_at=published,
                        importance=importance,
                        event_summary=extraction.event_summary,
                        economic_transmission_mechanism=extraction.mechanism,
                        revenue_margin_impact=f"Direction: {extraction.direction.value} (Strength: {extraction.impact_strength}/10)",
                        catalyst_durability=extraction.catalyst_durability,
                    )
                )
            except Exception:
                causal_items.append(
                    NewsCausalItem(
                        headline=title,
                        source=source,
                        published_at=published,
                        importance=importance,
                        event_summary=summary or title,
                        economic_transmission_mechanism=f"Direct industry exposure in {sector}.",
                        revenue_margin_impact="Operational impact in line with sector conditions.",
                        catalyst_durability="TEMPORARY",
                    )
                )
        return causal_items

    def _extract_sector_macro_context(
        self, ticker: str, sector: str, uni_meta: Optional[Dict[str, Any]]
    ) -> SectorMacroContext:
        tags = (uni_meta.get("tags", []) if uni_meta else [])
        drivers: List[str] = []
        tailwinds: List[str] = []
        headwinds: List[str] = []

        if "rate_sensitive" in tags:
            drivers.append("RBI Repo Rate & Monetary Policy Cycle")
            tailwinds.append("Lower borrowing rates stimulate credit demand and auto/home purchases.")
            headwinds.append("Sticky inflation may delay rate reduction trajectory.")
        if "crude_positive" in tags:
            drivers.append("Crude Oil & Energy Prices")
            tailwinds.append("Higher benchmark realization boosts upstream exploration revenue.")
            headwinds.append("Windfall tax adjustments or global demand moderation.")
        elif "crude_negative" in tags:
            drivers.append("Crude Oil & Petrochemical Input Costs")
            tailwinds.append("Falling crude prices expand gross operating margins.")
            headwinds.append("Crude price spikes increase raw material costs.")
        if "us_spending" in tags:
            drivers.append("US Enterprise Tech Spending & USD/INR Exchange Rate")
            tailwinds.append("Stronger USD realization and generative AI enterprise migration.")
            headwinds.append("US corporate discretionary IT budget delays.")
        if "indigenization" in tags or "sovereign_backed" in tags:
            drivers.append("Government Capital Expenditure & Atmanirbhar Bharat")
            tailwinds.append("Multi-year budgetary capex allocation and import embargo list.")
            headwinds.append("Procurement cycle execution delays.")

        if not drivers:
            drivers.append("Domestic GDP Growth & Urban Consumption Trends")
            tailwinds.append("Expanding formalization and domestic demographic consumption.")
            headwinds.append("Macroeconomic inflation or raw material volatility.")

        summary = (
            f"Key macro drivers for {ticker} ({sector}): {', '.join(drivers)}. "
            f"Tailwinds: {'; '.join(tailwinds[:2])}. Headwinds: {'; '.join(headwinds[:2])}."
        )

        return SectorMacroContext(
            key_drivers=drivers,
            macro_sensitivity=", ".join(tags) if tags else "General Domestic GDP",
            tailwinds=tailwinds,
            headwinds=headwinds,
            summary=summary,
        )

    def _build_comprehensive_fact_pack(
        self,
        meta: Dict[str, Any],
        company_name: str,
        sector_name: str,
        industry_name: str,
        inc: IncomeStatementData,
        bs: BalanceSheetData,
        cf: CashFlowData,
        ratios: KeyRatiosData,
        trends: HistoricalTrendSignals,
        price_momentum: PriceMomentumContext,
        earnings_quality: EarningsQualityAssessment,
        business_quality: BusinessQualityAssessment,
        financial_health: FinancialHealthAssessment,
        valuation_assessment: ValuationAssessment,
        portfolio_context: PortfolioContext,
        sector_macro: SectorMacroContext,
        news_causal: List[NewsCausalItem],
        decision: Any,
    ) -> Dict[str, Any]:
        return {
            "company": {
                "ticker": meta.get("ticker"),
                "name": company_name,
                "sector": sector_name,
                "industry": industry_name,
                "is_bank": bs.is_financial_institution,
                "current_price": meta.get("current_price"),
                "market_cap_cr": meta.get("market_cap_cr"),
            },
            "financials_in_cr": {
                "revenue_history": inc.revenue,
                "operating_margin_history_pct": inc.operating_margin,
                "net_profit_history": inc.net_income,
                "net_margin_history_pct": inc.net_margin,
                "eps_history": inc.eps,
                "revenue_cagr_3y_pct": inc.revenue_cagr_3y,
                "net_profit_cagr_3y_pct": inc.net_profit_cagr_3y,
            },
            "balance_sheet": {
                "total_debt_cr": bs.total_debt,
                "cash_and_equivalents_cr": bs.cash_and_equivalents,
                "debt_to_equity": bs.debt_to_equity,
                "current_ratio": bs.current_ratio,
                "solvency_stance": financial_health.balance_sheet_stance,
            },
            "cash_flow_and_earnings_quality": {
                "operating_cash_flow_cr": cf.operating_cash_flow,
                "free_cash_flow_cr": cf.free_cash_flow,
                "cfo_to_pat_ratio": earnings_quality.cfo_to_pat_ratio,
                "fcf_conversion_pct": earnings_quality.fcf_conversion_pct,
                "earnings_quality_status": earnings_quality.quality_status,
                "pat_vs_cfo_trend": earnings_quality.pat_vs_cfo_trend,
                "warnings": earnings_quality.warning_flags,
            },
            "ratios_and_returns": {
                "pe_ratio": ratios.pe_ratio,
                "forward_pe": ratios.forward_pe,
                "pb_ratio": ratios.pb_ratio,
                "ev_to_ebitda": ratios.ev_to_ebitda,
                "peg_ratio": valuation_assessment.peg_ratio,
                "roe_pct": ratios.roe,
                "roce_pct": ratios.roce,
                "dividend_yield_pct": ratios.dividend_yield,
                "valuation_tier": valuation_assessment.valuation_tier.value,
            },
            "price_momentum": {
                "price_1d_pct": price_momentum.price_change_1d,
                "price_5d_pct": price_momentum.price_change_5d,
                "price_20d_pct": price_momentum.price_change_20d,
                "distance_from_52w_high_pct": price_momentum.distance_from_52w_high_pct,
                "technical_stance": price_momentum.technical_stance,
                "interpretation": price_momentum.interpretation,
            },
            "business_quality": {
                "score": business_quality.score,
                "moat_rating": business_quality.moat_rating,
                "revenue_consistency": business_quality.revenue_consistency,
                "margin_stability": business_quality.margin_stability,
            },
            "sector_macro_tailwinds": sector_macro.tailwinds,
            "sector_macro_headwinds": sector_macro.headwinds,
            "portfolio_context": {
                "is_owned": portfolio_context.is_owned,
                "quantity": portfolio_context.quantity,
                "avg_buy_price": portfolio_context.average_buy_price,
                "unrealized_pnl_pct": portfolio_context.unrealized_pnl_pct,
                "portfolio_allocation_pct": portfolio_context.portfolio_allocation_pct,
                "concentration_flag": portfolio_context.concentration_risk_flag,
                "recommended_action": portfolio_context.recommended_action,
            },
            "deterministic_decision": {
                "fundamental_score": decision.fundamental_score,
                "decision": decision.decision.value,
                "key_strengths": decision.key_strengths,
                "key_concerns": decision.key_concerns,
            },
            "recent_news_events": [
                {
                    "headline": c.headline,
                    "event_summary": c.event_summary,
                    "transmission": c.economic_transmission_mechanism,
                    "durability": c.catalyst_durability,
                }
                for c in news_causal
            ],
        }

    def _synthesize_structured_ai_research(
        self,
        clean_ticker: str,
        company_name: str,
        fact_pack: Dict[str, Any],
        decision_result: Any,
        price_momentum: PriceMomentumContext,
        business_quality: BusinessQualityAssessment,
        financial_health: FinancialHealthAssessment,
        earnings_quality: EarningsQualityAssessment,
        valuation_assessment: ValuationAssessment,
        sector_macro: SectorMacroContext,
        news_causal_items: List[NewsCausalItem],
        portfolio_context: PortfolioContext,
    ) -> Tuple[Dict[str, Any], str, str]:
        prompt = f"""You are a senior institutional equities research director at BullCompass.
Synthesize a comprehensive, rigorous long-term investment research memo for {company_name} ({clean_ticker}).

RULES:
1. You MUST use ONLY the verified figures and calculations provided in the JSON FACT PACK below.
2. DO NOT fabricate, guess, or modify any financial numbers. If a metric is missing, write "Data unavailable".
3. Return ONLY a valid JSON object matching the exact schema below (no preamble, no markdown backticks around JSON).

SCHEMA:
{{
  "ai_thesis_report": "string (A complete institutional research memorandum with markdown headers for Executive Summary, Moat, Financial Health, Valuation, News Impact, Scenarios, Risks, and Invalidation)",
  "scenario_analysis": {{
    "bull_case": {{
      "scenario_title": "string",
      "probability_pct": 25,
      "assumptions": ["string", "string"],
      "growth_margin_projection": "string",
      "expected_return_stance": "string",
      "summary": "string"
    }},
    "base_case": {{
      "scenario_title": "string",
      "probability_pct": 55,
      "assumptions": ["string", "string"],
      "growth_margin_projection": "string",
      "expected_return_stance": "string",
      "summary": "string"
    }},
    "bear_case": {{
      "scenario_title": "string",
      "probability_pct": 20,
      "assumptions": ["string", "string"],
      "growth_margin_projection": "string",
      "expected_return_stance": "string",
      "summary": "string"
    }}
  }},
  "risk_matrix": {{
    "risks": [
      {{ "category": "BUSINESS", "title": "string", "severity": "MEDIUM", "rationale": "string" }},
      {{ "category": "FINANCIAL", "title": "string", "severity": "LOW", "rationale": "string" }},
      {{ "category": "VALUATION", "title": "string", "severity": "HIGH", "rationale": "string" }},
      {{ "category": "MACRO", "title": "string", "severity": "MEDIUM", "rationale": "string" }},
      {{ "category": "REGULATORY", "title": "string", "severity": "LOW", "rationale": "string" }}
    ],
    "primary_vulnerability": "string"
  }},
  "thesis_invalidation": {{
    "triggers": ["string (Specific operational event 1)", "string (Event 2)"],
    "quantifiable_thresholds": ["string (e.g. Revenue CAGR falling below X%)", "string (e.g. CFO/PAT falling below Y)"]
  }},
  "final_verdict": {{
    "verdict": "{decision_result.decision.value}",
    "conviction_score": {int(decision_result.fundamental_score)},
    "time_horizon": "1-3 years",
    "margin_of_safety": "{'HIGH' if valuation_assessment.valuation_tier == ValuationStatus.UNDERVALUED else 'LOW' if valuation_assessment.valuation_tier in [ValuationStatus.EXPENSIVE, ValuationStatus.EXTREMELY_OVERVALUED] else 'MEDIUM'}",
    "executive_summary": "string (2-3 concise sentences explaining the definitive BullCompass conclusion)"
  }}
}}

FACT PACK:
{json.dumps(fact_pack, indent=2)}
"""
        try:
            raw_response = self.ollama.chat(prompt)
            clean = raw_response.strip()
            if "{" in clean and "}" in clean:
                start = clean.find("{")
                end = clean.rfind("}")
                clean_json = clean[start : end + 1]
                parsed = json.loads(clean_json)

                # Validate and parse sub-models
                scenarios = self._parse_scenario_analysis(parsed.get("scenario_analysis"), clean_ticker)
                risk_matrix = self._parse_risk_matrix(parsed.get("risk_matrix"), clean_ticker)
                thesis_inval = self._parse_thesis_invalidation(parsed.get("thesis_invalidation"), clean_ticker)
                final_verd = self._parse_final_verdict(parsed.get("final_verdict"), decision_result, valuation_assessment)
                thesis_memo = str(parsed.get("ai_thesis_report") or "")

                if not thesis_memo or len(thesis_memo) < 100:
                    thesis_memo = self._generate_deterministic_memo_text(clean_ticker, fact_pack, decision_result, final_verd)

                return (
                    {
                        "scenario_analysis": scenarios,
                        "risk_matrix": risk_matrix,
                        "thesis_invalidation": thesis_inval,
                        "final_verdict": final_verd,
                    },
                    thesis_memo,
                    "ONLINE",
                )
        except Exception as e:
            logger.debug(f"[RESEARCH_COORDINATOR] Ollama structured synthesis fallback: {e}")

        # Deterministic Fallback Synthesis
        return self._generate_deterministic_structured_fallback(
            clean_ticker=clean_ticker,
            company_name=company_name,
            fact_pack=fact_pack,
            decision_result=decision_result,
            price_momentum=price_momentum,
            business_quality=business_quality,
            financial_health=financial_health,
            earnings_quality=earnings_quality,
            valuation_assessment=valuation_assessment,
            portfolio_context=portfolio_context,
        )

    def _parse_scenario_analysis(self, raw: Any, ticker: str) -> ScenarioAnalysis:
        if not isinstance(raw, dict):
            raise ValueError("Scenario analysis is not a dict")
        bull = raw.get("bull_case", {})
        base = raw.get("base_case", {})
        bear = raw.get("bear_case", {})
        return ScenarioAnalysis(
            bull_case=ScenarioCase(
                scenario_title=str(bull.get("scenario_title") or "High Compounding & Margin Expansion"),
                probability_pct=int(bull.get("probability_pct") or 25),
                assumptions=[str(a) for a in bull.get("assumptions", []) if a][:4] or ["Accelerating top-line revenue >18%", "Operating leverage expansion"],
                growth_margin_projection=str(bull.get("growth_margin_projection") or "Revenue CAGR: 18-22% | Operating Margins: +200 bps"),
                expected_return_stance=str(bull.get("expected_return_stance") or "Alpha generation outperforming Nifty 50"),
                summary=str(bull.get("summary") or "Durable market leadership and market share expansion drive premium valuation compounding."),
            ),
            base_case=ScenarioCase(
                scenario_title=str(base.get("scenario_title") or "Steady-State Secular Growth"),
                probability_pct=int(base.get("probability_pct") or 55),
                assumptions=[str(a) for a in base.get("assumptions", []) if a][:4] or ["Historical revenue CAGR tracks industry growth", "Stable margin preservation"],
                growth_margin_projection=str(base.get("growth_margin_projection") or "Revenue CAGR: 10-14% | Operating Margins: Stable"),
                expected_return_stance=str(base.get("expected_return_stance") or "Market-aligned steady compounding"),
                summary=str(base.get("summary") or "Business compounds steadily with GDP expansion and robust capital return metrics."),
            ),
            bear_case=ScenarioCase(
                scenario_title=str(bear.get("scenario_title") or "Macro Headwinds & Multiple Compression"),
                probability_pct=int(bear.get("probability_pct") or 20),
                assumptions=[str(a) for a in bear.get("assumptions", []) if a][:4] or ["Input cost inflation or price competition", "Revenue growth deceleration"],
                growth_margin_projection=str(bear.get("growth_margin_projection") or "Revenue CAGR: <6% | Operating Margins: -150 bps"),
                expected_return_stance=str(bear.get("expected_return_stance") or "Downside valuation mean-reversion"),
                summary=str(bear.get("summary") or "Cyclical downturn or aggressive competition compresses operating margins."),
            ),
        )

    def _parse_risk_matrix(self, raw: Any, ticker: str) -> RiskAnalysisMatrix:
        risks_list: List[RiskItem] = []
        if isinstance(raw, dict):
            raw_items = raw.get("risks", [])
            for r in raw_items:
                if isinstance(r, dict):
                    sev_str = str(r.get("severity", "MEDIUM")).upper()
                    sev = RiskSeverity.MEDIUM
                    if sev_str == "LOW":
                        sev = RiskSeverity.LOW
                    elif sev_str == "HIGH":
                        sev = RiskSeverity.HIGH
                    elif sev_str == "CRITICAL":
                        sev = RiskSeverity.CRITICAL

                    risks_list.append(
                        RiskItem(
                            category=str(r.get("category", "BUSINESS")).upper(),
                            title=str(r.get("title", "Market Risk")),
                            severity=sev,
                            rationale=str(r.get("rationale", "")),
                        )
                    )
            vuln = str(raw.get("primary_vulnerability") or "Valuation multiple compression in cyclical headwinds.")
        else:
            vuln = "Sector-level macroeconomic shifts."

        if not risks_list:
            risks_list = [
                RiskItem(category="BUSINESS", title="Competitive Moat Pressure", severity=RiskSeverity.MEDIUM, rationale="Intensifying competition from domestic and global players."),
                RiskItem(category="FINANCIAL", title="Working Capital Drag", severity=RiskSeverity.LOW, rationale="Fluctuations in inventory and receivables turnover."),
                RiskItem(category="VALUATION", title="Multiple Compression Risk", severity=RiskSeverity.HIGH, rationale="Elevated entry multiples leaves limited downside buffer."),
                RiskItem(category="MACRO", title="Interest Rate & Currency Volatility", severity=RiskSeverity.MEDIUM, rationale="Macroeconomic monetary adjustments impacting customer demand."),
            ]

        return RiskAnalysisMatrix(risks=risks_list, primary_vulnerability=vuln)

    def _parse_thesis_invalidation(self, raw: Any, ticker: str) -> ThesisInvalidationTriggers:
        triggers: List[str] = []
        thresholds: List[str] = []
        if isinstance(raw, dict):
            triggers = [str(t) for t in raw.get("triggers", []) if t][:4]
            thresholds = [str(th) for th in raw.get("quantifiable_thresholds", []) if th][:4]

        if not triggers:
            triggers = [
                "Loss of key institutional clients or major product line market share",
                "Sharp decline in operating margin exceeding 300 bps for two consecutive quarters",
                "Unanticipated capital misallocation or aggressive debt-fueled acquisitions",
            ]
        if not thresholds:
            thresholds = [
                "3-Year Revenue CAGR dropping below 8.0%",
                "CFO to PAT conversion ratio deteriorating below 0.50x",
                "Return on Capital Employed (ROCE) falling below 12.0%",
                "Debt-to-Equity ratio expanding above 1.5x (non-financial)",
            ]

        return ThesisInvalidationTriggers(triggers=triggers, quantifiable_thresholds=thresholds)

    def _parse_final_verdict(
        self, raw: Any, decision_result: Any, val_assessment: ValuationAssessment
    ) -> FinalVerdict:
        verdict_enum = decision_result.decision
        conviction = int(decision_result.fundamental_score)
        horizon = "1-3 years"
        mos = MarginOfSafety.MEDIUM

        if isinstance(raw, dict):
            verd_str = str(raw.get("verdict", "")).upper()
            for opt in DecisionRating:
                if opt.value == verd_str or opt.name == verd_str:
                    verdict_enum = opt
                    break
            if raw.get("conviction_score") is not None:
                try:
                    conviction = int(raw.get("conviction_score"))
                except Exception:
                    pass
            if raw.get("time_horizon"):
                horizon = str(raw.get("time_horizon"))
            if raw.get("margin_of_safety"):
                ms_str = str(raw.get("margin_of_safety")).upper()
                if ms_str == "HIGH":
                    mos = MarginOfSafety.HIGH
                elif ms_str == "LOW":
                    mos = MarginOfSafety.LOW

            exec_summary = str(raw.get("executive_summary") or "")
        else:
            exec_summary = ""

        if not exec_summary:
            exec_summary = (
                f"BullCompass concludes with a {verdict_enum.value} verdict and conviction {conviction}/100. "
                f"The business demonstrates robust operating quality with {val_assessment.valuation_tier.value.lower()} multiples over a {horizon} horizon."
            )

        return FinalVerdict(
            verdict=verdict_enum,
            conviction_score=conviction,
            time_horizon=horizon,
            margin_of_safety=mos,
            executive_summary=exec_summary,
        )

    def _generate_deterministic_structured_fallback(
        self,
        clean_ticker: str,
        company_name: str,
        fact_pack: Dict[str, Any],
        decision_result: Any,
        price_momentum: PriceMomentumContext,
        business_quality: BusinessQualityAssessment,
        financial_health: FinancialHealthAssessment,
        earnings_quality: EarningsQualityAssessment,
        valuation_assessment: ValuationAssessment,
        portfolio_context: PortfolioContext,
    ) -> Tuple[Dict[str, Any], str, str]:
        scenarios = ScenarioAnalysis(
            bull_case=ScenarioCase(
                scenario_title="Secular Market Share Expansion & Margin Accretion",
                probability_pct=30,
                assumptions=[
                    f"Revenue growth compounding above {fact_pack['financials_in_cr'].get('revenue_cagr_3y_pct') or 15.0}%",
                    "Continued market leadership and pricing power across core verticals",
                    "High cash conversion (>80% CFO/PAT) enabling self-funded capital expansion",
                ],
                growth_margin_projection="3Y Revenue CAGR: 16-20% | Operating Margins: +150-200 bps",
                expected_return_stance="Strong alpha generation outperforming benchmark index",
                summary=f"{company_name} capitalizes on structural sector tailwinds, driving sustained high return on capital and multiple re-rating.",
            ),
            base_case=ScenarioCase(
                scenario_title="Steady-State Compounding with Moderate Valuation Expansion",
                probability_pct=50,
                assumptions=[
                    "Top-line revenue compounds steadily with domestic GDP and sector trajectory",
                    "Operating margins remain resilient within audited historical bands",
                    "Prudent capital allocation maintaining comfortable leverage profile",
                ],
                growth_margin_projection="3Y Revenue CAGR: 10-14% | Operating Margins: Stable",
                expected_return_stance="Market-aligned compounding with steady cash return",
                summary=f"The company compounds earnings steadily in line with historical trends ({fact_pack['financials_in_cr'].get('net_profit_cagr_3y_pct') or 12.0}% profit CAGR).",
            ),
            bear_case=ScenarioCase(
                scenario_title="Competitive Margin Pressure & Multiple Compression",
                probability_pct=20,
                assumptions=[
                    "Intensifying pricing competition or input cost headwinds",
                    "Deceleration in customer demand or order execution delays",
                    "Working capital expansion compressing free cash flow conversion",
                ],
                growth_margin_projection="3Y Revenue CAGR: <7% | Operating Margins: -150 bps",
                expected_return_stance="Multiple compression toward historical downside support",
                summary="Downturn in broader macroeconomic demand or rising input costs compresses operating margins and slows net profit growth.",
            ),
        )

        risks = RiskAnalysisMatrix(
            risks=[
                RiskItem(category="BUSINESS", title="Competitive Pricing Pressure", severity=RiskSeverity.MEDIUM, rationale="Emergence of aggressive domestic competitors challenging pricing power."),
                RiskItem(category="FINANCIAL", title="Cash Flow & Working Capital Drag", severity=RiskSeverity.LOW if earnings_quality.quality_status == "HIGH_QUALITY_CONVERTING" else RiskSeverity.HIGH, rationale="Working capital expansion or delayed receivables collection."),
                RiskItem(category="VALUATION", title="Multiple Mean-Reversion", severity=RiskSeverity.HIGH if valuation_assessment.valuation_tier in [ValuationStatus.EXPENSIVE, ValuationStatus.EXTREMELY_OVERVALUED] else RiskSeverity.LOW, rationale="High entry multiples create downside sensitivity to earnings misses."),
                RiskItem(category="MACRO", title="Macroeconomic Demand Slowdown", severity=RiskSeverity.MEDIUM, rationale="Inflationary headwinds or interest rate volatility affecting discretionary capex."),
            ],
            primary_vulnerability=f"{valuation_assessment.valuation_tier.value} valuation multiples in the event of growth deceleration.",
        )

        thesis_inval = ThesisInvalidationTriggers(
            triggers=[
                "Structural deterioration in ROCE below 12.0% for two consecutive fiscal years",
                "Operating cash flow turning negative despite positive reported accounting profits",
                "Significant loss in market share to domestic or unorganized competitors",
                "Unplanned debt accumulation pushing Debt/Equity above 1.5x",
            ],
            quantifiable_thresholds=[
                f"Revenue CAGR falling below {max(6.0, (fact_pack['financials_in_cr'].get('revenue_cagr_3y_pct') or 10.0) * 0.5)}%",
                "CFO / PAT conversion ratio falling below 0.50x",
                "Operating margin compressing by >250 bps from historical averages",
            ],
        )

        verdict_enum = decision_result.decision
        mos = MarginOfSafety.HIGH if valuation_assessment.valuation_tier == ValuationStatus.UNDERVALUED else MarginOfSafety.LOW if valuation_assessment.valuation_tier in [ValuationStatus.EXPENSIVE, ValuationStatus.EXTREMELY_OVERVALUED] else MarginOfSafety.MEDIUM

        final_verd = FinalVerdict(
            verdict=verdict_enum,
            conviction_score=int(decision_result.fundamental_score),
            time_horizon="1-3 years",
            margin_of_safety=mos,
            executive_summary=(
                f"BullCompass awards {company_name} ({clean_ticker}) a {verdict_enum.value} rating with conviction {int(decision_result.fundamental_score)}/100. "
                f"The business demonstrates a {business_quality.moat_rating.replace('_', ' ').title()} moat, {financial_health.balance_sheet_stance.replace('_', ' ').title()} balance sheet, "
                f"and {valuation_assessment.valuation_tier.value.lower()} valuation multiples."
            ),
        )

        memo_text = self._generate_deterministic_memo_text(clean_ticker, fact_pack, decision_result, final_verd)

        return (
            {
                "scenario_analysis": scenarios,
                "risk_matrix": risks,
                "thesis_invalidation": thesis_inval,
                "final_verdict": final_verd,
            },
            memo_text,
            "OFFLINE_FALLBACK",
        )

    def _generate_deterministic_memo_text(
        self, ticker: str, fact_pack: Dict[str, Any], decision: Any, final_verd: FinalVerdict
    ) -> str:
        comp = fact_pack["company"]
        ratios = fact_pack["ratios_and_returns"]
        fin = fact_pack["financials_in_cr"]
        bs = fact_pack["balance_sheet"]
        cf_eq = fact_pack["cash_flow_and_earnings_quality"]
        pm = fact_pack["price_momentum"]

        return f"""### 1. Executive Summary & Institutional Quality Assessment
[FACT] **{comp['name']}** ({comp['ticker']}) is a leading enterprise in the **{comp['sector']}** sector ({comp['industry']}) with a market capitalization of **₹{comp['market_cap_cr']:,.2f} Cr** and current price **₹{comp['current_price']:,.2f}**.
[INFERENCE] BullCompass synthesizes an institutional **Quality Score of {decision.fundamental_score}/100**, arriving at a **{final_verd.verdict.value}** recommendation with **{final_verd.margin_of_safety.value}** margin of safety across a **{final_verd.time_horizon}** horizon.

### 2. Business Moat & Competitive Moat Quality
[FACT] The company exhibits a 3-year revenue CAGR of **{fin.get('revenue_cagr_3y_pct') or 'N/A'}%** and return on equity of **{ratios.get('roe_pct') or 'N/A'}%**.
[INFERENCE] Competitive positioning is assessed as **{fact_pack['business_quality']['moat_rating'].replace('_', ' ').title()}**, supported by durable pricing power and operational scale.

### 3. Revenue, Earnings & Historical Trajectory
[FACT] Audited 3-year profit CAGR stands at **{fin.get('net_profit_cagr_3y_pct') or 'N/A'}%**.
[INFERENCE] Top-line compounding exhibits **{fact_pack['business_quality']['revenue_consistency'].lower()}** multi-year revenue stability across fiscal cycles.

### 4. Balance Sheet Resilience & Capital Structure
[FACT] Debt-to-Equity stands at **{bs.get('debt_to_equity') or '0.0'}x** with solvency stance classified as **{bs.get('solvency_stance', 'HEALTHY').replace('_', ' ').title()}**.
[INFERENCE] Balance sheet provides strong downside shock absorption during macro cyclical contractions.

### 5. Cash Flow Reliability & Earnings Quality Diagnosis
[FACT] CFO to PAT conversion ratio: **{cf_eq.get('cfo_to_pat_ratio') or 'N/A'}x** | Free Cash Flow conversion: **{cf_eq.get('fcf_conversion_pct') or 'N/A'}%**.
[INFERENCE] Earnings Quality status: **{cf_eq.get('earnings_quality_status')}**. {cf_eq.get('pat_vs_cfo_trend')}.

### 6. Profitability & Return on Capital
[FACT] ROCE: **{ratios.get('roce_pct') or 'N/A'}%** | Operating Margins: **{ratios.get('operating_margin_pct') or 'N/A'}%**.
[INFERENCE] High capital productivity enables organic self-funded expansion without aggressive leverage.

### 7. Valuation Assessment & Margin of Safety
[FACT] Trailing P/E: **{ratios.get('pe_ratio') or 'N/A'}x** | P/B: **{ratios.get('pb_ratio') or 'N/A'}x** | EV/EBITDA: **{ratios.get('ev_to_ebitda') or 'N/A'}x**.
[INFERENCE] Valuation status: **{ratios.get('valuation_tier')}**. {fact_pack.get('valuation_assessment', {}).get('valuation_rationale', '')}

### 8. Price Momentum & Technical Context
[FACT] 1D: **{pm.get('price_1d_pct')}%** | 5D: **{pm.get('price_5d_pct')}%** | 20D: **{pm.get('price_20d_pct')}%** | Distance vs 52W High: **{pm.get('distance_from_52w_high_pct')}%**.
[INFERENCE] Technical stance: **{pm.get('technical_stance')}**. {pm.get('interpretation')}

### 9. Bull, Base & Bear Scenarios
- **Bull Case (30% Probability):** Revenue CAGR >16%, margin expansion +150 bps, delivering outsized market alpha.
- **Base Case (50% Probability):** Steady secular growth tracking industry (10-14% CAGR) with stable margins.
- **Bear Case (20% Probability):** Macro demand slowdown or pricing competition compressing margins by 150 bps.

### 10. Thesis Invalidation Triggers
- Sustained deterioration in ROCE below 12.0% for two consecutive fiscal years.
- Operating cash flow turning negative despite reported accounting profits.
- 3-year revenue growth deceleration below 6.0%.

### 11. Final BullCompass Verdict
**Verdict:** `{final_verd.verdict.value}` | **Conviction:** `{final_verd.conviction_score}/100` | **Margin of Safety:** `{final_verd.margin_of_safety.value}`

*(Generated using BullCompass Deterministic Institutional Equity Research Engine)*
"""
