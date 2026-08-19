from datetime import datetime
from typing import Optional

from app.database.portfolio_history_repository import PortfolioHistoryRepository
from app.database.portfolio_repository import PortfolioRepository
from app.database.portfolio_transaction_repository import PortfolioTransactionRepository
from app.models.portfolio import PortfolioHolding
from app.services.stock_service import StockService
from app.services.canonical_valuation_service import CanonicalValuationService


class PortfolioAgent:
    """
    Handles all portfolio-related business logic.
    Delegates all valuations to the CanonicalValuationService single source of truth.
    """

    def __init__(
        self,
        repository: PortfolioRepository,
        stock_service: Optional[StockService] = None,
        canonical_service: Optional[CanonicalValuationService] = None,
    ):
        self.repository = repository
        self.stock_service = stock_service or StockService()
        self.canonical_service = canonical_service or CanonicalValuationService.get_instance()
        self.history_repository = PortfolioHistoryRepository()
        self.transaction_repository = PortfolioTransactionRepository()

    def add_holding(
        self,
        ticker: str,
        quantity: float,
        average_buy_price: float,
    ) -> None:

        holding = PortfolioHolding(
            id=None,
            ticker=ticker.upper(),
            quantity=quantity,
            average_buy_price=average_buy_price,
        )

        self.repository.add_holding(holding)

    def get_holdings(self) -> list[dict]:
        """
        Return every holding together with canonical live market calculations.
        """
        holdings = self.repository.get_holdings()
        if not holdings:
            return []

        val_result = self.canonical_service.evaluate_portfolio(holdings)

        portfolio = []
        for item in val_result.holdings:
            portfolio.append(
                {
                    "holding": item.holding,
                    "current_price": item.current_price,
                    "invested": item.invested,
                    "current_value": item.current_value,
                    "profit": item.profit,
                    "returns": item.returns,
                }
            )

        return portfolio

    def update_holding(
        self,
        holding_id: int,
        quantity: float,
        average_buy_price: float,
    ) -> None:
        """
        Update an existing holding.
        """

        self.repository.update_holding(
            holding_id,
            quantity,
            average_buy_price,
        )

    def delete_holding(self, holding_id: int) -> None:
        """
        Delete a holding.
        """

        self.repository.delete_holding(holding_id)

    def save_portfolio_snapshot(self):
        """
        Save the current portfolio snapshot using canonical evaluation.
        """
        holdings = self.repository.get_holdings()
        if not holdings:
            return

        val_result = self.canonical_service.evaluate_portfolio(holdings)

        timestamp = datetime.now().strftime(
            "%Y-%m-%d %H:%M:%S"
        )

        self.history_repository.save_snapshot(
            timestamp=timestamp,
            invested_amount=val_result.total_invested,
            net_worth=val_result.total_current_value,
            profit=val_result.total_unrealized_profit,
            return_percentage=val_result.total_return_percentage,
        )

    def buy_stock(
        self,
        ticker: str,
        quantity: float,
        buy_price: float,
    ):

        ticker = ticker.upper()

        holding = self.repository.get_holding_by_ticker(
            ticker
        )

        if holding is None:

            self.add_holding(
                ticker=ticker,
                quantity=quantity,
                average_buy_price=buy_price,
            )

            average_cost = buy_price

        else:

            total_old_cost = (
                holding.quantity
                * holding.average_buy_price
            )

            total_new_cost = (
                quantity
                * buy_price
            )

            new_quantity = (
                holding.quantity
                + quantity
            )

            new_average = (
                total_old_cost
                + total_new_cost
            ) / new_quantity

            self.repository.update_quantity_and_average(
                ticker=ticker,
                quantity=new_quantity,
                average_buy_price=new_average,
            )

            average_cost = new_average

        self.transaction_repository.save_transaction(
            ticker=ticker,
            transaction_type="BUY",
            quantity=quantity,
            price=buy_price,
            average_cost=average_cost,
            total_amount=quantity * buy_price,
            profit_loss=None,
            transaction_date=datetime.now().strftime(
                "%Y-%m-%d %H:%M:%S"
            ),
        )

        self.save_portfolio_snapshot()

    def sell_stock(
        self,
        ticker: str,
        quantity: float,
        selling_price: float,
    ):

        ticker = ticker.upper()

        holding = self.repository.get_holding_by_ticker(
            ticker
        )

        if holding is None:
            raise ValueError(
                "Stock not found in portfolio."
            )

        if quantity > holding.quantity:
            raise ValueError(
                "Cannot sell more shares than you own."
            )

        profit = (
            selling_price
            - holding.average_buy_price
        ) * quantity

        remaining_quantity = (
            holding.quantity
            - quantity
        )

        if remaining_quantity == 0:

            self.repository.delete_holding_by_ticker(
                ticker
            )

        else:

            self.repository.update_quantity_and_average(
                ticker=ticker,
                quantity=remaining_quantity,
                average_buy_price=holding.average_buy_price,
            )

        self.transaction_repository.save_transaction(
            ticker=ticker,
            transaction_type="SELL",
            quantity=quantity,
            price=selling_price,
            average_cost=holding.average_buy_price,
            total_amount=quantity * selling_price,
            profit_loss=profit,
            transaction_date=datetime.now().strftime(
                "%Y-%m-%d %H:%M:%S"
            ),
        )

        self.save_portfolio_snapshot()