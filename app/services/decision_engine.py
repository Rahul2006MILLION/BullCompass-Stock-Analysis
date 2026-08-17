from typing import List, Dict, Any, Optional
from app.models.fundamentals import (
    IncomeStatementData,
    BalanceSheetData,
    CashFlowData,
    KeyRatiosData,
    HistoricalTrendSignals,
    QualityScoreBreakdown,
    InvestmentDecisionResult,
    DecisionRating,
    ValuationStatus,
    ConfidenceLevel,
)


class QualityScoreEngine:
    """
    Deterministic Fundamental Quality Scoring Engine (0 - 100).
    Explicit weights:
    - Business Quality: 10 pts
    - Financial Strength & Solvency: 15 pts
    - Growth: 15 pts
    - Profitability & Return on Capital: 15 pts
    - Cash Generation & Earnings Quality: 15 pts
    - Valuation: 15 pts
    - Risk & News Exposure: 15 pts
    """

    def compute_score(
        self,
        meta: Dict[str, Any],
        inc: IncomeStatementData,
        bs: BalanceSheetData,
        cf: CashFlowData,
        ratios: KeyRatiosData,
        trends: HistoricalTrendSignals,
        val_status: ValuationStatus,
        recent_news: List[Dict[str, Any]],
    ) -> QualityScoreBreakdown:
        is_bank = bs.is_financial_institution

        # 1. Business Quality (/10)
        bq = 7.0  # Base for established listed entities
        if meta.get("market_cap_cr", 0) > 50_000:  # Large Cap
            bq += 2.0
        elif meta.get("market_cap_cr", 0) > 15_000:  # Mid Cap
            bq += 1.0
        if ratios.operating_margin and ratios.operating_margin > 18.0:
            bq += 1.0
        bq = min(10.0, max(2.0, bq))

        # 2. Financial Strength & Solvency (/15)
        fs = 10.0
        if is_bank:
            # Banking solvency proxied via equity & asset base
            if ratios.roa and ratios.roa >= 1.5:
                fs = 14.0
            elif ratios.roa and ratios.roa >= 1.0:
                fs = 12.0
            else:
                fs = 9.0
        else:
            de = ratios.debt_to_equity
            if de is None or de <= 0.1:
                fs = 15.0  # Debt free / negligible
            elif de <= 0.5:
                fs = 13.0
            elif de <= 1.0:
                fs = 9.0
            elif de <= 1.8:
                fs = 5.0
            else:
                fs = 2.0  # High debt burden
        fs = min(15.0, max(0.0, fs))

        # 3. Growth (/15)
        gw = 8.0
        rev_cagr = inc.revenue_cagr_3y
        prof_cagr = inc.net_profit_cagr_3y

        if rev_cagr is not None:
            if rev_cagr >= 20.0:
                gw += 4.0
            elif rev_cagr >= 12.0:
                gw += 2.5
            elif rev_cagr < 0.0:
                gw -= 3.0

        if prof_cagr is not None:
            if prof_cagr >= 20.0:
                gw += 3.0
            elif prof_cagr >= 10.0:
                gw += 1.5
            elif prof_cagr < 0.0:
                gw -= 3.0

        if trends.revenue_trend == "STRONG_GROWTH":
            gw += 1.0
        gw = min(15.0, max(0.0, gw))

        # 4. Profitability & Return on Capital (/15)
        prof = 7.0
        roe = ratios.roe
        if roe is not None:
            if roe >= 22.0:
                prof += 6.0
            elif roe >= 16.0:
                prof += 4.5
            elif roe >= 10.0:
                prof += 2.0
            elif roe < 0.0:
                prof -= 5.0

        if ratios.net_margin is not None:
            if ratios.net_margin >= 18.0:
                prof += 2.0
            elif ratios.net_margin >= 10.0:
                prof += 1.0
        prof = min(15.0, max(0.0, prof))

        # 5. Cash Generation & Earnings Quality (/15)
        cg = 8.0
        if is_bank:
            cg = 11.0  # Banks evaluated on ROA/ROE rather than traditional FCF
        else:
            if cf.fcf_conversion is not None:
                if cf.fcf_conversion >= 80.0:
                    cg = 15.0
                elif cf.fcf_conversion >= 50.0:
                    cg = 12.0
                elif cf.fcf_conversion > 0:
                    cg = 8.0
                else:
                    cg = 3.0
            if cf.cash_flow_quality_flag == "ANOMALY_CFO_LAGGING_NET_PROFIT":
                cg -= 4.0
            elif cf.cash_flow_quality_flag == "WEAK_NEGATIVE_FCF":
                cg -= 5.0
        cg = min(15.0, max(0.0, cg))

        # 6. Valuation (/15)
        val = 8.0
        if val_status == ValuationStatus.UNDERVALUED:
            val = 14.0
        elif val_status == ValuationStatus.FAIRLY_VALUED:
            val = 10.0
        elif val_status == ValuationStatus.EXPENSIVE:
            val = 4.0
        else:
            val = 7.0
        val = min(15.0, max(0.0, val))

        # 7. Risk & News Sentiment (/15)
        rk = 11.0
        high_risk_news = sum(1 for n in recent_news if n.get("importance", "").upper() == "HIGH")
        if high_risk_news >= 2:
            rk -= 3.0
        if trends.margin_trend == "COMPRESSING":
            rk -= 2.0
        if trends.debt_trend == "HEAVILY_LEVERAGED":
            rk -= 4.0
        rk = min(15.0, max(0.0, rk))

        total = round(bq + fs + gw + prof + cg + val + rk, 1)

        return QualityScoreBreakdown(
            business_quality=round(bq, 1),
            financial_strength=round(fs, 1),
            growth=round(gw, 1),
            profitability=round(prof, 1),
            cash_generation=round(cg, 1),
            valuation=round(val, 1),
            risk_profile=round(rk, 1),
            total_score=total,
        )


class InvestmentDecisionEngine:
    """
    Deterministic Rules Engine for Long-term Investment Candidate Tiering.
    Produces STRONG BUY CANDIDATE, BUY CANDIDATE, HOLD / WATCH, or AVOID.
    """

    def __init__(self):
        self.score_engine = QualityScoreEngine()

    def evaluate(
        self,
        meta: Dict[str, Any],
        inc: IncomeStatementData,
        bs: BalanceSheetData,
        cf: CashFlowData,
        ratios: KeyRatiosData,
        trends: HistoricalTrendSignals,
        val_status: ValuationStatus,
        recent_news: List[Dict[str, Any]],
    ) -> InvestmentDecisionResult:
        # Check data sufficiency
        has_min_data = len(inc.years) >= 2 and (ratios.pe_ratio is not None or ratios.pb_ratio is not None)
        if not has_min_data:
            breakdown = QualityScoreBreakdown(0, 0, 0, 0, 0, 0, 0, 0)
            return InvestmentDecisionResult(
                decision=DecisionRating.INSUFFICIENT_DATA,
                fundamental_score=0,
                score_breakdown=breakdown,
                data_confidence=ConfidenceLevel.LOW,
                valuation_status=ValuationStatus.INSUFFICIENT_DATA,
                key_strengths=[],
                key_concerns=["Insufficient multi-year financial statements available for audited assessment."],
                is_bank=bs.is_financial_institution,
            )

        confidence = ConfidenceLevel.HIGH if len(inc.years) >= 3 else ConfidenceLevel.MEDIUM
        score_breakdown = self.score_engine.compute_score(
            meta, inc, bs, cf, ratios, trends, val_status, recent_news
        )
        total_score = score_breakdown.total_score

        # Identify strengths & concerns
        strengths = []
        concerns = []

        # Revenue & profit
        if inc.revenue_cagr_3y and inc.revenue_cagr_3y >= 12.0:
            strengths.append(f"Strong 3-year revenue CAGR of {inc.revenue_cagr_3y}%")
        elif inc.revenue_cagr_3y and inc.revenue_cagr_3y < 0:
            concerns.append(f"Contracting revenue trajectory (3Y CAGR: {inc.revenue_cagr_3y}%)")

        # ROE
        if ratios.roe and ratios.roe >= 16.0:
            strengths.append(f"High Return on Equity (ROE: {ratios.roe}%) indicating robust capital efficiency")
        elif ratios.roe and ratios.roe < 8.0:
            concerns.append(f"Subdued capital productivity with ROE at {ratios.roe}%")

        # Solvency
        if not bs.is_financial_institution:
            if ratios.debt_to_equity is not None and ratios.debt_to_equity <= 0.2:
                strengths.append("Virtually debt-free balance sheet offering significant downturn resilience")
            elif ratios.debt_to_equity is not None and ratios.debt_to_equity >= 1.5:
                concerns.append(f"High leverage exposure with Debt-to-Equity at {ratios.debt_to_equity}x")

        # Cash Flow
        if cf.is_applicable:
            if cf.fcf_conversion and cf.fcf_conversion >= 65.0:
                strengths.append(f"Excellent cash generation with {cf.fcf_conversion}% of profits converting to Free Cash Flow")
            elif cf.cash_flow_quality_flag == "WEAK_NEGATIVE_FCF":
                concerns.append("Negative Free Cash Flow generation due to heavy CapEx or working capital lock-in")

        # Valuation
        if val_status == ValuationStatus.UNDERVALUED:
            strengths.append("Attractive valuation multiples compared to historical fundamentals")
        elif val_status == ValuationStatus.EXPENSIVE:
            concerns.append(f"Elevated valuation multiples (P/E: {ratios.pe_ratio}x) pricing in aggressive growth")

        # Decision Matrix
        if total_score >= 80 and val_status != ValuationStatus.EXPENSIVE and (ratios.debt_to_equity or 0) < 1.5:
            decision = DecisionRating.STRONG_BUY
        elif total_score >= 65:
            decision = DecisionRating.BUY
        elif total_score >= 46:
            decision = DecisionRating.HOLD_WATCH
        else:
            decision = DecisionRating.AVOID

        if not strengths:
            strengths.append("Established market presence with stable operations.")
        if not concerns:
            concerns.append("Monitor sector-level macro headwinds and competitive pressures.")

        return InvestmentDecisionResult(
            decision=decision,
            fundamental_score=total_score,
            score_breakdown=score_breakdown,
            data_confidence=confidence,
            valuation_status=val_status,
            key_strengths=strengths,
            key_concerns=concerns,
            is_bank=bs.is_financial_institution,
        )
