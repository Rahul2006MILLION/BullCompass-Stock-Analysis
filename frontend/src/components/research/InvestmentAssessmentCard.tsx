"use client";

import React from "react";
import { InvestmentDecisionResult, ValuationStatus } from "@/types/research";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import {
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Zap,
  Activity,
  Flame,
} from "lucide-react";

interface InvestmentAssessmentCardProps {
  decision: InvestmentDecisionResult;
  ticker: string;
  companyName: string;
  currentPrice: number;
  marketCap: number;
  sector: string;
  industry: string;
  ollamaStatus: "ONLINE" | "OFFLINE_FALLBACK";
}

export function InvestmentAssessmentCard({
  decision,
  ticker,
  companyName,
  currentPrice,
  marketCap,
  sector,
  industry,
  ollamaStatus,
}: InvestmentAssessmentCardProps) {
  const getDecisionBadge = () => {
    switch (decision.decision) {
      case "STRONG BUY CANDIDATE":
        return (
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-mono font-bold shadow-lg shadow-emerald-500/10">
            <Flame className="w-5 h-5 text-emerald-400 animate-pulse" />
            <span className="text-base tracking-wide uppercase">{decision.decision}</span>
          </div>
        );
      case "BUY CANDIDATE":
        return (
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-mono font-bold shadow-sm">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
            <span className="text-base tracking-wide uppercase">{decision.decision}</span>
          </div>
        );
      case "HOLD / WATCH":
        return (
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 font-mono font-bold shadow-sm">
            <Activity className="w-5 h-5 text-amber-400" />
            <span className="text-base tracking-wide uppercase">{decision.decision}</span>
          </div>
        );
      case "AVOID":
        return (
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 font-mono font-bold shadow-sm">
            <TrendingDown className="w-5 h-5 text-rose-400" />
            <span className="text-base tracking-wide uppercase">{decision.decision}</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-500/15 border border-gray-500/30 text-gray-400 font-mono font-bold">
            <HelpCircle className="w-5 h-5 text-gray-400" />
            <span className="text-base tracking-wide uppercase">{decision.decision}</span>
          </div>
        );
    }
  };

  const getValuationBadge = (status: ValuationStatus) => {
    switch (status) {
      case "POTENTIALLY UNDERVALUED":
        return <Badge variant="mint">Under-Valued</Badge>;
      case "FAIRLY VALUED":
        return <Badge variant="neutral">Fairly Valued</Badge>;
      case "POTENTIALLY EXPENSIVE":
        return <Badge variant="coral">Expensive Multiples</Badge>;
      default:
        return <Badge variant="neutral">Valuation N/A</Badge>;
    }
  };

  const score = decision.fundamental_score;
  const scoreColor =
    score >= 75 ? "text-emerald-400" : score >= 55 ? "text-amber-400" : "text-rose-400";
  const barColor =
    score >= 75 ? "bg-emerald-500" : score >= 55 ? "bg-amber-500" : "bg-rose-500";

  return (
    <Card className="bg-gradient-to-br from-[#101726] via-[#0d121a] to-[#090c12] border-white/12 shadow-2xl space-y-6">
      {/* Top Bar: Company Header + Decision Tier */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/8 pb-5">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h2 className="text-2xl font-black text-white font-mono tracking-tight">
              {ticker}
            </h2>
            <span className="text-xs text-gray-400 font-medium">({companyName})</span>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-white/5 border border-white/8 text-gray-300">
              {sector}
            </span>
            {decision.is_bank && (
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-blue-500/15 border border-blue-500/30 text-blue-400 font-semibold">
                Banking Institution Model
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Current Market Price: <strong className="text-white font-mono">₹{currentPrice.toLocaleString("en-IN")}</strong> | Market Cap: <strong className="text-white font-mono">₹{marketCap.toLocaleString("en-IN")} Cr</strong>
          </p>
        </div>

        <div className="flex items-center gap-3 self-start lg:self-center">
          {getDecisionBadge()}
        </div>
      </div>

      {/* Metric Pillars: Score / Confidence / Valuation / Ollama Status */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 rounded-2xl bg-[#080b10]/80 border border-white/6 font-mono">
        {/* Score */}
        <div className="space-y-1">
          <span className="text-[11px] text-gray-400 uppercase tracking-wider block">
            Fundamental Score
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className={`text-3xl font-black ${scoreColor}`}>{score}</span>
            <span className="text-xs text-gray-500">/ 100</span>
          </div>
          <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden mt-1">
            <div
              className={`h-full rounded-full ${barColor}`}
              style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
            />
          </div>
        </div>

        {/* Data Confidence */}
        <div className="space-y-1">
          <span className="text-[11px] text-gray-400 uppercase tracking-wider block">
            Data Confidence
          </span>
          <div className="flex items-center gap-1.5 pt-1">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-bold text-white uppercase">
              {decision.data_confidence}
            </span>
          </div>
          <p className="text-[10px] text-gray-500">Based on audited multi-year statements</p>
        </div>

        {/* Valuation Assessment */}
        <div className="space-y-1">
          <span className="text-[11px] text-gray-400 uppercase tracking-wider block">
            Valuation Status
          </span>
          <div className="pt-1">{getValuationBadge(decision.valuation_status)}</div>
          <p className="text-[10px] text-gray-500">Multiples vs earnings quality</p>
        </div>

        {/* Ollama Status */}
        <div className="space-y-1">
          <span className="text-[11px] text-gray-400 uppercase tracking-wider block">
            AI Engine Status
          </span>
          <div className="flex items-center gap-1.5 pt-1">
            <Zap
              className={`w-3.5 h-3.5 ${
                ollamaStatus === "ONLINE" ? "text-emerald-400" : "text-amber-400"
              }`}
            />
            <span className="text-xs font-bold text-gray-200">
              {ollamaStatus === "ONLINE" ? "Ollama Qwen 2.5 (3B)" : "Deterministic Fallback"}
            </span>
          </div>
          <p className="text-[10px] text-gray-500">
            {ollamaStatus === "ONLINE" ? "LLM synthesis active" : "Rules engine active"}
          </p>
        </div>
      </div>

      {/* Decision Evidence: Strengths vs Concerns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Key Strengths */}
        <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/15 space-y-2.5">
          <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs tracking-wide uppercase">
            <CheckCircle2 className="w-4 h-4" />
            <span>Key Investment Strengths ({decision.key_strengths.length})</span>
          </div>
          <ul className="space-y-1.5 text-xs text-gray-300 font-mono">
            {decision.key_strengths.map((str, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">+</span>
                <span>{str}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Key Concerns */}
        <div className="p-4 rounded-xl bg-rose-500/5 border border-rose-500/15 space-y-2.5">
          <div className="flex items-center gap-2 text-rose-400 font-semibold text-xs tracking-wide uppercase">
            <AlertTriangle className="w-4 h-4" />
            <span>Key Concerns & Watchpoints ({decision.key_concerns.length})</span>
          </div>
          <ul className="space-y-1.5 text-xs text-gray-300 font-mono">
            {decision.key_concerns.map((con, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-rose-400 font-bold">-</span>
                <span>{con}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Card>
  );
}
