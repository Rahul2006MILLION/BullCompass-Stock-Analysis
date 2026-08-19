"use client";

import React, { useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { HoldingItem } from "@/types/portfolio";
import { formatCurrency, formatPercentage } from "@/lib/utils";

interface AllocationDonutProps {
  holdings: HoldingItem[];
  totalValue: number;
}

const COLORS = [
  "#10b981", // Mint
  "#3b82f6", // Blue
  "#8b5cf6", // Purple
  "#f59e0b", // Amber
  "#06b6d4", // Cyan
  "#ec4899", // Pink
  "#14b8a6", // Teal
  "#6366f1", // Indigo
];

export function AllocationDonut({ holdings, totalValue }: AllocationDonutProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  if (!holdings || holdings.length === 0 || totalValue === 0) {
    return (
      <div className="h-[280px] w-full flex items-center justify-center bg-white/2 rounded-2xl border border-dashed border-white/10 p-6 text-center">
        <p className="text-xs text-gray-500">No holdings to display allocation</p>
      </div>
    );
  }

  const chartData = holdings
    .filter((h) => (h.current_value != null ? h.current_value : (h.invested || 0)) > 0)
    .map((h) => {
      const val = h.current_value != null ? h.current_value : (h.quantity * h.average_buy_price);
      const percent = totalValue > 0 ? (val / totalValue) * 100 : 0;
      return {
        name: h.ticker,
        value: val,
        percentage: percent,
        quantity: h.quantity,
      };
    })
    .sort((a, b) => b.value - a.value);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-[#0f141e]/95 border border-white/15 rounded-xl p-3 shadow-2xl backdrop-blur-xl text-xs space-y-1">
          <p className="font-semibold text-white">{data.name}</p>
          <div className="flex justify-between gap-4 text-gray-400">
            <span>Value:</span>
            <span className="font-mono text-emerald-400 font-medium">
              {formatCurrency(data.value)}
            </span>
          </div>
          <div className="flex justify-between gap-4 text-gray-400">
            <span>Weight:</span>
            <span className="font-mono text-gray-200">{data.percentage.toFixed(1)}%</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full">
      <div className="mb-2">
        <h3 className="text-base font-semibold text-gray-100 tracking-tight">
          Asset Allocation
        </h3>
        <p className="text-xs text-gray-400">Distribution by current market value</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 items-center gap-4">
        {/* Donut Chart */}
        <div className="md:col-span-7 h-[230px] relative flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={88}
                paddingAngle={3}
                dataKey="value"
                isAnimationActive={true}
                animationDuration={850}
                animationEasing="ease-out"
                onMouseEnter={(_, index) => setActiveIndex(index)}
                onMouseLeave={() => setActiveIndex(null)}
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                    stroke="#0e121a"
                    strokeWidth={2}
                    className="transition-all duration-300 cursor-pointer"
                    opacity={activeIndex === null || activeIndex === index ? 1 : 0.4}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>

          {/* Center Text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-[11px] uppercase tracking-wider text-gray-400 font-medium">
              {activeIndex !== null ? chartData[activeIndex]?.name : "Holdings"}
            </span>
            <span className="text-sm font-mono font-bold text-gray-100">
              {activeIndex !== null
                ? `${chartData[activeIndex]?.percentage.toFixed(1)}%`
                : `${chartData.length} Stocks`}
            </span>
          </div>
        </div>

        {/* Legend List */}
        <div className="md:col-span-5 space-y-2 max-h-[220px] overflow-y-auto pr-1">
          {chartData.map((item, idx) => (
            <div
              key={item.name}
              onMouseEnter={() => setActiveIndex(idx)}
              onMouseLeave={() => setActiveIndex(null)}
              className={`flex items-center justify-between p-2 rounded-lg text-xs transition-colors cursor-pointer ${
                activeIndex === idx ? "bg-white/10" : "bg-white/2 hover:bg-white/5"
              }`}
            >
              <div className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                />
                <span className="font-semibold text-gray-200">{item.name}</span>
              </div>
              <div className="text-right">
                <span className="font-mono text-gray-300 block">{item.percentage.toFixed(1)}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
