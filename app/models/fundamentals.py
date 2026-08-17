from dataclasses import dataclass, field
from typing import Dict, List, Optional, Any
from enum import Enum


class DecisionRating(str, Enum):
    STRONG_BUY = "STRONG BUY CANDIDATE"
    BUY = "BUY CANDIDATE"
    HOLD_WATCH = "HOLD / WATCH"
    AVOID = "AVOID"
    INSUFFICIENT_DATA = "INSUFFICIENT DATA"


class ValuationStatus(str, Enum):
    UNDERVALUED = "POTENTIALLY UNDERVALUED"
    FAIRLY_VALUED = "FAIRLY VALUED"
    EXPENSIVE = "POTENTIALLY EXPENSIVE"
    INSUFFICIENT_DATA = "INSUFFICIENT DATA"


class ConfidenceLevel(str, Enum):
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"


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
