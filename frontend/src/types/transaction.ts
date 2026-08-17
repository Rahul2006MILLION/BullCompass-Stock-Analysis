export interface Transaction {
  id: number;
  ticker: string;
  transaction_type: "BUY" | "SELL" | string;
  quantity: number;
  price: number;
  average_cost: number | null;
  total_amount: number;
  profit_loss: number | null;
  transaction_date: string;
}
