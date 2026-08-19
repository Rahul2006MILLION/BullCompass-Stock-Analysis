from dataclasses import dataclass, field
from typing import Optional, List, Dict, Any
from enum import Enum


class RecommendationType(str, Enum):
    BUY = "BUY"
    BUY_MORE = "BUY MORE"
    HOLD = "HOLD"
    WATCH = "WATCH"
    REDUCE = "REDUCE"
    SELL = "SELL"
    AVOID = "AVOID"


class EventDirection(str, Enum):
    POSITIVE = "POSITIVE"
    NEGATIVE = "NEGATIVE"
    NEUTRAL = "NEUTRAL"
    MIXED = "MIXED"


class TimeHorizon(str, Enum):
    SHORT_TERM = "1-3 months"
    MEDIUM_TERM = "6-12 months"
    LONG_TERM = "1-3 years"
    MULTI_YEAR = "3-5 years"


@dataclass
class NewsEventExtraction:
    """
    Structured extraction produced by Ollama from financial news.
    """
    event_type: str
    event_summary: str
    affected_sectors: List[str]
    affected_tickers: List[str]
    direction: EventDirection
    impact_strength: int  # 1 to 10 scale
    time_horizon: str
    mechanism: str  # How the event transmits to corporate earnings / balance sheets
    potential_beneficiaries: List[str]
    potential_losers: List[str]
    key_risks: List[str]
    confidence: int  # 0 to 100


@dataclass
class QuantitativeFactors:
    """
    Deterministic quantitative assessment calculated in Python.
    """
    revenue_cagr_3y: Optional[float]
    profit_cagr_3y: Optional[float]
    operating_margin: Optional[float]
    net_margin: Optional[float]
    roe: Optional[float]
    roce: Optional[float]
    debt_to_equity: Optional[float]
    pe_ratio: Optional[float]
    pb_ratio: Optional[float]
    ev_to_ebitda: Optional[float]
    cfo_to_pat_ratio: Optional[float]  # Earnings quality indicator
    price_change_5d: Optional[float]   # Recent price reaction (%)
    current_price: float
    market_cap_cr: float
    is_financial_institution: bool = False


@dataclass
class ScoreBreakdown:
    fundamental_score: int    # 0 - 100
    earnings_quality_score: int  # 0 - 100
    valuation_score: int      # 0 - 100
    price_reaction_score: int # 0 - 100
    news_catalyst_score: int  # 0 - 100
    overall_conviction: int   # 0 - 100


@dataclass
class HardGateTrigger:
    gate_name: str
    description: str
    impact_on_decision: str


@dataclass
class InvestmentOpportunity:
    """
    Authoritative Investment Opportunity & Decision Memo.
    """
    id: Optional[int]
    ticker: str
    company_name: str
    sector: str
    industry: str
    recommendation: RecommendationType
    conviction_score: int  # 0 - 100
    time_horizon: str
    current_price: float
    
    # Triggering News Context
    news_id: Optional[str]
    news_title: str
    news_source: str
    news_published_at: str
    event_summary: str
    impact_direction: str
    impact_strength: int
    transmission_mechanism: str
    
    # Deterministic Scores & Metrics
    scores: ScoreBreakdown
    metrics: QuantitativeFactors
    hard_gates_triggered: List[HardGateTrigger]
    
    # Portfolio Context
    is_owned: bool
    portfolio_quantity: Optional[float]
    portfolio_avg_buy_price: Optional[float]
    portfolio_allocation_pct: Optional[float]
    
    # Qualitative Synthesized Thesis
    investment_thesis: str
    key_catalysts: List[str]
    key_risks: List[str]
    thesis_invalidation_triggers: List[str]
    
    created_at: str

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "ticker": self.ticker,
            "company_name": self.company_name,
            "sector": self.sector,
            "industry": self.industry,
            "recommendation": self.recommendation.value,
            "conviction_score": self.conviction_score,
            "time_horizon": self.time_horizon,
            "current_price": self.current_price,
            "news_id": self.news_id,
            "news_title": self.news_title,
            "news_source": self.news_source,
            "news_published_at": self.news_published_at,
            "event_summary": self.event_summary,
            "impact_direction": self.impact_direction,
            "impact_strength": self.impact_strength,
            "transmission_mechanism": self.transmission_mechanism,
            "scores": {
                "fundamental_score": self.scores.fundamental_score,
                "earnings_quality_score": self.scores.earnings_quality_score,
                "valuation_score": self.scores.valuation_score,
                "price_reaction_score": self.scores.price_reaction_score,
                "news_catalyst_score": self.scores.news_catalyst_score,
                "overall_conviction": self.scores.overall_conviction,
            },
            "metrics": {
                "revenue_cagr_3y": self.metrics.revenue_cagr_3y,
                "profit_cagr_3y": self.metrics.profit_cagr_3y,
                "operating_margin": self.metrics.operating_margin,
                "net_margin": self.metrics.net_margin,
                "roe": self.metrics.roe,
                "roce": self.metrics.roce,
                "debt_to_equity": self.metrics.debt_to_equity,
                "pe_ratio": self.metrics.pe_ratio,
                "pb_ratio": self.metrics.pb_ratio,
                "ev_to_ebitda": self.metrics.ev_to_ebitda,
                "cfo_to_pat_ratio": self.metrics.cfo_to_pat_ratio,
                "price_change_5d": self.metrics.price_change_5d,
                "current_price": self.metrics.current_price,
                "market_cap_cr": self.metrics.market_cap_cr,
            },
            "hard_gates_triggered": [
                {
                    "gate_name": g.gate_name,
                    "description": g.description,
                    "impact_on_decision": g.impact_on_decision,
                }
                for g in self.hard_gates_triggered
            ],
            "is_owned": self.is_owned,
            "portfolio_quantity": self.portfolio_quantity,
            "portfolio_avg_buy_price": self.portfolio_avg_buy_price,
            "portfolio_allocation_pct": self.portfolio_allocation_pct,
            "investment_thesis": self.investment_thesis,
            "key_catalysts": self.key_catalysts,
            "key_risks": self.key_risks,
            "thesis_invalidation_triggers": self.thesis_invalidation_triggers,
            "created_at": self.created_at,
        }
