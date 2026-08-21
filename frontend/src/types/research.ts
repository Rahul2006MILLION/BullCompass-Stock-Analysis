export type DecisionRating =
  | "STRONG BUY"
  | "BUY"
  | "ACCUMULATE"
  | "HOLD"
  | "WATCH"
  | "REDUCE"
  | "SELL"
  | "AVOID"
  | "STRONG BUY CANDIDATE"
  | "BUY CANDIDATE"
  | "HOLD / WATCH"
  | "INSUFFICIENT DATA";

export type ValuationStatus =
  | "UNDERVALUED"
  | "FAIRLY VALUED"
  | "EXPENSIVE"
  | "EXTREMELY OVERVALUED"
  | "POTENTIALLY UNDERVALUED"
  | "POTENTIALLY EXPENSIVE"
  | "INSUFFICIENT DATA";

export type ConfidenceLevel = "HIGH" | "MEDIUM" | "LOW";

export type MarginOfSafety = "HIGH" | "MEDIUM" | "LOW";

export type RiskSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

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

// -------------------------------------------------------------
// Upgraded Structured Research Sub-Models
// -------------------------------------------------------------

export interface PriceMomentumContext {
  current_price: number;
  price_change_1d?: number;
  price_change_5d?: number;
  price_change_20d?: number;
  fifty_two_week_high?: number | null;
  fifty_two_week_low?: number | null;
  distance_from_52w_high_pct?: number | null;
  technical_stance: "OVERHEATED" | "PULLBACK_ENTRY" | "MOMENTUM_EXPANDING" | "NEUTRAL" | "HEAVY_SELLING" | string;
  interpretation: string;
}

export interface BusinessQualityAssessment {
  score: number;
  revenue_consistency: "EXCELLENT" | "GOOD" | "ERRATIC" | "POOR" | string;
  margin_stability: "STABLE_EXPANDING" | "STABLE" | "VOLATILE" | "COMPRESSING" | string;
  capital_intensity: "LOW_ASSET_LIGHT" | "MODERATE" | "HIGH_CAPEX_HEAVY" | string;
  cyclicality: "NON_CYCLICAL_DEFENSIVE" | "MODERATELY_CYCLICAL" | "HIGHLY_CYCLICAL" | string;
  moat_rating: "WIDE_MOAT" | "NARROW_MOAT" | "NO_MOAT" | string;
  summary: string;
}

export interface FinancialHealthAssessment {
  solvency_score: number;
  total_debt_cr?: number | null;
  cash_and_equivalents_cr?: number | null;
  net_debt_cr?: number | null;
  debt_to_equity?: number | null;
  current_ratio?: number | null;
  interest_coverage?: number | null;
  balance_sheet_stance: "FORTRESS_CASH_RICH" | "HEALTHY_DELEVERAGED" | "MODERATE_LEVERAGE" | "HIGH_RISK_OVERLEVERAGED" | string;
  summary: string;
}

export interface EarningsQualityAssessment {
  quality_status: "HIGH_QUALITY_CONVERTING" | "MODERATE" | "EARNINGS_QUALITY_WARNING" | "CRITICAL_CASH_DIVERGENCE" | string;
  cfo_to_pat_ratio?: number | null;
  fcf_conversion_pct?: number | null;
  pat_vs_cfo_trend: string;
  margin_vs_revenue_trajectory: string;
  warning_flags: string[];
  summary: string;
}

export interface ValuationAssessment {
  valuation_tier: ValuationStatus | string;
  pe_ratio?: number | null;
  forward_pe?: number | null;
  pb_ratio?: number | null;
  ev_to_ebitda?: number | null;
  peg_ratio?: number | null;
  dividend_yield?: number | null;
  valuation_rationale: string;
}

export interface NewsCausalItem {
  headline: string;
  source: string;
  published_at: string;
  importance: string;
  event_summary: string;
  economic_transmission_mechanism: string;
  revenue_margin_impact: string;
  catalyst_durability: "STRUCTURAL" | "TEMPORARY" | string;
}

export interface SectorMacroContext {
  key_drivers: string[];
  macro_sensitivity: string;
  tailwinds: string[];
  headwinds: string[];
  summary: string;
}

export interface ScenarioCase {
  scenario_title: string;
  probability_pct: number;
  assumptions: string[];
  growth_margin_projection: string;
  expected_return_stance: string;
  summary: string;
}

export interface ScenarioAnalysis {
  bull_case: ScenarioCase;
  base_case: ScenarioCase;
  bear_case: ScenarioCase;
}

export interface RiskItem {
  category: "BUSINESS" | "FINANCIAL" | "VALUATION" | "MACRO" | "REGULATORY" | "EVENT" | string;
  title: string;
  severity: RiskSeverity;
  rationale: string;
}

export interface RiskAnalysisMatrix {
  risks: RiskItem[];
  primary_vulnerability: string;
}

export interface ThesisInvalidationTriggers {
  triggers: string[];
  quantifiable_thresholds: string[];
}

export interface PortfolioContext {
  is_owned: boolean;
  quantity?: number | null;
  average_buy_price?: number | null;
  current_price: number;
  invested_value?: number | null;
  current_value?: number | null;
  unrealized_pnl?: number | null;
  unrealized_pnl_pct?: number | null;
  portfolio_allocation_pct?: number | null;
  concentration_risk_flag: boolean;
  recommended_action: "BUY MORE" | "HOLD" | "REDUCE" | "SELL" | "BUY" | "WATCH" | "AVOID" | string;
  action_reasoning: string;
}

export interface FinalVerdict {
  verdict: DecisionRating;
  conviction_score: number;
  time_horizon: string;
  margin_of_safety: MarginOfSafety;
  executive_summary: string;
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

  // Structured Institutional Research Extensions
  price_momentum?: PriceMomentumContext;
  business_quality?: BusinessQualityAssessment;
  financial_health?: FinancialHealthAssessment;
  earnings_quality?: EarningsQualityAssessment;
  valuation_assessment?: ValuationAssessment;
  news_causal_analysis?: NewsCausalItem[];
  sector_macro?: SectorMacroContext;
  scenario_analysis?: ScenarioAnalysis;
  risk_matrix?: RiskAnalysisMatrix;
  thesis_invalidation?: ThesisInvalidationTriggers;
  portfolio_context?: PortfolioContext;
  final_verdict?: FinalVerdict;
}
