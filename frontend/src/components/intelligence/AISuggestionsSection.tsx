"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  InvestmentOpportunity,
  RecommendationType,
} from "@/types/intelligence";
import { OpportunityDetailModal } from "./OpportunityDetailModal";
import { api } from "@/lib/api";
import { Sparkles, RefreshCw, AlertTriangle, CheckCircle2, TrendingUp, ShieldAlert, ArrowRight, Layers } from "lucide-react";

const SECTOR_OPTIONS = [
  "ALL",
  "Banking & Financial Services",
  "Information Technology",
  "Oil, Gas & Energy",
  "Power & Renewable Energy",
  "Infrastructure, Capital Goods & Construction",
  "Automobile & Auto Components",
  "Pharmaceuticals & Healthcare",
  "Consumer Goods & Retail",
  "Metals & Mining",
  "Logistics, Ports & Transportation",
];

const REC_OPTIONS: Array<"ALL" | RecommendationType> = [
  "ALL",
  "BUY",
  "BUY MORE",
  "HOLD",
  "WATCH",
  "REDUCE",
  "SELL",
  "AVOID",
];

export const AISuggestionsSection: React.FC = () => {
  const [opportunities, setOpportunities] = useState<InvestmentOpportunity[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [scanning, setScanning] = useState<boolean>(false);
  const [selectedOpportunity, setSelectedOpportunity] = useState<InvestmentOpportunity | null>(null);
  const [selectedRec, setSelectedRec] = useState<"ALL" | RecommendationType>("ALL");
  const [selectedSector, setSelectedSector] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [lastScannedAt, setLastScannedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchOpportunities = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getIntelligenceOpportunities({ limit: 50 });
      setOpportunities(data.opportunities || []);
      if (data.opportunities && data.opportunities.length > 0) {
        setLastScannedAt(data.opportunities[0].created_at);
      }
    } catch (err: any) {
      setError(err.message || "Unable to load AI suggestions.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOpportunities();
  }, []);

  const handleTriggerScan = async () => {
    try {
      setScanning(true);
      setError(null);
      const data = await api.scanIntelligence(4);
      setOpportunities(data.opportunities || []);
      setLastScannedAt(new Date().toISOString());
    } catch (err: any) {
      setError(err.message || "Scan failed.");
    } finally {
      setScanning(false);
    }
  };

  const filteredOpportunities = useMemo(() => {
    return opportunities.filter((opp) => {
      // Recommendation Filter
      if (selectedRec !== "ALL" && opp.recommendation !== selectedRec) {
        return false;
      }
      // Flexible Sector Filter
      if (selectedSector !== "ALL") {
        const sec1 = (opp.sector || "").toLowerCase();
        const sec2 = selectedSector.toLowerCase();
        const ind = (opp.industry || "").toLowerCase();
        const match =
          sec1.includes(sec2) ||
          sec2.includes(sec1) ||
          ind.includes(sec2) ||
          (sec2.includes("tech") && (sec1.includes("tech") || ind.includes("tech") || ind.includes("software"))) ||
          (sec2.includes("bank") && (sec1.includes("bank") || sec1.includes("financial") || ind.includes("bank"))) ||
          (sec2.includes("infra") && (sec1.includes("basic") || sec1.includes("industrial") || ind.includes("material") || ind.includes("construction")));

        if (!match) {
          return false;
        }
      }
      // Search Filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTicker = opp.ticker.toLowerCase().includes(q);
        const matchesName = opp.company_name.toLowerCase().includes(q);
        const matchesSector = opp.sector.toLowerCase().includes(q);
        const matchesNews = opp.news_title.toLowerCase().includes(q);
        const matchesThesis = opp.investment_thesis.toLowerCase().includes(q);
        if (!matchesTicker && !matchesName && !matchesSector && !matchesNews && !matchesThesis) {
          return false;
        }
      }
      return true;
    });
  }, [opportunities, selectedRec, selectedSector, searchQuery]);

  const getRecBadge = (rec: RecommendationType) => {
    switch (rec) {
      case "BUY":
      case "BUY MORE":
        return {
          dot: "🟢",
          badgeClass: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-emerald-950/40",
          borderHover: "hover:border-emerald-500/50",
          titleColor: "text-emerald-400",
        };
      case "HOLD":
        return {
          dot: "🔵",
          badgeClass: "bg-sky-500/20 text-sky-400 border-sky-500/40",
          borderHover: "hover:border-sky-500/50",
          titleColor: "text-sky-400",
        };
      case "WATCH":
        return {
          dot: "🟡",
          badgeClass: "bg-amber-500/20 text-amber-400 border-amber-500/40",
          borderHover: "hover:border-amber-500/50",
          titleColor: "text-amber-400",
        };
      case "REDUCE":
        return {
          dot: "🟠",
          badgeClass: "bg-orange-500/20 text-orange-400 border-orange-500/40",
          borderHover: "hover:border-orange-500/50",
          titleColor: "text-orange-400",
        };
      case "SELL":
        return {
          dot: "🔴",
          badgeClass: "bg-rose-500/20 text-rose-400 border-rose-500/40 shadow-rose-950/40",
          borderHover: "hover:border-rose-500/50",
          titleColor: "text-rose-400",
        };
      case "AVOID":
        return {
          dot: "⚫",
          badgeClass: "bg-slate-700/50 text-slate-400 border-slate-600/40",
          borderHover: "hover:border-slate-600/50",
          titleColor: "text-slate-400",
        };
      default:
        return {
          dot: "⚪",
          badgeClass: "bg-slate-800 text-slate-300 border-slate-700",
          borderHover: "hover:border-slate-600",
          titleColor: "text-slate-300",
        };
    }
  };

  const getValuationLabel = (valScore: number, pe: number | null) => {
    if (pe && pe > 85) return "Extremely Overvalued";
    if (valScore >= 75) return "Attractive / Undervalued";
    if (valScore >= 50) return "Fair";
    if (valScore >= 35) return "Expensive";
    return "Extremely Overvalued";
  };

  const formatWhyPoints = (opp: InvestmentOpportunity) => {
    const points: string[] = [];

    // Revenue growth
    if (opp.metrics.revenue_cagr_3y !== null && opp.metrics.revenue_cagr_3y > 0) {
      points.push(`Revenue 3Y CAGR: ${opp.metrics.revenue_cagr_3y}%`);
    } else if (opp.scores.fundamental_score >= 60) {
      points.push("Solid top-line fundamental durability");
    }

    // Profitability / ROCE
    if (opp.metrics.roce !== null) {
      points.push(`ROCE: ${opp.metrics.roce}%`);
    } else if (opp.metrics.operating_margin !== null) {
      points.push(`Operating Margin: ${opp.metrics.operating_margin}%`);
    }

    // Cash conversion
    if (opp.metrics.cfo_to_pat_ratio !== null) {
      if (opp.metrics.cfo_to_pat_ratio >= 0.8) {
        points.push(`Strong cash conversion (CFO/PAT: ${opp.metrics.cfo_to_pat_ratio}x)`);
      } else {
        points.push(`CFO to PAT conversion: ${opp.metrics.cfo_to_pat_ratio}x`);
      }
    } else {
      points.push("Positive operating cash flow health");
    }

    // Debt status
    if (opp.metrics.debt_to_equity !== null) {
      if (opp.metrics.debt_to_equity <= 0.3) {
        points.push(`Prudent leverage (Debt/Equity: ${opp.metrics.debt_to_equity}x)`);
      } else {
        points.push(`Debt to Equity: ${opp.metrics.debt_to_equity}x`);
      }
    }

    // Valuation
    const valLabel = getValuationLabel(opp.scores.valuation_score, opp.metrics.pe_ratio);
    points.push(`Valuation: ${valLabel}`);

    // Price reaction
    const p5d = opp.metrics.price_change_5d;
    if (p5d !== null) {
      if (p5d >= 15) {
        points.push(`Price surged (+${p5d}%) in 5 sessions`);
      } else if (p5d <= 3 && p5d >= -3) {
        points.push(`Subdued price reaction (${p5d > 0 ? "+" : ""}${p5d}%), attractive entry`);
      } else {
        points.push(`5-day price change: ${p5d > 0 ? "+" : ""}${p5d}%`);
      }
    }

    return points.slice(0, 5);
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="p-6 bg-gradient-to-r from-slate-900 via-[#0d1522] to-slate-900 border border-slate-800 rounded-2xl shadow-xl backdrop-blur flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              AI Suggestions
            </h2>
          </div>
          <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
            Event-driven investment recommendations generated from macro news, causal transmission, audited fundamentals, valuation, and hard risk gates across the NSE universe.
          </p>
          {lastScannedAt && (
            <div className="text-[11px] text-slate-500 font-medium pt-1">
              Analysis generated: {new Date(lastScannedAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
            </div>
          )}
        </div>

        {/* Scan Action */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleTriggerScan}
            disabled={scanning}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-950/60 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${scanning ? "animate-spin" : ""}`} />
            <span>{scanning ? "Analyzing Market & News..." : "Scan for New Opportunities"}</span>
          </button>
        </div>
      </div>

      {/* 2. Causal Reasoning Transmission Breadcrumb Banner */}
      <div className="hidden lg:flex items-center justify-between px-5 py-3 bg-slate-900/60 border border-slate-800/80 rounded-xl text-[11px] font-semibold text-slate-400">
        <div className="flex items-center gap-2 text-white">
          <span className="text-emerald-400 font-bold">1</span> News / Event
        </div>
        <span className="text-slate-600">→</span>
        <div className="flex items-center gap-2">
          <span className="text-emerald-400 font-bold">2</span> What Happened?
        </div>
        <span className="text-slate-600">→</span>
        <div className="flex items-center gap-2">
          <span className="text-emerald-400 font-bold">3</span> Who is Affected?
        </div>
        <span className="text-slate-600">→</span>
        <div className="flex items-center gap-2">
          <span className="text-emerald-400 font-bold">4</span> Beneficiaries & Losers
        </div>
        <span className="text-slate-600">→</span>
        <div className="flex items-center gap-2">
          <span className="text-emerald-400 font-bold">5</span> Fundamentals & Multiples
        </div>
        <span className="text-slate-600">→</span>
        <div className="flex items-center gap-2 text-emerald-400 font-bold">
          <span>6</span> BullCompass Suggestion
        </div>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="p-4 bg-slate-900/70 border border-slate-800 rounded-xl space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search ticker, company, theme..."
              className="w-full pl-9 pr-4 py-2 bg-slate-800/80 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500/80 transition-colors"
            />
            <svg
              className="w-4 h-4 text-slate-400 absolute left-3 top-2.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Sector Selector */}
          <div className="w-full md:w-auto flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium whitespace-nowrap">Sector:</span>
            <select
              value={selectedSector}
              onChange={(e) => setSelectedSector(e.target.value)}
              className="w-full md:w-64 px-3 py-2 bg-slate-800/80 border border-slate-700/80 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500/80 cursor-pointer"
            >
              {SECTOR_OPTIONS.map((sec) => (
                <option key={sec} value={sec}>
                  {sec}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Recommendation Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-800/80">
          <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider mr-1">
            Recommendation:
          </span>
          {REC_OPTIONS.map((rec) => {
            const badgeMeta = rec !== "ALL" ? getRecBadge(rec) : null;
            return (
              <button
                key={rec}
                onClick={() => setSelectedRec(rec)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  selectedRec === rec
                    ? "bg-slate-700 text-white border border-slate-600 shadow"
                    : "bg-slate-800/40 text-slate-400 hover:text-slate-200 border border-transparent"
                }`}
              >
                {badgeMeta && <span>{badgeMeta.dot}</span>}
                <span>{rec}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Suggestion Cards Grid & States */}
      {loading ? (
        <div className="py-20 text-center space-y-3 bg-slate-900/40 border border-slate-800/80 rounded-2xl">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-500"></div>
          <div className="text-sm font-semibold text-slate-300">Analyzing market opportunities...</div>
          <div className="text-xs text-slate-500">Evaluating multi-factor fundamentals and hard risk gates</div>
        </div>
      ) : error ? (
        <div className="p-6 bg-rose-950/20 border border-rose-500/40 rounded-2xl text-center space-y-2">
          <AlertTriangle className="w-8 h-8 text-rose-400 mx-auto" />
          <div className="text-sm font-bold text-rose-300">Unable to load AI suggestions.</div>
          <div className="text-xs text-rose-400/80">{error}</div>
          <button
            onClick={fetchOpportunities}
            className="mt-2 px-4 py-1.5 bg-rose-900/40 hover:bg-rose-900/60 border border-rose-700 text-rose-200 text-xs font-bold rounded-lg transition-colors cursor-pointer"
          >
            Retry
          </button>
        </div>
      ) : filteredOpportunities.length === 0 ? (
        <div className="py-16 text-center p-8 bg-slate-900/40 border border-slate-800/80 rounded-2xl space-y-3">
          <ShieldAlert className="w-10 h-10 text-slate-600 mx-auto" />
          <div className="text-base font-bold text-slate-300">No high-conviction opportunities detected.</div>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Try adjusting your filter or click &quot;Scan for New Opportunities&quot; to parse fresh macro news and discover candidate equities.
          </p>
          <button
            onClick={handleTriggerScan}
            className="mt-2 px-4 py-2 bg-emerald-600/80 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl shadow transition-colors cursor-pointer"
          >
            Scan for New Opportunities
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredOpportunities.map((opp) => {
            const badgeMeta = getRecBadge(opp.recommendation);
            const whyPoints = formatWhyPoints(opp);
            const p5d = opp.metrics.price_change_5d;

            return (
              <div
                key={opp.id}
                onClick={() => setSelectedOpportunity(opp)}
                className={`p-5 bg-slate-900/80 hover:bg-slate-900 border border-slate-800 ${badgeMeta.borderHover} rounded-2xl shadow-xl transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-4 group`}
              >
                {/* Top Badge & Header */}
                <div className="space-y-3">
                  {/* Opportunity Status Pill */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      {opp.is_owned ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
                          <span>⚡</span>
                          <span>PORTFOLIO ({(opp.portfolio_allocation_pct || 0).toFixed(1)}%)</span>
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                          <span>🔥</span>
                          <span>NEW OPPORTUNITY</span>
                        </span>
                      )}
                      <span className="text-[10px] font-semibold text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700/50 truncate max-w-[120px]">
                        {opp.sector}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-black text-white">
                        {opp.conviction_score}%
                      </span>
                      <span className="text-[9px] uppercase font-bold text-slate-500 ml-1">
                        Confidence
                      </span>
                    </div>
                  </div>

                  {/* Stock Header & Recommendation */}
                  <div className="flex items-start justify-between gap-2 pt-1">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xl font-black text-white group-hover:text-emerald-400 transition-colors">
                          {opp.ticker}
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider border flex items-center gap-1 ${badgeMeta.badgeClass}`}
                        >
                          <span>{badgeMeta.dot}</span>
                          <span>{opp.recommendation}</span>
                        </span>
                      </div>
                      <div className="text-xs font-semibold text-slate-300 truncate max-w-[220px] mt-0.5">
                        {opp.company_name}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-xs font-bold text-slate-400">
                        Horizon
                      </div>
                      <div className="text-xs font-bold text-white">
                        {opp.time_horizon}
                      </div>
                    </div>
                  </div>

                  {/* Trigger / What Happened */}
                  <div className="p-3 bg-slate-800/50 border border-slate-700/60 rounded-xl space-y-1 text-xs">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Event Trigger
                    </div>
                    <div className="text-slate-200 font-medium line-clamp-2 leading-relaxed">
                      &ldquo;{opp.event_summary || opp.news_title}&rdquo;
                    </div>
                  </div>

                  {/* WHY BullCompass suggests this stock */}
                  <div className="space-y-1.5 pt-1">
                    <div className="text-[10px] font-black text-emerald-400 uppercase tracking-wider">
                      Why BullCompass Suggests This:
                    </div>
                    <div className="space-y-1 text-xs text-slate-300">
                      {whyPoints.map((pt, idx) => (
                        <div key={idx} className="flex items-start gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <span className="leading-tight">{pt}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 5D Price Reaction & Valuation pill */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80">
                    <div className="p-2 bg-slate-800/40 rounded-lg text-xs">
                      <div className="text-[10px] text-slate-400 uppercase font-bold">5D Price Reaction</div>
                      <div className={`font-bold mt-0.5 ${p5d !== null && p5d > 0 ? "text-emerald-400" : p5d !== null && p5d < 0 ? "text-rose-400" : "text-slate-300"}`}>
                        {p5d !== null ? `${p5d > 0 ? "+" : ""}${p5d}%` : "N/A"}
                      </div>
                    </div>

                    <div className="p-2 bg-slate-800/40 rounded-lg text-xs">
                      <div className="text-[10px] text-slate-400 uppercase font-bold">Quality Score</div>
                      <div className="font-bold text-white mt-0.5">
                        {opp.scores.fundamental_score}/100
                      </div>
                    </div>
                  </div>

                  {/* Key Risks Snippet */}
                  {opp.key_risks.length > 0 && (
                    <div className="space-y-1 pt-1">
                      <div className="text-[10px] font-bold text-rose-400/90 uppercase tracking-wider flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-rose-400" />
                        <span>Key Risks:</span>
                      </div>
                      <div className="text-[11px] text-slate-400 line-clamp-1">
                        {opp.key_risks[0]}
                      </div>
                    </div>
                  )}
                </div>

                {/* Action CTA */}
                <div className="pt-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedOpportunity(opp);
                    }}
                    className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white rounded-xl border border-slate-700/80 transition-all flex items-center justify-center gap-2 group-hover:border-slate-600 shadow-md cursor-pointer"
                  >
                    <span>View Full Analysis</span>
                    <ArrowRight className="w-3.5 h-3.5 text-emerald-400 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Full Modal */}
      <OpportunityDetailModal
        opportunity={selectedOpportunity}
        onClose={() => setSelectedOpportunity(null)}
      />
    </div>
  );
};
