"use client";

import React from "react";
import { HoldingItem } from "@/types/portfolio";
import { formatCurrency, formatPercentage } from "@/lib/utils";
import {
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  MinusCircle,
  Edit2,
  Trash2,
  Briefcase,
  Layers,
} from "lucide-react";

interface StockCardProps {
  holding: HoldingItem;
  totalPortfolioValue?: number;
  onBuy: (holding: HoldingItem) => void;
  onSell: (holding: HoldingItem) => void;
  onEdit: (holding: HoldingItem) => void;
  onDelete: (holding: HoldingItem) => void;
}

export function StockCard({
  holding,
  totalPortfolioValue = 0,
  onBuy,
  onSell,
  onEdit,
  onDelete,
}: StockCardProps) {
  const isPositive = (holding.profit || 0) >= 0;
  const currentVal =
    holding.current_value ??
    holding.quantity * (holding.current_price || holding.average_buy_price);
  const investedVal =
    holding.invested ?? holding.quantity * holding.average_buy_price;

  const allocationWeight =
    totalPortfolioValue > 0 && currentVal > 0
      ? (currentVal / totalPortfolioValue) * 100
      : 0;

  return (
    <div
      data-interactive-card="true"
      className="editorial-frame editorial-frame-hover p-5 rounded-2xl flex flex-col justify-between h-full group space-y-4 relative overflow-hidden select-none"
    >
      <div className="relative z-10 flex flex-col justify-between h-full space-y-4">
        {/* 1. Header: Stock Identity & Live Price / Return */}
        <div>
          <div className="flex items-start justify-between gap-3">
            {/* Stock Anchor */}
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg font-bold font-mono text-white tracking-tight group-hover:text-emerald-400 transition-colors duration-200">
                  {holding.ticker}
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.04] text-gray-300 border border-white/[0.06]">
                  NSE
                </span>
                {allocationWeight > 0 && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20 font-semibold flex items-center gap-1">
                    <Layers className="w-2.5 h-2.5" />
                    {allocationWeight.toFixed(1)}% wt
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400 font-sans">
                {holding.quantity} shares @ {formatCurrency(holding.average_buy_price)}
              </p>
            </div>

            {/* Current Price & Session / Return Signal */}
            <div className="text-right shrink-0 font-mono">
              <span className="text-sm font-light text-white block">
                {holding.current_price ? formatCurrency(holding.current_price) : "—"}
              </span>
              <div
                className={`inline-flex items-center gap-1 text-[11px] font-semibold pt-0.5 ${
                  isPositive ? "text-emerald-400" : "text-rose-400"
                }`}
              >
                {isPositive ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                <span>
                  {isPositive ? "+" : ""}
                  {formatPercentage(holding.returns)}
                </span>
              </div>
            </div>
          </div>

          {/* 2. Financial Metrics Bar */}
          <div className="mt-4 pt-3 pb-2.5 border-t border-b border-white/[0.05] grid grid-cols-3 gap-2 text-xs font-mono">
            <div>
              <span className="text-[10px] text-gray-500 uppercase tracking-wider block">
                Invested
              </span>
              <span className="text-gray-300 font-medium text-xs block mt-0.5">
                {formatCurrency(investedVal)}
              </span>
            </div>

            <div>
              <span className="text-[10px] text-gray-500 uppercase tracking-wider block">
                Current Val
              </span>
              <span className="text-white font-medium text-xs block mt-0.5">
                {formatCurrency(currentVal)}
              </span>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-gray-500 uppercase tracking-wider block">
                Unrealized P&L
              </span>
              <span
                className={`font-bold text-xs block mt-0.5 transition-all duration-200 ${
                  isPositive
                    ? "text-emerald-400 group-hover:brightness-110"
                    : "text-rose-400 group-hover:brightness-110"
                }`}
              >
                {formatCurrency(holding.profit)}
              </span>
            </div>
          </div>
        </div>

        {/* 3. Action Toolbar (Buy, Sell, Edit, Delete) */}
        <div className="pt-2 flex items-center justify-between gap-2 font-mono text-xs mt-auto">
          <div className="flex items-center gap-2 flex-1">
            <button
              onClick={() => onBuy(holding)}
              className="flex-1 py-1.5 px-3 rounded-lg bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-black border border-emerald-500/20 hover:border-emerald-400 font-mono text-xs font-semibold flex items-center justify-center gap-1.5 transition-all duration-200"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>Buy</span>
            </button>

            <button
              onClick={() => onSell(holding)}
              className="flex-1 py-1.5 px-3 rounded-lg bg-rose-500/10 hover:bg-rose-500 text-rose-300 hover:text-white border border-rose-500/20 hover:border-rose-400 font-mono text-xs font-semibold flex items-center justify-center gap-1.5 transition-all duration-200"
            >
              <MinusCircle className="w-3.5 h-3.5" />
              <span>Sell</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onEdit(holding)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.06] border border-white/[0.06] hover:border-white/[0.12] transition-colors"
              title="Edit Holding"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => onDelete(holding)}
              className="p-1.5 rounded-lg text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 border border-white/[0.06] hover:border-rose-500/20 transition-colors"
              title="Delete Holding"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
