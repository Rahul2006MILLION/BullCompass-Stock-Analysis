"use client";

import React from "react";
import { PriceMomentumContext } from "@/types/research";
import { Card } from "@/components/ui/Card";
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Compass,
  AlertCircle,
  CheckCircle,
  Zap,
} from "lucide-react";

interface PriceMomentumCardProps {
  momentum?: PriceMomentumContext;
}

export function PriceMomentumCard({ momentum }: PriceMomentumCardProps) {
  if (!momentum) return null;

  const p1d = momentum.price_change_1d ?? 0;
  const p5d = momentum.price_change_5d ?? 0;
  const p20d = momentum.price_change_20d ?? 0;
  const dist52w = momentum.distance_from_52w_high_pct;

  const getStanceBadge = (stance: string) => {
    switch (stance.toUpperCase()) {
      case "OVERHEATED":
        return {
          bg: "bg-rose-500/20 text-rose-300 border-rose-500/40",
          icon: <AlertCircle className="w-3.5 h-3.5 text-rose-400" />,
          label: "Overextended / Extended Rally",
        };
      case "PULLBACK_ENTRY":
        return {
          bg: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
          icon: <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />,
          label: "Attractive Pullback Entry",
        };
      case "MOMENTUM_EXPANDING":
        return {
          bg: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40",
          icon: <Zap className="w-3.5 h-3.5 text-cyan-400" />,
          label: "Expanding Momentum",
        };
      case "HEAVY_SELLING":
        return {
          bg: "bg-rose-500/20 text-rose-300 border-rose-500/40",
          icon: <TrendingDown className="w-3.5 h-3.5 text-rose-400" />,
          label: "Heavy Selling Pressure",
        };
      default:
        return {
          bg: "bg-gray-500/20 text-gray-300 border-gray-500/40",
          icon: <Activity className="w-3.5 h-3.5 text-gray-400" />,
          label: "Neutral Momentum Range",
        };
    }
  };

  const badge = getStanceBadge(momentum.technical_stance);

  const formatPct = (val: number) => {
    const sign = val > 0 ? "+" : "";
    return `${sign}${val.toFixed(2)}%`;
  };

  return (
    <Card className="p-5 bg-gradient-to-br from-[#0c121e] to-[#101726] border-white/10 shadow-xl space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/8">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2 font-mono">
              Price Momentum & Technical Positioning
            </h3>
            <p className="text-xs text-gray-400">
              Multi-timeframe price velocity and 52-week range positioning
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg border text-xs font-mono font-bold uppercase tracking-wider ${badge.bg}`}
          >
            {badge.icon}
            <span>{badge.label}</span>
          </span>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* 1D */}
        <div className="p-3 rounded-xl bg-black/30 border border-white/6 space-y-1">
          <span className="text-[11px] text-gray-400 font-mono block">1-Day Momentum</span>
          <span
            className={`text-base font-bold font-mono flex items-center gap-1 ${
              p1d >= 0 ? "text-emerald-400" : "text-rose-400"
            }`}
          >
            {p1d >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
            {formatPct(p1d)}
          </span>
          <span className="text-[10px] text-gray-500 font-mono block">Latest session</span>
        </div>

        {/* 5D */}
        <div className="p-3 rounded-xl bg-black/30 border border-white/6 space-y-1">
          <span className="text-[11px] text-gray-400 font-mono block">5-Day Velocity</span>
          <span
            className={`text-base font-bold font-mono flex items-center gap-1 ${
              p5d >= 0 ? "text-emerald-400" : "text-rose-400"
            }`}
          >
            {p5d >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
            {formatPct(p5d)}
          </span>
          <span className="text-[10px] text-gray-500 font-mono block">1-week trajectory</span>
        </div>

        {/* 20D */}
        <div className="p-3 rounded-xl bg-black/30 border border-white/6 space-y-1">
          <span className="text-[11px] text-gray-400 font-mono block">20-Day Trend</span>
          <span
            className={`text-base font-bold font-mono flex items-center gap-1 ${
              p20d >= 0 ? "text-emerald-400" : "text-rose-400"
            }`}
          >
            {p20d >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
            {formatPct(p20d)}
          </span>
          <span className="text-[10px] text-gray-500 font-mono block">1-month accumulation</span>
        </div>

        {/* 52W Range */}
        <div className="p-3 rounded-xl bg-black/30 border border-white/6 space-y-1">
          <span className="text-[11px] text-gray-400 font-mono block">Distance from 52W High</span>
          <span
            className={`text-base font-bold font-mono ${
              dist52w !== null && dist52w !== undefined && dist52w <= -15
                ? "text-emerald-400"
                : dist52w !== null && dist52w !== undefined && dist52w > -3
                ? "text-amber-400"
                : "text-gray-300"
            }`}
          >
            {dist52w !== null && dist52w !== undefined ? `${dist52w.toFixed(1)}%` : "N/A"}
          </span>
          <span className="text-[10px] text-gray-500 font-mono block">
            52W High: ₹{momentum.fifty_two_week_high?.toFixed(1) || "N/A"}
          </span>
        </div>
      </div>

      {/* Narrative Interpretation */}
      <div className="p-3.5 rounded-xl bg-black/25 border border-white/6 text-xs text-gray-300 font-mono flex items-start gap-2">
        <span className="text-cyan-400 font-bold uppercase tracking-wider text-[10px] flex-shrink-0 mt-0.5">
          Catalyst & Technical Context:
        </span>
        <span className="leading-relaxed">{momentum.interpretation}</span>
      </div>
    </Card>
  );
}
