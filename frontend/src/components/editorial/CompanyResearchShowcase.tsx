"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { formatCurrency, formatPercentage } from "@/lib/utils";
import { ShieldCheck, TrendingUp, Sparkles, ArrowUpRight, ArrowRight, Activity, AlertTriangle } from "lucide-react";
import Link from "next/link";

interface SampleStockAnalysis {
  ticker: string;
  name: string;
  sector: string;
  currentPrice: number;
  fairValue: number;
  upside: number;
  convictionScore: number;
  peRatio: number;
  fiveYearPE: number;
  peDiscount: number;
  roce: number;
  fcfYield: number;
  catalyst: string;
  earningsQuality: string;
  riskInvalidation: string;
}

const STOCKS_DATABASE: Record<string, SampleStockAnalysis> = {
  TCS: {
    ticker: "TCS",
    name: "Tata Consultancy Services Ltd",
    sector: "Information Technology · Digital Transformation",
    currentPrice: 3500.0,
    fairValue: 4150.0,
    upside: 18.57,
    convictionScore: 92,
    peRatio: 27.8,
    fiveYearPE: 33.5,
    peDiscount: 17.0,
    roce: 58.4,
    fcfYield: 4.8,
    catalyst: "Multi-billion dollar sovereign AI infrastructure contracts & European banking modernization deals.",
    earningsQuality: "Zero debt, 102% operating cash conversion, high reinvestment rate with pristine balance sheet.",
    riskInvalidation: "US discretionary tech spend freeze exceeding 2 quarters or cross-currency margin compression.",
  },
  RELIANCE: {
    ticker: "RELIANCE",
    name: "Reliance Industries Ltd",
    sector: "Conglomerate · Retail, Telecom & Energy",
    currentPrice: 2840.0,
    fairValue: 3350.0,
    upside: 17.96,
    convictionScore: 88,
    peRatio: 26.4,
    fiveYearPE: 30.2,
    peDiscount: 12.6,
    roce: 14.8,
    fcfYield: 3.9,
    catalyst: "5G monetization, retail network density expansion, and new energy gigafactory operationalization.",
    earningsQuality: "Resilient cash flow generation across consumer businesses offsetting cyclical refining margins.",
    riskInvalidation: "Crude refining margin collapse below $6/bbl or elevated net debt trajectory from new capex.",
  },
  HDFCBANK: {
    ticker: "HDFCBANK",
    name: "HDFC Bank Ltd",
    sector: "Financial Services · Private Commercial Banking",
    currentPrice: 1640.0,
    fairValue: 1980.0,
    upside: 20.73,
    convictionScore: 94,
    peRatio: 18.2,
    fiveYearPE: 22.8,
    peDiscount: 20.2,
    roce: 17.4,
    fcfYield: 6.2,
    catalyst: "Deposit accretion outperforming credit growth, branch synergy realization post-merger integration.",
    earningsQuality: "Gross NPA at record low 1.24%, conservative 74% provision coverage, stellar CASA franchise.",
    riskInvalidation: "Net interest margin compression below 3.2% or sustained deposit mobilization stagnation.",
  },
  INFY: {
    ticker: "INFY",
    name: "Infosys Ltd",
    sector: "Information Technology · Enterprise Cloud",
    currentPrice: 1780.0,
    fairValue: 2050.0,
    upside: 15.17,
    convictionScore: 87,
    peRatio: 25.1,
    fiveYearPE: 29.4,
    peDiscount: 14.6,
    roce: 42.1,
    fcfYield: 4.2,
    catalyst: "Generative AI platform Topaz enterprise adoption and large deal pipeline exceeding $4.5B.",
    earningsQuality: "Strong free cash flow accrual, 85% dividend payout consistency, industry-leading operating margins.",
    riskInvalidation: "BFSI client budget cancellation or senior leadership turnover in key verticals.",
  },
  TATAMOTORS: {
    ticker: "TATAMOTORS",
    name: "Tata Motors Ltd",
    sector: "Automotive · EV & Premium Mobility",
    currentPrice: 960.0,
    fairValue: 1180.0,
    upside: 22.92,
    convictionScore: 89,
    peRatio: 16.8,
    fiveYearPE: 24.5,
    peDiscount: 31.4,
    roce: 22.6,
    fcfYield: 5.8,
    catalyst: "JLR order book backlog execution, debt-free domestic PV/CV division demerger unlocking value.",
    earningsQuality: "Rapid debt deleveraging with record operating cash flows and expanding JLR EBIT margins.",
    riskInvalidation: "European luxury EV demand deceleration or supply chain disruption in specialized electronics.",
  },
  LAURUSLABS: {
    ticker: "LAURUSLABS",
    name: "Laurus Labs Ltd",
    sector: "Pharmaceuticals · CDMO & Specialty Biotech",
    currentPrice: 440.0,
    fairValue: 560.0,
    upside: 27.27,
    convictionScore: 85,
    peRatio: 34.2,
    fiveYearPE: 41.0,
    peDiscount: 16.6,
    roce: 18.2,
    fcfYield: 3.4,
    catalyst: "Commercialization of new CDMO capacities with top global biotech partners and high-margin synthesis.",
    earningsQuality: "R&D reinvestment rate at 7.5% of sales, pristine USFDA audit compliance records.",
    riskInvalidation: "Regulatory observation from key inspection agencies or raw material inflation in API intermediates.",
  },
};

export function CompanyResearchShowcase() {
  const [selectedTicker, setSelectedTicker] = useState<string>("TCS");
  const data = STOCKS_DATABASE[selectedTicker] || STOCKS_DATABASE.TCS;

  return (
    <section className="relative py-24 border-t border-white/[0.06] select-none">
      <div className="space-y-12">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <span className="text-[11px] font-mono tracking-[0.25em] text-emerald-400 uppercase font-semibold block">
              03 / FORENSIC COMPANY RESEARCH
            </span>
            <h2 className="text-3xl sm:text-5xl font-normal tracking-tight text-white font-sans">
              Investigating the <span className="font-editorial italic font-normal text-emerald-400">balance sheet</span>.
            </h2>
          </div>
          <p className="text-xs font-mono text-gray-400 max-w-xs leading-relaxed text-left md:text-right">
            COMPREHENSIVE INSTITUTIONAL GATES APPLIED ACROSS VALUATION, QUALITY, AND MOAT DURABILITY
          </p>
        </div>

        {/* Stock Selector Pill Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {Object.keys(STOCKS_DATABASE).map((tick) => {
            const isSelected = selectedTicker === tick;
            return (
              <button
                key={tick}
                onClick={() => setSelectedTicker(tick)}
                className={`px-4 py-2 rounded-xl text-xs font-mono font-semibold transition-all ${
                  isSelected
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm"
                    : "bg-white/[0.02] text-gray-400 border border-white/[0.06] hover:text-gray-200 hover:bg-white/[0.05]"
                }`}
              >
                {tick}
              </button>
            );
          })}
        </div>

        {/* Large Scale Editorial Showcase Canvas */}
        <AnimatePresence mode="wait">
          <motion.div
            key={data.ticker}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="rounded-3xl editorial-frame p-8 lg:p-12 space-y-8 relative overflow-hidden"
          >
            {/* Top Company Identity Bar */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-8 border-b border-white/[0.06]">
              <div className="space-y-1.5">
                <div className="flex items-center gap-3">
                  <span className="text-3xl sm:text-4xl font-bold font-mono tracking-tight text-white">
                    {data.ticker}
                  </span>
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-white/5 border border-white/10 text-gray-300">
                    NSE LISTED
                  </span>
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-semibold">
                    AI CONVICTION: {data.convictionScore}/100
                  </span>
                </div>
                <div className="text-sm text-gray-300 font-sans">{data.name}</div>
                <div className="text-xs text-gray-400 font-mono">{data.sector}</div>
              </div>

              {/* Price & Upside Column */}
              <div className="flex items-center gap-8">
                <div>
                  <span className="text-[11px] font-mono text-gray-400 uppercase tracking-wider block">Live Price</span>
                  <span className="text-2xl font-bold font-mono text-white mt-0.5 block">
                    {formatCurrency(data.currentPrice)}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] font-mono text-gray-400 uppercase tracking-wider block">Target Intrinsic Value</span>
                  <span className="text-2xl font-bold font-mono text-emerald-400 mt-0.5 block">
                    {formatCurrency(data.fairValue)}
                  </span>
                </div>
                <div className="hidden sm:block">
                  <span className="text-[11px] font-mono text-gray-400 uppercase tracking-wider block">Margin of Safety</span>
                  <span className="text-2xl font-bold font-mono text-emerald-400 mt-0.5 block">
                    +{data.upside.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Asymmetric 3-Column Institutional Architecture */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Left Column: Valuation & Capital Allocation (4 cols) */}
              <div className="lg:col-span-4 space-y-6">
                <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.05] space-y-4">
                  <div className="flex items-center justify-between text-xs font-mono text-gray-400 uppercase tracking-wider">
                    <span>Valuation Multiple Stance</span>
                    <span className="text-emerald-400 font-semibold">{data.peDiscount}% Discount</span>
                  </div>
                  <div className="space-y-2 font-mono text-xs">
                    <div className="flex justify-between py-1 border-b border-white/[0.04]">
                      <span className="text-gray-400">Current P/E</span>
                      <span className="text-white font-semibold">{data.peRatio}x</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-white/[0.04]">
                      <span className="text-gray-400">5Y Historical Median P/E</span>
                      <span className="text-gray-300">{data.fiveYearPE}x</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-white/[0.04]">
                      <span className="text-gray-400">ROCE (Capital Efficiency)</span>
                      <span className="text-emerald-400 font-semibold">{data.roce}%</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-gray-400">Free Cash Flow Yield</span>
                      <span className="text-white font-semibold">{data.fcfYield}%</span>
                    </div>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.05] space-y-2">
                  <div className="text-xs font-mono text-gray-400 uppercase tracking-wider">Earnings Quality Audit</div>
                  <p className="text-xs text-gray-300 leading-relaxed font-sans">{data.earningsQuality}</p>
                </div>
              </div>

              {/* Center Column: Catalysts & Growth Thesis (5 cols) */}
              <div className="lg:col-span-5 space-y-6">
                <div className="p-6 rounded-2xl bg-emerald-500/[0.04] border border-emerald-500/20 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 uppercase tracking-wider font-semibold">
                    <Sparkles className="w-4 h-4" />
                    <span>Primary Growth & Margin Catalyst</span>
                  </div>
                  <p className="text-sm text-gray-200 leading-relaxed font-sans">{data.catalyst}</p>
                </div>

                <div className="p-6 rounded-2xl bg-rose-500/[0.04] border border-rose-500/20 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-mono text-rose-400 uppercase tracking-wider font-semibold">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Thesis Invalidation Trigger</span>
                  </div>
                  <p className="text-xs text-gray-300 leading-relaxed font-sans">{data.riskInvalidation}</p>
                </div>
              </div>

              {/* Right Column: AI Action Gateway (3 cols) */}
              <div className="lg:col-span-3 flex flex-col justify-between p-6 rounded-2xl bg-[#090c13] border border-white/[0.08] space-y-6">
                <div className="space-y-3">
                  <span className="text-[10px] font-mono tracking-widest text-emerald-400 uppercase font-semibold block">
                    INVESTMENT GATEWAY
                  </span>
                  <h4 className="text-lg font-bold text-white tracking-tight">Institutional Dossier</h4>
                  <p className="text-xs text-gray-400 leading-relaxed font-sans">
                    Read the complete 14-page AI research memo including Bear/Base/Bull scenarios, peer valuation matrix, and DCF sensitivity.
                  </p>
                </div>

                <Link href={`/ai-analysis?ticker=${data.ticker}`}>
                  <button className="w-full py-3 px-4 rounded-xl text-xs font-mono font-semibold bg-emerald-500 text-black hover:bg-emerald-400 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 hover:scale-[1.02] active:scale-[0.98]">
                    <span>Open Research Report</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </Link>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
