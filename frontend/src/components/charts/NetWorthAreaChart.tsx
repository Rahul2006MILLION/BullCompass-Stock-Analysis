"use client";

import React, { useState, useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { PortfolioHistorySnapshot } from "@/types/portfolio";
import { formatCurrency, formatPercentage } from "@/lib/utils";

interface NetWorthAreaChartProps {
  data: PortfolioHistorySnapshot[];
  isLoading?: boolean;
}

function parseSnapshotDate(ts: string): Date {
  if (!ts) return new Date();
  const normalized = ts.includes("T") ? ts : ts.replace(" ", "T");
  const d = new Date(normalized);
  if (!isNaN(d.getTime())) return d;
  const fallback = new Date(ts);
  return isNaN(fallback.getTime()) ? new Date() : fallback;
}

export const NetWorthAreaChart = React.memo(function NetWorthAreaChart({
  data,
  isLoading = false,
}: NetWorthAreaChartProps) {
  const [timeRange, setTimeRange] = useState<"1W" | "1M" | "3M" | "ALL">("ALL");

  const filteredSnapshots = useMemo(() => {
    if (!data || data.length === 0) return [];
    if (timeRange === "ALL") return data;

    const daysMap: Record<"1W" | "1M" | "3M", number> = {
      "1W": 7,
      "1M": 30,
      "3M": 90,
    };

    const days = daysMap[timeRange];
    if (!days) return data;

    const parsed = data
      .map((item) => ({
        item,
        time: parseSnapshotDate(item.timestamp).getTime(),
      }))
      .filter((p) => !isNaN(p.time));

    if (parsed.length === 0) return data;

    const latestTime = Math.max(...parsed.map((p) => p.time));
    const refTime = Math.max(Date.now(), latestTime);
    const cutoff = refTime - days * 24 * 60 * 60 * 1000;

    const matched = parsed.filter((p) => p.time >= cutoff).map((p) => p.item);

    if (matched.length === 0 && data.length > 0) {
      return [data[data.length - 1]];
    }

    return matched;
  }, [data, timeRange]);

  const formattedData = useMemo(() => {
    if (!filteredSnapshots || filteredSnapshots.length === 0) return [];

    const dateCounts: Record<string, number> = {};
    filteredSnapshots.forEach((item) => {
      const d = parseSnapshotDate(item.timestamp);
      if (!isNaN(d.getTime())) {
        const dayKey = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
        dateCounts[dayKey] = (dateCounts[dayKey] || 0) + 1;
      }
    });
    const hasSameDayMulti = Object.values(dateCounts).some((count) => count > 1);

    return filteredSnapshots.map((item) => {
      const d = parseSnapshotDate(item.timestamp);
      let dateLabel = item.timestamp;

      if (!isNaN(d.getTime())) {
        if (timeRange === "1W" || hasSameDayMulti) {
          dateLabel = d.toLocaleDateString("en-IN", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          });
        } else {
          dateLabel = d.toLocaleDateString("en-IN", {
            month: "short",
            day: "numeric",
          });
        }
      }

      return {
        timestamp: item.timestamp,
        dateLabel,
        netWorth: item.net_worth,
        invested: item.invested_amount,
        profit: item.profit,
        returnPercentage: item.return_percentage,
      };
    });
  }, [filteredSnapshots, timeRange]);

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
            <Tooltip
              cursor={{ stroke: "rgba(111, 227, 166, 0.4)", strokeWidth: 1, strokeDasharray: "3 3" }}
              content={<CustomTooltip />}
            />
            <Area
              type="monotone"
              dataKey="netWorth"
              name="Net Worth"
              stroke="#10b981"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4.5, fill: "#10b981", stroke: "#ffffff", strokeWidth: 2 }}
              fillOpacity={1}
              fill="url(#netWorthGradient)"
              isAnimationActive={true}
              animationDuration={500}
              animationEasing="ease-out"
            />
            <Area
              type="monotone"
              dataKey="invested"
              name="Invested"
              stroke="#60a5fa"
              strokeWidth={1.5}
              strokeDasharray="4 4"
              dot={false}
              activeDot={{ r: 3.5, fill: "#60a5fa", stroke: "#ffffff", strokeWidth: 1.5 }}
              fillOpacity={1}
              fill="url(#investedGradient)"
              isAnimationActive={true}
              animationDuration={500}
              animationEasing="ease-out"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
});


