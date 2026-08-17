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
