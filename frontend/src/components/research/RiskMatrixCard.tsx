"use client";

import React from "react";
import { RiskAnalysisMatrix } from "@/types/research";
import { Card } from "@/components/ui/Card";
import {
  ShieldAlert,
  AlertTriangle,
  AlertOctagon,
  Info,
  ShieldCheck,
  Zap,
} from "lucide-react";

interface RiskMatrixCardProps {
  riskMatrix?: RiskAnalysisMatrix;
}

export function RiskMatrixCard({ riskMatrix }: RiskMatrixCardProps) {
  if (!riskMatrix || !riskMatrix.risks || riskMatrix.risks.length === 0) return null;

  const getSeverityBadge = (severity: string) => {
    switch (severity.toUpperCase()) {
      case "CRITICAL":
        return {
          bg: "bg-rose-500/25 text-rose-300 border-rose-500/50",
          icon: <AlertOctagon className="w-3.5 h-3.5 text-rose-400" />,
          label: "Critical Risk",
        };
      case "HIGH":
        return {
          bg: "bg-rose-500/20 text-rose-300 border-rose-500/40",
          icon: <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />,
          label: "High Risk",
        };
      case "MEDIUM":
        return {
          bg: "bg-amber-500/20 text-amber-300 border-amber-500/40",
          icon: <Info className="w-3.5 h-3.5 text-amber-400" />,
          label: "Medium Risk",
        };
      default:
        return {
          bg: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
          icon: <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />,
          label: "Low Risk",
        };
    }
  };

  return (
    <Card className="p-5 bg-gradient-to-br from-[#0c121e] to-[#101726] border-white/10 shadow-xl space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/8">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2 font-mono">
              Categorized Downside Risk Radar
            </h3>
            <p className="text-xs text-gray-400">
              Institutional breakdown of business, financial, valuation, and macroeconomic risk factors
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-gray-400">
          <span>Total Assessed Risks: <strong>{riskMatrix.risks.length}</strong></span>
        </div>
      </div>

      {/* Primary Vulnerability Banner */}
      {riskMatrix.primary_vulnerability && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/25 flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="text-[11px] font-bold text-rose-400 uppercase font-mono tracking-wider">
              Primary Downside Vulnerability:
            </span>
            <p className="text-xs text-rose-200/90 font-sans leading-relaxed">
              {riskMatrix.primary_vulnerability}
            </p>
          </div>
        </div>
      )}

      {/* Risk Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {riskMatrix.risks.map((r, idx) => {
          const badge = getSeverityBadge(r.severity);
          return (
            <div
              key={idx}
              className="p-3.5 rounded-xl bg-black/30 border border-white/6 space-y-2 hover:border-white/12 transition-all"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-gray-400">
                  {r.category}
                </span>
                <span
                  className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[10px] font-mono font-bold uppercase ${badge.bg}`}
                >
                  {badge.icon}
                  <span>{badge.label}</span>
                </span>
              </div>

              <h4 className="text-xs font-bold text-white font-sans">
                {r.title}
              </h4>

              <p className="text-xs text-gray-300 font-sans leading-relaxed">
                {r.rationale}
              </p>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
