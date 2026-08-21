"use client";

import React from "react";
import { ThesisInvalidationTriggers } from "@/types/research";
import { Card } from "@/components/ui/Card";
import {
  XCircle,
  AlertOctagon,
  Gauge,
  CheckCircle,
  Sliders,
} from "lucide-react";

interface ThesisInvalidationCardProps {
  thesisInvalidation?: ThesisInvalidationTriggers;
}

export function ThesisInvalidationCard({ thesisInvalidation }: ThesisInvalidationCardProps) {
  if (!thesisInvalidation) return null;

  const triggers = thesisInvalidation.triggers || [];
  const thresholds = thesisInvalidation.quantifiable_thresholds || [];

  return (
    <Card className="p-5 bg-gradient-to-br from-[#0c121e] to-[#121018] border-white/10 shadow-xl space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/8">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
            <XCircle className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2 font-mono">
              Thesis Invalidation Triggers & Numerical Stop-Conditions
            </h3>
            <p className="text-xs text-gray-400">
              Pre-defined quantifiable conditions that require immediately exiting or reducing position
            </p>
          </div>
        </div>

        <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-300 border border-amber-500/30 uppercase">
          Mandatory Stop-Checks
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 1. Operational & Structural Break Triggers */}
        <div className="p-4 rounded-xl bg-black/30 border border-white/6 space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-bold font-mono text-gray-300 uppercase tracking-wider">
            <AlertOctagon className="w-3.5 h-3.5 text-rose-400" />
            <span>Structural & Operational Invalidation</span>
          </div>
          <ul className="space-y-2 text-xs text-gray-300 font-sans">
            {triggers.map((t, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400 flex-shrink-0 mt-1.5" />
                <span className="leading-relaxed">{t}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* 2. Quantifiable Metric Thresholds */}
        <div className="p-4 rounded-xl bg-black/30 border border-white/6 space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-bold font-mono text-gray-300 uppercase tracking-wider">
            <Sliders className="w-3.5 h-3.5 text-amber-400" />
            <span>Audited Metric Thresholds</span>
          </div>
          <ul className="space-y-2 text-xs text-gray-300 font-mono">
            {thresholds.map((th, idx) => (
              <li key={idx} className="flex items-start gap-2 p-2 rounded-lg bg-white/3 border border-white/4">
                <span className="text-amber-400 font-bold text-xs flex-shrink-0 mt-0.5">⚠️</span>
                <span className="leading-relaxed text-xs text-amber-200/90">{th}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Card>
  );
}
