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
  Clock,
  Layers,
  Compass,
  Zap,
  Globe,
  Radio,
  BarChart2,
  Calendar,
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
        return "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm shadow-emerald-950";
      case "BUY MORE":
        return "bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-sm shadow-cyan-950";
      case "HOLD":
        return "bg-blue-500/20 text-blue-300 border-blue-500/40";
      case "WATCH":
        return "bg-amber-500/20 text-amber-300 border-amber-500/40";
      case "REDUCE":
        return "bg-orange-500/20 text-orange-300 border-orange-500/40";
      case "SELL":
        return "bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-sm shadow-rose-950";
      case "AVOID":
        return "bg-purple-500/20 text-purple-300 border-purple-500/40";
      default:
        return "bg-zinc-800 text-zinc-300 border-zinc-700";
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 75) return "text-emerald-400";
    if (score >= 55) return "text-indigo-400";
    if (score >= 40) return "text-amber-400";
    return "text-rose-400";
  };

  const getValuationStatus = (tier?: string, pe?: number | null) => {
    if (tier === "EXTREMELY_OVERVALUED" || (pe && pe > 85)) return "Extremely Overvalued";
    if (tier === "UNDERVALUED") return "Attractive / Undervalued";
    if (tier === "FAIRLY_VALUED") return "Fairly Valued";
    if (tier === "EXPENSIVE") return "Expensive";
    return tier || "Valuation Assessed";
  };

  const p1d = opportunity.metrics?.price_change_1d ?? null;
  const p5d = opportunity.metrics?.price_change_5d ?? null;
  const p20d = opportunity.metrics?.price_change_20d ?? null;
  const dist52w = opportunity.metrics?.distance_from_52w_high_pct ?? null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-5xl max-h-[92vh] bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-y-auto text-zinc-100 flex flex-col">
        {/* Sticky Header */}
        <div className="sticky top-0 z-20 flex items-center justify-between px-6 py-4 bg-zinc-950/95 backdrop-blur border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="flex flex-col">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="text-2xl font-black tracking-tight text-white">
                  {opportunity.ticker}
                </span>
                <span
                  className={`px-3 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border ${getRecBadgeClass(
                    opportunity.recommendation
                  )}`}
                >
                  {opportunity.recommendation}
                </span>
                {opportunity.is_owned ? (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                    ⚡ In Portfolio ({(opportunity.portfolio_allocation_pct || 0).toFixed(1)}% Allocation)
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                    ✨ Broad Universe Discovery
                  </span>
                )}
                {opportunity.catalyst_durability && (
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                      opportunity.catalyst_durability === "STRUCTURAL"
                        ? "bg-indigo-500/15 text-indigo-300 border-indigo-500/30"
                        : "bg-amber-500/15 text-amber-300 border-amber-500/30"
                    }`}
                  >
                    {opportunity.catalyst_durability} CATALYST
                  </span>
                )}
              </div>
              <span className="text-sm font-medium text-zinc-400 mt-0.5">
                {opportunity.company_name} • {opportunity.sector} ({opportunity.industry})
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Current Market Price</div>
              <div className="text-xl font-bold text-white">
                ₹{opportunity.current_price?.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6">
          {/* Institutional Causal Reasoning Chain */}
          <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-xl space-y-3">
            <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <Target className="w-4 h-4 text-emerald-400" />
              <span>Complete Institutional Causal Transmission Chain</span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2 text-center text-xs">
              <div className="p-2 bg-zinc-950/80 border border-zinc-800 rounded-lg">
                <div className="text-[10px] text-zinc-500 uppercase font-bold">1. News</div>
                <div className="text-xs font-semibold text-zinc-300 truncate mt-1">Multi-Source</div>
              </div>
              <div className="p-2 bg-zinc-950/80 border border-zinc-800 rounded-lg">
                <div className="text-[10px] text-zinc-500 uppercase font-bold">2. Event</div>
                <div className="text-xs font-semibold text-emerald-400 truncate mt-1">{opportunity.impact_direction}</div>
              </div>
              <div className="p-2 bg-zinc-950/80 border border-zinc-800 rounded-lg">
                <div className="text-[10px] text-zinc-500 uppercase font-bold">3. Sector</div>
                <div className="text-xs font-semibold text-zinc-300 truncate mt-1">{opportunity.sector}</div>
              </div>
              <div className="p-2 bg-zinc-950/80 border border-zinc-800 rounded-lg">
                <div className="text-[10px] text-zinc-500 uppercase font-bold">4. Company</div>
                <div className="text-xs font-semibold text-white truncate mt-1">{opportunity.ticker}</div>
              </div>
              <div className="p-2 bg-zinc-950/80 border border-zinc-800 rounded-lg">
                <div className="text-[10px] text-zinc-500 uppercase font-bold">5. Fundamentals</div>
                <div className="text-xs font-semibold text-indigo-400 truncate mt-1">{opportunity.scores.fundamental_score}/100</div>
              </div>
              <div className="p-2 bg-zinc-950/80 border border-zinc-800 rounded-lg">
                <div className="text-[10px] text-zinc-500 uppercase font-bold">6. Valuation</div>
                <div className="text-xs font-semibold text-amber-400 truncate mt-1">
                  {getValuationStatus(opportunity.valuation_tier || opportunity.metrics?.valuation_tier, opportunity.metrics.pe_ratio)}
                </div>
              </div>
              <div className="p-2 bg-zinc-950/80 border border-zinc-800 rounded-lg">
                <div className="text-[10px] text-zinc-500 uppercase font-bold">7. Price (5D)</div>
                <div className="text-xs font-semibold text-zinc-300 truncate mt-1">
                  {p5d !== null ? `${p5d > 0 ? "+" : ""}${p5d}%` : "0.0%"}
                </div>
              </div>
              <div className="p-2 bg-emerald-950/40 border border-emerald-500/40 rounded-lg">
                <div className="text-[10px] text-emerald-400 uppercase font-bold">8. Recommendation</div>
                <div className="text-xs font-bold text-emerald-300 truncate mt-1">{opportunity.recommendation}</div>
              </div>
            </div>
          </div>

          {/* Multi-Factor Conviction Dashboard */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="p-3.5 bg-zinc-900/70 border border-zinc-800 rounded-xl">
              <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                Overall Conviction
              </div>
              <div className={`text-2xl font-black mt-1 ${getScoreColor(opportunity.conviction_score)}`}>
                {opportunity.conviction_score}
                <span className="text-xs font-normal text-zinc-500">/100</span>
              </div>
            </div>

            <div className="p-3.5 bg-zinc-900/70 border border-zinc-800 rounded-xl">
              <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                Fundamental Quality
              </div>
              <div className={`text-2xl font-black mt-1 ${getScoreColor(opportunity.scores.fundamental_score)}`}>
                {opportunity.scores.fundamental_score}
                <span className="text-xs font-normal text-zinc-500">/100</span>
              </div>
            </div>

            <div className="p-3.5 bg-zinc-900/70 border border-zinc-800 rounded-xl">
              <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                Cash Conversion
              </div>
              <div className={`text-2xl font-black mt-1 ${getScoreColor(opportunity.scores.earnings_quality_score)}`}>
                {opportunity.scores.earnings_quality_score}
                <span className="text-xs font-normal text-zinc-500">/100</span>
              </div>
            </div>

            <div className="p-3.5 bg-zinc-900/70 border border-zinc-800 rounded-xl">
              <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                Valuation Score
              </div>
              <div className={`text-2xl font-black mt-1 ${getScoreColor(opportunity.scores.valuation_score)}`}>
                {opportunity.scores.valuation_score}
                <span className="text-xs font-normal text-zinc-500">/100</span>
              </div>
            </div>

            <div className="p-3.5 bg-zinc-900/70 border border-zinc-800 rounded-xl">
              <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                Price Momentum
              </div>
              <div className={`text-2xl font-black mt-1 ${getScoreColor(opportunity.scores.price_reaction_score)}`}>
                {opportunity.scores.price_reaction_score}
                <span className="text-xs font-normal text-zinc-500">/100</span>
              </div>
            </div>

            <div className="p-3.5 bg-zinc-900/70 border border-zinc-800 rounded-xl">
              <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                Time Horizon
              </div>
              <div className="text-sm font-bold text-white mt-2 truncate">
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
                  <div key={idx} className="p-2.5 bg-zinc-950/80 border border-amber-500/20 rounded-lg text-xs">
                    <div className="font-semibold text-amber-300">{gate.gate_name}</div>
                    <div className="text-zinc-300 mt-0.5">{gate.description}</div>
                    <div className="text-amber-400 font-medium mt-1">Action Constraint: {gate.impact_on_decision}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-4 py-2.5 bg-emerald-950/20 border border-emerald-500/30 rounded-xl text-xs font-semibold text-emerald-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>All Hard Risk Gates Cleared — Quality, Balance Sheet & Valuation Pass Institutional Requirements</span>
            </div>
          )}

          {/* Triggering News Catalyst & Economic Transmission */}
          <div className="p-5 bg-zinc-900/50 border border-zinc-800 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-indigo-400" />
                Triggering Catalyst Event
              </span>
              <span className="text-xs text-zinc-500">
                {opportunity.news_source || "Market Feed"} {opportunity.news_published_at ? `• ${opportunity.news_published_at}` : ""}
              </span>
            </div>
            <h4 className="text-base font-bold text-white">
              {opportunity.news_title}
            </h4>

            {/* Related Headlines / Multi-Sources */}
            {opportunity.related_headlines && opportunity.related_headlines.length > 1 && (
              <div className="p-3 bg-zinc-950/60 border border-zinc-800 rounded-lg space-y-1">
                <span className="text-[10px] font-semibold uppercase text-zinc-500 tracking-wider">
                  Corroborating Event Headlines ({opportunity.related_headlines.length})
                </span>
                <ul className="text-xs text-zinc-400 space-y-1">
                  {opportunity.related_headlines.slice(0, 3).map((hl, i) => (
                    <li key={i} className="truncate">• {hl}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="p-3.5 bg-zinc-950/60 border border-zinc-800 rounded-lg space-y-1.5 text-xs">
              <div className="text-zinc-400 font-semibold uppercase tracking-wider text-[10px]">
                Economic Transmission Mechanism:
              </div>
              <div className="text-zinc-200 leading-relaxed font-medium">
                {opportunity.transmission_mechanism}
              </div>
            </div>
          </div>

          {/* Synthesized Institutional Research Thesis */}
          <div className="p-5 bg-gradient-to-br from-zinc-900/90 to-zinc-950 border border-zinc-800 rounded-xl space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-emerald-400" />
              <span>Synthesized Institutional Research Thesis</span>
            </div>
            <p className="text-sm leading-relaxed text-zinc-200 font-medium">
              {opportunity.investment_thesis}
            </p>
          </div>

          {/* Deterministic Fundamentals Matrix */}
          <div className="space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <BarChart2 className="w-4 h-4 text-indigo-400" />
              <span>Audited Multi-Year Financial & Valuation Metrics</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-3">
              <div className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-xl text-xs">
                <div className="text-zinc-500 font-medium">3Y Revenue CAGR</div>
                <div className="text-base font-bold text-white mt-1">
                  {opportunity.metrics.revenue_cagr_3y !== null ? `${opportunity.metrics.revenue_cagr_3y}%` : "N/A"}
                </div>
              </div>
              <div className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-xl text-xs">
                <div className="text-zinc-500 font-medium">3Y Net Profit CAGR</div>
                <div className="text-base font-bold text-white mt-1">
                  {opportunity.metrics.profit_cagr_3y !== null ? `${opportunity.metrics.profit_cagr_3y}%` : "N/A"}
                </div>
              </div>
              <div className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-xl text-xs">
                <div className="text-zinc-500 font-medium">Operating Margin</div>
                <div className="text-base font-bold text-white mt-1">
                  {opportunity.metrics.operating_margin !== null ? `${opportunity.metrics.operating_margin}%` : "N/A"}
                </div>
              </div>
              <div className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-xl text-xs">
                <div className="text-zinc-500 font-medium">ROCE / ROE</div>
                <div className="text-base font-bold text-white mt-1">
                  {opportunity.metrics.roce !== null ? `${opportunity.metrics.roce}%` : "N/A"} / {opportunity.metrics.roe !== null ? `${opportunity.metrics.roe}%` : "N/A"}
                </div>
              </div>
              <div className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-xl text-xs">
                <div className="text-zinc-500 font-medium">Debt / Equity</div>
                <div className="text-base font-bold text-white mt-1">
                  {opportunity.metrics.debt_to_equity !== null ? `${opportunity.metrics.debt_to_equity}x` : "0.0x"}
                </div>
              </div>
              <div className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-xl text-xs">
                <div className="text-zinc-500 font-medium">P/E Ratio</div>
                <div className="text-base font-bold text-white mt-1">
                  {opportunity.metrics.pe_ratio !== null ? `${opportunity.metrics.pe_ratio}x` : "N/A"}
                </div>
              </div>
              <div className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-xl text-xs">
                <div className="text-zinc-500 font-medium">P/B Ratio</div>
                <div className="text-base font-bold text-white mt-1">
                  {opportunity.metrics.pb_ratio !== null ? `${opportunity.metrics.pb_ratio}x` : "N/A"}
                </div>
              </div>
              <div className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-xl text-xs">
                <div className="text-zinc-500 font-medium">CFO / PAT Conversion</div>
                <div className="text-base font-bold text-white mt-1">
                  {opportunity.metrics.cfo_to_pat_ratio !== null ? `${opportunity.metrics.cfo_to_pat_ratio}x` : "N/A"}
                </div>
              </div>
            </div>
          </div>

          {/* Price Reaction / Momentum Matrix */}
          <div className="space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span>Multi-Timeframe Price Momentum & Technical Position</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-xl">
                <div className="text-zinc-500 text-xs font-medium uppercase">1-Day Move</div>
                <div className={`text-base font-bold mt-1 ${(p1d || 0) >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                  {p1d !== null ? `${p1d > 0 ? "+" : ""}${p1d}%` : "—"}
                </div>
              </div>
              <div className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-xl">
                <div className="text-zinc-500 text-xs font-medium uppercase">5-Day Reaction</div>
                <div className={`text-base font-bold mt-1 ${(p5d || 0) >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                  {p5d !== null ? `${p5d > 0 ? "+" : ""}${p5d}%` : "—"}
                </div>
              </div>
              <div className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-xl">
                <div className="text-zinc-500 text-xs font-medium uppercase">20-Day Trend</div>
                <div className={`text-base font-bold mt-1 ${(p20d || 0) >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                  {p20d !== null ? `${p20d > 0 ? "+" : ""}${p20d}%` : "—"}
                </div>
              </div>
              <div className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-xl">
                <div className="text-zinc-500 text-xs font-medium uppercase">Distance from 52W High</div>
                <div className="text-base font-bold text-zinc-200 mt-1">
                  {dist52w !== null ? `${dist52w}%` : "—"}
                </div>
              </div>
            </div>
          </div>

          {/* Growth Catalysts, Risks, & Thesis Invalidation */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Catalysts */}
            <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-xl space-y-2">
              <div className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span>Key Catalysts</span>
              </div>
              <ul className="space-y-1.5 text-xs text-zinc-300">
                {opportunity.key_catalysts.map((c, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-emerald-500 font-bold">•</span>
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Key Risks */}
            <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-xl space-y-2">
              <div className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <span>Key Risks</span>
              </div>
              <ul className="space-y-1.5 text-xs text-zinc-300">
                {opportunity.key_risks.map((r, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-rose-500 font-bold">•</span>
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Invalidation Triggers */}
            <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-xl space-y-2">
              <div className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span>Thesis Invalidation Triggers</span>
              </div>
              <ul className="space-y-1.5 text-xs text-zinc-300">
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
        <div className="sticky bottom-0 px-6 py-4 bg-zinc-950/95 border-t border-zinc-800 flex items-center justify-between">
          <span className="text-xs text-zinc-500">
            Analysis ID: #{opportunity.id} • Generated at {new Date(opportunity.created_at).toLocaleString()}
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-white bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-xl transition-colors cursor-pointer"
          >
            Close Memo
          </button>
        </div>
      </div>
    </div>
  );
};
