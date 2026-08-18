export interface CompanyQuote {
  ticker: string;
  name: string;
  sector: string;
  industry: string;
  country: string;
  currency: string;
  market_cap: number;
  current_price: number;
}

export interface AIAnalysisResult {
  ticker: string;
  company_name?: string;
  analysis: string;
}

export interface QuoteItem {
  ticker: string;
  resolved_ticker: string;
  current_price: number | null;
  previous_close: number | null;
  change: number | null;
  change_percent: number | null;
  timestamp: string;
}

export interface MarketStatus {
  is_open: boolean;
  status: "OPEN" | "CLOSED" | "PRE_OPEN" | "POST_CLOSE" | string;
  current_time_ist: string;
  timezone: string;
}

export interface BatchQuotesResponse {
  quotes: Record<string, QuoteItem>;
  market_status: MarketStatus;
}

