"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  InvestmentOpportunity,
  RecommendationType,
} from "@/types/intelligence";
import { OpportunityDetailModal } from "./OpportunityDetailModal";

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

export const MarketOpportunitiesSection: React.FC = () => {
  const [opportunities, setOpportunities] = useState<InvestmentOpportunity[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [scanning, setScanning] = useState<boolean>(false);
  const [selectedOpportunity, setSelectedOpportunity] = useState<InvestmentOpportunity | null>(null);
  const [selectedRec, setSelectedRec] = useState<"ALL" | RecommendationType>("ALL");
  const [selectedSector, setSelectedSector] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const fetchOpportunities = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/intelligence/opportunities?limit=50");
      if (!res.ok) throw new Error("Failed to load investment opportunities");
      const data = await res.json();
      setOpportunities(data.opportunities || []);
    } catch (err: any) {
      setError(err.message || "Failed to load opportunities");
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
      const res = await fetch("/api/intelligence/scan?max_articles=6", {
        method: "POST",
      });
      if (!res.ok) throw new Error("Intelligence scan failed");
      const data = await res.json();
      setOpportunities(data.opportunities || []);
    } catch (err: any) {
      setError(err.message || "Scan failed");
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
      // Sector Filter
      if (selectedSector !== "ALL" && opp.sector !== selectedSector) {
        return false;
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

  return (
    <div className="space-y-6">
      {/* Header & Scanning Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-slate-900/80 border border-slate-800 rounded-2xl backdrop-blur">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <h2 className="text-xl font-bold tracking-tight text-white">
              AI Investment Intelligence & Opportunities
            </h2>
          </div>
          <p className="text-xs text-slate-400">
            Institutional causal reasoning across the NSE universe • Deterministic fundamentals, cash flow quality & hard risk gates.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleTriggerScan}
            disabled={scanning}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-950/50 transition-all cursor-pointer"
          >
            {scanning ? (
              <>
                <svg className="animate-spin w-4 h-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Scanning Universe & News...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Scan News & Opportunities</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-3">
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
              className="w-full md:w-64 px-3 py-2 bg-slate-800/80 border border-slate-700/80 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500/80"
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
            Filter:
          </span>
          {REC_OPTIONS.map((rec) => (
            <button
              key={rec}
              onClick={() => setSelectedRec(rec)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                selectedRec === rec
                  ? "bg-slate-700 text-white border border-slate-600 shadow"
                  : "bg-slate-800/40 text-slate-400 hover:text-slate-200 border border-transparent"
              }`}
            >
              {rec}
            </button>
          ))}
        </div>
      </div>

      {/* Content Grid / Loading State */}
      {loading ? (
        <div className="py-16 text-center space-y-3">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-500"></div>
          <div className="text-xs text-slate-400">Evaluating opportunities and hard gates...</div>
        </div>
      ) : error ? (
        <div className="p-4 bg-rose-950/20 border border-rose-500/40 rounded-xl text-xs text-rose-300">
          {error}
        </div>
      ) : filteredOpportunities.length === 0 ? (
        <div className="py-12 text-center p-8 bg-slate-900/40 border border-slate-800/80 rounded-2xl space-y-3">
          <svg className="w-10 h-10 text-slate-600 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="text-sm font-semibold text-slate-300">No opportunities match current filter</div>
          <div className="text-xs text-slate-500">
            Try selecting "ALL" or click "Scan News & Opportunities" to trigger an AI universe scan.
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredOpportunities.map((opp) => (
            <div
              key={opp.id}
              onClick={() => setSelectedOpportunity(opp)}
              className="p-5 bg-slate-900/70 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl shadow-lg transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-4 group"
            >
              {/* Card Top Row */}
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-black text-white group-hover:text-emerald-400 transition-colors">
                        {opp.ticker}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${getRecBadgeClass(
                          opp.recommendation
                        )}`}
                      >
                        {opp.recommendation}
                      </span>
                    </div>
                    <div className="text-xs font-medium text-slate-400 truncate max-w-[200px]">
                      {opp.company_name}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className={`text-base font-black ${getScoreColor(opp.conviction_score)}`}>
                      {opp.conviction_score}
                      <span className="text-[10px] font-normal text-slate-400">/100</span>
                    </div>
                    <div className="text-[9px] uppercase font-bold text-slate-500">Conviction</div>
                  </div>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700/60">
                    {opp.sector}
                  </span>
                  {opp.is_owned ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      Owned ({(opp.portfolio_allocation_pct || 0).toFixed(1)}%)
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                      Universe Discovery
                    </span>
                  )}
                </div>
              </div>

              {/* News Catalyst Snippet */}
              <div className="p-3 bg-slate-800/40 border border-slate-800/80 rounded-xl space-y-1 text-xs">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                  <span>Catalyst</span>
                  <span className="text-slate-500 font-normal">{opp.time_horizon}</span>
                </div>
                <div className="text-slate-200 line-clamp-2 font-medium">
                  {opp.news_title}
                </div>
              </div>

              {/* Hard Gates Alert (if any) */}
              {opp.hard_gates_triggered.length > 0 && (
                <div className="px-2.5 py-1.5 bg-amber-950/20 border border-amber-500/30 rounded-lg text-[10px] text-amber-300 font-semibold flex items-center gap-1.5 truncate">
                  <span className="text-amber-400">⚠️</span>
                  <span>{opp.hard_gates_triggered[0].gate_name}</span>
                </div>
              )}

              {/* Quick Metrics Bar */}
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <div>
                  <span className="text-slate-500 text-[10px]">Price: </span>
                  <span className="font-bold text-white">₹{opp.current_price.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px]">P/E: </span>
                  <span className="font-bold text-slate-300">{opp.metrics.pe_ratio !== null ? `${opp.metrics.pe_ratio}x` : "N/A"}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px]">ROCE: </span>
                  <span className="font-bold text-slate-300">{opp.metrics.roce !== null ? `${opp.metrics.roce}%` : "N/A"}</span>
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedOpportunity(opp);
                }}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 hover:text-white rounded-xl border border-slate-700/80 transition-colors flex items-center justify-center gap-1.5"
              >
                <span>Inspect Full Evidence Memo</span>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          ))}
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
