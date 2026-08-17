from fastapi import APIRouter, HTTPException, status
from typing import List, Optional

from app.agents.portfolio_agent import PortfolioAgent
from app.agents.decision_agent import DecisionAgent
from app.database.portfolio_repository import PortfolioRepository
from app.database.portfolio_history_repository import PortfolioHistoryRepository
from app.database.portfolio_transaction_repository import PortfolioTransactionRepository
from app.services.stock_service import StockService
from app.services.ollama_service import OllamaService
from app.api.schemas import (
    BuyStockRequest,
    SellStockRequest,
    AddHoldingRequest,
    UpdateHoldingRequest,
    AIAnalyzeRequest,
    PortfolioSummaryResponse,
    HoldingItemResponse,
    PortfolioHistorySnapshotResponse,
    TransactionResponse,
    CompanyQuoteResponse,
    AIAnalysisResponse,
    MessageResponse,
)

router = APIRouter(prefix="/api", tags=["portfolio"])


def get_portfolio_agent() -> PortfolioAgent:
    repo = PortfolioRepository()
    return PortfolioAgent(repo)


def get_portfolio_repo() -> PortfolioRepository:
    return PortfolioRepository()


def get_transaction_repo() -> PortfolioTransactionRepository:
    return PortfolioTransactionRepository()


def get_history_repo() -> PortfolioHistoryRepository:
    return PortfolioHistoryRepository()


def get_stock_service() -> StockService:
    return StockService()


def get_decision_agent() -> DecisionAgent:
    return DecisionAgent(OllamaService(), StockService())


# -------------------------------------------------------------------------
# Portfolio Summary & Holdings Endpoints
# -------------------------------------------------------------------------

@router.get("/portfolio", response_model=PortfolioSummaryResponse)
def get_portfolio():
    """
    Get full portfolio summary including live valuations, returns, and holdings.
    """
    try:
        agent = get_portfolio_agent()
        trans_repo = get_transaction_repo()
        raw_portfolio = agent.get_holdings()

        holdings_list = []
        for item in raw_portfolio:
            h = item["holding"]
            holdings_list.append(
                HoldingItemResponse(
                    id=h.id,
                    ticker=h.ticker,
                    quantity=h.quantity,
                    average_buy_price=h.average_buy_price,
                    current_price=item.get("current_price"),
                    invested=item.get("invested"),
                    current_value=item.get("current_value"),
                    profit=item.get("profit"),
                    returns=item.get("returns"),
                )
            )

        total_holdings = len(holdings_list)
        total_invested = sum(item.invested or 0 for item in holdings_list)
        total_current_value = sum(item.current_value or 0 for item in holdings_list)
        total_unrealized_profit = total_current_value - total_invested
        total_return_percentage = (
            (total_unrealized_profit / total_invested) * 100 if total_invested > 0 else 0.0
        )
        total_realized_profit = trans_repo.get_realized_profit() or 0.0

        return PortfolioSummaryResponse(
            total_holdings=total_holdings,
            total_invested=total_invested,
            total_current_value=total_current_value,
            total_unrealized_profit=total_unrealized_profit,
            total_return_percentage=total_return_percentage,
            total_realized_profit=total_realized_profit,
            holdings=holdings_list,
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch portfolio: {str(e)}",
        )


@router.post("/portfolio/holdings", response_model=MessageResponse)
def add_holding(payload: AddHoldingRequest):
    """
    Directly add a new holding to the portfolio.
    """
    try:
        agent = get_portfolio_agent()
        agent.add_holding(
            ticker=payload.ticker.strip().upper(),
            quantity=payload.quantity,
            average_buy_price=payload.average_buy_price,
        )
        agent.save_portfolio_snapshot()
        return MessageResponse(
            status="success",
            message=f"Holding {payload.ticker.upper()} added successfully.",
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to add holding: {str(e)}",
        )


@router.put("/portfolio/holdings/{holding_id}", response_model=MessageResponse)
def update_holding(holding_id: int, payload: UpdateHoldingRequest):
    """
    Update quantity and average buy price of an existing holding.
    """
    try:
        repo = get_portfolio_repo()
        agent = get_portfolio_agent()
        existing = repo.get_holding_by_id(holding_id)
        if not existing:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Holding with id {holding_id} not found.",
            )

        agent.update_holding(
            holding_id=holding_id,
            quantity=payload.quantity,
            average_buy_price=payload.average_buy_price,
        )
        agent.save_portfolio_snapshot()
        return MessageResponse(
            status="success",
            message=f"Holding {existing.ticker} updated successfully.",
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to update holding: {str(e)}",
        )


@router.delete("/portfolio/holdings/{holding_id}", response_model=MessageResponse)
def delete_holding(holding_id: int):
    """
    Delete a holding from the portfolio and take a snapshot.
    """
    try:
        repo = get_portfolio_repo()
        agent = get_portfolio_agent()
        existing = repo.get_holding_by_id(holding_id)
        if not existing:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Holding with id {holding_id} not found.",
            )

        agent.delete_holding(holding_id)
        agent.save_portfolio_snapshot()
        return MessageResponse(
            status="success",
            message=f"Holding {existing.ticker} deleted successfully.",
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to delete holding: {str(e)}",
        )


# -------------------------------------------------------------------------
# Trading (Buy / Sell) Endpoints
# -------------------------------------------------------------------------

@router.post("/portfolio/buy", response_model=MessageResponse)
def buy_stock(payload: BuyStockRequest):
    """
    Execute a buy order. Recalculates weighted average price, records transaction,
    and saves portfolio history snapshot.
    """
    try:
        agent = get_portfolio_agent()
        agent.buy_stock(
            ticker=payload.ticker.strip().upper(),
            quantity=payload.quantity,
            buy_price=payload.buy_price,
        )
        return MessageResponse(
            status="success",
            message=f"Successfully purchased {payload.quantity} shares of {payload.ticker.upper()} at ₹{payload.buy_price:,.2f}.",
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Buy order failed: {str(e)}",
        )


@router.post("/portfolio/sell", response_model=MessageResponse)
def sell_stock(payload: SellStockRequest):
    """
    Execute a sell order. Validates owned quantity, calculates realized P&L,
    records transaction, and saves portfolio history snapshot.
    """
    try:
        agent = get_portfolio_agent()
        agent.sell_stock(
            ticker=payload.ticker.strip().upper(),
            quantity=payload.quantity,
            selling_price=payload.selling_price,
        )
        return MessageResponse(
            status="success",
            message=f"Successfully sold {payload.quantity} shares of {payload.ticker.upper()} at ₹{payload.selling_price:,.2f}.",
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Sell order failed: {str(e)}",
        )


# -------------------------------------------------------------------------
# History, Transactions & Metrics Endpoints
# -------------------------------------------------------------------------

@router.get("/portfolio/history", response_model=List[PortfolioHistorySnapshotResponse])
def get_portfolio_history():
    """
    Get chronological net worth snapshots for performance charts.
    """
    try:
        repo = get_history_repo()
        snapshots = repo.get_history()
        return [
            PortfolioHistorySnapshotResponse(
                id=s.id,
                timestamp=s.timestamp,
                invested_amount=s.invested_amount,
                net_worth=s.net_worth,
                profit=s.profit,
                return_percentage=s.return_percentage,
            )
            for s in snapshots
        ]
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch portfolio history: {str(e)}",
        )


@router.post("/portfolio/snapshot", response_model=MessageResponse)
def trigger_snapshot():
    """
    Manually capture and persist a current portfolio valuation snapshot.
    """
    try:
        agent = get_portfolio_agent()
        agent.save_portfolio_snapshot()
        return MessageResponse(
            status="success",
            message="Portfolio snapshot recorded successfully.",
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to record snapshot: {str(e)}",
        )


@router.get("/portfolio/transactions", response_model=List[TransactionResponse])
def get_transactions(ticker: Optional[str] = None):
    """
    Get trade audit ledger of all buys and sells.
    """
    try:
        repo = get_transaction_repo()
        if ticker:
            rows = repo.get_transactions_by_ticker(ticker.strip().upper())
        else:
            rows = repo.get_all_transactions()

        transactions = []
        for r in rows:
            transactions.append(
                TransactionResponse(
                    id=r[0],
                    ticker=r[1],
                    transaction_type=r[2],
                    quantity=r[3],
                    price=r[4],
                    average_cost=r[5],
                    total_amount=r[6],
                    profit_loss=r[7],
                    transaction_date=r[8],
                )
            )
        return transactions
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch transactions: {str(e)}",
        )


@router.get("/portfolio/realized-profit")
def get_realized_profit():
    """
    Get cumulative realized profit across all sell transactions.
    """
    try:
        repo = get_transaction_repo()
        profit = repo.get_realized_profit()
        return {"realized_profit": profit or 0.0}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch realized profit: {str(e)}",
        )


# -------------------------------------------------------------------------
# Market & AI Insights Endpoints
# -------------------------------------------------------------------------

@router.get("/market/quote/{ticker}", response_model=CompanyQuoteResponse)
def get_company_quote(ticker: str):
    """
    Fetch live market quote and company metadata via StockService / yfinance.
    """
    try:
        service = get_stock_service()
        info = service.get_company_info(ticker)
        current_price = info.current_price
        if current_price == 0.0:
            try:
                current_price = service.get_current_price(ticker)
            except Exception:
                current_price = 0.0

        return CompanyQuoteResponse(
            ticker=info.ticker,
            name=info.name or info.ticker,
            sector=info.sector or "N/A",
            industry=info.industry or "N/A",
            country=info.country or "India",
            currency=info.currency or "INR",
            market_cap=info.market_cap or 0,
            current_price=current_price,
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Failed to fetch quote for {ticker}: {str(e)}",
        )


@router.post("/ai/analyze", response_model=AIAnalysisResponse)
def analyze_stock(payload: AIAnalyzeRequest):
    """
    Perform deep AI analysis using DecisionAgent and Ollama.
    """
    try:
        service = get_stock_service()
        agent = get_decision_agent()
        company = service.get_company_info(payload.ticker)
        analysis_text = agent.analyze_company(payload.ticker)
        return AIAnalysisResponse(
            ticker=payload.ticker.upper(),
            company_name=company.name or payload.ticker.upper(),
            analysis=analysis_text,
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AI analysis failed: {str(e)}",
        )
