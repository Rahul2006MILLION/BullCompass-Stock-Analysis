"use client";

import React from "react";
import { ValuationAssessment, KeyRatiosData, IncomeStatementData } from "@/types/research";
import { Card } from "@/components/ui/Card";
import {
  Scale,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Layers,
} from "lucide-react";

interface ValuationContextCardProps {
  valuation?: ValuationAssessment;
  ratios?: KeyRatiosData;
  incomeStatement?: IncomeStatementData;
}

export function ValuationContextCard({
  valuation,
  ratios,
  incomeStatement,
}: ValuationContextCardProps) {
  if (!valuation && !ratios) return null;

  const tier = valuation?.valuation_tier || "FAIRLY VALUED";
  const pe = valuation?.pe_ratio ?? ratios?.pe_ratio;
  const fwdPe = valuation?.forward_pe ?? ratios?.forward_pe;
  const pb = valuation?.pb_ratio ?? ratios?.pb_ratio;
  const evEbitda = valuation?.ev_to_ebitda ?? ratios?.ev_to_ebitda;
  const peg = valuation?.peg_ratio;
  const divYield = valuation?.dividend_yield ?? ratios?.dividend_yield;
  const rationale = valuation?.valuation_rationale || "";

  const getTierBadge = (t: string) => {
    const clean = t.toUpperCase();
    if (clean.includes("UNDERVALUED")) {
      return {
        bg: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
        icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />,
        label: "Attractive Valuation",
      };
    }
    if (clean.includes("EXTREMELY OVERVALUED")) {
      return {
        bg: "bg-rose-500/25 text-rose-300 border-rose-500/50",
        icon: <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />,
        label: "Extremely Overvalued",
      };
    }
    if (clean.includes("EXPENSIVE")) {
      return {
        bg: "bg-rose-500/20 text-rose-300 border-rose-500/40",
        icon: <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />,
        label: "Premium Valuation",
      };
    }
    return {
      bg: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40",
      icon: <Scale className="w-3.5 h-3.5 text-cyan-400" />,
      label: "Fairly Valued",
    };
  };

  const badge = getTierBadge(tier);

  return (
    <Card className="p-5 bg-gradient-to-br from-[#0c121e] via-[#101728] to-[#0c121e] border-white/10 shadow-xl space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/8">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
            <Scale className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2 font-mono">
              Valuation Multiple Multi-Factor Analysis
            </h3>
            <p className="text-xs text-gray-400">
              Cross-asset pricing evaluated against underlying growth and capital productivity
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

      {/* Multiples Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {/* P/E */}
        <div className="p-3 rounded-xl bg-black/30 border border-white/6 space-y-1">
          <span className="text-[11px] text-gray-400 font-mono block">Trailing P/E</span>
          <span className="text-base font-bold font-mono text-white">
            {pe ? `${pe}x` : "N/A"}
          </span>
          <span className="text-[10px] text-gray-500 font-mono block">
            {pe && pe < 20 ? "Undervalued" : pe && pe > 50 ? "Premium multiple" : "Standard range"}
          </span>
        </div>

        {/* Forward P/E */}
        <div className="p-3 rounded-xl bg-black/30 border border-white/6 space-y-1">
          <span className="text-[11px] text-gray-400 font-mono block">Forward P/E</span>
          <span className="text-base font-bold font-mono text-white">
            {fwdPe ? `${fwdPe}x` : "N/A"}
          </span>
          <span className="text-[10px] text-gray-500 font-mono block">Next 12M estimate</span>
        </div>

        {/* P/B */}
        <div className="p-3 rounded-xl bg-black/30 border border-white/6 space-y-1">
          <span className="text-[11px] text-gray-400 font-mono block">Price to Book (P/B)</span>
          <span className="text-base font-bold font-mono text-white">
            {pb ? `${pb}x` : "N/A"}
          </span>
          <span className="text-[10px] text-gray-500 font-mono block">Book value equity</span>
        </div>

        {/* EV/EBITDA */}
        <div className="p-3 rounded-xl bg-black/30 border border-white/6 space-y-1">
          <span className="text-[11px] text-gray-400 font-mono block">EV / EBITDA</span>
          <span className="text-base font-bold font-mono text-white">
            {evEbitda ? `${evEbitda}x` : "N/A"}
          </span>
          <span className="text-[10px] text-gray-500 font-mono block">Enterprise value</span>
        </div>

        {/* PEG Ratio */}
        <div className="p-3 rounded-xl bg-black/30 border border-white/6 space-y-1">
          <span className="text-[11px] text-gray-400 font-mono block">PEG Ratio</span>
          <span
            className={`text-base font-bold font-mono ${
              peg && peg < 1.0
                ? "text-emerald-400"
                : peg && peg <= 2.0
                ? "text-cyan-400"
                : "text-amber-400"
            }`}
          >
            {peg ? `${peg}x` : "N/A"}
          </span>
          <span className="text-[10px] text-gray-500 font-mono block">
            {peg && peg < 1.0 ? "Growth at value" : "P/E to 3Y CAGR"}
          </span>
        </div>

        {/* Div Yield */}
        <div className="p-3 rounded-xl bg-black/30 border border-white/6 space-y-1">
          <span className="text-[11px] text-gray-400 font-mono block">Dividend Yield</span>
          <span className="text-base font-bold font-mono text-white">
            {divYield ? `${divYield}%` : "0.00%"}
          </span>
          <span className="text-[10px] text-gray-500 font-mono block">Annual cash payout</span>
        </div>
      </div>

      {/* Multi-Factor Synthesis Narrative */}
      {rationale && (
        <div className="p-3.5 rounded-xl bg-black/25 border border-white/6 text-xs text-gray-300 font-mono flex items-start gap-2">
          <span className="text-purple-400 font-bold uppercase tracking-wider text-[10px] flex-shrink-0 mt-0.5">
            Valuation Justification:
          </span>
          <span className="leading-relaxed">{rationale}</span>
        </div>
      )}
    </Card>
  );
}
