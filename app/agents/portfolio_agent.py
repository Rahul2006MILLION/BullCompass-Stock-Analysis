from datetime import datetime

from app.database.portfolio_history_repository import PortfolioHistoryRepository
from app.database.portfolio_repository import PortfolioRepository
from app.database.portfolio_transaction_repository import PortfolioTransactionRepository
from app.models.portfolio import PortfolioHolding
from app.services.stock_service import StockService


class PortfolioAgent:
    """
    Handles all portfolio-related business logic.
    """

    def __init__(self, repository: PortfolioRepository):
        self.repository = repository
        self.stock_service = StockService()
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
        Return every holding together with live market calculations.
        """

        portfolio = []

        for holding in self.repository.get_holdings():

            try:

                current_price = self.stock_service.get_current_price(
                    holding.ticker + ".NS"
                )

                invested = (
                    holding.quantity
                    * holding.average_buy_price
                )

                current_value = (
                    holding.quantity
                    * current_price
                )

                profit = current_value - invested

                returns = (
                    (profit / invested) * 100
                    if invested > 0
                    else 0
                )

            except Exception:

                current_price = None
                invested = None
                current_value = None
                profit = None
                returns = None

            portfolio.append(
                {
                    "holding": holding,
                    "current_price": current_price,
                    "invested": invested,
                    "current_value": current_value,
                    "profit": profit,
                    "returns": returns,
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
        Save the current portfolio snapshot.
        """

        portfolio = self.get_holdings()

        invested_amount = sum(
            item["invested"] or 0
            for item in portfolio
        )

        net_worth = sum(
            item["current_value"] or 0
            for item in portfolio
        )

        profit = net_worth - invested_amount

        if invested_amount > 0:
            return_percentage = (
                profit / invested_amount
            ) * 100
        else:
            return_percentage = 0

        timestamp = datetime.now().strftime(
            "%Y-%m-%d %H:%M:%S"
        )

        self.history_repository.save_snapshot(
            timestamp=timestamp,
            invested_amount=invested_amount,
            net_worth=net_worth,
            profit=profit,
            return_percentage=return_percentage,
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