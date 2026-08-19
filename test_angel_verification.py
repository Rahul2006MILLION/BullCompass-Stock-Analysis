import sys
from app.services.market_data.factory import get_market_data_provider
from app.services.stock_service import StockService
from app.database.portfolio_repository import PortfolioRepository
from app.agents.portfolio_agent import PortfolioAgent


def test_stocks_verification():
    print("=" * 60)
    print("ANGEL ONE SMARTAPI LIVE QUOTE VERIFICATION")
    print("=" * 60)

    stock_service = StockService()
    test_tickers = [
        "MRF",
        "NITCO",
        "HDFCBANK",
        "INFY",
        "TCS",
        "RELIANCE",
        "ADANIPOWER",
        "SUZLON",
    ]

    quotes_map = stock_service.get_batch_quotes(test_tickers)

    for ticker in test_tickers:
        q = quotes_map.get(ticker, {})
        print(f"\nTicker: {ticker}")
        print(f"  provider: {q.get('provider')}")
        print(f"  tradingSymbol: {q.get('trading_symbol')}")
        print(f"  symbolToken: {q.get('symbol_token')}")
        print(f"  LTP: ₹{q.get('ltp'):,}" if q.get('ltp') else f"  LTP: None")
        print(f"  Bid: ₹{q.get('bid'):,}" if q.get('bid') else f"  Bid: None")
        print(f"  Ask: ₹{q.get('ask'):,}" if q.get('ask') else f"  Ask: None")
        print(f"  Previous Close: ₹{q.get('previous_close'):,}" if q.get('previous_close') else f"  Previous Close: None")
        print(f"  Timestamp: {q.get('timestamp')}")
        print(f"  price_used_by_bullcompass: LTP (₹{q.get('current_price'):,})" if q.get('current_price') else "  price_used_by_bullcompass: LTP")

    print("\n" + "=" * 60)
    print("PORTFOLIO LIVE VALUATION VERIFICATION (USING ANGEL ONE LTP)")
    print("=" * 60)

    repo = PortfolioRepository()
    agent = PortfolioAgent(repository=repo)
    holdings = agent.get_holdings()

    if not holdings:
        print("No active portfolio holdings in database.")
    else:
        print(f"Total active holdings: {len(holdings)}")
        total_invested = 0.0
        total_current_val = 0.0
        for h in holdings:
            holding_obj = h["holding"]
            curr_price = h["current_price"]
            inv = h["invested"] or 0.0
            cur = h["current_value"] or 0.0
            profit = h["profit"] or 0.0
            returns = h["returns"] or 0.0
            total_invested += inv
            total_current_val += cur

            print(f"\nHolding: {holding_obj.ticker}")
            print(f"  Quantity: {holding_obj.quantity}")
            print(f"  Average Buy Price: ₹{holding_obj.average_buy_price:,.2f}")
            print(f"  Live LTP Price: ₹{curr_price:,.2f}" if curr_price else "  Live LTP Price: N/A")
            print(f"  Invested Amount: ₹{inv:,.2f}")
            print(f"  Current Value (qty × LTP): ₹{cur:,.2f}")
            print(f"  Unrealized P&L: ₹{profit:,.2f} ({returns:.2f}%)")

        total_unrealized = total_current_val - total_invested
        total_ret_pct = (total_unrealized / total_invested * 100.0) if total_invested > 0 else 0.0
        print("\n" + "-" * 60)
        print(f"Portfolio Total Invested: ₹{total_invested:,.2f}")
        print(f"Portfolio Total Current Value: ₹{total_current_val:,.2f}")
        print(f"Portfolio Total Unrealized P&L: ₹{total_unrealized:,.2f} ({total_ret_pct:.2f}%)")
        print("=" * 60)


if __name__ == "__main__":
    test_stocks_verification()
