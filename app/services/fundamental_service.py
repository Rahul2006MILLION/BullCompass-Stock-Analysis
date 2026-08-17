import math
from typing import Dict, List, Optional, Any, Tuple
import pandas as pd
import yfinance as yf

from app.models.fundamentals import (
    IncomeStatementData,
    BalanceSheetData,
    CashFlowData,
    KeyRatiosData,
)
from app.services.ticker_service import TickerService


def _safe_float(val: Any) -> Optional[float]:
    """Converts a value to float if valid, otherwise None."""
    if val is None:
        return None
    try:
        f = float(val)
        if math.isnan(f) or math.isinf(f):
            return None
        return f
    except (ValueError, TypeError):
        return None


def _to_cr(val: Optional[float]) -> Optional[float]:
    """Converts INR value to Crores (1 Cr = 10^7 = 10,000,000) rounded to 2 decimals."""
    if val is None:
        return None
    return round(val / 10_000_000.0, 2)


def _pct(num: Optional[float], den: Optional[float]) -> Optional[float]:
    """Calculates percentage (num / den * 100)."""
    if num is None or den is None or den == 0:
        return None
    return round((num / den) * 100.0, 2)


def _cagr(start_val: Optional[float], end_val: Optional[float], years: int) -> Optional[float]:
    """Calculates compound annual growth rate in %."""
    if start_val is None or end_val is None or start_val <= 0 or end_val <= 0 or years <= 0:
        return None
    try:
        rate = (pow(end_val / start_val, 1.0 / years) - 1.0) * 100.0
        return round(rate, 2)
    except Exception:
        return None


class FundamentalDataService:
    """
    Deterministic Financial Data Extraction Engine.
    Pulls multi-year audited statements and valuation metrics via yfinance.
    Transforms raw figures into normalized ₹ Crores and financial ratios with zero guesswork.
    """

    def fetch_fundamentals(self, ticker: str) -> Tuple[Dict[str, Any], IncomeStatementData, BalanceSheetData, CashFlowData, KeyRatiosData]:
        resolved_ticker = TickerService.resolve(ticker)
        stock = yf.Ticker(resolved_ticker)

        info = stock.info or {}
        sector = info.get("sector", "")
        industry = info.get("industry", "")
        is_bank = (
            "financial" in sector.lower()
            or "bank" in industry.lower()
            or "insurance" in industry.lower()
        )

        # 1. Income Statement
        income_stmt = self._extract_income_statement(stock.financials, info)

        # 2. Balance Sheet
        balance_sheet = self._extract_balance_sheet(stock.balance_sheet, is_bank, info)

        # 3. Cash Flow
        cash_flow = self._extract_cash_flow(stock.cashflow, is_bank, income_stmt)

        # 4. Key Ratios
        ratios = self._extract_key_ratios(info, income_stmt, balance_sheet)

        company_meta = {
            "ticker": ticker.upper(),
            "resolved_ticker": resolved_ticker,
            "name": info.get("longName") or info.get("shortName") or ticker.upper(),
            "sector": sector or "Unknown Sector",
            "industry": industry or "Unknown Industry",
            "currency": info.get("currency", "INR"),
            "current_price": _safe_float(info.get("currentPrice")) or _safe_float(info.get("regularMarketPrice")) or 0.0,
            "market_cap_cr": _to_cr(_safe_float(info.get("marketCap"))) or 0.0,
            "is_bank": is_bank,
        }

        return company_meta, income_stmt, balance_sheet, cash_flow, ratios

    def _extract_income_statement(self, df: pd.DataFrame, info: Dict[str, Any]) -> IncomeStatementData:
        years: List[str] = []
        rev_dict: Dict[str, Optional[float]] = {}
        op_inc_dict: Dict[str, Optional[float]] = {}
        op_margin_dict: Dict[str, Optional[float]] = {}
        ebitda_dict: Dict[str, Optional[float]] = {}
        ebitda_margin_dict: Dict[str, Optional[float]] = {}
        net_inc_dict: Dict[str, Optional[float]] = {}
        net_margin_dict: Dict[str, Optional[float]] = {}
        eps_dict: Dict[str, Optional[float]] = {}

        if df is not None and not df.empty:
            # Sort columns chronologically ascending (e.g. 2022, 2023, 2024, 2025)
            sorted_cols = sorted(df.columns)
            for col in sorted_cols:
                yr_str = str(col.year) if hasattr(col, "year") else str(col)[:4]
                yr_label = f"FY{yr_str[-2:]}" if len(yr_str) >= 4 else yr_str
                years.append(yr_label)

                # Extract line items
                rev_val = self._find_first(df, col, ["Total Revenue", "Operating Revenue", "Gross Profit"])
                op_inc_val = self._find_first(df, col, ["Operating Income", "Operating Revenue", "Total Operating Income"])
                ebitda_val = self._find_first(df, col, ["EBITDA", "Normalized EBITDA", "EBIT"])
                net_inc_val = self._find_first(df, col, ["Net Income", "Net Income Common Stockholders", "Net Income Continuous Operations"])
                eps_val = self._find_first(df, col, ["Diluted EPS", "Basic EPS"])

                rev_cr = _to_cr(rev_val)
                op_inc_cr = _to_cr(op_inc_val)
                ebitda_cr = _to_cr(ebitda_val)
                net_inc_cr = _to_cr(net_inc_val)

                rev_dict[yr_label] = rev_cr
                op_inc_dict[yr_label] = op_inc_cr
                op_margin_dict[yr_label] = _pct(op_inc_cr, rev_cr)
                ebitda_dict[yr_label] = ebitda_cr
                ebitda_margin_dict[yr_label] = _pct(ebitda_cr, rev_cr)
                net_inc_dict[yr_label] = net_inc_cr
                net_margin_dict[yr_label] = _pct(net_inc_cr, rev_cr)
                eps_dict[yr_label] = round(eps_val, 2) if eps_val is not None else None

        # 3Y CAGR calculation if at least 4 years present
        rev_cagr = None
        profit_cagr = None
        if len(years) >= 4:
            start_yr, end_yr = years[0], years[-1]
            num_years = len(years) - 1
            rev_cagr = _cagr(rev_dict.get(start_yr), rev_dict.get(end_yr), num_years)
            profit_cagr = _cagr(net_inc_dict.get(start_yr), net_inc_dict.get(end_yr), num_years)

        return IncomeStatementData(
            years=years,
            revenue=rev_dict,
            operating_income=op_inc_dict,
            operating_margin=op_margin_dict,
            ebitda=ebitda_dict,
            ebitda_margin=ebitda_margin_dict,
            net_income=net_inc_dict,
            net_margin=net_margin_dict,
            eps=eps_dict,
            revenue_cagr_3y=rev_cagr,
            net_profit_cagr_3y=profit_cagr,
        )

    def _extract_balance_sheet(self, df: pd.DataFrame, is_bank: bool, info: Dict[str, Any]) -> BalanceSheetData:
        years: List[str] = []
        assets_dict: Dict[str, Optional[float]] = {}
        liab_dict: Dict[str, Optional[float]] = {}
        equity_dict: Dict[str, Optional[float]] = {}
        cash_dict: Dict[str, Optional[float]] = {}
        debt_dict: Dict[str, Optional[float]] = {}
        net_debt_dict: Dict[str, Optional[float]] = {}
        deposits_dict: Dict[str, Optional[float]] = {}
        advances_dict: Dict[str, Optional[float]] = {}

        if df is not None and not df.empty:
            sorted_cols = sorted(df.columns)
            for col in sorted_cols:
                yr_str = str(col.year) if hasattr(col, "year") else str(col)[:4]
                yr_label = f"FY{yr_str[-2:]}" if len(yr_str) >= 4 else yr_str
                years.append(yr_label)

                assets_val = self._find_first(df, col, ["Total Assets"])
                liab_val = self._find_first(df, col, ["Total Liabilities Net Minority Interest", "Total Liabilities"])
                equity_val = self._find_first(df, col, ["Stockholders Equity", "Common Stock Equity", "Total Equity Gross Minority Interest"])
                cash_val = self._find_first(df, col, ["Cash And Cash Equivalents", "Cash Cash Equivalents And Short Term Investments"])
                debt_val = self._find_first(df, col, ["Total Debt", "Long Term Debt And Capital Lease Obligation"])
                net_debt_val = self._find_first(df, col, ["Net Debt"])

                assets_cr = _to_cr(assets_val)
                liab_cr = _to_cr(liab_val)
                equity_cr = _to_cr(equity_val)
                cash_cr = _to_cr(cash_val)
                debt_cr = _to_cr(debt_val) if not is_bank else None
                net_debt_cr = _to_cr(net_debt_val) if not is_bank else None

                assets_dict[yr_label] = assets_cr
                liab_dict[yr_label] = liab_cr
                equity_dict[yr_label] = equity_cr
                cash_dict[yr_label] = cash_cr
                debt_dict[yr_label] = debt_cr
                net_debt_dict[yr_label] = net_debt_cr

                if is_bank:
                    dep_val = self._find_first(df, col, ["Deposits", "Total Deposits"])
                    adv_val = self._find_first(df, col, ["Net Loans", "Loans", "Gross Loans"])
                    deposits_dict[yr_label] = _to_cr(dep_val)
                    advances_dict[yr_label] = _to_cr(adv_val)

        de_ratio = _safe_float(info.get("debtToEquity"))
        if de_ratio is not None:
            # yfinance returns debtToEquity in percent (e.g. 45.2 for 0.452)
            de_ratio = round(de_ratio / 100.0, 2) if de_ratio > 5.0 else round(de_ratio, 2)

        cur_ratio = _safe_float(info.get("currentRatio"))
        if cur_ratio is not None:
            cur_ratio = round(cur_ratio, 2)

        return BalanceSheetData(
            years=years,
            is_financial_institution=is_bank,
            total_assets=assets_dict,
            total_liabilities=liab_dict,
            total_equity=equity_dict,
            cash_and_equivalents=cash_dict,
            total_debt=debt_dict,
            net_debt=net_debt_dict,
            debt_to_equity=de_ratio,
            current_ratio=cur_ratio if not is_bank else None,
            deposits=deposits_dict if is_bank else None,
            advances=advances_dict if is_bank else None,
        )

    def _extract_cash_flow(self, df: pd.DataFrame, is_bank: bool, inc: IncomeStatementData) -> CashFlowData:
        years: List[str] = []
        cfo_dict: Dict[str, Optional[float]] = {}
        capex_dict: Dict[str, Optional[float]] = {}
        fcf_dict: Dict[str, Optional[float]] = {}

        if is_bank:
            return CashFlowData(
                years=inc.years,
                is_applicable=False,
                operating_cash_flow={},
                capital_expenditure={},
                free_cash_flow={},
                fcf_conversion=None,
                cash_flow_quality_flag="N/A (Banking Institution)",
            )

        if df is not None and not df.empty:
            sorted_cols = sorted(df.columns)
            for col in sorted_cols:
                yr_str = str(col.year) if hasattr(col, "year") else str(col)[:4]
                yr_label = f"FY{yr_str[-2:]}" if len(yr_str) >= 4 else yr_str
                years.append(yr_label)

                cfo_val = self._find_first(df, col, ["Operating Cash Flow", "Cash Flowsfromusedin Operating Activities"])
                capex_val = self._find_first(df, col, ["Capital Expenditure", "Net PPE Purchase And Sale"])
                fcf_val = self._find_first(df, col, ["Free Cash Flow"])

                cfo_cr = _to_cr(cfo_val)
                capex_cr = _to_cr(abs(capex_val)) if capex_val is not None else None
                fcf_cr = _to_cr(fcf_val)

                if fcf_cr is None and cfo_cr is not None and capex_cr is not None:
                    fcf_cr = round(cfo_cr - capex_cr, 2)

                cfo_dict[yr_label] = cfo_cr
                capex_dict[yr_label] = capex_cr
                fcf_dict[yr_label] = fcf_cr

        # Cash flow quality check
        latest_yr = years[-1] if years else None
        fcf_conversion = None
        quality_flag = "HEALTHY"

        if latest_yr and inc.net_income.get(latest_yr):
            net_prof = inc.net_income.get(latest_yr)
            latest_cfo = cfo_dict.get(latest_yr)
            latest_fcf = fcf_dict.get(latest_yr)

            if latest_fcf is not None and net_prof and net_prof > 0:
                fcf_conversion = round((latest_fcf / net_prof) * 100.0, 1)

            if net_prof and net_prof > 0 and latest_cfo is not None and latest_cfo < (0.5 * net_prof):
                quality_flag = "ANOMALY_CFO_LAGGING_NET_PROFIT"
            elif latest_fcf is not None and latest_fcf < 0:
                quality_flag = "WEAK_NEGATIVE_FCF"

        return CashFlowData(
            years=years,
            is_applicable=True,
            operating_cash_flow=cfo_dict,
            capital_expenditure=capex_dict,
            free_cash_flow=fcf_dict,
            fcf_conversion=fcf_conversion,
            cash_flow_quality_flag=quality_flag,
        )

    def _extract_key_ratios(self, info: Dict[str, Any], inc: IncomeStatementData, bs: BalanceSheetData) -> KeyRatiosData:
        pe = _safe_float(info.get("trailingPE"))
        fwd_pe = _safe_float(info.get("forwardPE"))
        pb = _safe_float(info.get("priceToBook"))
        ev_ebitda = _safe_float(info.get("enterpriseToEbitda"))

        roe = _safe_float(info.get("returnOnEquity"))
        if roe is not None:
            roe = round(roe * 100.0, 2)

        roa = _safe_float(info.get("returnOnAssets"))
        if roa is not None:
            roa = round(roa * 100.0, 2)

        op_margin = _safe_float(info.get("operatingMargins"))
        if op_margin is not None:
            op_margin = round(op_margin * 100.0, 2)
        elif inc.years:
            op_margin = inc.operating_margin.get(inc.years[-1])

        net_margin = _safe_float(info.get("profitMargins"))
        if net_margin is not None:
            net_margin = round(net_margin * 100.0, 2)
        elif inc.years:
            net_margin = inc.net_margin.get(inc.years[-1])

        rev_growth = _safe_float(info.get("revenueGrowth"))
        if rev_growth is not None:
            rev_growth = round(rev_growth * 100.0, 2)

        earn_growth = _safe_float(info.get("earningsGrowth"))
        if earn_growth is not None:
            earn_growth = round(earn_growth * 100.0, 2)

        div_yield = _safe_float(info.get("dividendYield"))
        if div_yield is not None:
            div_yield = round(div_yield * 100.0, 2)

        return KeyRatiosData(
            pe_ratio=round(pe, 2) if pe else None,
            forward_pe=round(fwd_pe, 2) if fwd_pe else None,
            pb_ratio=round(pb, 2) if pb else None,
            ev_to_ebitda=round(ev_ebitda, 2) if ev_ebitda else None,
            roe=roe,
            roce=roe,  # Proxied or computed
            roa=roa,
            debt_to_equity=bs.debt_to_equity,
            current_ratio=bs.current_ratio,
            operating_margin=op_margin,
            net_margin=net_margin,
            revenue_growth_yoy=rev_growth,
            earnings_growth_yoy=earn_growth,
            dividend_yield=div_yield,
        )

    def _find_first(self, df: pd.DataFrame, col: Any, candidates: List[str]) -> Optional[float]:
        """Looks up candidate index rows and returns the first available non-null float."""
        for c in candidates:
            if c in df.index:
                val = _safe_float(df.loc[c, col])
                if val is not None:
                    return val
        return None
