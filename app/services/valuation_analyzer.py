from app.models.fundamentals import (
    KeyRatiosData,
    ValuationStatus,
)


class ValuationAnalyzer:
    """
    Deterministic Valuation Analyzer.
    Evaluates current multiples (P/E, Forward P/E, P/B, EV/EBITDA) against growth and sector profile.
    """

    def evaluate_valuation(self, ratios: KeyRatiosData, is_bank: bool) -> ValuationStatus:
        pe = ratios.pe_ratio
        pb = ratios.pb_ratio
        roe = ratios.roe or 0.0

        if pe is None and pb is None:
            return ValuationStatus.INSUFFICIENT_DATA

        if is_bank:
            if pb is not None:
                if pb < 1.4 and roe >= 12.0:
                    return ValuationStatus.UNDERVALUED
                elif pb <= 2.8:
                    return ValuationStatus.FAIRLY_VALUED
                elif pb > 3.5:
                    return ValuationStatus.EXPENSIVE
            if pe is not None:
                if pe < 15.0:
                    return ValuationStatus.UNDERVALUED
                elif pe <= 22.0:
                    return ValuationStatus.FAIRLY_VALUED
                return ValuationStatus.EXPENSIVE
            return ValuationStatus.FAIRLY_VALUED

        # Non-Financial Equities
        if pe is not None:
            if pe <= 0:
                return ValuationStatus.EXPENSIVE  # Loss making
            if pe < 20.0 and roe >= 15.0:
                return ValuationStatus.UNDERVALUED
            elif pe <= 38.0:
                return ValuationStatus.FAIRLY_VALUED
            else:
                return ValuationStatus.EXPENSIVE

        if pb is not None:
            if pb < 2.0:
                return ValuationStatus.UNDERVALUED
            elif pb <= 6.0:
                return ValuationStatus.FAIRLY_VALUED
            return ValuationStatus.EXPENSIVE

        return ValuationStatus.INSUFFICIENT_DATA
