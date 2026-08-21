"use client";

import React from "react";
import { EarningsQualityAssessment } from "@/types/research";
import { Card } from "@/components/ui/Card";
import {
  Banknote,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
} from "lucide-react";

interface EarningsQualityCardProps {
  earningsQuality?: EarningsQualityAssessment;
}

export function EarningsQualityCard({ earningsQuality }: EarningsQualityCardProps) {
  if (!earningsQuality) return null;

  const getStatusBadge = (status: string) => {
    switch (status.toUpperCase()) {
      case "HIGH_QUALITY_CONVERTING":
        return {
          bg: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
          icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />,
          label: "High Cash Quality",
        };
      case "MODERATE":
        return {
          bg: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40",
          icon: <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />,
          label: "Adequate Conversion",
        };
      case "EARNINGS_QUALITY_WARNING":
        return {
          bg: "bg-amber-500/20 text-amber-300 border-amber-500/40",
          icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />,
          label: "Cash Flow Warning",
        };
      case "CRITICAL_CASH_DIVERGENCE":
        return {
          bg: "bg-rose-500/20 text-rose-300 border-rose-500/40",
          icon: <AlertOctagon className="w-3.5 h-3.5 text-rose-400" />,
          label: "Critical Divergence",
        };
      default:
        return {
          bg: "bg-gray-500/20 text-gray-300 border-gray-500/40",
          icon: <ShieldCheck className="w-3.5 h-3.5 text-gray-400" />,
          label: status,
        };
    }
  };

  const badge = getStatusBadge(earningsQuality.quality_status);
  const cfoPat = earningsQuality.cfo_to_pat_ratio;
  const fcfConv = earningsQuality.fcf_conversion_pct;
  const warnings = earningsQuality.warning_flags || [];

  return (
    <Card className="p-5 bg-gradient-to-br from-[#0e1420] to-[#121929] border-white/10 shadow-xl space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/8">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <Banknote className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2 font-mono">
              Earnings Quality & Cash Flow Diagnosis
            </h3>
            <p className="text-xs text-gray-400">
              Audit of reported accounting profit vs actual cash generated
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

      {/* Grid Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* CFO / PAT */}
        <div className="p-3 rounded-xl bg-black/30 border border-white/6 space-y-1">
          <span className="text-[11px] text-gray-400 font-mono block">CFO / PAT Conversion</span>
          <span
            className={`text-base font-bold font-mono ${
              cfoPat && cfoPat >= 1.0
                ? "text-emerald-400"
                : cfoPat && cfoPat >= 0.7
                ? "text-cyan-400"
                : cfoPat && cfoPat < 0.5
                ? "text-rose-400"
                : "text-gray-300"
            }`}
          >
            {cfoPat !== null && cfoPat !== undefined ? `${cfoPat}x` : "N/A"}
          </span>
          <span className="text-[10px] text-gray-500 font-mono block">
            {cfoPat && cfoPat >= 1.0
              ? "Cash flow exceeds net profit"
              : cfoPat && cfoPat >= 0.7
              ? "Healthy cash conversion"
              : "Working capital drag"}
          </span>
        </div>

        {/* FCF Conversion */}
        <div className="p-3 rounded-xl bg-black/30 border border-white/6 space-y-1">
          <span className="text-[11px] text-gray-400 font-mono block">FCF Conversion (% of PAT)</span>
          <span
            className={`text-base font-bold font-mono ${
              fcfConv && fcfConv >= 60
                ? "text-emerald-400"
                : fcfConv && fcfConv > 0
                ? "text-cyan-400"
                : fcfConv && fcfConv < 0
                ? "text-rose-400"
                : "text-gray-300"
            }`}
          >
            {fcfConv !== null && fcfConv !== undefined ? `${fcfConv}%` : "N/A"}
          </span>
          <span className="text-[10px] text-gray-500 font-mono block">
            {fcfConv && fcfConv >= 60
              ? "High free cash generation"
              : fcfConv && fcfConv < 0
              ? "Negative FCF (CapEx / Reinvestment)"
              : "Moderate cash conversion"}
          </span>
        </div>

        {/* PAT vs CFO Trend Diagnosis */}
        <div className="p-3 rounded-xl bg-black/30 border border-white/6 space-y-1">
          <span className="text-[11px] text-gray-400 font-mono block">Cash Flow Coherence</span>
          <span className="text-xs font-bold font-mono text-gray-200 block truncate">
            {earningsQuality.pat_vs_cfo_trend}
          </span>
          <span className="text-[10px] text-gray-500 font-mono block">
            {earningsQuality.margin_vs_revenue_trajectory}
          </span>
        </div>
      </div>

      {/* Red Flag Warnings (If any) */}
      {warnings.length > 0 && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs font-bold font-mono text-rose-400 uppercase tracking-wider">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Earnings Quality Warning Indicators</span>
          </div>
          <ul className="list-disc list-inside text-xs text-rose-300/90 space-y-1 font-mono">
            {warnings.map((w, idx) => (
              <li key={idx}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Audit Summary Narrative */}
      <div className="p-3.5 rounded-xl bg-black/25 border border-white/6 text-xs text-gray-300 font-mono flex items-start gap-2">
        <span className="text-emerald-400 font-bold uppercase tracking-wider text-[10px] flex-shrink-0 mt-0.5">
          Cash Flow Diagnosis:
        </span>
        <span className="leading-relaxed">{earningsQuality.summary}</span>
      </div>
    </Card>
  );
}
