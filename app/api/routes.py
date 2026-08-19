from fastapi import APIRouter, HTTPException, status
from typing import List, Optional

from app.agents.portfolio_agent import PortfolioAgent
from app.agents.decision_agent import DecisionAgent
from app.database.portfolio_repository import PortfolioRepository
from app.database.portfolio_history_repository import PortfolioHistoryRepository
from app.database.portfolio_transaction_repository import PortfolioTransactionRepository
from app.database.news_repository import NewsRepository
from app.services.stock_service import StockService
from app.services.canonical_valuation_service import CanonicalValuationService
from app.services.market_session import MarketSessionManager
from app.services.ollama_service import OllamaService
from app.services.news_service import NewsService
from app.services.research_coordinator import ResearchCoordinatorService
from app.services.watchlist_service import WatchlistService
from app.api.schemas import (
    BuyStockRequest,
    SellStockRequest,
    AddHoldingRequest,
    UpdateHoldingRequest,
    AddWatchlistRequest,
    AIAnalyzeRequest,
    PortfolioSummaryResponse,
    HoldingItemResponse,
    PortfolioHistorySnapshotResponse,
    TransactionResponse,
    CompanyQuoteResponse,
    AIAnalysisResponse,
    WatchlistItemResponse,
    WatchlistResponse,
    NewsItemResponse,
    NewsListResponse,
    NewsMetadataResponse,
    NewsSyncResponse,
    EntityExposureResponse,
    IncomeStatementResponse,
    BalanceSheetResponse,
    CashFlowResponse,
    KeyRatiosResponse,
    HistoricalTrendsResponse,
    QualityScoreBreakdownResponse,
    InvestmentDecisionResponse,
    ComprehensiveResearchResponse,
    MessageResponse,
    BatchQuotesRequest,
    QuoteItemResponse,
    MarketStatusResponse,
    BatchQuotesResponse,
    ReconciliationItemResponse,
    PortfolioReconciliationResponse,
    IntelligenceScoreBreakdownResponse,
    IntelligenceMetricsResponse,
    HardGateTriggerResponse,
    InvestmentOpportunityResponse,
    OpportunitiesListResponse,
)
from app.services.intelligence.engine import InvestmentIntelligenceEngine

router = APIRouter(prefix="/api", tags=["portfolio"])


def get_intelligence_engine() -> InvestmentIntelligenceEngine:
    return InvestmentIntelligenceEngine()


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


def get_news_service() -> NewsService:
    repo = NewsRepository()
    return NewsService(repo)


def get_research_coordinator() -> ResearchCoordinatorService:
    return ResearchCoordinatorService()


def get_watchlist_service() -> WatchlistService:
    return WatchlistService()


# -------------------------------------------------------------------------
# Portfolio Summary & Holdings Endpoints
# -------------------------------------------------------------------------

@router.get("/portfolio", response_model=PortfolioSummaryResponse)
def get_portfolio():
    """
    Get full portfolio summary including canonical valuations, returns, and holdings.
    Guarantees strict session freezing when the market is closed.
    """
    try:
        repo = get_portfolio_repo()
        trans_repo = get_transaction_repo()
        holdings = repo.get_holdings()

        canonical_svc = CanonicalValuationService.get_instance()
        val_result = canonical_svc.evaluate_portfolio(holdings)

        holdings_list = []
        for item in val_result.holdings:
            h = item.holding
            holdings_list.append(
                HoldingItemResponse(
                    id=h.id,
                    ticker=h.ticker,
                    quantity=h.quantity,
                    average_buy_price=h.average_buy_price,
                    current_price=item.current_price,
                    invested=item.invested,
                    current_value=item.current_value,
                    profit=item.profit,
                    returns=item.returns,
                )
            )

        total_realized_profit = trans_repo.get_realized_profit() or 0.0

        return PortfolioSummaryResponse(
            total_holdings=val_result.total_holdings,
            total_invested=val_result.total_invested,
            total_current_value=val_result.total_current_value,
            total_unrealized_profit=val_result.total_unrealized_profit,
            total_return_percentage=val_result.total_return_percentage,
            total_realized_profit=total_realized_profit,
            holdings=holdings_list,
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch portfolio: {str(e)}",
        )


@router.get("/portfolio/reconciliation", response_model=PortfolioReconciliationResponse)
def get_portfolio_reconciliation():
    """
    Diagnostic reconciliation endpoint comparing database quantities, active provider prices,
    calculated values, price types, full holding telemetry, and portfolio totals.
    """
    try:
        repo = get_portfolio_repo()
        holdings = repo.get_holdings()
        
        canonical_svc = CanonicalValuationService.get_instance()
        val_result = canonical_svc.evaluate_portfolio(holdings)
        session_info = val_result.session_info

        items = []
        for item in val_result.holdings:
            h = item.holding
            t = item.telemetry
            items.append(
                ReconciliationItemResponse(
                    id=h.id,
                    ticker=h.ticker,
                    symbol_token=t.symbol_token,
                    quantity=h.quantity,
                    average_buy_price=h.average_buy_price,
                    invested=item.invested,
                    provider=t.quote_source,
                    price=item.current_price,
                    close=t.close,
                    price_type="LTP" if session_info.is_open else "OFFICIAL_CLOSE",
                    current_value=item.current_value,
                    profit=item.profit,
                    returns=item.returns,
                    exch_feed_time=t.exch_feed_time,
                    exch_trade_time=t.exch_trade_time,
                    api_response_timestamp=t.api_response_timestamp,
                    server_timestamp=t.server_timestamp,
                    quote_source=t.quote_source,
                    cache_timestamp=t.cache_timestamp,
                    session_state=t.session_state,
                    session_id=t.session_id,
                    timestamp=t.server_timestamp,
                )
            )

        from datetime import datetime, timezone
        return PortfolioReconciliationResponse(
            total_holdings=val_result.total_holdings,
            total_invested=val_result.total_invested,
            total_current_value=val_result.total_current_value,
            total_unrealized_profit=val_result.total_unrealized_profit,
            total_return_percentage=val_result.total_return_percentage,
            market_status=session_info.status,
            session_id=session_info.session_id,
            is_frozen=session_info.is_frozen,
            active_provider="AngelOneMarketDataProvider",
            timestamp=datetime.now(timezone.utc).isoformat(),
            items=items,
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate reconciliation report: {str(e)}",
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
def get_portfolio_history(range: Optional[str] = None):
    """
    Get chronological net worth snapshots for performance charts with optional range filter (1W, 1M, 3M, ALL).
    """
    try:
        repo = get_history_repo()
        snapshots = repo.get_history(range_str=range)
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
# News Ingestion & Market Feeds Endpoints (Phase 1)
# -------------------------------------------------------------------------

@router.get("/news", response_model=NewsListResponse)
def get_news(
    limit: int = 50,
    offset: int = 0,
    category: Optional[str] = None,
    importance: Optional[str] = None,
    source: Optional[str] = None,
    search: Optional[str] = None,
    company: Optional[str] = None,
    ticker: Optional[str] = None,
):
    """
    Retrieve normalized market news items with optional filters.
    """
    try:
        service = get_news_service()
        selected_ticker = ticker or company
        items = service.get_news_feed(
            limit=limit,
            offset=offset,
            category=category,
            importance=importance,
            source=source,
            search=search,
            ticker=selected_ticker,
        )
        response_items = [
            NewsItemResponse(
                id=item.id,
                title=item.title,
                summary=item.summary,
                source=item.source,
                source_url=item.source_url,
                published_at=item.published_at,
                fetched_at=item.fetched_at,
                category=item.category,
                subcategory=item.subcategory,
                importance=item.importance,
                raw_content=item.raw_content,
                entities=[
                    EntityExposureResponse(
                        ticker=e.ticker,
                        sector=e.sector,
                        entity_type=e.entity_type,
                        exposure_type=e.exposure_type.value if hasattr(e.exposure_type, "value") else str(e.exposure_type),
                        sentiment_hint=e.sentiment_hint.value if hasattr(e.sentiment_hint, "value") else str(e.sentiment_hint),
                    )
                    for e in item.entities
                ],
            )
            for item in items
        ]
        return NewsListResponse(total=len(response_items), news=response_items)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch news feed: {str(e)}",
        )


@router.get("/news/metadata", response_model=NewsMetadataResponse)
def get_news_metadata():
    """
    Get distinct categories, sources, and total count for building dynamic UI filters.
    """
    try:
        service = get_news_service()
        data = service.get_filter_metadata()
        return NewsMetadataResponse(
            sources=data.get("sources", []),
            categories=data.get("categories", []),
            total_count=data.get("total_count", 0),
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch news metadata: {str(e)}",
        )


@router.post("/news/sync", response_model=NewsSyncResponse)
def sync_news():
    """
    Trigger immediate ingestion of news from all free providers.
    """
    try:
        service = get_news_service()
        new_count = service.sync_news(limit_per_provider=25)
        return NewsSyncResponse(
            status="success",
            inserted_count=new_count,
            message=f"Synchronized news successfully. {new_count} new articles ingested.",
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to sync news: {str(e)}",
        )


@router.get("/news/{news_id}", response_model=NewsItemResponse)
def get_news_article(news_id: str):
    """
    Get a single news article with entity mappings by its SHA-256 ID.
    """
    try:
        service = get_news_service()
        item = service.get_news_by_id(news_id)
        if not item:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"News article with id {news_id} not found.",
            )
        return NewsItemResponse(
            id=item.id,
            title=item.title,
            summary=item.summary,
            source=item.source,
            source_url=item.source_url,
            published_at=item.published_at,
            fetched_at=item.fetched_at,
            category=item.category,
            subcategory=item.subcategory,
            importance=item.importance,
            raw_content=item.raw_content,
            entities=[
                EntityExposureResponse(
                    ticker=e.ticker,
                    sector=e.sector,
                    entity_type=e.entity_type,
                    exposure_type=e.exposure_type.value if hasattr(e.exposure_type, "value") else str(e.exposure_type),
                    sentiment_hint=e.sentiment_hint.value if hasattr(e.sentiment_hint, "value") else str(e.sentiment_hint),
                )
                for e in item.entities
            ],
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch news article: {str(e)}",
        )


# -------------------------------------------------------------------------
# Comprehensive Fundamental Research & Decision Support Pipeline
# -------------------------------------------------------------------------

def _serialize_report(report) -> ComprehensiveResearchResponse:
    inc = report.income_statement
    bs = report.balance_sheet
    cf = report.cash_flow
    ratios = report.ratios
    trends = report.historical_trends
    dec = report.decision
    sb = dec.score_breakdown

    return ComprehensiveResearchResponse(
        ticker=report.ticker,
        company_name=report.company_name,
        sector=report.sector,
        industry=report.industry,
        currency=report.currency,
        current_price=report.current_price,
        market_cap=report.market_cap,
        income_statement=IncomeStatementResponse(
            years=inc.years,
            revenue=inc.revenue,
            operating_income=inc.operating_income,
            operating_margin=inc.operating_margin,
            ebitda=inc.ebitda,
            ebitda_margin=inc.ebitda_margin,
            net_income=inc.net_income,
            net_margin=inc.net_margin,
            eps=inc.eps,
            revenue_cagr_3y=inc.revenue_cagr_3y,
            net_profit_cagr_3y=inc.net_profit_cagr_3y,
        ),
        balance_sheet=BalanceSheetResponse(
            years=bs.years,
            is_financial_institution=bs.is_financial_institution,
            total_assets=bs.total_assets,
            total_liabilities=bs.total_liabilities,
            total_equity=bs.total_equity,
            cash_and_equivalents=bs.cash_and_equivalents,
            total_debt=bs.total_debt,
            net_debt=bs.net_debt,
            debt_to_equity=bs.debt_to_equity,
            current_ratio=bs.current_ratio,
            deposits=bs.deposits,
            advances=bs.advances,
        ),
        cash_flow=CashFlowResponse(
            years=cf.years,
            is_applicable=cf.is_applicable,
            operating_cash_flow=cf.operating_cash_flow,
            capital_expenditure=cf.capital_expenditure,
            free_cash_flow=cf.free_cash_flow,
            fcf_conversion=cf.fcf_conversion,
            cash_flow_quality_flag=cf.cash_flow_quality_flag,
        ),
        ratios=KeyRatiosResponse(
            pe_ratio=ratios.pe_ratio,
            forward_pe=ratios.forward_pe,
            pb_ratio=ratios.pb_ratio,
            ev_to_ebitda=ratios.ev_to_ebitda,
            roe=ratios.roe,
            roce=ratios.roce,
            roa=ratios.roa,
            debt_to_equity=ratios.debt_to_equity,
            current_ratio=ratios.current_ratio,
            operating_margin=ratios.operating_margin,
            net_margin=ratios.net_margin,
            revenue_growth_yoy=ratios.revenue_growth_yoy,
            earnings_growth_yoy=ratios.earnings_growth_yoy,
            dividend_yield=ratios.dividend_yield,
        ),
        historical_trends=HistoricalTrendsResponse(
            revenue_trend=trends.revenue_trend,
            profit_trend=trends.profit_trend,
            margin_trend=trends.margin_trend,
            roe_trend=trends.roe_trend,
            debt_trend=trends.debt_trend,
            cash_flow_trend=trends.cash_flow_trend,
        ),
        decision=InvestmentDecisionResponse(
            decision=dec.decision.value if hasattr(dec.decision, "value") else str(dec.decision),
            fundamental_score=dec.fundamental_score,
            score_breakdown=QualityScoreBreakdownResponse(
                business_quality=sb.business_quality,
                financial_strength=sb.financial_strength,
                growth=sb.growth,
                profitability=sb.profitability,
                cash_generation=sb.cash_generation,
                valuation=sb.valuation,
                risk_profile=sb.risk_profile,
                total_score=sb.total_score,
            ),
            data_confidence=dec.data_confidence.value if hasattr(dec.data_confidence, "value") else str(dec.data_confidence),
            valuation_status=dec.valuation_status.value if hasattr(dec.valuation_status, "value") else str(dec.valuation_status),
            key_strengths=dec.key_strengths,
            key_concerns=dec.key_concerns,
            is_bank=dec.is_bank,
        ),
        recent_news=report.recent_news,
        ai_thesis_report=report.ai_thesis_report,
        generated_at=report.generated_at,
        ollama_status=report.ollama_status,
    )


@router.post("/research/analyze", response_model=ComprehensiveResearchResponse)
def analyze_company_research(payload: AIAnalyzeRequest):
    """
    Run the complete institutional investment research engine:
    Deterministic multi-year statements, ratios, trends, 0-100 scoring, decision tiering, and Ollama synthesis.
    """
    clean_ticker = payload.ticker.strip().upper()
    try:
        coordinator = get_research_coordinator()
        report = coordinator.generate_research_report(clean_ticker)
        return _serialize_report(report)
    except HTTPException:
        raise
    except ValueError as ve:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(ve),
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Research analysis pipeline failed: {str(e)}",
        )


@router.get("/research/{ticker}", response_model=ComprehensiveResearchResponse)
def get_company_research(ticker: str):
    """
    GET shortcut to generate or retrieve comprehensive fundamental research report.
    """
    clean_ticker = ticker.strip().upper()
    try:
        coordinator = get_research_coordinator()
        report = coordinator.generate_research_report(clean_ticker)
        return _serialize_report(report)
    except HTTPException:
        raise
    except ValueError as ve:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(ve),
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch research report for {clean_ticker}: {str(e)}",
        )


# -------------------------------------------------------------------------
# Live Quotes & Market Hours Endpoints
# -------------------------------------------------------------------------

@router.get("/market/status", response_model=MarketStatusResponse)
def get_market_status():
    """
    Get current Indian stock market operational status (OPEN / CLOSED / PRE_OPEN / POST_CLOSE).
    """
    try:
        service = get_stock_service()
        status_info = service.is_indian_market_open()
        return MarketStatusResponse(**status_info)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch market status: {str(e)}",
        )


@router.post("/quotes/batch", response_model=BatchQuotesResponse)
def get_batch_quotes_post(payload: BatchQuotesRequest):
    """
    Fetch lightweight live quotes for a batch of tickers simultaneously in ~1 network call.
    """
    try:
        service = get_stock_service()
        quotes_dict = service.get_batch_quotes(payload.tickers)
        market_status = service.is_indian_market_open()

        quote_items = {}
        for ticker, q in quotes_dict.items():
            quote_items[ticker] = QuoteItemResponse(
                ticker=q.get("ticker", ticker),
                resolved_ticker=q.get("resolved_ticker", ticker),
                trading_symbol=q.get("trading_symbol"),
                symbol_token=q.get("symbol_token"),
                current_price=q.get("current_price"),
                ltp=q.get("ltp") or q.get("current_price"),
                bid=q.get("bid"),
                ask=q.get("ask"),
                previous_close=q.get("previous_close"),
                change=q.get("change"),
                change_percent=q.get("change_percent"),
                timestamp=q.get("timestamp", ""),
                provider=q.get("provider", "angelone"),
                price_type=q.get("price_type", "LTP"),
            )

        return BatchQuotesResponse(
            quotes=quote_items,
            market_status=MarketStatusResponse(**market_status),
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch batch quotes: {str(e)}",
        )


@router.get("/quotes/batch", response_model=BatchQuotesResponse)
def get_batch_quotes_get(symbols: Optional[str] = None):
    """
    Fetch lightweight live quotes via GET with comma-separated symbols query parameter.
    e.g. /api/quotes/batch?symbols=TCS,INFY,^NSEI,^BSESN
    """
    ticker_list = [s.strip() for s in symbols.split(",") if s.strip()] if symbols else []
    return get_batch_quotes_post(BatchQuotesRequest(tickers=ticker_list))


# -------------------------------------------------------------------------
# Legacy Market & AI Insights Endpoints
# -------------------------------------------------------------------------

@router.get("/market/quote/{ticker}", response_model=CompanyQuoteResponse)
def get_company_quote(ticker: str):
    """
    Fetch live market quote and company metadata via StockService / yfinance.
    """
    clean_ticker = ticker.strip().upper()
    try:
        service = get_stock_service()
        info = service.get_company_info(clean_ticker)
        if not info.name or info.current_price <= 0.0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"We couldn't find a listed stock matching '{clean_ticker}'.",
            )

        return CompanyQuoteResponse(
            ticker=info.ticker,
            name=info.name,
            sector=info.sector or "N/A",
            industry=info.industry or "N/A",
            country=info.country or "India",
            currency=info.currency or "INR",
            market_cap=info.market_cap or 0,
            current_price=info.current_price,
        )
    except HTTPException:
        raise
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"We couldn't find a listed stock matching '{clean_ticker}'.",
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"We couldn't find a listed stock matching '{clean_ticker}'.",
        )


@router.post("/ai/analyze", response_model=AIAnalysisResponse)
def analyze_stock(payload: AIAnalyzeRequest):
    """
    Perform deep AI analysis using DecisionAgent and Ollama.
    """
    clean_ticker = payload.ticker.strip().upper()
    try:
        agent = get_decision_agent()
        report = agent.generate_full_research_report(clean_ticker)
        return AIAnalysisResponse(
            ticker=clean_ticker,
            company_name=report.company_name,
            analysis=report.ai_thesis_report,
        )
    except HTTPException:
        raise
    except ValueError as ve:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(ve),
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AI analysis failed: {str(e)}",
        )


# -------------------------------------------------------------------------
# Watchlist Endpoints (Phase 1)
# -------------------------------------------------------------------------

@router.get("/watchlist", response_model=WatchlistResponse)
def get_watchlist():
    """
    Get all watchlist items with live market valuations and portfolio ownership flags.
    """
    try:
        service = get_watchlist_service()
        items_data = service.get_watchlist()
        items = [
            WatchlistItemResponse(
                id=item["id"],
                ticker=item["ticker"],
                resolved_ticker=item["resolved_ticker"],
                company_name=item["company_name"],
                current_price=item.get("current_price"),
                change=item.get("change"),
                change_percent=item.get("change_percent"),
                is_owned=item.get("is_owned", False),
                added_at=item["added_at"],
            )
            for item in items_data
        ]
        return WatchlistResponse(total=len(items), items=items)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch watchlist: {str(e)}",
        )


@router.post("/watchlist", response_model=WatchlistItemResponse)
def add_to_watchlist(payload: AddWatchlistRequest):
    """
    Add a new stock symbol to the user's watchlist after verifying ticker authenticity.
    """
    clean_ticker = payload.ticker.strip().upper()
    try:
        service = get_watchlist_service()
        item = service.add_to_watchlist(clean_ticker)
        return WatchlistItemResponse(
            id=item["id"],
            ticker=item["ticker"],
            resolved_ticker=item["resolved_ticker"],
            company_name=item["company_name"],
            current_price=item.get("current_price"),
            change=item.get("change"),
            change_percent=item.get("change_percent"),
            is_owned=item.get("is_owned", False),
            added_at=item["added_at"],
        )
    except HTTPException:
        raise
    except ValueError as ve:
        err_msg = str(ve)
        if "already in your watchlist" in err_msg.lower():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=err_msg,
            )
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=err_msg,
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"We couldn't find a listed stock matching '{clean_ticker}'.",
        )


@router.get("/watchlist/{ticker}", response_model=WatchlistItemResponse)
def get_watchlist_item(ticker: str):
    """
    Get a single watchlist item by symbol.
    """
    clean_ticker = ticker.strip().upper()
    try:
        service = get_watchlist_service()
        item = service.get_watchlist_item(clean_ticker)
        return WatchlistItemResponse(
            id=item["id"],
            ticker=item["ticker"],
            resolved_ticker=item["resolved_ticker"],
            company_name=item["company_name"],
            current_price=item.get("current_price"),
            change=item.get("change"),
            change_percent=item.get("change_percent"),
            is_owned=item.get("is_owned", False),
            added_at=item["added_at"],
        )
    except HTTPException:
        raise
    except ValueError as ve:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(ve),
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch watchlist item '{clean_ticker}': {str(e)}",
        )


@router.delete("/watchlist/{ticker}", response_model=MessageResponse)
def delete_from_watchlist(ticker: str):
    """
    Remove a stock symbol from the user's watchlist without affecting portfolio holdings.
    """
    clean_ticker = ticker.strip().upper()
    try:
        service = get_watchlist_service()
        service.delete_from_watchlist(clean_ticker)
        return MessageResponse(
            status="success",
            message=f"Stock '{clean_ticker}' was removed from your watchlist.",
        )
    except HTTPException:
        raise
    except ValueError as ve:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(ve),
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to remove '{clean_ticker}' from watchlist: {str(e)}",
        )


# -------------------------------------------------------------------------
# AI Investment Intelligence Endpoints
# -------------------------------------------------------------------------

@router.get("/intelligence/opportunities", response_model=OpportunitiesListResponse)
def get_investment_opportunities(
    limit: int = 30,
    offset: int = 0,
    recommendation: Optional[str] = None,
    sector: Optional[str] = None,
    search: Optional[str] = None,
):
    """
    Retrieve structured multi-factor AI investment opportunities discovered across the NSE universe.
    """
    try:
        engine = get_intelligence_engine()
        items = engine.get_opportunities(
            limit=limit,
            offset=offset,
            recommendation=recommendation,
            sector=sector,
            search=search,
            auto_scan_if_empty=True,
        )
        return OpportunitiesListResponse(
            total=len(items),
            opportunities=[
                InvestmentOpportunityResponse(
                    id=opp.id,
                    ticker=opp.ticker,
                    company_name=opp.company_name,
                    sector=opp.sector,
                    industry=opp.industry,
                    recommendation=opp.recommendation.value,
                    conviction_score=opp.conviction_score,
                    time_horizon=opp.time_horizon,
                    current_price=opp.current_price,
                    news_id=opp.news_id,
                    news_title=opp.news_title,
                    news_source=opp.news_source,
                    news_published_at=opp.news_published_at,
                    event_summary=opp.event_summary,
                    impact_direction=opp.impact_direction,
                    impact_strength=opp.impact_strength,
                    transmission_mechanism=opp.transmission_mechanism,
                    scores=IntelligenceScoreBreakdownResponse(**opp.to_dict()["scores"]),
                    metrics=IntelligenceMetricsResponse(**opp.to_dict()["metrics"]),
                    hard_gates_triggered=[
                        HardGateTriggerResponse(**g) for g in opp.to_dict()["hard_gates_triggered"]
                    ],
                    is_owned=opp.is_owned,
                    portfolio_quantity=opp.portfolio_quantity,
                    portfolio_avg_buy_price=opp.portfolio_avg_buy_price,
                    portfolio_allocation_pct=opp.portfolio_allocation_pct,
                    investment_thesis=opp.investment_thesis,
                    key_catalysts=opp.key_catalysts,
                    key_risks=opp.key_risks,
                    thesis_invalidation_triggers=opp.thesis_invalidation_triggers,
                    created_at=opp.created_at,
                )
                for opp in items
            ],
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch investment opportunities: {str(e)}",
        )


@router.get("/intelligence/opportunity/{opp_id}", response_model=InvestmentOpportunityResponse)
def get_opportunity_detail(opp_id: int):
    """
    Retrieve single comprehensive investment opportunity by ID with full chain of evidence.
    """
    try:
        engine = get_intelligence_engine()
        opp = engine.get_opportunity_by_id(opp_id)
        if not opp:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Investment opportunity with ID {opp_id} not found.",
            )
        return InvestmentOpportunityResponse(
            id=opp.id,
            ticker=opp.ticker,
            company_name=opp.company_name,
            sector=opp.sector,
            industry=opp.industry,
            recommendation=opp.recommendation.value,
            conviction_score=opp.conviction_score,
            time_horizon=opp.time_horizon,
            current_price=opp.current_price,
            news_id=opp.news_id,
            news_title=opp.news_title,
            news_source=opp.news_source,
            news_published_at=opp.news_published_at,
            event_summary=opp.event_summary,
            impact_direction=opp.impact_direction,
            impact_strength=opp.impact_strength,
            transmission_mechanism=opp.transmission_mechanism,
            scores=IntelligenceScoreBreakdownResponse(**opp.to_dict()["scores"]),
            metrics=IntelligenceMetricsResponse(**opp.to_dict()["metrics"]),
            hard_gates_triggered=[
                HardGateTriggerResponse(**g) for g in opp.to_dict()["hard_gates_triggered"]
            ],
            is_owned=opp.is_owned,
            portfolio_quantity=opp.portfolio_quantity,
            portfolio_avg_buy_price=opp.portfolio_avg_buy_price,
            portfolio_allocation_pct=opp.portfolio_allocation_pct,
            investment_thesis=opp.investment_thesis,
            key_catalysts=opp.key_catalysts,
            key_risks=opp.key_risks,
            thesis_invalidation_triggers=opp.thesis_invalidation_triggers,
            created_at=opp.created_at,
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch opportunity details: {str(e)}",
        )


@router.post("/intelligence/scan", response_model=OpportunitiesListResponse)
def trigger_intelligence_scan(max_articles: int = 4):
    """
    Trigger real-time scanning of latest financial news across the NSE universe.
    """
    try:
        engine = get_intelligence_engine()
        engine.scan_and_generate_opportunities(max_articles=max_articles)
        items = engine.get_opportunities(limit=50, auto_scan_if_empty=False)
        return OpportunitiesListResponse(
            total=len(items),
            opportunities=[
                InvestmentOpportunityResponse(
                    id=opp.id,
                    ticker=opp.ticker,
                    company_name=opp.company_name,
                    sector=opp.sector,
                    industry=opp.industry,
                    recommendation=opp.recommendation.value,
                    conviction_score=opp.conviction_score,
                    time_horizon=opp.time_horizon,
                    current_price=opp.current_price,
                    news_id=opp.news_id,
                    news_title=opp.news_title,
                    news_source=opp.news_source,
                    news_published_at=opp.news_published_at,
                    event_summary=opp.event_summary,
                    impact_direction=opp.impact_direction,
                    impact_strength=opp.impact_strength,
                    transmission_mechanism=opp.transmission_mechanism,
                    scores=IntelligenceScoreBreakdownResponse(**opp.to_dict()["scores"]),
                    metrics=IntelligenceMetricsResponse(**opp.to_dict()["metrics"]),
                    hard_gates_triggered=[
                        HardGateTriggerResponse(**g) for g in opp.to_dict()["hard_gates_triggered"]
                    ],
                    is_owned=opp.is_owned,
                    portfolio_quantity=opp.portfolio_quantity,
                    portfolio_avg_buy_price=opp.portfolio_avg_buy_price,
                    portfolio_allocation_pct=opp.portfolio_allocation_pct,
                    investment_thesis=opp.investment_thesis,
                    key_catalysts=opp.key_catalysts,
                    key_risks=opp.key_risks,
                    thesis_invalidation_triggers=opp.thesis_invalidation_triggers,
                    created_at=opp.created_at,
                )
                for opp in items
            ],
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to execute intelligence scan: {str(e)}",
        )

