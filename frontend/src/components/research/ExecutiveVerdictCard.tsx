"use client";

import React from "react";
import { FinalVerdict, InvestmentDecisionResult, PriceMomentumContext, ValuationAssessment } from "@/types/research";
import { Card } from "@/components/ui/Card";
import {
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  AlertTriangle,
  Activity,
  Flame,
  Clock,
  Crosshair,
  Sparkles,
  Gauge,
} from "lucide-react";

interface ExecutiveVerdictCardProps {
  verdict?: FinalVerdict;
  decision: InvestmentDecisionResult;
  valuation?: ValuationAssessment;
  momentum?: PriceMomentumContext;
  ticker: string;
  companyName: string;
  currentPrice: number;
  marketCap: number;
  sector: string;
  industry: string;
  ollamaStatus: "ONLINE" | "OFFLINE_FALLBACK";
}

export function ExecutiveVerdictCard({
  verdict,
  decision,
  valuation,
  momentum,
  ticker,
  companyName,
  currentPrice,
  marketCap,
  sector,
  industry,
  ollamaStatus,
}: ExecutiveVerdictCardProps) {
  const verdictRating = verdict?.verdict || decision.decision;
  const convictionScore = verdict?.conviction_score ?? Math.round(decision.fundamental_score);
  const marginOfSafety = verdict?.margin_of_safety || (decision.valuation_status.includes("UNDERVALUED") ? "HIGH" : decision.valuation_status.includes("EXPENSIVE") ? "LOW" : "MEDIUM");
  const timeHorizon = verdict?.time_horizon || "1-3 years";
  const execSummary = verdict?.executive_summary || decision.key_strengths.join(". ");

  const getVerdictStyle = (v: string) => {
    const clean = v.toUpperCase();
    if (clean.includes("STRONG BUY")) {
      return {
        bg: "from-emerald-950/80 via-emerald-900/30 to-[#0c121e]",
        border: "border-emerald-500/50 shadow-emerald-500/15",
        text: "text-emerald-400",
        badgeBg: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
        icon: <Flame className="w-5 h-5 text-emerald-400 animate-pulse" />,
      };
    }
    if (clean.includes("BUY") || clean.includes("ACCUMULATE")) {
      return {
        bg: "from-emerald-950/60 via-[#101726] to-[#0c121e]",
        border: "border-emerald-500/40 shadow-emerald-500/10",
        text: "text-emerald-400",
        badgeBg: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
        icon: <TrendingUp className="w-5 h-5 text-emerald-400" />,
      };
    }
    if (clean.includes("HOLD") || clean.includes("WATCH")) {
      return {
        bg: "from-amber-950/60 via-[#141b29] to-[#0c121e]",
        border: "border-amber-500/40 shadow-amber-500/10",
        text: "text-amber-400",
        badgeBg: "bg-amber-500/20 text-amber-400 border-amber-500/30",
        icon: <Activity className="w-5 h-5 text-amber-400" />,
      };
    }
    return {
      bg: "from-rose-950/60 via-[#17121c] to-[#0c121e]",
      border: "border-rose-500/40 shadow-rose-500/10",
      text: "text-rose-400",
      badgeBg: "bg-rose-500/20 text-rose-400 border-rose-500/30",
      icon: <TrendingDown className="w-5 h-5 text-rose-400" />,
    };
  };

  const style = getVerdictStyle(verdictRating);

  return (
    <Card
      className={`relative overflow-hidden bg-gradient-to-br ${style.bg} ${style.border} border shadow-2xl p-6 sm:p-7 space-y-6`}
    >
      {/* Top Banner: Ticker & Meta */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-white/8">
        <div className="space-y-1.5">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-xs px-2.5 py-0.5 rounded-md bg-white/10 text-gray-300 font-mono font-bold tracking-wider">
              {ticker}
            </span>
            <span className="text-xs text-gray-400 font-medium">
              {sector} • {industry}
            </span>
            <span
              className={`text-[11px] px-2 py-0.5 rounded-full border font-mono ${
                ollamaStatus === "ONLINE"
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                  : "bg-amber-500/10 text-amber-400 border-amber-500/30"
              }`}
            >
              {ollamaStatus === "ONLINE" ? "● AI Synthesis Active" : "● Algorithmic Engine"}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {companyName}
          </h1>

          <div className="flex items-baseline gap-3 pt-0.5">
            <span className="text-2xl font-black font-mono text-white">
              ₹{currentPrice.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </span>
            <span className="text-xs text-gray-400 font-mono">
              Market Cap: <strong className="text-gray-200">₹{marketCap.toLocaleString("en-IN")} Cr</strong>
            </span>
          </div>
        </div>

        {/* Big Verdict Badge */}
        <div className="flex flex-col items-start md:items-end gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 font-mono">
            BullCompass Institutional Verdict
          </span>
          <div
            className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border ${style.badgeBg} font-mono font-black shadow-lg text-lg tracking-wider`}
          >
            {style.icon}
            <span>{verdictRating}</span>
          </div>
        </div>
      </div>

      {/* 4 Pillars Metagrid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* 1. Conviction Meter */}
        <div className="p-3.5 rounded-xl bg-black/30 border border-white/6 space-y-1.5">
          <div className="flex items-center justify-between text-xs text-gray-400 font-mono">
            <span className="flex items-center gap-1.5">
              <Crosshair className="w-3.5 h-3.5 text-emerald-400" />
              Conviction Score
            </span>
            <span className={`font-bold font-mono ${style.text}`}>
              {convictionScore}/100
            </span>
          </div>
          <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-700 ${
                convictionScore >= 75
                  ? "bg-emerald-500"
                  : convictionScore >= 50
                  ? "bg-amber-500"
                  : "bg-rose-500"
              }`}
              style={{ width: `${Math.min(100, Math.max(5, convictionScore))}%` }}
            />
          </div>
          <span className="text-[11px] text-gray-400 font-mono block">
            {convictionScore >= 75 ? "High Conviction Thesis" : convictionScore >= 50 ? "Moderate Conviction" : "Low Risk-Adjusted Conviction"}
          </span>
        </div>

        {/* 2. Margin of Safety */}
        <div className="p-3.5 rounded-xl bg-black/30 border border-white/6 space-y-1.5">
          <div className="flex items-center justify-between text-xs text-gray-400 font-mono">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
              Margin of Safety
            </span>
            <span
              className={`font-bold font-mono ${
                marginOfSafety === "HIGH"
                  ? "text-emerald-400"
                  : marginOfSafety === "MEDIUM"
                  ? "text-amber-400"
                  : "text-rose-400"
              }`}
            >
              {marginOfSafety}
            </span>
          </div>
          <p className="text-[11px] text-gray-300 font-mono">
            {marginOfSafety === "HIGH"
              ? "Significant downside cushion at current price"
              : marginOfSafety === "MEDIUM"
              ? "Fair multiple balancing growth & risk"
              : "Thin margin of safety against earnings misses"}
          </p>
        </div>

        {/* 3. Recommended Horizon */}
        <div className="p-3.5 rounded-xl bg-black/30 border border-white/6 space-y-1.5">
          <div className="flex items-center justify-between text-xs text-gray-400 font-mono">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              Investment Horizon
            </span>
            <span className="font-bold font-mono text-indigo-300">{timeHorizon}</span>
          </div>
          <p className="text-[11px] text-gray-300 font-mono">
            Secular multi-year compounding focus
          </p>
        </div>

        {/* 4. Technical / Valuation Stance */}
        <div className="p-3.5 rounded-xl bg-black/30 border border-white/6 space-y-1.5">
          <div className="flex items-center justify-between text-xs text-gray-400 font-mono">
            <span className="flex items-center gap-1.5">
              <Gauge className="w-3.5 h-3.5 text-purple-400" />
              Valuation Tier
            </span>
            <span className="font-bold font-mono text-purple-300">
              {valuation?.valuation_tier || decision.valuation_status}
            </span>
          </div>
          <p className="text-[11px] text-gray-300 font-mono">
            {momentum?.technical_stance
              ? `Stance: ${momentum.technical_stance.replace('_', ' ')}`
              : "Multiples audited against historical bounds"}
          </p>
        </div>
      </div>

      {/* Executive Summary Narrative */}
      <div className="p-4 rounded-xl bg-white/4 border border-white/8 space-y-2">
        <div className="flex items-center gap-2 text-xs font-bold font-mono text-gray-300 uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          <span>Executive Research Synthesis</span>
        </div>
        <p className="text-sm text-gray-200 leading-relaxed font-sans">
          {execSummary}
        </p>
      </div>
    </Card>
  );
}
