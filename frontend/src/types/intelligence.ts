export type RecommendationType =
  | "BUY"
  | "BUY MORE"
  | "HOLD"
  | "WATCH"
  | "REDUCE"
  | "SELL"
  | "AVOID";

export interface IntelligenceScoreBreakdown {
  fundamental_score: number;
  earnings_quality_score: number;
  valuation_score: number;
  price_reaction_score: number;
  news_catalyst_score: number;
  overall_conviction: number;
}

export interface IntelligenceMetrics {
  revenue_cagr_3y: number | null;
  profit_cagr_3y: number | null;
  operating_margin: number | null;
  net_margin: number | null;
  roe: number | null;
  roce: number | null;
  debt_to_equity: number | null;
  pe_ratio: number | null;
  pb_ratio: number | null;
  ev_to_ebitda: number | null;
  cfo_to_pat_ratio: number | null;
  price_change_5d: number | null;
  current_price: number;
  market_cap_cr: number;
}

export interface HardGateTrigger {
  gate_name: string;
  description: string;
  impact_on_decision: string;
}

export interface InvestmentOpportunity {
  id: number;
  ticker: string;
  company_name: string;
  sector: string;
  industry: string;
  recommendation: RecommendationType;
  conviction_score: number;
  time_horizon: string;
  current_price: number;
  news_id: string | null;
  news_title: string;
  news_source: string;
  news_published_at: string;
  event_summary: string;
  impact_direction: string;
  impact_strength: number;
  transmission_mechanism: string;
  scores: IntelligenceScoreBreakdown;
  metrics: IntelligenceMetrics;
  hard_gates_triggered: HardGateTrigger[];
  is_owned: boolean;
  portfolio_quantity: number | null;
  portfolio_avg_buy_price: number | null;
  portfolio_allocation_pct: number | null;
  investment_thesis: string;
  key_catalysts: string[];
  key_risks: string[];
  thesis_invalidation_triggers: string[];
  created_at: string;
}

export interface OpportunitiesListResponse {
  total: number;
  opportunities: InvestmentOpportunity[];
}
