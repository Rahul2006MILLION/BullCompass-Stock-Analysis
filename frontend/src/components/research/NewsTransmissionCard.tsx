"use client";

import React from "react";
import { NewsCausalItem, SectorMacroContext, RecentNewsItem } from "@/types/research";
import { Card } from "@/components/ui/Card";
import {
  Newspaper,
  Globe,
  ArrowRight,
  Sparkles,
  Layers,
  CheckCircle2,
  TrendingUp,
  Clock,
} from "lucide-react";

interface NewsTransmissionCardProps {
  newsCausal?: NewsCausalItem[];
  sectorMacro?: SectorMacroContext;
  recentNews?: RecentNewsItem[];
  sector: string;
}

export function NewsTransmissionCard({
  newsCausal,
  sectorMacro,
  recentNews,
  sector,
}: NewsTransmissionCardProps) {
  const hasMacro = sectorMacro && (sectorMacro.tailwinds.length > 0 || sectorMacro.headwinds.length > 0);
  const hasNews = (newsCausal && newsCausal.length > 0) || (recentNews && recentNews.length > 0);

  if (!hasMacro && !hasNews) return null;

  return (
    <Card className="p-5 bg-gradient-to-br from-[#0c121e] to-[#101726] border-white/10 shadow-xl space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/8">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <Globe className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2 font-mono">
              News & Macroeconomic Transmission Engine
            </h3>
            <p className="text-xs text-gray-400">
              Causal chain analysis mapping sector shifts and corporate developments to future cash flows
            </p>
          </div>
        </div>

        <span className="text-[11px] font-mono text-gray-400">
          Sector Context: <strong className="text-emerald-400">{sector}</strong>
        </span>
      </div>

      {/* Sector Macro Context (Tailwinds / Headwinds) */}
      {hasMacro && sectorMacro && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {/* Tailwinds */}
          <div className="p-3.5 rounded-xl bg-emerald-500/5 border border-emerald-500/20 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold font-mono text-emerald-400 uppercase tracking-wider">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Macroeconomic Tailwinds</span>
            </div>
            <ul className="space-y-1.5 text-xs text-gray-300 font-sans">
              {sectorMacro.tailwinds.map((tw, idx) => (
                <li key={idx} className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>{tw}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Headwinds */}
          <div className="p-3.5 rounded-xl bg-rose-500/5 border border-rose-500/20 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold font-mono text-rose-400 uppercase tracking-wider">
              <Clock className="w-3.5 h-3.5 text-rose-400" />
              <span>Macroeconomic Headwinds & Risks</span>
            </div>
            <ul className="space-y-1.5 text-xs text-gray-300 font-sans">
              {sectorMacro.headwinds.map((hw, idx) => (
                <li key={idx} className="flex items-start gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400 flex-shrink-0 mt-1.5" />
                  <span>{hw}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Causal News Transmission Cards */}
      {newsCausal && newsCausal.length > 0 && (
        <div className="space-y-3 pt-2">
          <span className="text-[11px] font-bold text-gray-400 font-mono uppercase tracking-wider block">
            Causal Event Chains ({newsCausal.length} Analyzed Events):
          </span>

          <div className="space-y-3">
            {newsCausal.map((item, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-black/30 border border-white/6 space-y-2.5 hover:border-white/12 transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <h4 className="text-xs font-bold text-white font-sans flex items-center gap-2">
                    <Newspaper className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                    <span>{item.headline}</span>
                  </h4>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-[10px] text-gray-400 font-mono">
                      {item.source} • {item.published_at}
                    </span>
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                        item.catalyst_durability === "STRUCTURAL"
                          ? "bg-purple-500/20 text-purple-300 border-purple-500/40"
                          : "bg-cyan-500/20 text-cyan-300 border-cyan-500/40"
                      }`}
                    >
                      {item.catalyst_durability}
                    </span>
                  </div>
                </div>

                {/* Transmission steps */}
                <div className="p-3 rounded-lg bg-white/3 border border-white/4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono font-bold text-gray-400 uppercase block">
                      Transmission Channel:
                    </span>
                    <p className="text-gray-300 font-sans leading-relaxed">
                      {item.economic_transmission_mechanism}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase block">
                      Revenue & Margin Impact:
                    </span>
                    <p className="text-gray-300 font-sans leading-relaxed">
                      {item.revenue_margin_impact}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
