from typing import List, Optional
from app.models.fundamentals import (
    IncomeStatementData,
    BalanceSheetData,
    CashFlowData,
    KeyRatiosData,
    HistoricalTrendSignals,
)


class HistoricalFundamentalAnalyzer:
    """
    Analyzes multi-year financial statements to detect deterministic historical trends.
    Identifies growth patterns, margin dynamics, balance sheet health, and cash flow consistency.
    """

    def analyze_trends(
        self,
        income_stmt: IncomeStatementData,
        balance_sheet: BalanceSheetData,
        cash_flow: CashFlowData,
        ratios: KeyRatiosData,
    ) -> HistoricalTrendSignals:
        rev_trend = self._analyze_revenue_trend(income_stmt)
        profit_trend = self._analyze_profit_trend(income_stmt)
        margin_trend = self._analyze_margin_trend(income_stmt)
        roe_trend = self._analyze_roe_trend(ratios)
        debt_trend = self._analyze_debt_trend(balance_sheet, ratios)
        cf_trend = self._analyze_cash_flow_trend(cash_flow)

        return HistoricalTrendSignals(
            revenue_trend=rev_trend,
            profit_trend=profit_trend,
            margin_trend=margin_trend,
            roe_trend=roe_trend,
            debt_trend=debt_trend,
            cash_flow_trend=cf_trend,
        )

    def _analyze_revenue_trend(self, inc: IncomeStatementData) -> str:
        if inc.revenue_cagr_3y is not None:
            if inc.revenue_cagr_3y >= 15.0:
                return "STRONG_GROWTH"
            elif inc.revenue_cagr_3y >= 7.0:
                return "MODERATE_GROWTH"
            elif inc.revenue_cagr_3y >= 0.0:
                return "STAGNANT"
            else:
                return "DECLINING"

        # Fallback to year-over-year check
        vals = [v for v in inc.revenue.values() if v is not None]
        if len(vals) >= 2:
            if vals[-1] > vals[0]:
                return "MODERATE_GROWTH"
            elif vals[-1] < vals[0]:
                return "DECLINING"

        return "INSUFFICIENT_DATA"

    def _analyze_profit_trend(self, inc: IncomeStatementData) -> str:
        if inc.net_profit_cagr_3y is not None:
            if inc.net_profit_cagr_3y >= 15.0:
                return "EXPANDING"
            elif inc.net_profit_cagr_3y >= 5.0:
                return "STABLE_GROWTH"
            elif inc.net_profit_cagr_3y >= 0.0:
                return "STABLE"
            else:
                return "DETERIORATING"

        vals = [v for v in inc.net_income.values() if v is not None]
        if len(vals) >= 2:
            if vals[-1] > vals[0]:
                return "EXPANDING"
            elif vals[-1] < vals[0]:
                return "DETERIORATING"

        return "STABLE"

    def _analyze_margin_trend(self, inc: IncomeStatementData) -> str:
        margins = [v for v in inc.operating_margin.values() if v is not None]
        if len(margins) >= 2:
            delta = margins[-1] - margins[0]
            if delta >= 1.5:
                return "EXPANDING"
            elif delta <= -1.5:
                return "COMPRESSING"
            return "STABLE"
        return "STABLE"

    def _analyze_roe_trend(self, ratios: KeyRatiosData) -> str:
        if ratios.roe is None:
            return "UNKNOWN"
        if ratios.roe >= 18.0:
            return "CONSISTENT_HIGH"
        elif ratios.roe >= 12.0:
            return "HEALTHY"
        elif ratios.roe >= 7.0:
            return "AVERAGE"
        return "WEAK"

    def _analyze_debt_trend(self, bs: BalanceSheetData, ratios: KeyRatiosData) -> str:
        if bs.is_financial_institution:
            return "BANKING_LEVERAGE_MANAGED"

        de = ratios.debt_to_equity
        if de is None or de <= 0.1:
            return "DEBT_FREE_OR_NEGLIGIBLE"
        elif de <= 0.6:
            return "HEALTHY_LOW_LEVERAGE"
        elif de <= 1.3:
            return "MODERATE_LEVERAGE"
        else:
            return "HEAVILY_LEVERAGED"

    def _analyze_cash_flow_trend(self, cf: CashFlowData) -> str:
        if not cf.is_applicable:
            return "NOT_APPLICABLE_BANK"

        fcf_vals = [v for v in cf.free_cash_flow.values() if v is not None]
        if not fcf_vals:
            return "INSUFFICIENT_DATA"

        if all(v > 0 for v in fcf_vals):
            return "CONSISTENT_GENERATOR"
        elif fcf_vals[-1] > 0:
            return "MODERATE_GENERATOR"
        return "NEGATIVE_OR_ERRATIC"
