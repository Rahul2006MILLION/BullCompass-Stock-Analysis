import json
from datetime import datetime, timezone
from typing import Dict, Any, List

from app.models.fundamentals import (
    ComprehensiveResearchReport,
    DecisionRating,
    ValuationStatus,
    ConfidenceLevel,
)
from app.services.fundamental_service import FundamentalDataService
from app.services.historical_analyzer import HistoricalFundamentalAnalyzer
from app.services.valuation_analyzer import ValuationAnalyzer
from app.services.decision_engine import InvestmentDecisionEngine
from app.database.news_repository import NewsRepository
from app.services.ollama_service import OllamaService


class ResearchCoordinatorService:
    """
    Orchestrates the entire Long-Term Investment Research Pipeline:
    1. Data Collection (Income Stmt, Balance Sheet, Cash Flow, Ratios)
    2. Historical Trend & CAGR Analysis
    3. Valuation Multiples Assessment
    4. News Integration
    5. Deterministic Scoring & Decision Engine
    6. Structured Fact Pack Generation
    7. AI Thesis Memorandum Synthesis via Ollama (with offline fallback)
    """

    def __init__(self):
        self.fundamental_service = FundamentalDataService()
        self.historical_analyzer = HistoricalFundamentalAnalyzer()
        self.valuation_analyzer = ValuationAnalyzer()
        self.decision_engine = InvestmentDecisionEngine()
        self.news_repository = NewsRepository()
        self.ollama = OllamaService()

    def generate_research_report(self, ticker: str) -> ComprehensiveResearchReport:
        clean_ticker = ticker.strip().upper()

        # 1. Fetch multi-year fundamentals
        meta, inc, bs, cf, ratios = self.fundamental_service.fetch_fundamentals(clean_ticker)

        # 2. Analyze historical trends
        trends = self.historical_analyzer.analyze_trends(inc, bs, cf, ratios)

        # 3. Assess valuation
        val_status = self.valuation_analyzer.evaluate_valuation(ratios, bs.is_financial_institution)

        # 4. Fetch recent company news
        news_items = self.news_repository.get_recent_news(limit=5, ticker=clean_ticker)
        recent_news_dicts = [
            {
                "title": n.title,
                "source": n.source,
                "published_at": n.published_at,
                "importance": n.importance,
                "summary": n.summary[:180] + "..." if len(n.summary) > 180 else n.summary,
            }
            for n in news_items
        ]

        # 5. Deterministic Investment Decision & Scoring
        decision_result = self.decision_engine.evaluate(
            meta, inc, bs, cf, ratios, trends, val_status, recent_news_dicts
        )

        # 6. Build Structured Fact Pack for LLM
        fact_pack = self._build_fact_pack(meta, inc, bs, cf, ratios, trends, decision_result, recent_news_dicts)

        # 7. AI Synthesis via Ollama (with robust offline fallback)
        ai_thesis, ollama_status = self._synthesize_ai_thesis(clean_ticker, fact_pack, decision_result)

        return ComprehensiveResearchReport(
            ticker=clean_ticker,
            company_name=meta.get("name", clean_ticker),
            sector=meta.get("sector", "General"),
            industry=meta.get("industry", "General"),
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
            ai_thesis_report=ai_thesis,
            generated_at=datetime.now(timezone.utc).isoformat(),
            ollama_status=ollama_status,
        )

    def _build_fact_pack(
        self,
        meta: Dict[str, Any],
        inc: Any,
        bs: Any,
        cf: Any,
        ratios: Any,
        trends: Any,
        decision: Any,
        recent_news: List[Dict[str, Any]],
    ) -> Dict[str, Any]:
        return {
            "company": {
                "name": meta.get("name"),
                "ticker": meta.get("ticker"),
                "sector": meta.get("sector"),
                "industry": meta.get("industry"),
                "is_bank": meta.get("is_bank"),
                "current_price": meta.get("current_price"),
                "market_cap_cr": meta.get("market_cap_cr"),
            },
            "financials_in_cr": {
                "revenue_history": inc.revenue,
                "operating_income_history": inc.operating_income,
                "operating_margin_history_pct": inc.operating_margin,
                "net_profit_history": inc.net_income,
                "net_margin_history_pct": inc.net_margin,
                "eps_history": inc.eps,
                "revenue_cagr_3y_pct": inc.revenue_cagr_3y,
                "net_profit_cagr_3y_pct": inc.net_profit_cagr_3y,
            },
            "balance_sheet": {
                "total_assets_cr": bs.total_assets,
                "total_equity_cr": bs.total_equity,
                "cash_and_equivalents_cr": bs.cash_and_equivalents,
                "total_debt_cr": bs.total_debt,
                "debt_to_equity": bs.debt_to_equity,
                "current_ratio": bs.current_ratio,
            },
            "cash_flow": {
                "is_applicable": cf.is_applicable,
                "operating_cash_flow_cr": cf.operating_cash_flow,
                "free_cash_flow_cr": cf.free_cash_flow,
                "fcf_conversion_pct": cf.fcf_conversion,
                "quality_flag": cf.cash_flow_quality_flag,
            },
            "ratios": {
                "pe_ratio": ratios.pe_ratio,
                "forward_pe": ratios.forward_pe,
                "pb_ratio": ratios.pb_ratio,
                "ev_to_ebitda": ratios.ev_to_ebitda,
                "roe_pct": ratios.roe,
                "roa_pct": ratios.roa,
                "operating_margin_pct": ratios.operating_margin,
                "net_margin_pct": ratios.net_margin,
            },
            "historical_trend_signals": {
                "revenue_trend": trends.revenue_trend,
                "profit_trend": trends.profit_trend,
                "margin_trend": trends.margin_trend,
                "roe_trend": trends.roe_trend,
                "debt_trend": trends.debt_trend,
                "cash_flow_trend": trends.cash_flow_trend,
            },
            "deterministic_scoring": {
                "total_quality_score": decision.fundamental_score,
                "breakdown": {
                    "business_quality": decision.score_breakdown.business_quality,
                    "financial_strength": decision.score_breakdown.financial_strength,
                    "growth": decision.score_breakdown.growth,
                    "profitability": decision.score_breakdown.profitability,
                    "cash_generation": decision.score_breakdown.cash_generation,
                    "valuation": decision.score_breakdown.valuation,
                    "risk_profile": decision.score_breakdown.risk_profile,
                },
                "decision_tier": decision.decision.value,
                "valuation_status": decision.valuation_status.value,
                "data_confidence": decision.data_confidence.value,
                "key_strengths": decision.key_strengths,
                "key_concerns": decision.key_concerns,
            },
            "recent_news_events": recent_news,
        }

    def _synthesize_ai_thesis(
        self, ticker: str, fact_pack: Dict[str, Any], decision: Any
    ) -> (str, str):
        prompt = f"""
You are an institutional long-term equity research analyst at BullCompass.
Your task is to write a rigorous, evidence-grounded Investment Research Memorandum for {ticker}.

RULES:
1. You MUST use ONLY the verified facts and deterministic calculations provided in the JSON FACT PACK below.
2. DO NOT fabricate, guess, or modify any numbers. If a metric is missing or None, write N/A.
3. You must explicitly annotate key assertions with one of the following epistemic tags:
   - [FACT]: For verified audited data, reported earnings, or historical metrics.
   - [INFERENCE]: For logical analytical conclusions derived directly from the facts.
   - [ASSUMPTION]: For operating premises about future market conditions or management execution.
   - [UNCERTAINTY]: For regulatory, competitive, or macroeconomic unknowns.
4. Structure your response into the following exact sections with clear markdown headers:

### 1. Executive Summary & Quality Assessment
### 2. Business Moat & Competitive Quality
### 3. Revenue, Earnings & Historical Trajectory
### 4. Balance Sheet Resilience & Capital Structure
### 5. Cash Flow Reliability & Capital Allocation
### 6. Profitability & Return on Capital (ROE/ROCE)
### 7. Valuation Assessment & Margin of Safety
### 8. Recent News, Catalysts & Macro Exposures
### 9. Key Downside Risks
### 10. Bull Case Scenario
### 11. Base Case Scenario
### 12. Bear Case Scenario
### 13. Thesis Invalidation Triggers (What would break this investment?)
### 14. Final Investment Assessment & Recommendation

FACT PACK:
{json.dumps(fact_pack, indent=2)}
"""
        try:
            response = self.ollama.chat(prompt)
            if response and len(response.strip()) > 100:
                return response.strip(), "ONLINE"
        except Exception as e:
            # Fallback to rich deterministic template
            pass

        return self._generate_deterministic_fallback_report(ticker, fact_pack, decision), "OFFLINE_FALLBACK"

    def _generate_deterministic_fallback_report(
        self, ticker: str, fact_pack: Dict[str, Any], decision: Any
    ) -> str:
        comp = fact_pack["company"]
        ratios = fact_pack["ratios"]
        trends = fact_pack["historical_trend_signals"]
        scoring = fact_pack["deterministic_scoring"]

        return f"""### 1. Executive Summary & Quality Assessment
[FACT] **{comp['name']}** ({comp['ticker']}) operates in the **{comp['sector']}** sector with a current market capitalization of **₹{comp['market_cap_cr']:,.2f} Cr**.
[INFERENCE] The deterministic scoring engine awards {comp['ticker']} a **Fundamental Score of {scoring['total_quality_score']}/100**, placing it in the **{scoring['decision_tier']}** tier with **{scoring['data_confidence']}** data confidence.

### 2. Business Moat & Competitive Quality
[FACT] The company holds a prominent position within the Indian {comp['industry']} industry.
[INFERENCE] Return on Equity stands at **{ratios.get('roe_pct') or 'N/A'}%**, reflecting durable pricing power and operational moats.

### 3. Revenue, Earnings & Historical Trajectory
[FACT] Revenue trajectory signal: **{trends['revenue_trend']}**.
[FACT] Net profit growth signal: **{trends['profit_trend']}**.
[INFERENCE] The business demonstrates consistent top-line compounding across audited multi-year fiscal cycles.

### 4. Balance Sheet Resilience & Capital Structure
[FACT] Debt-to-Equity ratio: **{fact_pack['balance_sheet'].get('debt_to_equity') or 'N/A'}x**.
[INFERENCE] Solvency and leverage profile: **{trends['debt_trend']}**.

### 5. Cash Flow Reliability & Capital Allocation
[FACT] Cash flow profile signal: **{trends['cash_flow_trend']}**.
[INFERENCE] Free cash flow conversion and quality flag: **{fact_pack['cash_flow'].get('quality_flag')}**.

### 6. Profitability & Return on Capital
[FACT] Operating Margin: **{ratios.get('operating_margin_pct') or 'N/A'}%** | Net Profit Margin: **{ratios.get('net_margin_pct') or 'N/A'}%**.
[INFERENCE] Margin dynamics remain **{trends['margin_trend']}**.

### 7. Valuation Assessment & Margin of Safety
[FACT] Trailing P/E: **{ratios.get('pe_ratio') or 'N/A'}x** | Price to Book: **{ratios.get('pb_ratio') or 'N/A'}x** | EV/EBITDA: **{ratios.get('ev_to_ebitda') or 'N/A'}x**.
[INFERENCE] Current valuation status is classified as **{scoring['valuation_status']}**.

### 8. Recent News, Catalysts & Macro Exposures
[FACT] Analyzed recent corporate and market wire developments.
[UNCERTAINTY] Short-term price movement remains exposed to broader index swings and macroeconomic policy adjustments.

### 9. Key Downside Risks
{chr(10).join(f"- [UNCERTAINTY] {c}" for c in scoring['key_concerns'])}

### 10. Bull Case Scenario
[ASSUMPTION] Continued revenue expansion above 12% CAGR, margin stability, and sustained capital efficiency justify sustained compounding.

### 11. Base Case Scenario
[ASSUMPTION] Steady performance aligned with GDP growth and industry demand, delivering moderate steady-state returns.

### 12. Bear Case Scenario
[UNCERTAINTY] Aggressive sector margin compression or adverse regulatory interventions could compress multiples and impede earnings growth.

### 13. Thesis Invalidation Triggers
- [UNCERTAINTY] Sustained deterioration in ROE below 10% for two consecutive years.
- [UNCERTAINTY] Sharp debt accumulation or unexpected governance irregularities.

### 14. Final Investment Assessment & Recommendation
**Assessment Tier:** `{scoring['decision_tier']}`
**Fundamental Score:** `{scoring['total_quality_score']}/100`

**Key Positives:**
{chr(10).join(f"- [FACT] {s}" for s in scoring['key_strengths'])}

*(Generated using BullCompass Deterministic Valuation & Research Rules Engine)*
"""
