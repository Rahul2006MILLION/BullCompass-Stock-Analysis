"use client";

import React, { useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { PortfolioHistorySnapshot } from "@/types/portfolio";
import { formatCurrency, formatPercentage } from "@/lib/utils";

interface NetWorthAreaChartProps {
  data: PortfolioHistorySnapshot[];
  isLoading?: boolean;
}

export function NetWorthAreaChart({ data, isLoading = false }: NetWorthAreaChartProps) {
  const [timeRange, setTimeRange] = useState<"1W" | "1M" | "3M" | "ALL">("ALL");

  if (isLoading) {
    return (
      <div className="h-[280px] w-full flex items-center justify-center bg-white/2 rounded-2xl animate-pulse">
        <span className="text-xs text-gray-500">Loading performance chart...</span>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="h-[280px] w-full flex flex-col items-center justify-center bg-white/2 rounded-2xl border border-dashed border-white/10 p-6 text-center">
        <p className="text-sm font-medium text-gray-300">No snapshot history yet</p>
        <p className="text-xs text-gray-500 mt-1">
          Perform a Buy/Sell trade or click &ldquo;Record Snapshot&rdquo; to track valuation over time.
        </p>
      </div>
    );
  }

  // Format data for chart
  const formattedData = data.map((item) => {
    const d = new Date(item.timestamp);
    const dateLabel = !isNaN(d.getTime())
      ? d.toLocaleDateString("en-IN", { month: "short", day: "numeric" })
      : item.timestamp;

    return {
      timestamp: item.timestamp,
      dateLabel,
      netWorth: item.net_worth,
      invested: item.invested_amount,
      profit: item.profit,
      returnPercentage: item.return_percentage,
    };
  });

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const p = payload[0].payload;
      const isPositive = p.profit >= 0;

      return (
        <div className="bg-[#0f141e]/95 border border-white/15 rounded-xl p-3.5 shadow-2xl backdrop-blur-xl text-xs space-y-1.5 min-w-[170px]">
          <p className="font-mono text-gray-400 border-b border-white/8 pb-1.5">{p.timestamp}</p>
          <div className="flex justify-between items-center gap-4 pt-0.5">
            <span className="text-gray-400">Net Worth:</span>
            <span className="font-mono font-semibold text-white">{formatCurrency(p.netWorth)}</span>
          </div>
          <div className="flex justify-between items-center gap-4">
            <span className="text-gray-400">Invested:</span>
            <span className="font-mono text-gray-300">{formatCurrency(p.invested)}</span>
          </div>
          <div className="flex justify-between items-center gap-4">
            <span className="text-gray-400">P&L:</span>
            <span className={`font-mono font-semibold ${isPositive ? "text-emerald-400" : "text-rose-400"}`}>
              {formatCurrency(p.profit)} ({formatPercentage(p.returnPercentage)})
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold text-gray-100 tracking-tight">
            Portfolio Performance
          </h3>
          <p className="text-xs text-gray-400">Historical valuation and net worth progression</p>
        </div>

        {/* Timeframe selector */}
        <div className="flex items-center gap-1 bg-[#111622] p-1 rounded-lg border border-white/6 text-xs">
          {(["1W", "1M", "3M", "ALL"] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                timeRange === range
                  ? "bg-emerald-500/20 text-emerald-400 font-semibold border border-emerald-500/30"
                  : "text-gray-400 hover:text-gray-200"
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      <div className="h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={formattedData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="netWorthGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="investedGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="dateLabel"
              stroke="#4b5563"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: "rgba(255,255,255,0.08)" }}
            />
            <YAxis
              stroke="#4b5563"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`}
              domain={["auto", "auto"]}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="netWorth"
              name="Net Worth"
              stroke="#10b981"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#netWorthGradient)"
            />
            <Area
              type="monotone"
              dataKey="invested"
              name="Invested"
              stroke="#60a5fa"
              strokeWidth={1.5}
              strokeDasharray="4 4"
              fillOpacity={1}
              fill="url(#investedGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
