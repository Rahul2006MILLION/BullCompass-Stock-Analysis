"use client";

import React from "react";
import { HoldingItem } from "@/types/portfolio";
import { formatCurrency, formatPercentage } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  MinusCircle,
  Edit2,
  Trash2,
  Percent,
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
  const unrealizedProfit =
    holding.profit ??
    (holding.current_price != null
      ? (holding.current_price - holding.average_buy_price) * holding.quantity
      : 0);

  const stockNameColor =
    unrealizedProfit > 0
      ? "text-emerald-400 group-hover:text-emerald-300"
      : unrealizedProfit < 0
      ? "text-rose-400 group-hover:text-rose-300"
      : "text-white group-hover:text-gray-200";

  const isPositive = (holding.profit || 0) >= 0;
  const currentVal = holding.current_value ?? holding.quantity * (holding.current_price || holding.average_buy_price);
  const investedVal = holding.invested ?? holding.quantity * holding.average_buy_price;

  const allocationWeight =
    totalPortfolioValue > 0 && currentVal > 0
      ? (currentVal / totalPortfolioValue) * 100
      : 0;

  return (
    <div className="liquid-card-shell group">
      <div className="liquid-card-inner">
        {/* Subtle top indicator bar */}
        <div
          className={`absolute top-0 left-0 right-0 h-[2px] opacity-75 group-hover:opacity-100 transition-opacity ${
            isPositive ? "bg-emerald-500" : "bg-rose-500"
          }`}
        />

      {/* Header */}
      <div className="flex items-start justify-between mb-3.5 pt-1">
        <div>
          <div className="flex items-center gap-2">
            <span className={`font-bold text-lg font-mono tracking-tight transition-colors ${stockNameColor}`}>
              {holding.ticker}
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/5 text-gray-400 border border-white/8">
              NSE
            </span>
            {allocationWeight > 0 && (
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                {allocationWeight.toFixed(1)}% wt
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-0.5">
            {holding.quantity} shares @ {formatCurrency(holding.average_buy_price)}
          </p>
        </div>

        {/* Current Live Price & Return % */}
        <div className="text-right">
          <span className="text-sm font-bold font-mono text-gray-100 block">
            {holding.current_price ? formatCurrency(holding.current_price) : "Fetching..."}
          </span>
          <Badge variant={isPositive ? "mint" : "coral"} size="sm" dot>
            {isPositive ? (
              <TrendingUp className="w-3 h-3 mr-0.5 inline" />
            ) : (
              <TrendingDown className="w-3 h-3 mr-0.5 inline" />
            )}
            {formatPercentage(holding.returns)}
          </Badge>
        </div>
      </div>

      {/* Financial Valuation Metrics */}
      <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-[#080b10]/70 border border-white/5 mb-4 text-xs font-mono">
        <div>
          <span className="text-gray-500 block text-[11px]">Invested</span>
          <span className="text-gray-300 font-semibold">{formatCurrency(investedVal)}</span>
        </div>
        <div className="text-right">
          <span className="text-gray-500 block text-[11px]">Current Value</span>
          <span className="text-white font-semibold">{formatCurrency(currentVal)}</span>
        </div>
        <div className="col-span-2 pt-2 border-t border-white/5 flex justify-between items-center">
          <span className="text-gray-500 text-[11px]">Unrealized P&L</span>
          <span className={`font-bold ${isPositive ? "text-emerald-400" : "text-rose-400"}`}>
            {formatCurrency(holding.profit)}
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-1.5 pt-1">
        <Button
          variant="mint"
          size="sm"
          onClick={() => onBuy(holding)}
          className="flex-1 text-xs py-1.5 font-medium"
        >
          <ShoppingCart className="w-3.5 h-3.5 mr-1" />
          Buy
        </Button>
        <Button
          variant="danger"
          size="sm"
          onClick={() => onSell(holding)}
          className="flex-1 text-xs py-1.5 font-medium"
        >
          <MinusCircle className="w-3.5 h-3.5 mr-1" />
          Sell
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onEdit(holding)}
          className="h-8 w-8 text-gray-400 hover:text-gray-200 hover:bg-white/10 rounded-xl"
          title="Edit Holding"
        >
          <Edit2 className="w-3.5 h-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDelete(holding)}
          className="h-8 w-8 text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl"
          title="Delete Holding"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  </div>
  );
}
