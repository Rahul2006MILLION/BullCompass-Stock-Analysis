import os
import sys
from datetime import datetime, timezone, timedelta

# Ensure python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database.portfolio_repository import PortfolioRepository
from app.services.canonical_valuation_service import CanonicalValuationService
from app.services.market_session import MarketSessionManager, IST

def main():
    print("================================================================================")
    print("BULLCOMPASS - POST-MARKET CLOSE VALUATION & TELEMETRY VERIFICATION")
    print("================================================================================\n")

    repo = PortfolioRepository()
    holdings = repo.get_holdings()
    canonical_svc = CanonicalValuationService.get_instance()
    session_mgr = MarketSessionManager.get_instance()

    session_info = session_mgr.get_session_info()
    print(f"Current IST Time:       {session_info.current_time_ist}")
    print(f"Market Status:          {session_info.status}")
    print(f"Is Market Open:         {session_info.is_open}")
    print(f"Session ID:             {session_info.session_id}")
    print(f"Is Session Frozen:      {session_info.is_frozen}")
    print(f"Next Session Start IST: {session_info.next_session_start_ist}")
    print(f"Total Active Holdings:  {len(holdings)}\n")

    print("--------------------------------------------------------------------------------")
    print("1. DETAILED TELEMETRY LOG FOR EVERY HOLDING (REQUIREMENT 2):")
    print("--------------------------------------------------------------------------------")

    initial_eval = canonical_svc.evaluate_portfolio(holdings)

    for item in initial_eval.holdings:
        t = item.telemetry
        print(f"Holding: {t.symbol:<12} | Token: {t.symbol_token:<6} | LTP: ₹{t.ltp:<9.2f} | PrevClose: ₹{t.close or 0.0:<8.2f} | Source: {t.quote_source}")
        print(f"  ├─ exchFeedTime:           {t.exch_feed_time}")
        print(f"  ├─ exchTradeTime:          {t.exch_trade_time}")
        print(f"  ├─ apiResponseTimestamp:   {t.api_response_timestamp}")
        print(f"  ├─ serverTimestamp:        {t.server_timestamp}")
        print(f"  ├─ cacheTimestamp:         {t.cache_timestamp}")
        print(f"  ├─ sessionState:           {t.session_state} ({t.session_id})")
        print(f"  └─ Price Used For Valuation: ₹{t.price_used_for_valuation:<9.2f} | Qty: {item.holding.quantity:<5} | Value: ₹{item.current_value:<10.2f}\n")

    print("--------------------------------------------------------------------------------")
    print("2. SIMULATING 5 RAPID POLLING CYCLES AFTER MARKET CLOSE:")
    print("--------------------------------------------------------------------------------")

    results = []
    for cycle in range(1, 6):
        eval_res = canonical_svc.evaluate_portfolio(holdings)
        results.append(eval_res)
        print(f"Cycle {cycle:02d} | Source: {eval_res.valuation_source:<14} | Net Worth: ₹{eval_res.total_current_value:10.2f} | Invested: ₹{eval_res.total_invested:10.2f} | P&L: ₹{eval_res.total_unrealized_profit:+10.2f} ({eval_res.total_return_percentage:+.2f}%)")

    # Assert all cycles are 100% identical
    first = results[0]
    for i, r in enumerate(results[1:], start=2):
        assert r.total_current_value == first.total_current_value, f"Cycle {i} value changed!"
        assert r.total_unrealized_profit == first.total_unrealized_profit, f"Cycle {i} P&L changed!"
        assert r.total_invested == first.total_invested, f"Cycle {i} invested changed!"
        for h_idx in range(len(first.holdings)):
            assert r.holdings[h_idx].current_value == first.holdings[h_idx].current_value, f"Holding {first.holdings[h_idx].holding.ticker} value changed!"

    print("\n[SUCCESS] All 5 post-close polling cycles produced 100% identical, frozen valuations!")
    print(f"Mathematical Verification: {first.total_current_value:.2f} - {first.total_invested:.2f} = {first.total_unrealized_profit:.2f} (Delta = {first.total_current_value - first.total_invested - first.total_unrealized_profit:.4f})")
    print("================================================================================\n")

if __name__ == "__main__":
    main()
