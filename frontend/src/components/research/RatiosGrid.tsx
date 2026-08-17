"use client";

import React from "react";
import { KeyRatiosData, IncomeStatementData } from "@/types/research";
import { Card } from "@/components/ui/Card";
import {
  Percent,
  Calculator,
  Scale,
  TrendingUp,
} from "lucide-react";

interface RatiosGridProps {
  ratios: KeyRatiosData;
  incomeStatement: IncomeStatementData;
}

export function RatiosGrid({ ratios, incomeStatement }: RatiosGridProps) {
  const renderRatio = (val: number | null | undefined, suffix = "x", isPct = false) => {
    if (val === null || val === undefined || isNaN(val)) {
      return <span className="text-gray-500 font-mono">N/A</span>;
    }
    if (isPct) {
      const isPositive = val >= 0;
      return (
        <span className={`font-mono font-bold ${isPositive ? "text-emerald-400" : "text-rose-400"}`}>
          {val > 0 ? `+${val.toFixed(1)}%` : `${val.toFixed(1)}%`}
        </span>
      );
    }
    return <span className="font-mono font-bold text-white">{val.toFixed(2)}{suffix}</span>;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Valuation Multiples */}
      <Card className="bg-[#0d121a]/95 border-white/8 space-y-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
          <Calculator className="w-4 h-4 text-emerald-400" />
          <span>Valuation Multiples</span>
        </div>
        <div className="space-y-2 text-xs font-mono">
          <div className="flex items-center justify-between py-1 border-b border-white/5">
            <span className="text-gray-400">Trailing P/E</span>
            {renderRatio(ratios.pe_ratio)}
          </div>
          <div className="flex items-center justify-between py-1 border-b border-white/5">
            <span className="text-gray-400">Forward P/E</span>
            {renderRatio(ratios.forward_pe)}
          </div>
          <div className="flex items-center justify-between py-1 border-b border-white/5">
            <span className="text-gray-400">Price to Book (P/B)</span>
            {renderRatio(ratios.pb_ratio)}
          </div>
          <div className="flex items-center justify-between py-1">
            <span className="text-gray-400">EV / EBITDA</span>
            {renderRatio(ratios.ev_to_ebitda)}
          </div>
        </div>
      </Card>

      {/* 2. Profitability & Returns */}
      <Card className="bg-[#0d121a]/95 border-white/8 space-y-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
          <Percent className="w-4 h-4 text-blue-400" />
          <span>Profitability & Capital</span>
        </div>
        <div className="space-y-2 text-xs font-mono">
          <div className="flex items-center justify-between py-1 border-b border-white/5">
            <span className="text-gray-400">Return on Equity (ROE)</span>
            {renderRatio(ratios.roe, "%", true)}
          </div>
          <div className="flex items-center justify-between py-1 border-b border-white/5">
            <span className="text-gray-400">Return on Assets (ROA)</span>
            {renderRatio(ratios.roa, "%", true)}
          </div>
          <div className="flex items-center justify-between py-1 border-b border-white/5">
            <span className="text-gray-400">Operating Margin</span>
            {renderRatio(ratios.operating_margin, "%", true)}
          </div>
          <div className="flex items-center justify-between py-1">
            <span className="text-gray-400">Net Profit Margin</span>
            {renderRatio(ratios.net_margin, "%", true)}
          </div>
        </div>
      </Card>

      {/* 3. Solvency & Balance Sheet */}
      <Card className="bg-[#0d121a]/95 border-white/8 space-y-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
          <Scale className="w-4 h-4 text-purple-400" />
          <span>Solvency & Leverage</span>
        </div>
        <div className="space-y-2 text-xs font-mono">
          <div className="flex items-center justify-between py-1 border-b border-white/5">
            <span className="text-gray-400">Debt to Equity</span>
            {renderRatio(ratios.debt_to_equity, "x")}
          </div>
          <div className="flex items-center justify-between py-1 border-b border-white/5">
            <span className="text-gray-400">Current Ratio</span>
            {renderRatio(ratios.current_ratio, "x")}
          </div>
          <div className="flex items-center justify-between py-1">
            <span className="text-gray-400">Dividend Yield</span>
            {renderRatio(ratios.dividend_yield, "%", true)}
          </div>
        </div>
      </Card>

      {/* 4. Multi-Year Growth */}
      <Card className="bg-[#0d121a]/95 border-white/8 space-y-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
          <TrendingUp className="w-4 h-4 text-emerald-400" />
          <span>Compounded Growth</span>
        </div>
        <div className="space-y-2 text-xs font-mono">
          <div className="flex items-center justify-between py-1 border-b border-white/5">
            <span className="text-gray-400">3Y Revenue CAGR</span>
            {renderRatio(incomeStatement.revenue_cagr_3y, "%", true)}
          </div>
          <div className="flex items-center justify-between py-1 border-b border-white/5">
            <span className="text-gray-400">3Y Net Profit CAGR</span>
            {renderRatio(incomeStatement.net_profit_cagr_3y, "%", true)}
          </div>
          <div className="flex items-center justify-between py-1 border-b border-white/5">
            <span className="text-gray-400">YoY Revenue Growth</span>
            {renderRatio(ratios.revenue_growth_yoy, "%", true)}
          </div>
          <div className="flex items-center justify-between py-1">
            <span className="text-gray-400">YoY Earnings Growth</span>
            {renderRatio(ratios.earnings_growth_yoy, "%", true)}
          </div>
        </div>
      </Card>
    </div>
  );
}
