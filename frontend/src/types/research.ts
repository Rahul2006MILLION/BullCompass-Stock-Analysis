export type DecisionRating =
  | "STRONG BUY CANDIDATE"
  | "BUY CANDIDATE"
  | "HOLD / WATCH"
  | "AVOID"
  | "INSUFFICIENT DATA";

export type ValuationStatus =
  | "POTENTIALLY UNDERVALUED"
  | "FAIRLY VALUED"
  | "POTENTIALLY EXPENSIVE"
  | "INSUFFICIENT DATA";

export type ConfidenceLevel = "HIGH" | "MEDIUM" | "LOW";

export interface IncomeStatementData {
  years: string[];
  revenue: Record<string, number | null>;
  operating_income: Record<string, number | null>;
  operating_margin: Record<string, number | null>;
  ebitda: Record<string, number | null>;
  ebitda_margin: Record<string, number | null>;
  net_income: Record<string, number | null>;
  net_margin: Record<string, number | null>;
  eps: Record<string, number | null>;
  revenue_cagr_3y?: number | null;
  net_profit_cagr_3y?: number | null;
}

export interface BalanceSheetData {
  years: string[];
  is_financial_institution: boolean;
  total_assets: Record<string, number | null>;
  total_liabilities: Record<string, number | null>;
  total_equity: Record<string, number | null>;
  cash_and_equivalents: Record<string, number | null>;
  total_debt: Record<string, number | null>;
  net_debt: Record<string, number | null>;
  debt_to_equity?: number | null;
  current_ratio?: number | null;
  deposits?: Record<string, number | null>;
  advances?: Record<string, number | null>;
}

export interface CashFlowData {
  years: string[];
  is_applicable: boolean;
  operating_cash_flow: Record<string, number | null>;
  capital_expenditure: Record<string, number | null>;
  free_cash_flow: Record<string, number | null>;
  fcf_conversion?: number | null;
  cash_flow_quality_flag: string;
}

export interface KeyRatiosData {
  pe_ratio?: number | null;
  forward_pe?: number | null;
  pb_ratio?: number | null;
  ev_to_ebitda?: number | null;
  roe?: number | null;
  roce?: number | null;
  roa?: number | null;
  debt_to_equity?: number | null;
  current_ratio?: number | null;
  operating_margin?: number | null;
  net_margin?: number | null;
  revenue_growth_yoy?: number | null;
  earnings_growth_yoy?: number | null;
  dividend_yield?: number | null;
}

export interface HistoricalTrendsData {
  revenue_trend: string;
  profit_trend: string;
  margin_trend: string;
  roe_trend: string;
  debt_trend: string;
  cash_flow_trend: string;
}

export interface QualityScoreBreakdown {
  business_quality: number;
  financial_strength: number;
  growth: number;
  profitability: number;
  cash_generation: number;
  valuation: number;
  risk_profile: number;
  total_score: number;
}

export interface InvestmentDecisionResult {
  decision: DecisionRating;
  fundamental_score: number;
  score_breakdown: QualityScoreBreakdown;
  data_confidence: ConfidenceLevel;
  valuation_status: ValuationStatus;
  key_strengths: string[];
  key_concerns: string[];
  is_bank: boolean;
}

export interface RecentNewsItem {
  title: string;
  source: string;
  published_at: string;
  importance: string;
  summary: string;
}

export interface ComprehensiveResearchReport {
  ticker: string;
  company_name: string;
  sector: string;
  industry: string;
  currency: string;
  current_price: number;
  market_cap: number;
  income_statement: IncomeStatementData;
  balance_sheet: BalanceSheetData;
  cash_flow: CashFlowData;
  ratios: KeyRatiosData;
  historical_trends: HistoricalTrendsData;
  decision: InvestmentDecisionResult;
  recent_news: RecentNewsItem[];
  ai_thesis_report: string;
  generated_at: string;
  ollama_status: "ONLINE" | "OFFLINE_FALLBACK";
}
