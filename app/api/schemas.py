from pydantic import BaseModel, Field
from typing import Optional, List


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


class AIAnalysisResponse(BaseModel):
    ticker: str
    company_name: Optional[str] = None
    analysis: str


class MessageResponse(BaseModel):
    status: str
    message: str
