from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
import yfinance as yf

from app.database.watchlist_repository import WatchlistRepository
from app.database.portfolio_repository import PortfolioRepository
from app.services.stock_service import StockService
from app.services.ticker_service import TickerService


class WatchlistService:
    def __init__(
        self,
        repository: Optional[WatchlistRepository] = None,
        portfolio_repo: Optional[PortfolioRepository] = None,
        stock_service: Optional[StockService] = None,
    ):
        self.repository = repository or WatchlistRepository()
        self.portfolio_repo = portfolio_repo or PortfolioRepository()
        self.stock_service = stock_service or StockService()

    @staticmethod
    def normalize_ticker(symbol: str) -> str:
        """
        Normalizes a ticker symbol to a standard base symbol (e.g., 'HDFCBANK.NS' -> 'HDFCBANK').
        """
        clean = symbol.strip().upper()
        if clean.endswith(".NS"):
            clean = clean[:-3]
        return clean

    def add_to_watchlist(self, raw_ticker: str) -> Dict[str, Any]:
        """
        Validates, normalizes, and stores a stock in the user's watchlist.
        Rejects invalid or unresolvable stocks and prevents duplicates.
        """
        normalized_ticker = self.normalize_ticker(raw_ticker)
        if not normalized_ticker:
            raise ValueError("Stock ticker symbol cannot be empty.")

        # Duplicate check
        if self.repository.exists(normalized_ticker):
            raise ValueError(f"Stock '{normalized_ticker}' is already in your watchlist.")

        # Validate stock authenticity and get official corporate name
        company = self.stock_service.get_company_info(normalized_ticker)
        if not company.name or company.current_price <= 0:
            raise ValueError(f"We couldn't find a listed stock matching '{raw_ticker}'.")

        added_at = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")
        item = self.repository.add_stock(
            ticker=normalized_ticker,
            company_name=company.name,
            added_at=added_at,
        )

        owned_tickers = {
            self.normalize_ticker(h.ticker) for h in self.portfolio_repo.get_holdings()
        }

        return {
            "id": item.id,
            "ticker": item.ticker,
            "resolved_ticker": TickerService.resolve(item.ticker),
            "company_name": item.company_name,
            "current_price": company.current_price,
            "change": 0.0,
            "change_percent": 0.0,
            "is_owned": item.ticker in owned_tickers,
            "added_at": item.added_at,
        }

    def get_watchlist(self) -> List[Dict[str, Any]]:
        """
        Retrieves all watchlist items hydrated with live prices, daily changes, and portfolio ownership status.
        """
        items = self.repository.get_all()
        if not items:
            return []

        owned_tickers = {
            self.normalize_ticker(h.ticker) for h in self.portfolio_repo.get_holdings()
        }

        results = []
        for item in items:
            resolved = TickerService.resolve(item.ticker)
            current_price = None
            change = None
            change_percent = None

            try:
                stock = yf.Ticker(resolved)
                info = stock.info or {}
                if isinstance(info, dict):
                    current_price = (
                        info.get("currentPrice")
                        or info.get("regularMarketPrice")
                        or info.get("previousClose")
                    )
                    prev_close = (
                        info.get("previousClose")
                        or info.get("regularMarketPreviousClose")
                    )

                    if current_price and prev_close and prev_close > 0:
                        change = float(current_price) - float(prev_close)
                        change_percent = (change / float(prev_close)) * 100.0

                if current_price is None:
                    current_price = self.stock_service.get_current_price(resolved)
            except Exception:
                pass

            results.append(
                {
                    "id": item.id,
                    "ticker": item.ticker,
                    "resolved_ticker": resolved,
                    "company_name": item.company_name,
                    "current_price": float(current_price) if current_price is not None else None,
                    "change": round(float(change), 2) if change is not None else 0.0,
                    "change_percent": round(float(change_percent), 2) if change_percent is not None else 0.0,
                    "is_owned": item.ticker in owned_tickers,
                    "added_at": item.added_at,
                }
            )

        return results

    def get_watchlist_item(self, raw_ticker: str) -> Dict[str, Any]:
        """
        Retrieves a single watchlist item by symbol.
        """
        normalized_ticker = self.normalize_ticker(raw_ticker)
        item = self.repository.get_by_ticker(normalized_ticker)
        if not item:
            raise ValueError(f"Stock '{normalized_ticker}' was not found in your watchlist.")

        owned_tickers = {
            self.normalize_ticker(h.ticker) for h in self.portfolio_repo.get_holdings()
        }
        resolved = TickerService.resolve(item.ticker)
        company = self.stock_service.get_company_info(item.ticker)

        return {
            "id": item.id,
            "ticker": item.ticker,
            "resolved_ticker": resolved,
            "company_name": item.company_name,
            "current_price": company.current_price,
            "change": 0.0,
            "change_percent": 0.0,
            "is_owned": item.ticker in owned_tickers,
            "added_at": item.added_at,
        }

    def delete_from_watchlist(self, raw_ticker: str) -> bool:
        """
        Removes a stock from the watchlist.
        """
        normalized_ticker = self.normalize_ticker(raw_ticker)
        deleted = self.repository.delete_by_ticker(normalized_ticker)
        if not deleted:
            raise ValueError(f"Stock '{normalized_ticker}' was not found in your watchlist.")
        return True
