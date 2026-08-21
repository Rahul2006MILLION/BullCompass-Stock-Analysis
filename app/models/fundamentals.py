from dataclasses import dataclass, field
from typing import Dict, List, Optional, Any
from enum import Enum


class DecisionRating(str, Enum):
    STRONG_BUY = "STRONG BUY"
    BUY = "BUY"
    ACCUMULATE = "ACCUMULATE"
    HOLD = "HOLD"
    WATCH = "WATCH"
    REDUCE = "REDUCE"
    SELL = "SELL"
    AVOID = "AVOID"
    INSUFFICIENT_DATA = "INSUFFICIENT DATA"


class ValuationStatus(str, Enum):
    UNDERVALUED = "UNDERVALUED"
    FAIRLY_VALUED = "FAIRLY VALUED"
    EXPENSIVE = "EXPENSIVE"
    EXTREMELY_OVERVALUED = "EXTREMELY OVERVALUED"
    INSUFFICIENT_DATA = "INSUFFICIENT DATA"


class ConfidenceLevel(str, Enum):
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"


class MarginOfSafety(str, Enum):
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"


class RiskSeverity(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


@dataclass
class MultiYearMetric:
    name: str
    values: Dict[str, Optional[float]] = field(default_factory=dict)  # e.g. {"FY23": 100.0, "FY24": 120.0, ...}
    unit: str = "₹ Cr"
    growth_yoy: Optional[float] = None


@dataclass
class IncomeStatementData:
    years: List[str]
    revenue: Dict[str, Optional[float]]
    operating_income: Dict[str, Optional[float]]
    operating_margin: Dict[str, Optional[float]]  # In %
    ebitda: Dict[str, Optional[float]]
    ebitda_margin: Dict[str, Optional[float]]  # In %
    net_income: Dict[str, Optional[float]]
    net_margin: Dict[str, Optional[float]]  # In %
    eps: Dict[str, Optional[float]]
    revenue_cagr_3y: Optional[float] = None
    net_profit_cagr_3y: Optional[float] = None


@dataclass
class BalanceSheetData:
    years: List[str]
    is_financial_institution: bool
    total_assets: Dict[str, Optional[float]]
    total_liabilities: Dict[str, Optional[float]]
    total_equity: Dict[str, Optional[float]]
    cash_and_equivalents: Dict[str, Optional[float]]
    total_debt: Dict[str, Optional[float]]
    net_debt: Dict[str, Optional[float]]
    debt_to_equity: Optional[float] = None
    current_ratio: Optional[float] = None
    # Banking specific
    deposits: Optional[Dict[str, Optional[float]]] = None
    advances: Optional[Dict[str, Optional[float]]] = None


@dataclass
class CashFlowData:
    years: List[str]
    is_applicable: bool  # False for banks
    operating_cash_flow: Dict[str, Optional[float]]
    capital_expenditure: Dict[str, Optional[float]]
    free_cash_flow: Dict[str, Optional[float]]
    fcf_conversion: Optional[float] = None  # FCF / Net Profit (%)
    cash_flow_quality_flag: str = "NORMAL"  # 'HEALTHY', 'ANOMALY_CFO_LAGGING', 'WEAK_FCF', 'N/A'


@dataclass
class KeyRatiosData:
    pe_ratio: Optional[float]
    forward_pe: Optional[float]
    pb_ratio: Optional[float]
    ev_to_ebitda: Optional[float]
    roe: Optional[float]  # In %
    roce: Optional[float]  # In %
    roa: Optional[float]  # In %
    debt_to_equity: Optional[float]
    current_ratio: Optional[float] = None
    operating_margin: Optional[float] = None  # In %
    net_margin: Optional[float] = None  # In %
    revenue_growth_yoy: Optional[float] = None  # In %
    earnings_growth_yoy: Optional[float] = None  # In %
    dividend_yield: Optional[float] = None  # In %


@dataclass
class HistoricalTrendSignals:
    revenue_trend: str  # 'STRONG_GROWTH', 'MODERATE_GROWTH', 'STAGNANT', 'DECLINING'
    profit_trend: str  # 'EXPANDING', 'STABLE', 'COMPRESSING', 'DETERIORATING'
    margin_trend: str  # 'EXPANDING', 'STABLE', 'COMPRESSING'
    roe_trend: str  # 'CONSISTENT_HIGH', 'IMPROVING', 'AVERAGE', 'WEAK'
    debt_trend: str  # 'DEBT_FREE_OR_NEGLIGIBLE', 'DELEVERAGING', 'INCREASING', 'HEAVILY_LEVERAGED'
    cash_flow_trend: str  # 'CONSISTENT_GENERATOR', 'ERRATIC', 'NEGATIVE', 'NOT_APPLICABLE'


@dataclass
class QualityScoreBreakdown:
    business_quality: float  # out of 10
    financial_strength: float  # out of 15
    growth: float  # out of 15
    profitability: float  # out of 15
    cash_generation: float  # out of 15
    valuation: float  # out of 15
    risk_profile: float  # out of 15
    total_score: float  # out of 100


@dataclass
class InvestmentDecisionResult:
    decision: DecisionRating
    fundamental_score: float  # 0 to 100
    score_breakdown: QualityScoreBreakdown
    data_confidence: ConfidenceLevel
    valuation_status: ValuationStatus
    key_strengths: List[str]
    key_concerns: List[str]
    is_bank: bool


# =====================================================================
# STRUCTURED INSTITUTIONAL RESEARCH SUB-MODELS
# =====================================================================

@dataclass
class PriceMomentumContext:
    current_price: float
    price_change_1d: Optional[float] = 0.0
    price_change_5d: Optional[float] = 0.0
    price_change_20d: Optional[float] = 0.0
    fifty_two_week_high: Optional[float] = None
    fifty_two_week_low: Optional[float] = None
    distance_from_52w_high_pct: Optional[float] = None
    technical_stance: str = "NEUTRAL"  # 'OVERHEATED', 'PULLBACK_ENTRY', 'MOMENTUM_EXPANDING', 'NEUTRAL', 'HEAVY_SELLING'
    interpretation: str = ""


@dataclass
class BusinessQualityAssessment:
    score: float = 7.0  # 0 - 10
    revenue_consistency: str = "GOOD"  # 'EXCELLENT', 'GOOD', 'ERRATIC', 'POOR'
    margin_stability: str = "STABLE"  # 'STABLE_EXPANDING', 'STABLE', 'VOLATILE', 'COMPRESSING'
    capital_intensity: str = "MODERATE"  # 'LOW_ASSET_LIGHT', 'MODERATE', 'HIGH_CAPEX_HEAVY'
    cyclicality: str = "MODERATELY_CYCLICAL"  # 'NON_CYCLICAL_DEFENSIVE', 'MODERATELY_CYCLICAL', 'HIGHLY_CYCLICAL'
    moat_rating: str = "NARROW_MOAT"  # 'WIDE_MOAT', 'NARROW_MOAT', 'NO_MOAT'
    summary: str = ""


@dataclass
class FinancialHealthAssessment:
    solvency_score: float = 80.0  # 0 - 100
    total_debt_cr: Optional[float] = 0.0
    cash_and_equivalents_cr: Optional[float] = 0.0
    net_debt_cr: Optional[float] = 0.0
    debt_to_equity: Optional[float] = None
    current_ratio: Optional[float] = None
    interest_coverage: Optional[float] = None
    balance_sheet_stance: str = "HEALTHY"  # 'FORTRESS_CASH_RICH', 'HEALTHY_DELEVERAGED', 'MODERATE_LEVERAGE', 'HIGH_RISK_OVERLEVERAGED'
    summary: str = ""


@dataclass
class EarningsQualityAssessment:
    quality_status: str = "HIGH_QUALITY_CONVERTING"  # 'HIGH_QUALITY_CONVERTING', 'MODERATE', 'EARNINGS_QUALITY_WARNING', 'CRITICAL_CASH_DIVERGENCE'
    cfo_to_pat_ratio: Optional[float] = None
    fcf_conversion_pct: Optional[float] = None
    pat_vs_cfo_trend: str = "PAT and CFO moving in tandem"
    margin_vs_revenue_trajectory: str = "Revenue growing with healthy margins"
    warning_flags: List[str] = field(default_factory=list)
    summary: str = ""


@dataclass
class ValuationAssessment:
    valuation_tier: ValuationStatus = ValuationStatus.FAIRLY_VALUED
    pe_ratio: Optional[float] = None
    forward_pe: Optional[float] = None
    pb_ratio: Optional[float] = None
    ev_to_ebitda: Optional[float] = None
    peg_ratio: Optional[float] = None
    dividend_yield: Optional[float] = None
    valuation_rationale: str = ""  # Explains relationship between Valuation + Growth + Profitability + Quality


@dataclass
class NewsCausalItem:
    headline: str
    source: str
    published_at: str
    importance: str
    event_summary: str
    economic_transmission_mechanism: str
    revenue_margin_impact: str
    catalyst_durability: str  # 'STRUCTURAL' vs 'TEMPORARY'


@dataclass
class SectorMacroContext:
    key_drivers: List[str] = field(default_factory=list)
    macro_sensitivity: str = ""
    tailwinds: List[str] = field(default_factory=list)
    headwinds: List[str] = field(default_factory=list)
    summary: str = ""


@dataclass
class ScenarioCase:
    scenario_title: str
    probability_pct: int
    assumptions: List[str]
    growth_margin_projection: str
    expected_return_stance: str
    summary: str


@dataclass
class ScenarioAnalysis:
    bull_case: ScenarioCase
    base_case: ScenarioCase
    bear_case: ScenarioCase


@dataclass
class RiskItem:
    category: str  # 'BUSINESS', 'FINANCIAL', 'VALUATION', 'MACRO', 'REGULATORY', 'EVENT'
    title: str
    severity: RiskSeverity  # LOW, MEDIUM, HIGH, CRITICAL
    rationale: str


@dataclass
class RiskAnalysisMatrix:
    risks: List[RiskItem] = field(default_factory=list)
    primary_vulnerability: str = ""


@dataclass
class ThesisInvalidationTriggers:
    triggers: List[str] = field(default_factory=list)
    quantifiable_thresholds: List[str] = field(default_factory=list)


@dataclass
class PortfolioContext:
    is_owned: bool = False
    quantity: Optional[float] = None
    average_buy_price: Optional[float] = None
    current_price: float = 0.0
    invested_value: Optional[float] = None
    current_value: Optional[float] = None
    unrealized_pnl: Optional[float] = None
    unrealized_pnl_pct: Optional[float] = None
    portfolio_allocation_pct: Optional[float] = None
    concentration_risk_flag: bool = False
    recommended_action: str = "WATCH"  # 'BUY MORE', 'HOLD', 'REDUCE', 'SELL' (if owned) | 'BUY', 'WATCH', 'AVOID' (if unowned)
    action_reasoning: str = ""


@dataclass
class FinalVerdict:
    verdict: DecisionRating = DecisionRating.HOLD
    conviction_score: int = 65  # 0 - 100
    time_horizon: str = "1-3 years"  # '1-3 months', '6-12 months', '1-3 years', '3-5 years'
    margin_of_safety: MarginOfSafety = MarginOfSafety.MEDIUM
    executive_summary: str = ""


# =====================================================================
# COMPREHENSIVE RESEARCH REPORT MASTER MODEL
# =====================================================================

@dataclass
class ComprehensiveResearchReport:
    ticker: str
    company_name: str
    sector: str
    industry: str
    currency: str
    current_price: float
    market_cap: float
    income_statement: IncomeStatementData
    balance_sheet: BalanceSheetData
    cash_flow: CashFlowData
    ratios: KeyRatiosData
    historical_trends: HistoricalTrendSignals
    decision: InvestmentDecisionResult
    recent_news: List[Dict[str, Any]]
    ai_thesis_report: str  # Generated synthesized report from Ollama (or fallback)
    generated_at: str
    ollama_status: str  # 'ONLINE' | 'OFFLINE_FALLBACK'
    
    # Enhanced Institutional Structured Research Sub-models
    price_momentum: Optional[PriceMomentumContext] = None
    business_quality: Optional[BusinessQualityAssessment] = None
    financial_health: Optional[FinancialHealthAssessment] = None
    earnings_quality: Optional[EarningsQualityAssessment] = None
    valuation_assessment: Optional[ValuationAssessment] = None
    news_causal_analysis: Optional[List[NewsCausalItem]] = None
    sector_macro: Optional[SectorMacroContext] = None
    scenario_analysis: Optional[ScenarioAnalysis] = None
    risk_matrix: Optional[RiskAnalysisMatrix] = None
    thesis_invalidation: Optional[ThesisInvalidationTriggers] = None
    portfolio_context: Optional[PortfolioContext] = None
    final_verdict: Optional[FinalVerdict] = None
