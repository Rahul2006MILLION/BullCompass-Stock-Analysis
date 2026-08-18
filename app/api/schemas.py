from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any


# --- Requests ---

class BuyStockRequest(BaseModel):
    ticker: str = Field(..., description="Stock symbol (e.g. TCS, INFY)", example="TCS")
    quantity: float = Field(..., gt=0, description="Quantity of shares to buy", example=10)
    buy_price: float = Field(..., gt=0, description="Buy price per share", example=3500.0)


class SellStockRequest(BaseModel):
    ticker: str = Field(..., description="Stock symbol to sell", example="TCS")
    quantity: float = Field(..., gt=0, description="Quantity of shares to sell", example=5)
    selling_price: float = Field(..., gt=0, description="Selling price per share", example=3800.0)


class AddHoldingRequest(BaseModel):
    ticker: str = Field(..., description="Stock symbol", example="INFY")
    quantity: float = Field(..., gt=0, description="Quantity of shares", example=25)
    average_buy_price: float = Field(..., gt=0, description="Average buy price per share", example=1450.0)


class UpdateHoldingRequest(BaseModel):
    quantity: float = Field(..., gt=0, description="Updated quantity of shares", example=30)
    average_buy_price: float = Field(..., gt=0, description="Updated average buy price", example=1420.0)


class AIAnalyzeRequest(BaseModel):
    ticker: str = Field(..., description="Stock ticker symbol to analyze", example="RELIANCE")


# --- News Schemas ---

class EntityExposureResponse(BaseModel):
    ticker: Optional[str] = None
    sector: Optional[str] = None
    entity_type: str
    exposure_type: str
    sentiment_hint: str


class NewsItemResponse(BaseModel):
    id: str
    title: str
    summary: Optional[str] = None
    source: str
    source_url: Optional[str] = None
    published_at: str
    fetched_at: str
    category: str
    subcategory: Optional[str] = None
    importance: str = "MEDIUM"
    raw_content: Optional[str] = None
    entities: List[EntityExposureResponse] = []


class NewsListResponse(BaseModel):
    total: int
    news: List[NewsItemResponse]


class NewsMetadataResponse(BaseModel):
    sources: List[str]
    categories: List[str]
    total_count: int


class NewsSyncResponse(BaseModel):
    status: str
    inserted_count: int
    message: str


# --- Portfolio & Market Responses ---

class HoldingItemResponse(BaseModel):
    id: Optional[int]
    ticker: str
    quantity: float
    average_buy_price: float
    current_price: Optional[float] = None
    invested: Optional[float] = None
    current_value: Optional[float] = None
    profit: Optional[float] = None
    returns: Optional[float] = None


class PortfolioSummaryResponse(BaseModel):
    total_holdings: int
    total_invested: float
    total_current_value: float
    total_unrealized_profit: float
    total_return_percentage: float
    total_realized_profit: float
    holdings: List[HoldingItemResponse]


class PortfolioHistorySnapshotResponse(BaseModel):
    id: Optional[int]
    timestamp: str
    invested_amount: float
    net_worth: float
    profit: float
    return_percentage: float


class TransactionResponse(BaseModel):
    id: int
    ticker: str
    transaction_type: str
    quantity: float
    price: float
    average_cost: Optional[float] = None
    total_amount: float
    profit_loss: Optional[float] = None
    transaction_date: str


class CompanyQuoteResponse(BaseModel):
    ticker: str
    name: str
    sector: str
    industry: str
    country: str
    currency: str
    market_cap: int
    current_price: float


# --- Fundamental Research & AI Analysis Schemas ---

class IncomeStatementResponse(BaseModel):
    years: List[str]
    revenue: Dict[str, Optional[float]]
    operating_income: Dict[str, Optional[float]]
    operating_margin: Dict[str, Optional[float]]
    ebitda: Dict[str, Optional[float]]
    ebitda_margin: Dict[str, Optional[float]]
    net_income: Dict[str, Optional[float]]
    net_margin: Dict[str, Optional[float]]
    eps: Dict[str, Optional[float]]
    revenue_cagr_3y: Optional[float] = None
    net_profit_cagr_3y: Optional[float] = None


class BalanceSheetResponse(BaseModel):
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
    deposits: Optional[Dict[str, Optional[float]]] = None
    advances: Optional[Dict[str, Optional[float]]] = None


class CashFlowResponse(BaseModel):
    years: List[str]
    is_applicable: bool
    operating_cash_flow: Dict[str, Optional[float]]
    capital_expenditure: Dict[str, Optional[float]]
    free_cash_flow: Dict[str, Optional[float]]
    fcf_conversion: Optional[float] = None
    cash_flow_quality_flag: str


class KeyRatiosResponse(BaseModel):
    pe_ratio: Optional[float] = None
    forward_pe: Optional[float] = None
    pb_ratio: Optional[float] = None
    ev_to_ebitda: Optional[float] = None
    roe: Optional[float] = None
    roce: Optional[float] = None
    roa: Optional[float] = None
    debt_to_equity: Optional[float] = None
    current_ratio: Optional[float] = None
    operating_margin: Optional[float] = None
    net_margin: Optional[float] = None
    revenue_growth_yoy: Optional[float] = None
    earnings_growth_yoy: Optional[float] = None
    dividend_yield: Optional[float] = None


class HistoricalTrendsResponse(BaseModel):
    revenue_trend: str
    profit_trend: str
    margin_trend: str
    roe_trend: str
    debt_trend: str
    cash_flow_trend: str


class QualityScoreBreakdownResponse(BaseModel):
    business_quality: float
    financial_strength: float
    growth: float
    profitability: float
    cash_generation: float
    valuation: float
    risk_profile: float
    total_score: float


class InvestmentDecisionResponse(BaseModel):
    decision: str
    fundamental_score: float
    score_breakdown: QualityScoreBreakdownResponse
    data_confidence: str
    valuation_status: str
    key_strengths: List[str]
    key_concerns: List[str]
    is_bank: bool


class ComprehensiveResearchResponse(BaseModel):
    ticker: str
    company_name: str
    sector: str
    industry: str
    currency: str
    current_price: float
    market_cap: float
    income_statement: IncomeStatementResponse
    balance_sheet: BalanceSheetResponse
    cash_flow: CashFlowResponse
    ratios: KeyRatiosResponse
    historical_trends: HistoricalTrendsResponse
    decision: InvestmentDecisionResponse
    recent_news: List[Dict[str, Any]]
    ai_thesis_report: str
    generated_at: str
    ollama_status: str


class AIAnalysisResponse(BaseModel):
    ticker: str
    company_name: Optional[str] = None
    analysis: str


class AddWatchlistRequest(BaseModel):
    ticker: str = Field(..., description="Stock symbol to add to watchlist", example="INFY")


class WatchlistItemResponse(BaseModel):
    id: Optional[int] = None
    ticker: str
    resolved_ticker: str
    company_name: str
    current_price: Optional[float] = None
    change: Optional[float] = None
    change_percent: Optional[float] = None
    is_owned: bool = False
    added_at: str


class WatchlistResponse(BaseModel):
    total: int
    items: List[WatchlistItemResponse]


class MessageResponse(BaseModel):
    status: str
    message: str


# --- Live Batch Quotes & Market Status Schemas ---

class BatchQuotesRequest(BaseModel):
    tickers: List[str] = Field(..., description="List of stock symbols to fetch quotes for", example=["TCS", "INFY", "^NSEI"])


class QuoteItemResponse(BaseModel):
    ticker: str
    resolved_ticker: str
    current_price: Optional[float] = None
    previous_close: Optional[float] = None
    change: Optional[float] = None
    change_percent: Optional[float] = None
    timestamp: str


class MarketStatusResponse(BaseModel):
    is_open: bool
    status: str
    current_time_ist: str
    timezone: str


class BatchQuotesResponse(BaseModel):
    quotes: Dict[str, QuoteItemResponse]
    market_status: MarketStatusResponse

