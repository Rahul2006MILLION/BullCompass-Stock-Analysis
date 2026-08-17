export interface HoldingItem {
  id: number | null;
  ticker: string;
  quantity: number;
  average_buy_price: number;
  current_price: number | null;
  invested: number | null;
  current_value: number | null;
  profit: number | null;
  returns: number | null;
}

export interface PortfolioSummary {
  total_holdings: number;
  total_invested: number;
  total_current_value: number;
  total_unrealized_profit: number;
  total_return_percentage: number;
  total_realized_profit: number;
  holdings: HoldingItem[];
}

export interface PortfolioHistorySnapshot {
  id: number | null;
  timestamp: string;
  invested_amount: number;
  net_worth: number;
  profit: number;
  return_percentage: number;
}

export interface BuyStockPayload {
  ticker: string;
  quantity: number;
  buy_price: number;
}

export interface SellStockPayload {
  ticker: string;
  quantity: number;
  selling_price: number;
}

export interface AddHoldingPayload {
  ticker: string;
  quantity: number;
  average_buy_price: number;
}

export interface UpdateHoldingPayload {
  quantity: number;
  average_buy_price: number;
}
