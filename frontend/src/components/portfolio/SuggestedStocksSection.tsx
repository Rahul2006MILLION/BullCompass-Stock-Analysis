"use client";

import React, { useState, useEffect, useMemo } from "react";
import { InvestmentOpportunity, RecommendationType } from "@/types/intelligence";
import { OpportunityDetailModal } from "@/components/intelligence/OpportunityDetailModal";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import {
  Sparkles,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Building2,
  Clock,
  ExternalLink,
  Layers,
  Search,
  ShoppingCart,
  ArrowRight,
  ShieldCheck,
  Zap,
} from "lucide-react";

interface SuggestedStocksSectionProps {
  onQuickBuy?: (holding: { ticker: string; current_price?: number }) => void;
}

function formatRelativeTime(dateStr?: string): string {
  if (!dateStr) return "Recent";
  try {
    const pubDate = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - pubDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60 && diffMins >= 0) return `${diffMins}m ago`;
    if (diffHours < 24 && diffHours >= 0) return `${diffHours}h ago`;
    if (diffDays <= 7 && diffDays > 0) return `${diffDays}d ago`;
    return dateStr.split(" ")[0] || dateStr;
  } catch {
    return dateStr;
  }
}

export function SuggestedStocksSection({ onQuickBuy }: SuggestedStocksSectionProps) {
  const [opportunities, setOpportunities] = useState<InvestmentOpportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [selectedOpportunity, setSelectedOpportunity] = useState<InvestmentOpportunity | null>(null);
  const [filterTab, setFilterTab] = useState<"ALL" | "BUY" | "DISCOVERIES" | "PORTFOLIO" | "WATCH">("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchOpportunities = async () => {
    try {
      setLoading(true);
      const data = await api.getIntelligenceOpportunities({ limit: 12 });
      setOpportunities(data.opportunities || []);
    } catch {
      // Graceful fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOpportunities();
  }, []);

  const handleScanNews = async () => {
    try {
      setScanning(true);
      const data = await api.scanIntelligence(10);
      setOpportunities(data.opportunities || []);
    } catch {
      // Graceful fallback
    } finally {
      setScanning(false);
    }
  };

  const filteredOpportunities = useMemo(() => {
    return opportunities.filter((opp) => {
      if (filterTab === "BUY" && !["BUY", "BUY MORE"].includes(opp.recommendation)) return false;
      if (filterTab === "DISCOVERIES" && opp.is_owned) return false;
      if (filterTab === "PORTFOLIO" && !opp.is_owned) return false;
      if (filterTab === "WATCH" && opp.recommendation !== "WATCH") return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTicker = opp.ticker.toLowerCase().includes(q);
        const matchesCompany = opp.company_name?.toLowerCase().includes(q);
        const matchesSector = opp.sector?.toLowerCase().includes(q);
        const matchesNews = opp.news_title?.toLowerCase().includes(q);
        const matchesThesis = opp.investment_thesis?.toLowerCase().includes(q);
        if (!matchesTicker && !matchesCompany && !matchesSector && !matchesNews && !matchesThesis) {
          return false;
        }
      }
      return true;
    });
  }, [opportunities, filterTab, searchQuery]);

  const getRecommendationBadge = (rec: RecommendationType) => {
    switch (rec) {
      case "BUY":
      case "BUY MORE":
        return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
      case "HOLD":
        return "bg-blue-500/10 text-blue-300 border border-blue-500/20";
      case "WATCH":
        return "bg-amber-500/10 text-amber-300 border border-amber-500/20";
      case "REDUCE":
      case "SELL":
        return "bg-rose-500/10 text-rose-400 border border-rose-500/20";
      default:
        return "bg-white/[0.04] text-gray-300 border border-white/[0.06]";
    }
  };

  return (
    <div className="space-y-4 pt-6 border-t border-white/[0.06]">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_rgba(111,227,166,0.8)]" />
            <h2 className="text-base sm:text-lg font-bold font-mono tracking-tight text-white flex items-center gap-2">
              <span>NEWS-DRIVEN STOCK OPPORTUNITIES & RECOMMENDATIONS</span>
            </h2>
          </div>
          <p className="text-xs text-gray-400 font-sans">
            AI-synthesized research ideas derived from corporate disclosures, earnings catalysts & audited fundamentals
          </p>
        </div>

        <button
          onClick={handleScanNews}
          disabled={scanning}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-gray-300 hover:text-white border border-white/[0.08] text-xs font-mono transition-all duration-200 disabled:opacity-50 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${scanning ? "animate-spin text-emerald-400" : "text-gray-400"}`} />
          <span>{scanning ? "Scanning News Universe..." : "Scan Latest News"}</span>
        </button>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 editorial-frame p-3 rounded-xl text-xs font-mono">
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setFilterTab("ALL")}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filterTab === "ALL"
                ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-bold"
                : "text-gray-400 hover:text-gray-200 hover:bg-white/[0.04] border border-transparent"
            }`}
          >
            All Suggestions ({opportunities.length})
          </button>
          <button
            onClick={() => setFilterTab("BUY")}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filterTab === "BUY"
                ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-bold"
                : "text-gray-400 hover:text-emerald-400 hover:bg-emerald-500/10 border border-transparent"
            }`}
          >
            High Conviction Buy
          </button>
          <button
            onClick={() => setFilterTab("DISCOVERIES")}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filterTab === "DISCOVERIES"
                ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-bold"
                : "text-gray-400 hover:text-gray-200 hover:bg-white/[0.04] border border-transparent"
            }`}
          >
            Market Discoveries
          </button>
          <button
            onClick={() => setFilterTab("PORTFOLIO")}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filterTab === "PORTFOLIO"
                ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-bold"
                : "text-gray-400 hover:text-gray-200 hover:bg-white/[0.04] border border-transparent"
            }`}
          >
            Portfolio Actions
          </button>
          <button
            onClick={() => setFilterTab("WATCH")}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filterTab === "WATCH"
                ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-bold"
                : "text-gray-400 hover:text-gray-200 hover:bg-white/[0.04] border border-transparent"
            }`}
          >
            Watchlist
          </button>
        </div>

        <div className="relative min-w-[200px]">
          <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search suggested tickers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1 bg-[#07080a] border border-white/[0.08] rounded-lg text-xs text-gray-200 placeholder:text-gray-500 focus:outline-none focus:border-emerald-500/40 font-mono"
          />
        </div>
      </div>

      {/* Suggestions Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="editorial-frame p-5 rounded-2xl h-64 animate-pulse space-y-3"
            >
              <div className="h-6 bg-white/[0.05] rounded-md w-1/3" />
              <div className="h-4 bg-white/[0.03] rounded-md w-2/3" />
              <div className="h-20 bg-white/[0.02] rounded-xl" />
              <div className="h-8 bg-white/[0.04] rounded-lg" />
            </div>
          ))}
        </div>
      ) : filteredOpportunities.length === 0 ? (
        <div className="editorial-frame p-8 text-center rounded-2xl space-y-3">
          <p className="text-xs text-gray-400 font-sans">
            No active suggestions matching the current filter.
          </p>
          <button
            onClick={handleScanNews}
            className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-mono font-semibold hover:bg-emerald-500/20 transition-colors"
          >
            Scan News Universe for Catalysts
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredOpportunities.map((opp) => {
            const isBullish = opp.impact_direction === "POSITIVE" || ["BUY", "BUY MORE"].includes(opp.recommendation);

            return (
              <div
                key={opp.id}
                data-interactive-card="true"
                onClick={() => setSelectedOpportunity(opp)}
                className="editorial-frame editorial-frame-hover p-5 rounded-2xl flex flex-col justify-between h-full group space-y-4 relative overflow-hidden cursor-pointer select-none"
              >
                <div className="relative z-10 flex flex-col justify-between h-full space-y-3">
                  {/* Header: Stock Identity & Recommendation Badge */}
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-lg font-bold font-mono text-white tracking-tight group-hover:text-emerald-400 transition-colors duration-200">
                            {opp.ticker}
                          </h3>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.04] text-gray-300 border border-white/[0.06]">
                            NSE
                          </span>
                          <span
                            className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded ${getRecommendationBadge(
                              opp.recommendation
                            )}`}
                          >
                            {opp.recommendation}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 truncate font-sans">
                          {opp.company_name}
                        </p>
                      </div>

                      {/* Live / Reference Price & Conviction */}
                      <div className="text-right shrink-0 font-mono">
                        <span className="text-sm font-light text-white block">
                          {opp.current_price ? formatCurrency(opp.current_price) : "—"}
                        </span>
                        <span className="text-[10px] text-gray-500 font-mono">
                          Conviction: <strong className="text-emerald-400">{opp.conviction_score}/100</strong>
                        </span>
                      </div>
                    </div>

                    {/* Sector & Telemetry Bar */}
                    <div className="mt-3 flex items-center justify-between gap-2 text-xs font-mono text-gray-400">
                      <span className="text-[10px] px-2 py-0.5 rounded bg-white/[0.03] text-gray-400 border border-white/[0.05] truncate max-w-[180px]">
                        {opp.sector}
                      </span>
                      <div className="flex items-center gap-1 text-[11px] text-gray-500 shrink-0">
                        <Clock className="w-3 h-3" />
                        <span>{formatRelativeTime(opp.news_published_at)}</span>
                      </div>
                    </div>

                    {/* News Context & Causal Catalyst */}
                    <div className="mt-3 pt-3 border-t border-white/[0.05] space-y-1.5">
                      <div className="text-xs font-medium text-gray-200 line-clamp-2 leading-snug group-hover:text-white transition-colors font-sans">
                        {opp.news_title}
                      </div>

                      <p className="text-xs text-gray-400 line-clamp-3 leading-relaxed font-sans">
                        {opp.event_summary || opp.investment_thesis}
                      </p>
                    </div>
                  </div>

                  {/* Action Toolbar */}
                  <div
                    className="pt-3 border-t border-white/[0.05] flex items-center justify-between gap-2 text-xs font-mono mt-auto"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => setSelectedOpportunity(opp)}
                      className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1"
                    >
                      <span>Institutional Thesis →</span>
                    </button>

                    {onQuickBuy && (
                      <button
                        onClick={() =>
                          onQuickBuy({
                            ticker: opp.ticker,
                            current_price: opp.current_price,
                          })
                        }
                        className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-black border border-emerald-500/20 text-xs font-semibold flex items-center gap-1 transition-all"
                      >
                        <ShoppingCart className="w-3 h-3" />
                        <span>Trade</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Opportunity Detail Modal */}
      <OpportunityDetailModal
        opportunity={selectedOpportunity}
        onClose={() => setSelectedOpportunity(null)}
      />
    </div>
  );
}
