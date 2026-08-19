"use client";

import React from "react";
import {
  InvestmentOpportunity,
  RecommendationType,
} from "@/types/intelligence";
import {
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  ShieldCheck,
  Building,
  DollarSign,
  Activity,
  ArrowRight,
  X,
  Target,
  FileText,
} from "lucide-react";

interface OpportunityDetailModalProps {
  opportunity: InvestmentOpportunity | null;
  onClose: () => void;
}

export const OpportunityDetailModal: React.FC<OpportunityDetailModalProps> = ({
  opportunity,
  onClose,
}) => {
  if (!opportunity) return null;

  const getRecBadgeClass = (rec: RecommendationType) => {
    switch (rec) {
      case "BUY":
      case "BUY MORE":
        return "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm shadow-emerald-950";
      case "HOLD":
        return "bg-sky-500/20 text-sky-400 border border-sky-500/40";
      case "WATCH":
        return "bg-amber-500/20 text-amber-400 border border-amber-500/40";
      case "REDUCE":
      case "SELL":
        return "bg-rose-500/20 text-rose-400 border border-rose-500/40 shadow-sm shadow-rose-950";
      case "AVOID":
        return "bg-gray-700/40 text-gray-400 border border-gray-600/40";
      default:
        return "bg-gray-800 text-gray-300 border border-gray-700";
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 75) return "text-emerald-400";
    if (score >= 55) return "text-sky-400";
    if (score >= 40) return "text-amber-400";
    return "text-rose-400";
  };

  const getValuationStatus = (valScore: number, pe: number | null) => {
    if (pe && pe > 85) return "Extremely Overvalued";
    if (valScore >= 75) return "Attractive / Undervalued";
    if (valScore >= 50) return "Fairly Valued";
    if (valScore >= 35) return "Expensive";
    return "Extremely Overvalued";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-5xl max-h-[92vh] bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-y-auto text-slate-100 flex flex-col">
        {/* Header */}
        <div className="sticky top-0 z-20 flex items-center justify-between px-6 py-4 bg-slate-900/95 backdrop-blur border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex flex-col">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl font-black tracking-tight text-white">
                  {opportunity.ticker}
                </span>
                <span
                  className={`px-3 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${getRecBadgeClass(
                    opportunity.recommendation
                  )}`}
                >
                  {opportunity.recommendation}
                </span>
                {opportunity.is_owned ? (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    ⚡ In Portfolio ({(opportunity.portfolio_allocation_pct || 0).toFixed(1)}% Allocation)
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                    🔥 Universe Discovery
                  </span>
                )}
              </div>
              <span className="text-sm font-medium text-slate-400">
                {opportunity.company_name} • {opportunity.sector} ({opportunity.industry})
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <div className="text-xs text-slate-400 uppercase font-semibold">Current Price</div>
              <div className="text-xl font-bold text-white">
                ₹{opportunity.current_price.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6">
          {/* Institutional Causal Reasoning Chain */}
          <div className="p-4 bg-slate-800/40 border border-slate-700/60 rounded-xl space-y-3">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Target className="w-4 h-4 text-emerald-400" />
              <span>Complete Institutional Causal Transmission Chain</span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2 text-center text-xs">
              <div className="p-2 bg-slate-900/80 border border-slate-800 rounded-lg">
                <div className="text-[10px] text-slate-500 uppercase font-bold">1. News</div>
                <div className="text-xs font-semibold text-slate-300 truncate mt-1">Source</div>
              </div>
              <div className="p-2 bg-slate-900/80 border border-slate-800 rounded-lg">
                <div className="text-[10px] text-slate-500 uppercase font-bold">2. Event</div>
                <div className="text-xs font-semibold text-emerald-400 truncate mt-1">{opportunity.impact_direction}</div>
              </div>
              <div className="p-2 bg-slate-900/80 border border-slate-800 rounded-lg">
                <div className="text-[10px] text-slate-500 uppercase font-bold">3. Sector</div>
                <div className="text-xs font-semibold text-slate-300 truncate mt-1">{opportunity.sector}</div>
              </div>
              <div className="p-2 bg-slate-900/80 border border-slate-800 rounded-lg">
                <div className="text-[10px] text-slate-500 uppercase font-bold">4. Company</div>
                <div className="text-xs font-semibold text-white truncate mt-1">{opportunity.ticker}</div>
              </div>
              <div className="p-2 bg-slate-900/80 border border-slate-800 rounded-lg">
                <div className="text-[10px] text-slate-500 uppercase font-bold">5. Fundamentals</div>
                <div className="text-xs font-semibold text-sky-400 truncate mt-1">{opportunity.scores.fundamental_score}/100</div>
              </div>
              <div className="p-2 bg-slate-900/80 border border-slate-800 rounded-lg">
                <div className="text-[10px] text-slate-500 uppercase font-bold">6. Valuation</div>
                <div className="text-xs font-semibold text-amber-400 truncate mt-1">{getValuationStatus(opportunity.scores.valuation_score, opportunity.metrics.pe_ratio)}</div>
              </div>
              <div className="p-2 bg-slate-900/80 border border-slate-800 rounded-lg">
                <div className="text-[10px] text-slate-500 uppercase font-bold">7. Price (5D)</div>
                <div className="text-xs font-semibold text-slate-300 truncate mt-1">
                  {opportunity.metrics.price_change_5d !== null ? `${opportunity.metrics.price_change_5d > 0 ? "+" : ""}${opportunity.metrics.price_change_5d}%` : "0.0%"}
                </div>
              </div>
              <div className="p-2 bg-emerald-950/40 border border-emerald-500/40 rounded-lg">
                <div className="text-[10px] text-emerald-400 uppercase font-bold">8. Suggestion</div>
                <div className="text-xs font-bold text-emerald-300 truncate mt-1">{opportunity.recommendation}</div>
              </div>
            </div>
          </div>

          {/* Top Multi-Factor Conviction Dashboard */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="p-3.5 bg-slate-800/60 border border-slate-700/60 rounded-xl">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Overall Conviction
              </div>
              <div className={`text-2xl font-black mt-1 ${getScoreColor(opportunity.conviction_score)}`}>
                {opportunity.conviction_score}
                <span className="text-xs font-normal text-slate-400">/100</span>
              </div>
            </div>

            <div className="p-3.5 bg-slate-800/60 border border-slate-700/60 rounded-xl">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Fundamental
              </div>
              <div className={`text-2xl font-black mt-1 ${getScoreColor(opportunity.scores.fundamental_score)}`}>
                {opportunity.scores.fundamental_score}
                <span className="text-xs font-normal text-slate-400">/100</span>
              </div>
            </div>

            <div className="p-3.5 bg-slate-800/60 border border-slate-700/60 rounded-xl">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Cash Conversion
              </div>
              <div className={`text-2xl font-black mt-1 ${getScoreColor(opportunity.scores.earnings_quality_score)}`}>
                {opportunity.scores.earnings_quality_score}
                <span className="text-xs font-normal text-slate-400">/100</span>
              </div>
            </div>

            <div className="p-3.5 bg-slate-800/60 border border-slate-700/60 rounded-xl">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Valuation
              </div>
              <div className={`text-2xl font-black mt-1 ${getScoreColor(opportunity.scores.valuation_score)}`}>
                {opportunity.scores.valuation_score}
                <span className="text-xs font-normal text-slate-400">/100</span>
              </div>
            </div>

            <div className="p-3.5 bg-slate-800/60 border border-slate-700/60 rounded-xl">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                5D Reaction
              </div>
              <div className={`text-2xl font-black mt-1 ${getScoreColor(opportunity.scores.price_reaction_score)}`}>
                {opportunity.metrics.price_change_5d !== null
                  ? `${opportunity.metrics.price_change_5d > 0 ? "+" : ""}${opportunity.metrics.price_change_5d}%`
                  : "N/A"}
              </div>
            </div>

            <div className="p-3.5 bg-slate-800/60 border border-slate-700/60 rounded-xl">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Time Horizon
              </div>
              <div className="text-sm font-bold text-white mt-1.5 truncate">
                {opportunity.time_horizon}
              </div>
            </div>
          </div>

          {/* Hard Risk Gates Banner */}
          {opportunity.hard_gates_triggered.length > 0 ? (
            <div className="p-4 bg-amber-950/30 border border-amber-500/40 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>Active Risk Gates Triggered ({opportunity.hard_gates_triggered.length})</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {opportunity.hard_gates_triggered.map((gate, idx) => (
                  <div key={idx} className="p-2.5 bg-slate-900/80 border border-amber-500/20 rounded-lg text-xs">
                    <div className="font-semibold text-amber-300">{gate.gate_name}</div>
                    <div className="text-slate-300 mt-0.5">{gate.description}</div>
                    <div className="text-amber-400/90 font-medium mt-1">Impact: {gate.impact_on_decision}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-4 py-2.5 bg-emerald-950/20 border border-emerald-500/30 rounded-xl text-xs font-semibold text-emerald-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>All Hard Risk Gates Cleared — Fundamentals, Cash Flows & Valuation Pass Institutional Checks</span>
            </div>
          )}

          {/* Triggering News Catalyst & Economic Transmission */}
          <div className="p-5 bg-slate-800/40 border border-slate-700/60 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Triggering Catalyst Event
              </span>
              <span className="text-xs text-slate-500">
                {opportunity.news_source} • {opportunity.news_published_at}
              </span>
            </div>
            <h4 className="text-base font-bold text-white">
              {opportunity.news_title}
            </h4>
            <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg space-y-1.5 text-xs">
              <div className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                Economic Transmission Mechanism:
              </div>
              <div className="text-slate-200 leading-relaxed font-medium">
                {opportunity.transmission_mechanism}
              </div>
            </div>
          </div>

          {/* Institutional Investment Thesis */}
          <div className="p-5 bg-gradient-to-br from-slate-800/80 to-slate-900 border border-slate-700 rounded-xl space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-emerald-400" />
              <span>Synthesized Investment Thesis</span>
            </div>
            <p className="text-sm leading-relaxed text-slate-200">
              {opportunity.investment_thesis}
            </p>
          </div>

          {/* Audited Multi-Year Fundamentals Matrix */}
          <div className="space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Deterministic Fundamentals & Valuation Data
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              <div className="p-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-xs">
                <div className="text-slate-400">3Y Revenue CAGR</div>
                <div className="text-base font-bold text-white mt-1">
                  {opportunity.metrics.revenue_cagr_3y !== null ? `${opportunity.metrics.revenue_cagr_3y}%` : "N/A"}
                </div>
              </div>
              <div className="p-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-xs">
                <div className="text-slate-400">3Y Net Profit CAGR</div>
                <div className="text-base font-bold text-white mt-1">
                  {opportunity.metrics.profit_cagr_3y !== null ? `${opportunity.metrics.profit_cagr_3y}%` : "N/A"}
                </div>
              </div>
              <div className="p-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-xs">
                <div className="text-slate-400">Operating Margin</div>
                <div className="text-base font-bold text-white mt-1">
                  {opportunity.metrics.operating_margin !== null ? `${opportunity.metrics.operating_margin}%` : "N/A"}
                </div>
              </div>
              <div className="p-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-xs">
                <div className="text-slate-400">ROCE / ROE</div>
                <div className="text-base font-bold text-white mt-1">
                  {opportunity.metrics.roce !== null ? `${opportunity.metrics.roce}%` : "N/A"} / {opportunity.metrics.roe !== null ? `${opportunity.metrics.roe}%` : "N/A"}
                </div>
              </div>
              <div className="p-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-xs">
                <div className="text-slate-400">Debt / Equity</div>
                <div className="text-base font-bold text-white mt-1">
                  {opportunity.metrics.debt_to_equity !== null ? `${opportunity.metrics.debt_to_equity}x` : "0.0x"}
                </div>
              </div>
              <div className="p-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-xs">
                <div className="text-slate-400">P/E Ratio</div>
                <div className="text-base font-bold text-white mt-1">
                  {opportunity.metrics.pe_ratio !== null ? `${opportunity.metrics.pe_ratio}x` : "N/A"}
                </div>
              </div>
              <div className="p-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-xs">
                <div className="text-slate-400">P/B Ratio</div>
                <div className="text-base font-bold text-white mt-1">
                  {opportunity.metrics.pb_ratio !== null ? `${opportunity.metrics.pb_ratio}x` : "N/A"}
                </div>
              </div>
              <div className="p-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-xs">
                <div className="text-slate-400">CFO / PAT Conversion</div>
                <div className="text-base font-bold text-white mt-1">
                  {opportunity.metrics.cfo_to_pat_ratio !== null ? `${opportunity.metrics.cfo_to_pat_ratio}x` : "N/A"}
                </div>
              </div>
            </div>
          </div>

          {/* Growth Catalysts, Risks, & Thesis Invalidation */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Catalysts */}
            <div className="p-4 bg-slate-800/40 border border-slate-700/60 rounded-xl space-y-2">
              <div className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span>Key Catalysts</span>
              </div>
              <ul className="space-y-1.5 text-xs text-slate-300">
                {opportunity.key_catalysts.map((c, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-emerald-500 font-bold">•</span>
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Key Risks */}
            <div className="p-4 bg-slate-800/40 border border-slate-700/60 rounded-xl space-y-2">
              <div className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <span>Key Risks</span>
              </div>
              <ul className="space-y-1.5 text-xs text-slate-300">
                {opportunity.key_risks.map((r, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-rose-500 font-bold">•</span>
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Invalidation Triggers */}
            <div className="p-4 bg-slate-800/40 border border-slate-700/60 rounded-xl space-y-2">
              <div className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span>Thesis Invalidation Triggers</span>
              </div>
              <ul className="space-y-1.5 text-xs text-slate-300">
                {opportunity.thesis_invalidation_triggers.map((t, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-amber-500 font-bold">•</span>
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 px-6 py-4 bg-slate-900/95 border-t border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Analysis ID: #{opportunity.id} • Generated at {new Date(opportunity.created_at).toLocaleString()}
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors cursor-pointer"
          >
            Close Memo
          </button>
        </div>
      </div>
    </div>
  );
};
