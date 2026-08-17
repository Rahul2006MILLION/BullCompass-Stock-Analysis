"use client";

import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from "recharts";
import { HoldingItem } from "@/types/portfolio";
import { formatCurrency, formatPercentage } from "@/lib/utils";

interface ProfitLossBarChartProps {
  holdings: HoldingItem[];
}

export function ProfitLossBarChart({ holdings }: ProfitLossBarChartProps) {
  if (!holdings || holdings.length === 0) {
    return (
      <div className="h-[250px] w-full flex items-center justify-center bg-white/2 rounded-2xl border border-dashed border-white/10 p-6 text-center">
        <p className="text-xs text-gray-500">No holdings to compare P&L</p>
      </div>
    );
  }

  const chartData = holdings.map((h) => {
    const profit = h.profit || 0;
    const returnPct = h.returns || 0;
    return {
      name: h.ticker,
      profit: profit,
      returnPct: returnPct,
    };
  });

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const isPositive = data.profit >= 0;
      return (
        <div className="bg-[#0f141e]/95 border border-white/15 rounded-xl p-3 shadow-2xl backdrop-blur-xl text-xs space-y-1">
          <p className="font-semibold text-white">{data.name}</p>
          <div className="flex justify-between gap-4 text-gray-400">
            <span>Profit / Loss:</span>
            <span
              className={`font-mono font-medium ${
                isPositive ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              {formatCurrency(data.profit)}
            </span>
          </div>
          <div className="flex justify-between gap-4 text-gray-400">
            <span>Return %:</span>
            <span
              className={`font-mono font-medium ${
                isPositive ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              {formatPercentage(data.returnPct)}
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-gray-100 tracking-tight">
          Individual Stock P&L
        </h3>
        <p className="text-xs text-gray-400">Unrealized profit/loss across current holdings</p>
      </div>

      <div className="h-[250px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <XAxis
              dataKey="name"
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
            />
            <ReferenceLine y={0} stroke="rgba(255,255,255,0.15)" />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="profit" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell
                  key={`bar-${index}`}
                  fill={entry.profit >= 0 ? "#10b981" : "#f43f5e"}
                  opacity={0.85}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
