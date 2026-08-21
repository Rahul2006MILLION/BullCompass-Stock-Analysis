"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface MarketBreadthCardProps {
  advancing?: number;
  declining?: number;
  className?: string;
}

/**
 * MarketBreadthCard
 *
 * Displays the National Stock Exchange (NSE) Market Breadth ratio:
 * representing advancing vs declining listed equities.
 *
 * Structured cleanly so that live WebSocket/API breadth telemetry
 * can be bound directly without altering card structure.
 */
export function MarketBreadthCard({
  advancing = 1412,
  declining = 918,
  className,
}: MarketBreadthCardProps) {
  const total = advancing + declining;
  const advancePercent = total > 0 ? Math.round((advancing / total) * 100) : 50;

  return (
    <div
      data-interactive-card="true"
      className={cn(
        "p-4 rounded-xl editorial-frame editorial-frame-hover space-y-1 select-none",
        className
      )}
    >
      <div className="flex items-center justify-between text-[10px] font-mono text-gray-400 uppercase tracking-wider">
        <span>MARKET BREADTH</span>
        <span className="text-emerald-400 text-[10px] font-semibold">
          {advancePercent}% ADV
        </span>
      </div>

      <div className="flex items-baseline justify-between gap-1">
        <div className="text-xl sm:text-2xl font-light font-mono text-white tracking-tight">
          {advancing.toLocaleString("en-IN")}{" "}
          <span className="text-gray-500 text-sm font-normal">/</span>{" "}
          {declining.toLocaleString("en-IN")}
        </div>
        <span
          className="text-[10px] text-gray-400 font-sans tracking-tight"
          aria-label="Advancing versus declining equities"
        >
          Advancing / Declining
        </span>
      </div>

      {/* Visual Dual Ratio Split Gauge */}
      <div
        className="w-full h-1.5 bg-rose-500/30 rounded-full overflow-hidden flex mt-1"
        role="progressbar"
        aria-valuenow={advancePercent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Market breadth: ${advancePercent}% advancing`}
      >
        <div
          className="h-full bg-emerald-400 rounded-full transition-all duration-500"
          style={{ width: `${advancePercent}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-[10px] font-mono text-gray-500 pt-0.5">
        <span className="text-emerald-400/80">{advancing.toLocaleString("en-IN")} Adv</span>
        <span className="text-rose-400/80">{declining.toLocaleString("en-IN")} Dec</span>
      </div>
    </div>
  );
}
