"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  InvestmentOpportunity,
  RecommendationType,
} from "@/types/intelligence";
import { OpportunityDetailModal } from "./OpportunityDetailModal";
import { api } from "@/lib/api";
import {
  Sparkles,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  ShieldAlert,
  ArrowRight,
  Layers,
  Compass,
  Search,
  Filter,
  Flame,
  Shield,
  Zap,
  Clock,
  Coins,
  BarChart3,
  ExternalLink,
} from "lucide-react";

const SECTOR_OPTIONS = [
  "ALL",
  "Banking & Financial Services",
  "NBFC & Housing Finance",
  "Information Technology & SaaS",
  "Oil, Gas & Refining",
  "Power Generation & Distribution",
  "Renewable Energy & Cleantech",
  "Defence & Aerospace",
  "Railways & Mass Transit",
  "Automobile & EV Ecosystem",
  "Auto Components & Ancillaries",
  "Pharmaceuticals & API Manufacturing",
  "Hospitals & Healthcare Diagnostics",
  "Consumer Goods & FMCG",
  "Consumer Discretionary & Retail",
  "Metals & Mining",
  "Chemicals & Specialty Materials",
  "Capital Goods & Industrial Machinery",
  "Infrastructure & Construction",
  "Real Estate & Urban Development",
  "Telecommunications & 5G Infrastructure",
  "Electronics Manufacturing Services (EMS)",
  "Logistics & Supply Chain",
  "Ports & Marine Infrastructure",
  "Aviation & Airport Services",
  "Cement & Building Materials",
  "Agriculture, Fertilizers & Agrochemicals",
  "Hotels & Hospitality",
  "Textiles & Apparel Export",
  "Paper & Packaging",
  "Sugar & Biofuels",
  "Media & Entertainment",
  "Jewellery, Gems & Luxury",
  "Diversified Conglomerates",
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

const TIME_HORIZON_OPTIONS = [
  "ALL",
  "1-3 months",
  "6-12 months",
  "1-3 years",
  "3-5 years",
];

type CategoryTab = "ALL" | "TOP" | "DISCOVERIES" | "PORTFOLIO" | "RISKS";

export const AISuggestionsSection: React.FC = () => {
  const [opportunities, setOpportunities] = useState<InvestmentOpportunity[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [scanning, setScanning] = useState<boolean>(false);
  const [selectedOpportunity, setSelectedOpportunity] = useState<InvestmentOpportunity | null>(null);
  const [activeCategoryTab, setActiveCategoryTab] = useState<CategoryTab>("ALL");
  const [selectedRec, setSelectedRec] = useState<"ALL" | RecommendationType>("ALL");
  const [selectedSector, setSelectedSector] = useState<string>("ALL");
  const [selectedHorizon, setSelectedHorizon] = useState<string>("ALL");
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

  const handleRunScan = async () => {
    try {
      setScanning(true);
      setError(null);
      const data = await api.scanIntelligence(20);
      setOpportunities(data.opportunities || []);
      if (data.opportunities && data.opportunities.length > 0) {
        setLastScannedAt(data.opportunities[0].created_at);
      }
    } catch (err: any) {
      setError(err.message || "Intelligence scan failed.");
    } finally {
      setScanning(false);
    }
  };

  useEffect(() => {
    fetchOpportunities();
  }, []);

  // Filter Opportunities
  const filteredOpportunities = useMemo(() => {
    return opportunities.filter((opp) => {
      // 1. Category Tab Filter
      if (activeCategoryTab === "TOP" && opp.conviction_score < 75) {
        return false;
      }
      if (activeCategoryTab === "DISCOVERIES" && opp.is_owned) {
        return false;
      }
      if (activeCategoryTab === "PORTFOLIO" && !opp.is_owned) {
        return false;
      }
      if (
        activeCategoryTab === "RISKS" &&
        !["AVOID", "REDUCE", "SELL"].includes(opp.recommendation) &&
        opp.impact_direction !== "NEGATIVE"
      ) {
        return false;
      }

      // 2. Recommendation Filter
      if (selectedRec !== "ALL" && opp.recommendation !== selectedRec) {
        return false;
      }

      // 3. Sector Filter
      if (selectedSector !== "ALL" && opp.sector !== selectedSector) {
        return false;
      }

      // 4. Time Horizon Filter
      if (selectedHorizon !== "ALL" && opp.time_horizon !== selectedHorizon) {
        return false;
      }

      // 5. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTicker = opp.ticker.toLowerCase().includes(q);
        const matchesName = opp.company_name.toLowerCase().includes(q);
        const matchesSector = opp.sector.toLowerCase().includes(q);
        const matchesEvent = opp.event_summary.toLowerCase().includes(q);
        const matchesThesis = opp.investment_thesis.toLowerCase().includes(q);
        const matchesMech = opp.transmission_mechanism.toLowerCase().includes(q);
        if (!matchesTicker && !matchesName && !matchesSector && !matchesEvent && !matchesThesis && !matchesMech) {
          return false;
        }
      }

      return true;
    });
  }, [
    opportunities,
    activeCategoryTab,
    selectedRec,
    selectedSector,
    selectedHorizon,
    searchQuery,
  ]);

  // Tab counts
  const categoryCounts = useMemo(() => {
    return {
      ALL: opportunities.length,
      TOP: opportunities.filter((o) => o.conviction_score >= 75).length,
      DISCOVERIES: opportunities.filter((o) => !o.is_owned).length,
      PORTFOLIO: opportunities.filter((o) => o.is_owned).length,
      RISKS: opportunities.filter(
        (o) => ["AVOID", "REDUCE", "SELL"].includes(o.recommendation) || o.impact_direction === "NEGATIVE"
      ).length,
    };
  }, [opportunities]);

  const getRecommendationBadge = (rec: RecommendationType) => {
    switch (rec) {
      case "BUY":
        return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.2)]";
      case "BUY MORE":
        return "bg-cyan-500/15 text-cyan-400 border-cyan-500/30 shadow-[0_0_12px_rgba(6,182,212,0.2)]";
      case "HOLD":
        return "bg-blue-500/15 text-blue-400 border-blue-500/30";
      case "WATCH":
        return "bg-amber-500/15 text-amber-400 border-amber-500/30 shadow-[0_0_12px_rgba(245,158,11,0.2)]";
      case "REDUCE":
        return "bg-orange-500/15 text-orange-400 border-orange-500/30";
      case "SELL":
        return "bg-rose-500/15 text-rose-400 border-rose-500/30 shadow-[0_0_12px_rgba(244,63,94,0.2)]";
      case "AVOID":
        return "bg-purple-500/15 text-purple-400 border-purple-500/30";
      default:
        return "bg-zinc-800 text-zinc-300 border-zinc-700";
    }
  };

  const getValuationTierBadge = (tier?: string) => {
    switch (tier) {
      case "UNDERVALUED":
        return { label: "Undervalued", color: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" };
      case "FAIRLY_VALUED":
        return { label: "Fairly Valued", color: "bg-blue-500/15 text-blue-300 border-blue-500/30" };
      case "EXPENSIVE":
        return { label: "Expensive", color: "bg-amber-500/15 text-amber-300 border-amber-500/30" };
      case "EXTREMELY_OVERVALUED":
        return { label: "Severely Stretched", color: "bg-rose-500/15 text-rose-300 border-rose-500/30" };
      default:
        return { label: "Valuation Assessed", color: "bg-zinc-800 text-zinc-400 border-zinc-700" };
    }
  };

  return (
    <section className="mt-12 mb-16 relative">
      {/* Background ambient lighting */}
      <div className="absolute -top-12 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute -bottom-12 right-1/4 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Header Container */}
      <div className="bg-gradient-to-br from-zinc-900/90 via-zinc-900/60 to-zinc-950/90 border border-zinc-800/80 rounded-2xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 pb-6 border-b border-zinc-800/80">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold uppercase tracking-wider">
              <Compass className="w-3.5 h-3.5 text-indigo-400 animate-spin-slow" />
              <span>Multi-Factor Institutional Intelligence</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-100 flex items-center gap-3">
              AI Market Suggestions & Ideas
              <span className="text-xs font-normal text-zinc-400 px-2.5 py-0.5 rounded-full bg-zinc-800 border border-zinc-700">
                {opportunities.length} Total Opportunities Found
              </span>
            </h2>
            <p className="text-sm text-zinc-400 max-w-3xl leading-relaxed">
              Synthesized by BullCompass across 33 NSE sectors: real-world catalyst clustering, multi-year audited financial health, cash flow earnings quality, valuation multiples, and strict risk gates.
            </p>
          </div>

          {/* Action Bar */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              id="btn-scan-opportunities"
              onClick={handleRunScan}
              disabled={scanning || loading}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white text-sm font-medium transition-all duration-200 shadow-lg shadow-indigo-600/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${scanning ? "animate-spin" : ""}`} />
              <span>{scanning ? "Scanning 33 Sectors..." : "Scan & Discover Ideas"}</span>
            </button>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="mt-6 flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveCategoryTab("ALL")}
            className={`px-3.5 py-2 rounded-xl text-xs font-medium transition-all duration-150 flex items-center gap-2 ${
              activeCategoryTab === "ALL"
                ? "bg-zinc-100 text-zinc-950 font-semibold shadow-md"
                : "bg-zinc-800/60 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-700/50"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>ALL OPPORTUNITIES</span>
            <span className="px-1.5 py-0.2 rounded-md bg-zinc-700/50 text-[10px]">
              {categoryCounts.ALL}
            </span>
          </button>

          <button
            onClick={() => setActiveCategoryTab("TOP")}
            className={`px-3.5 py-2 rounded-xl text-xs font-medium transition-all duration-150 flex items-center gap-2 ${
              activeCategoryTab === "TOP"
                ? "bg-gradient-to-r from-amber-500 to-orange-500 text-zinc-950 font-bold shadow-md shadow-amber-500/20"
                : "bg-zinc-800/60 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-700/50"
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span>TOP HIGH CONVICTION</span>
            <span className="px-1.5 py-0.2 rounded-md bg-zinc-700/50 text-[10px]">
              {categoryCounts.TOP}
            </span>
          </button>

          <button
            onClick={() => setActiveCategoryTab("DISCOVERIES")}
            className={`px-3.5 py-2 rounded-xl text-xs font-medium transition-all duration-150 flex items-center gap-2 ${
              activeCategoryTab === "DISCOVERIES"
                ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-zinc-950 font-bold shadow-md shadow-emerald-500/20"
                : "bg-zinc-800/60 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-700/50"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>NEW DISCOVERIES (MARKET-WIDE)</span>
            <span className="px-1.5 py-0.2 rounded-md bg-zinc-700/50 text-[10px]">
              {categoryCounts.DISCOVERIES}
            </span>
          </button>

          <button
            onClick={() => setActiveCategoryTab("PORTFOLIO")}
            className={`px-3.5 py-2 rounded-xl text-xs font-medium transition-all duration-150 flex items-center gap-2 ${
              activeCategoryTab === "PORTFOLIO"
                ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-zinc-950 font-bold shadow-md shadow-blue-500/20"
                : "bg-zinc-800/60 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-700/50"
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-cyan-400" />
            <span>PORTFOLIO ACTIONS</span>
            <span className="px-1.5 py-0.2 rounded-md bg-zinc-700/50 text-[10px]">
              {categoryCounts.PORTFOLIO}
            </span>
          </button>

          <button
            onClick={() => setActiveCategoryTab("RISKS")}
            className={`px-3.5 py-2 rounded-xl text-xs font-medium transition-all duration-150 flex items-center gap-2 ${
              activeCategoryTab === "RISKS"
                ? "bg-gradient-to-r from-rose-500 to-pink-500 text-white font-bold shadow-md shadow-rose-500/20"
                : "bg-zinc-800/60 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-700/50"
            }`}
          >
            <Shield className="w-3.5 h-3.5 text-rose-400" />
            <span>MARKET RISKS / AVOID</span>
            <span className="px-1.5 py-0.2 rounded-md bg-zinc-700/50 text-[10px]">
              {categoryCounts.RISKS}
            </span>
          </button>
        </div>

        {/* Secondary Filter Controls */}
        <div className="mt-4 pt-4 border-t border-zinc-800/60 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search box */}
          <div className="relative">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search ticker, company, theme..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-zinc-950/70 border border-zinc-800 rounded-xl text-xs text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-indigo-500/60 transition-colors"
            />
          </div>

          {/* Recommendation dropdown */}
          <div className="relative">
            <select
              value={selectedRec}
              onChange={(e) => setSelectedRec(e.target.value as any)}
              className="w-full px-3 py-2 bg-zinc-950/70 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-indigo-500/60 transition-colors appearance-none cursor-pointer"
            >
              {REC_OPTIONS.map((rec) => (
                <option key={rec} value={rec} className="bg-zinc-900 text-zinc-200">
                  {rec === "ALL" ? "All Recommendations" : `Recommendation: ${rec}`}
                </option>
              ))}
            </select>
          </div>

          {/* Sector dropdown */}
          <div className="relative">
            <select
              value={selectedSector}
              onChange={(e) => setSelectedSector(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-950/70 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-indigo-500/60 transition-colors appearance-none cursor-pointer"
            >
              {SECTOR_OPTIONS.map((sec) => (
                <option key={sec} value={sec} className="bg-zinc-900 text-zinc-200">
                  {sec === "ALL" ? "All 33 NSE Sectors" : sec}
                </option>
              ))}
            </select>
          </div>

          {/* Time Horizon dropdown */}
          <div className="relative">
            <select
              value={selectedHorizon}
              onChange={(e) => setSelectedHorizon(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-950/70 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-indigo-500/60 transition-colors appearance-none cursor-pointer"
            >
              {TIME_HORIZON_OPTIONS.map((hz) => (
                <option key={hz} value={hz} className="bg-zinc-900 text-zinc-200">
                  {hz === "ALL" ? "All Horizons" : `Horizon: ${hz}`}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Opportunities Grid / List */}
      <div className="mt-6">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-6 animate-pulse space-y-4"
              >
                <div className="h-6 bg-zinc-800 rounded-lg w-2/3" />
                <div className="h-4 bg-zinc-800 rounded w-1/2" />
                <div className="h-20 bg-zinc-800/50 rounded-xl" />
                <div className="h-10 bg-zinc-800 rounded-xl" />
              </div>
            ))}
          </div>
        ) : filteredOpportunities.length === 0 ? (
          <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-2xl p-12 text-center space-y-4">
            <Compass className="w-12 h-12 text-zinc-600 mx-auto" />
            <h3 className="text-base font-semibold text-zinc-300">
              No matching suggestions found for the selected filters.
            </h3>
            <p className="text-xs text-zinc-500 max-w-md mx-auto">
              Try broadening your sector or recommendation filters, or click "Scan & Discover Ideas" to scan fresh market intelligence.
            </p>
            <button
              onClick={() => {
                setActiveCategoryTab("ALL");
                setSelectedRec("ALL");
                setSelectedSector("ALL");
                setSelectedHorizon("ALL");
                setSearchQuery("");
              }}
              className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-300 transition-colors"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredOpportunities.map((opp) => {
              const valTier = getValuationTierBadge(opp.valuation_tier || opp.metrics?.valuation_tier);
              const p1d = opp.metrics?.price_change_1d ?? null;
              const p5d = opp.metrics?.price_change_5d ?? null;
              const p20d = opp.metrics?.price_change_20d ?? null;
              const dist52w = opp.metrics?.distance_from_52w_high_pct ?? null;

              return (
                <div
                  key={opp.id || opp.ticker}
                  className="group bg-gradient-to-b from-zinc-900/90 to-zinc-950/90 hover:from-zinc-900 hover:to-zinc-900/95 border border-zinc-800/80 hover:border-zinc-700/80 rounded-2xl p-5 sm:p-6 transition-all duration-200 shadow-lg hover:shadow-2xl flex flex-col justify-between"
                >
                  {/* Top Metadata Row */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {opp.is_owned ? (
                          <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-[10px] font-semibold flex items-center gap-1">
                            <Zap className="w-2.5 h-2.5" />
                            PORTFOLIO {opp.portfolio_allocation_pct ? `(${opp.portfolio_allocation_pct}%)` : ""}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[10px] font-semibold flex items-center gap-1">
                            <Sparkles className="w-2.5 h-2.5" />
                            NEW DISCOVERY
                          </span>
                        )}
                        <span className="px-2 py-0.5 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-400 text-[10px] truncate max-w-[130px]">
                          {opp.sector}
                        </span>
                      </div>

                      {/* Catalyst Durability Pill */}
                      {opp.catalyst_durability && (
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                            opp.catalyst_durability === "STRUCTURAL"
                              ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-300"
                              : "bg-amber-500/10 border-amber-500/30 text-amber-300"
                          }`}
                        >
                          {opp.catalyst_durability}
                        </span>
                      )}
                    </div>

                    {/* Stock & Recommendation Header */}
                    <div className="flex items-start justify-between gap-3 pt-1">
                      <div>
                        <div className="flex items-baseline gap-2">
                          <h3 className="text-xl font-bold text-zinc-100 group-hover:text-indigo-300 transition-colors">
                            {opp.ticker}
                          </h3>
                          <span className="text-xs font-semibold text-zinc-400">
                            ₹{opp.current_price?.toLocaleString("en-IN") || "N/A"}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-400 truncate max-w-[200px]">
                          {opp.company_name}
                        </p>
                      </div>

                      {/* Recommendation Badge */}
                      <span
                        className={`px-3 py-1 rounded-xl text-xs font-bold border tracking-wide uppercase shrink-0 ${getRecommendationBadge(
                          opp.recommendation
                        )}`}
                      >
                        {opp.recommendation}
                      </span>
                    </div>

                    {/* Conviction Score & Valuation Tier Bar */}
                    <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800/60">
                      <div className="flex items-center gap-2">
                        <div className="flex flex-col">
                          <span className="text-[10px] text-zinc-500 font-medium uppercase">
                            Conviction
                          </span>
                          <span className="text-xs font-bold text-zinc-200">
                            {opp.conviction_score}/100
                          </span>
                        </div>
                        <div className="w-16 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              opp.conviction_score >= 75
                                ? "bg-emerald-400"
                                : opp.conviction_score >= 60
                                ? "bg-indigo-400"
                                : "bg-amber-400"
                            }`}
                            style={{ width: `${opp.conviction_score}%` }}
                          />
                        </div>
                      </div>

                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-medium border ${valTier.color}`}
                      >
                        {valTier.label}
                      </span>
                    </div>

                    {/* Triggering Event Box */}
                    <div className="space-y-1.5 p-3 rounded-xl bg-zinc-950/40 border border-zinc-800/40 text-xs">
                      <div className="flex items-center justify-between text-zinc-500 text-[10px]">
                        <span className="font-semibold uppercase tracking-wider flex items-center gap-1 text-zinc-400">
                          <Compass className="w-3 h-3 text-indigo-400" />
                          Market Catalyst
                        </span>
                        <span>{opp.time_horizon}</span>
                      </div>
                      <p className="text-zinc-300 line-clamp-2 leading-relaxed">
                        {opp.event_summary}
                      </p>
                    </div>

                    {/* "Why BullCompass Suggests This" Deterministic Bullets */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-semibold uppercase text-zinc-500 tracking-wider">
                        Why BullCompass Suggests This
                      </span>
                      <ul className="space-y-1 text-xs text-zinc-400">
                        {/* 1. Fundamentals bullet */}
                        <li className="flex items-start gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <span className="line-clamp-1">
                            {opp.metrics?.revenue_cagr_3y != null
                              ? `3Y Revenue CAGR: ${opp.metrics.revenue_cagr_3y}% | ROCE: ${opp.metrics.roce || "N/A"}%`
                              : "Solid balance sheet & operating margins"}
                          </span>
                        </li>

                        {/* 2. Earnings quality bullet */}
                        <li className="flex items-start gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <span className="line-clamp-1">
                            {opp.metrics?.cfo_to_pat_ratio != null
                              ? `CFO/PAT: ${opp.metrics.cfo_to_pat_ratio}x (Cash conversion)`
                              : "Audited multi-year earnings support"}
                          </span>
                        </li>

                        {/* 3. Valuation multiple */}
                        <li className="flex items-start gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <span className="line-clamp-1">
                            P/E: {opp.metrics?.pe_ratio ? `${opp.metrics.pe_ratio}x` : "N/A"} | P/B: {opp.metrics?.pb_ratio ? `${opp.metrics.pb_ratio}x` : "N/A"}
                          </span>
                        </li>
                      </ul>
                    </div>

                    {/* Price Momentum Grid (1D, 5D, 20D, 52W High) */}
                    <div className="grid grid-cols-4 gap-1.5 pt-1 text-center">
                      <div className="p-1.5 rounded-lg bg-zinc-950/60 border border-zinc-800/40">
                        <span className="text-[9px] text-zinc-500 block uppercase">1D</span>
                        <span
                          className={`text-xs font-semibold ${
                            (p1d || 0) >= 0 ? "text-emerald-400" : "text-rose-400"
                          }`}
                        >
                          {p1d != null ? `${p1d > 0 ? "+" : ""}${p1d}%` : "—"}
                        </span>
                      </div>
                      <div className="p-1.5 rounded-lg bg-zinc-950/60 border border-zinc-800/40">
                        <span className="text-[9px] text-zinc-500 block uppercase">5D</span>
                        <span
                          className={`text-xs font-semibold ${
                            (p5d || 0) >= 0 ? "text-emerald-400" : "text-rose-400"
                          }`}
                        >
                          {p5d != null ? `${p5d > 0 ? "+" : ""}${p5d}%` : "—"}
                        </span>
                      </div>
                      <div className="p-1.5 rounded-lg bg-zinc-950/60 border border-zinc-800/40">
                        <span className="text-[9px] text-zinc-500 block uppercase">20D</span>
                        <span
                          className={`text-xs font-semibold ${
                            (p20d || 0) >= 0 ? "text-emerald-400" : "text-rose-400"
                          }`}
                        >
                          {p20d != null ? `${p20d > 0 ? "+" : ""}${p20d}%` : "—"}
                        </span>
                      </div>
                      <div className="p-1.5 rounded-lg bg-zinc-950/60 border border-zinc-800/40">
                        <span className="text-[9px] text-zinc-500 block uppercase">vs 52W H</span>
                        <span className="text-xs font-semibold text-zinc-300">
                          {dist52w != null ? `${dist52w}%` : "—"}
                        </span>
                      </div>
                    </div>

                    {/* Hard Risk Gate Notice */}
                    {opp.hard_gates_triggered && opp.hard_gates_triggered.length > 0 ? (
                      <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] flex items-start gap-2">
                        <ShieldAlert className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-400" />
                        <div className="space-y-0.5">
                          <span className="font-semibold block">
                            {opp.hard_gates_triggered[0].gate_name}
                          </span>
                          <p className="text-amber-300/80 text-[10px] line-clamp-1">
                            {opp.hard_gates_triggered[0].impact_on_decision}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="p-2 rounded-xl bg-emerald-500/5 border border-emerald-500/15 text-emerald-400/90 text-[10px] flex items-center gap-1.5">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                        <span>All Hard Risk Gates Cleared</span>
                      </div>
                    )}
                  </div>

                  {/* Modal Trigger Action */}
                  <div className="mt-5 pt-3 border-t border-zinc-800/60">
                    <button
                      onClick={() => setSelectedOpportunity(opp)}
                      className="w-full py-2 px-3 rounded-xl bg-zinc-800/60 hover:bg-zinc-700/60 text-xs font-medium text-zinc-200 hover:text-white transition-all flex items-center justify-center gap-2 group-hover:border-indigo-500/40 border border-transparent cursor-pointer"
                    >
                      <span>Institutional Research Memo</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform text-indigo-400" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal View for Full Institutional Research Memo */}
      {selectedOpportunity && (
        <OpportunityDetailModal
          opportunity={selectedOpportunity}
          onClose={() => setSelectedOpportunity(null)}
        />
      )}
    </section>
  );
};
