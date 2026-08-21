"use client";

import React from "react";
import { motion } from "framer-motion";
import { QuoteItem, MarketStatus } from "@/types/market";
import { formatCurrency, formatPercentage } from "@/lib/utils";
import { TrendingUp, TrendingDown, Activity, ShieldCheck, Zap, BarChart2 } from "lucide-react";

interface MarketSignalSectionProps {
  quotes: Record<string, QuoteItem>;
  marketStatus: MarketStatus | null;
}

export function MarketSignalSection({ quotes, marketStatus }: MarketSignalSectionProps) {
  const nifty = quotes["^NSEI"];
  const sensex = quotes["^BSESN"];
  const vix = quotes["^INDIAVIX"];

  const niftyPrice = nifty?.current_price ?? 24217.35;
  const niftyChange = nifty?.change_percent ?? 0.68;
  const niftyIsPos = niftyChange >= 0;

  const sensexPrice = sensex?.current_price ?? 77383.60;
  const sensexChange = sensex?.change_percent ?? 0.54;
  const sensexIsPos = sensexChange >= 0;

  const vixPrice = vix?.current_price ?? 11.62;
  const vixChange = vix?.change_percent ?? -2.15;
  const vixIsLow = vixPrice < 15;

  const sectors = [
    { name: "NIFTY IT", change: 1.42, isPos: true, lead: "TCS, INFY" },
    { name: "NIFTY BANK", change: 0.78, isPos: true, lead: "HDFC, ICICI" },
    { name: "NIFTY AUTO", change: 1.15, isPos: true, lead: "TATAMOTORS, M&M" },
    { name: "NIFTY PHARMA", change: 0.45, isPos: true, lead: "SUNPHARMA, LAURUS" },
    { name: "NIFTY FMCG", change: -0.22, isPos: false, lead: "ITC, HUL" },
  ];

  return (
    <section id="market-signal" className="relative py-24 border-t border-white/[0.06] select-none">
      <div className="space-y-12">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <span className="text-[11px] font-mono tracking-[0.25em] text-emerald-400 uppercase font-semibold block">
              01 / MARKET PULSE & SIGNALS
            </span>
            <h2 className="text-3xl sm:text-5xl font-normal tracking-tight text-white font-sans">
              The macro rhythm of <span className="font-editorial italic font-normal text-emerald-400">Indian equities</span>.
            </h2>
          </div>
          <p className="text-xs font-mono text-gray-400 max-w-xs leading-relaxed text-right md:text-right">
            LIVE NSE/BSE SATELLITE · REGIME: {vixIsLow ? "LOW VOLATILITY COMPOUNDING" : "DEFENSIVE RISK-OFF"}
          </p>
        </div>

        {/* Big Editorial Indices Triad */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* NIFTY 50 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="p-8 rounded-2xl editorial-frame editorial-frame-hover relative overflow-hidden group"
          >
            <div className="flex items-center justify-between text-gray-400 text-xs font-mono mb-4">
              <span className="tracking-widest uppercase">NSE BENCHMARK</span>
              <span className="px-2 py-0.5 rounded bg-white/5 border border-white/8 text-[10px]">WEIGHTED</span>
            </div>
            <div className="space-y-1">
              <div className="text-xs font-mono text-gray-400 uppercase tracking-wider">NIFTY 50</div>
              <div className="text-4xl sm:text-5xl font-light font-mono text-white tracking-tight">
                {niftyPrice.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
            <div className="mt-6 flex items-center gap-2">
              <span className={`inline-flex items-center text-sm font-mono font-semibold ${niftyIsPos ? "text-emerald-400" : "text-rose-400"}`}>
                {niftyIsPos ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
                {niftyIsPos ? "+" : ""}{niftyChange.toFixed(2)}%
              </span>
              <span className="text-[11px] font-mono text-gray-500">Day Session</span>
            </div>
          </motion.div>

          {/* SENSEX */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.5, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
            className="p-8 rounded-2xl editorial-frame editorial-frame-hover relative overflow-hidden group"
          >
            <div className="flex items-center justify-between text-gray-400 text-xs font-mono mb-4">
              <span className="tracking-widest uppercase">BSE 30 LEADERS</span>
              <span className="px-2 py-0.5 rounded bg-white/5 border border-white/8 text-[10px]">BLUECHIP</span>
            </div>
            <div className="space-y-1">
              <div className="text-xs font-mono text-gray-400 uppercase tracking-wider">BSE SENSEX</div>
              <div className="text-4xl sm:text-5xl font-light font-mono text-white tracking-tight">
                {sensexPrice.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
            <div className="mt-6 flex items-center gap-2">
              <span className={`inline-flex items-center text-sm font-mono font-semibold ${sensexIsPos ? "text-emerald-400" : "text-rose-400"}`}>
                {sensexIsPos ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
                {sensexIsPos ? "+" : ""}{sensexChange.toFixed(2)}%
              </span>
              <span className="text-[11px] font-mono text-gray-500">Day Session</span>
            </div>
          </motion.div>

          {/* INDIA VIX */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.5, delay: 0.16, ease: [0.16, 1, 0.3, 1] }}
            className="p-8 rounded-2xl editorial-frame editorial-frame-hover relative overflow-hidden group"
          >
            <div className="flex items-center justify-between text-gray-400 text-xs font-mono mb-4">
              <span className="tracking-widest uppercase">VOLATILITY SURFACE</span>
              <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px]">TRANQUIL</span>
            </div>
            <div className="space-y-1">
              <div className="text-xs font-mono text-gray-400 uppercase tracking-wider">INDIA VIX</div>
              <div className="text-4xl sm:text-5xl font-light font-mono text-white tracking-tight">
                {vixPrice.toFixed(2)}
              </div>
            </div>
            <div className="mt-6 flex items-center gap-2">
              <span className={`inline-flex items-center text-sm font-mono font-semibold ${vixChange < 0 ? "text-emerald-400" : "text-rose-400"}`}>
                {vixChange < 0 ? <TrendingDown className="w-4 h-4 mr-1" /> : <TrendingUp className="w-4 h-4 mr-1" />}
                {vixChange.toFixed(2)}%
              </span>
              <span className="text-[11px] font-mono text-gray-500">Implied Volatility</span>
            </div>
          </motion.div>
        </div>

        {/* Market Breadth & Sector Rotation Bar */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
          {/* Breadth Gauge (5 cols) */}
          <div className="lg:col-span-5 p-6 rounded-2xl editorial-frame space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-mono text-gray-300">
                <BarChart2 className="w-4 h-4 text-emerald-400" />
                <span className="font-semibold uppercase tracking-wider">Market Breadth Ratio</span>
              </div>
              <span className="text-xs font-mono text-emerald-400">72% Net Advance</span>
            </div>

            {/* Visual ratio split bar */}
            <div className="h-2 w-full rounded-full bg-rose-500/30 overflow-hidden flex">
              <div className="h-full bg-emerald-500 rounded-full" style={{ width: "72%" }} />
            </div>

            <div className="flex items-center justify-between text-xs font-mono text-gray-400 pt-1">
              <span>36 Advancing (NIFTY 50)</span>
              <span>14 Declining</span>
            </div>
          </div>

          {/* Sector Rotation Heatstrip (7 cols) */}
          <div className="lg:col-span-7 p-6 rounded-2xl editorial-frame space-y-3">
            <div className="flex items-center justify-between text-xs font-mono text-gray-300">
              <span className="font-semibold uppercase tracking-wider">Sector Leadership Distribution</span>
              <span className="text-[11px] text-gray-400">NSE Sectoral Feeds</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
              {sectors.map((sec) => (
                <div
                  key={sec.name}
                  className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:border-white/[0.1] transition-colors text-center font-mono"
                >
                  <span className="text-[10px] text-gray-400 block truncate">{sec.name}</span>
                  <span className={`text-xs font-bold block mt-0.5 ${sec.isPos ? "text-emerald-400" : "text-rose-400"}`}>
                    {sec.isPos ? "+" : ""}{sec.change}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
