"use client";

import React from "react";
import { QualityScoreBreakdown, HistoricalTrendsData } from "@/types/research";
import { Card } from "@/components/ui/Card";
import { Gauge, CheckCircle2, AlertCircle } from "lucide-react";

interface QualityScoreBreakdownCardProps {
  breakdown: QualityScoreBreakdown;
  trends: HistoricalTrendsData;
}

export function QualityScoreBreakdownCard({
  breakdown,
  trends,
}: QualityScoreBreakdownCardProps) {
  const categories = [
    { name: "Business Quality & Moat", score: breakdown.business_quality, max: 10 },
    { name: "Financial Strength & Solvency", score: breakdown.financial_strength, max: 15 },
    { name: "Growth Trajectory", score: breakdown.growth, max: 15 },
    { name: "Profitability & ROE", score: breakdown.profitability, max: 15 },
    { name: "Cash Generation & FCF Quality", score: breakdown.cash_generation, max: 15 },
    { name: "Valuation Attractiveness", score: breakdown.valuation, max: 15 },
    { name: "Risk & News Exposure", score: breakdown.risk_profile, max: 15 },
  ];

  return (
    <Card className="bg-[#0d121a]/95 border-white/8 space-y-4 shadow-xl">
      <div className="flex items-center justify-between border-b border-white/8 pb-3">
        <div>
          <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <Gauge className="w-4 h-4 text-emerald-400" />
            Deterministic Fundamental Score Breakdown
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">
            Transparent scoring weights calculated deterministically in Python (0 - 100)
          </p>
        </div>
        <div className="text-right">
          <span className="text-xl font-black text-emerald-400 font-mono">
            {breakdown.total_score}
          </span>
          <span className="text-xs text-gray-500 font-mono"> / 100</span>
        </div>
      </div>

      {/* Progress Bars for each category */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 font-mono text-xs">
        {categories.map((cat, idx) => {
          const pct = Math.min(100, Math.max(0, (cat.score / cat.max) * 100));
          return (
            <div key={idx} className="space-y-1">
              <div className="flex justify-between items-center text-gray-300">
                <span>{cat.name}</span>
                <span className="font-bold text-white">
                  {cat.score} <span className="text-gray-500 font-normal">/ {cat.max}</span>
                </span>
              </div>
              <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Historical Trend Signals Footer */}
      <div className="pt-3 border-t border-white/5 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 text-[11px] font-mono">
        <div className="p-2 rounded-lg bg-white/2 border border-white/4">
          <span className="text-gray-500 block text-[10px]">Revenue Trend</span>
          <span className="text-gray-200 font-semibold">{trends.revenue_trend}</span>
        </div>
        <div className="p-2 rounded-lg bg-white/2 border border-white/4">
          <span className="text-gray-500 block text-[10px]">Profit Trend</span>
          <span className="text-gray-200 font-semibold">{trends.profit_trend}</span>
        </div>
        <div className="p-2 rounded-lg bg-white/2 border border-white/4">
          <span className="text-gray-500 block text-[10px]">Margin Trend</span>
          <span className="text-gray-200 font-semibold">{trends.margin_trend}</span>
        </div>
        <div className="p-2 rounded-lg bg-white/2 border border-white/4">
          <span className="text-gray-500 block text-[10px]">ROE Signal</span>
          <span className="text-gray-200 font-semibold">{trends.roe_trend}</span>
        </div>
        <div className="p-2 rounded-lg bg-white/2 border border-white/4">
          <span className="text-gray-500 block text-[10px]">Debt Signal</span>
          <span className="text-gray-200 font-semibold">{trends.debt_trend}</span>
        </div>
        <div className="p-2 rounded-lg bg-white/2 border border-white/4">
          <span className="text-gray-500 block text-[10px]">Cash Flow</span>
          <span className="text-gray-200 font-semibold">{trends.cash_flow_trend}</span>
        </div>
      </div>
    </Card>
  );
}
