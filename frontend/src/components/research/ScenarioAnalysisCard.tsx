"use client";

import React, { useState } from "react";
import { ScenarioAnalysis } from "@/types/research";
import { Card } from "@/components/ui/Card";
import {
  TrendingUp,
  Activity,
  TrendingDown,
  CheckCircle2,
  PieChart,
  Layers,
  Sparkles,
} from "lucide-react";

interface ScenarioAnalysisCardProps {
  scenarioAnalysis?: ScenarioAnalysis;
}

export function ScenarioAnalysisCard({ scenarioAnalysis }: ScenarioAnalysisCardProps) {
  const [activeTab, setActiveTab] = useState<"all" | "bull" | "base" | "bear">("all");

  if (!scenarioAnalysis) return null;

  const { bull_case, base_case, bear_case } = scenarioAnalysis;

  return (
    <Card className="p-5 bg-gradient-to-br from-[#0b101c] via-[#0e1524] to-[#0b101c] border-white/10 shadow-xl space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/8">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
            <PieChart className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2 font-mono">
              Scenario Analysis: Bull / Base / Bear Projections
            </h3>
            <p className="text-xs text-gray-400">
              Probabilistic outcome modeling under varying operational and macroeconomic conditions
            </p>
          </div>
        </div>

        {/* Tab Toggle */}
        <div className="flex items-center gap-1 p-1 bg-white/5 rounded-lg border border-white/6 text-xs font-mono">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-2.5 py-1 rounded-md transition-all ${
              activeTab === "all" ? "bg-white/15 text-white font-bold" : "text-gray-400 hover:text-gray-200"
            }`}
          >
            All Cases
          </button>
          <button
            onClick={() => setActiveTab("bull")}
            className={`px-2.5 py-1 rounded-md transition-all ${
              activeTab === "bull" ? "bg-emerald-500/20 text-emerald-300 font-bold" : "text-gray-400 hover:text-gray-200"
            }`}
          >
            Bull ({bull_case.probability_pct}%)
          </button>
          <button
            onClick={() => setActiveTab("base")}
            className={`px-2.5 py-1 rounded-md transition-all ${
              activeTab === "base" ? "bg-cyan-500/20 text-cyan-300 font-bold" : "text-gray-400 hover:text-gray-200"
            }`}
          >
            Base ({base_case.probability_pct}%)
          </button>
          <button
            onClick={() => setActiveTab("bear")}
            className={`px-2.5 py-1 rounded-md transition-all ${
              activeTab === "bear" ? "bg-rose-500/20 text-rose-300 font-bold" : "text-gray-400 hover:text-gray-200"
            }`}
          >
            Bear ({bear_case.probability_pct}%)
          </button>
        </div>
      </div>

      {/* 3-Column Grid */}
      <div
        className={`grid gap-4 ${
          activeTab === "all"
            ? "grid-cols-1 lg:grid-cols-3"
            : "grid-cols-1"
        }`}
      >
        {/* 1. Bull Case */}
        {(activeTab === "all" || activeTab === "bull") && (
          <div className="p-4 rounded-xl bg-gradient-to-b from-emerald-950/30 to-[#0b121c] border border-emerald-500/30 space-y-3 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <TrendingUp className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-bold font-mono text-emerald-300 uppercase tracking-wider">
                  Bull Case
                </span>
              </div>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                {bull_case.probability_pct}% Probability
              </span>
            </div>

            <h4 className="text-sm font-bold text-white font-sans">
              {bull_case.scenario_title}
            </h4>

            <div className="space-y-1">
              <span className="text-[11px] font-bold text-gray-400 font-mono uppercase block">
                Growth & Margin Target:
              </span>
              <p className="text-xs text-emerald-400 font-mono font-semibold">
                {bull_case.growth_margin_projection}
              </p>
            </div>

            <div className="space-y-1.5 pt-1 border-t border-white/6">
              <span className="text-[11px] font-bold text-gray-400 font-mono uppercase block">
                Key Assumptions:
              </span>
              <ul className="space-y-1 text-xs text-gray-300 font-sans">
                {bull_case.assumptions.map((a, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span>{a}</span>
                  </li>
                ))}
              </ul>
            </div>

            <p className="text-xs text-gray-400 pt-2 border-t border-white/6 leading-relaxed font-sans">
              {bull_case.summary}
            </p>
          </div>
        )}

        {/* 2. Base Case */}
        {(activeTab === "all" || activeTab === "base") && (
          <div className="p-4 rounded-xl bg-gradient-to-b from-cyan-950/30 to-[#0b121c] border border-cyan-500/30 space-y-3 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                  <Activity className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-bold font-mono text-cyan-300 uppercase tracking-wider">
                  Base Case
                </span>
              </div>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
                {base_case.probability_pct}% Probability
              </span>
            </div>

            <h4 className="text-sm font-bold text-white font-sans">
              {base_case.scenario_title}
            </h4>

            <div className="space-y-1">
              <span className="text-[11px] font-bold text-gray-400 font-mono uppercase block">
                Growth & Margin Target:
              </span>
              <p className="text-xs text-cyan-400 font-mono font-semibold">
                {base_case.growth_margin_projection}
              </p>
            </div>

            <div className="space-y-1.5 pt-1 border-t border-white/6">
              <span className="text-[11px] font-bold text-gray-400 font-mono uppercase block">
                Key Assumptions:
              </span>
              <ul className="space-y-1 text-xs text-gray-300 font-sans">
                {base_case.assumptions.map((a, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0 mt-0.5" />
                    <span>{a}</span>
                  </li>
                ))}
              </ul>
            </div>

            <p className="text-xs text-gray-400 pt-2 border-t border-white/6 leading-relaxed font-sans">
              {base_case.summary}
            </p>
          </div>
        )}

        {/* 3. Bear Case */}
        {(activeTab === "all" || activeTab === "bear") && (
          <div className="p-4 rounded-xl bg-gradient-to-b from-rose-950/30 to-[#0b121c] border border-rose-500/30 space-y-3 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-rose-500/20 text-rose-400 flex items-center justify-center">
                  <TrendingDown className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-bold font-mono text-rose-300 uppercase tracking-wider">
                  Bear Case
                </span>
              </div>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/30">
                {bear_case.probability_pct}% Probability
              </span>
            </div>

            <h4 className="text-sm font-bold text-white font-sans">
              {bear_case.scenario_title}
            </h4>

            <div className="space-y-1">
              <span className="text-[11px] font-bold text-gray-400 font-mono uppercase block">
                Growth & Margin Target:
              </span>
              <p className="text-xs text-rose-400 font-mono font-semibold">
                {bear_case.growth_margin_projection}
              </p>
            </div>

            <div className="space-y-1.5 pt-1 border-t border-white/6">
              <span className="text-[11px] font-bold text-gray-400 font-mono uppercase block">
                Downside Catalysts:
              </span>
              <ul className="space-y-1 text-xs text-gray-300 font-sans">
                {bear_case.assumptions.map((a, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-rose-400 flex-shrink-0 mt-0.5" />
                    <span>{a}</span>
                  </li>
                ))}
              </ul>
            </div>

            <p className="text-xs text-gray-400 pt-2 border-t border-white/6 leading-relaxed font-sans">
              {bear_case.summary}
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}
