export interface WatchlistItem {
  id: number;
  ticker: string;
  resolved_ticker: string;
  company_name: string;
  current_price: number | null;
  change: number | null;
  change_percent: number | null;
  is_owned: boolean;
  added_at: string;
}

export interface WatchlistResponse {
  total: number;
  items: WatchlistItem[];
}

export interface AddWatchlistPayload {
  ticker: string;
}
