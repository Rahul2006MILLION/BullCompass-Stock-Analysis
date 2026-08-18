"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { WatchlistItem } from "@/types/watchlist";
import { formatCurrency, formatPercentage } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  Bot,
  Trash2,
  CheckCircle2,
  X,
  Briefcase,
} from "lucide-react";

interface WatchlistStockCardProps {
  item: WatchlistItem;
  onRemove: (ticker: string) => void;
  onBuy: (ticker: string, price: number | null) => void;
}

export function WatchlistStockCard({
  item,
  onRemove,
  onBuy,
}: WatchlistStockCardProps) {
  const [isConfirmingRemove, setIsConfirmingRemove] = useState(false);

  const price = item.current_price ?? 0;
  const change = item.change ?? 0;
  const changePct = item.change_percent ?? 0;
  const isPositive = change >= 0;

  return (
    <Card
      className="group transition-all duration-300 bg-[#0d121a]/95 hover:bg-[#111724] border-white/8 hover:border-white/20 relative overflow-hidden flex flex-col justify-between"
    >
      {/* Top subtle glow on hover */}
      <div
        className={`absolute top-0 left-0 right-0 h-[2px] transition-opacity duration-300 opacity-0 group-hover:opacity-100 ${
          isPositive ? "bg-emerald-500/60" : "bg-rose-500/60"
        }`}
      />

      <div className="p-5">
        {/* Header: Company Name, Ticker, Badges & Remove Button */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-bold tracking-tight text-white group-hover:text-emerald-300 transition-colors truncate">
                {item.ticker}
              </h3>
              <Badge variant="neutral" size="sm" className="text-[10px] font-mono py-0 px-1.5 border-white/10 text-gray-400">
                NSE
              </Badge>
              {item.is_owned && (
                <Badge
                  variant="mint"
                  size="sm"
                  className="text-[10px] font-semibold py-0 px-1.5 flex items-center gap-1"
                >
                  <Briefcase className="w-2.5 h-2.5" />
                  OWNED
                </Badge>
              )}
            </div>
            <p className="text-xs text-gray-400 font-medium truncate max-w-[220px]" title={item.company_name}>
              {item.company_name}
            </p>
          </div>

          {/* Remove / × Action */}
          <div className="relative">
            {isConfirmingRemove ? (
              <div className="flex items-center gap-1 bg-[#1a2230] p-1 rounded-lg border border-white/10 shadow-lg animate-in fade-in zoom-in-95 duration-150">
                <button
                  onClick={() => onRemove(item.ticker)}
                  title="Confirm Remove"
                  className="p-1 rounded bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white transition-colors"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setIsConfirmingRemove(false)}
                  title="Cancel"
                  className="p-1 rounded hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsConfirmingRemove(true)}
                className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all duration-200"
                title="Remove from Watchlist"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Live Price & Day Change Section */}
        <div className="bg-[#141a24]/60 rounded-xl p-3.5 border border-white/5 space-y-2 mb-4">
          <div className="flex items-baseline justify-between">
            <span className="text-[11px] font-mono text-gray-400 uppercase tracking-wider">
              Live Price
            </span>
            <span className="text-lg font-bold font-mono text-white tracking-tight">
              {price > 0 ? formatCurrency(price) : "—"}
            </span>
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-white/5 text-xs">
            <span className="text-gray-400 text-[11px]">Today&apos;s Change</span>
            <div
              className={`flex items-center gap-1 font-mono font-medium ${
                isPositive ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              {isPositive ? (
                <TrendingUp className="w-3.5 h-3.5" />
              ) : (
                <TrendingDown className="w-3.5 h-3.5" />
              )}
              <span>
                {isPositive ? "+" : ""}
                {formatCurrency(change)} ({isPositive ? "+" : ""}
                {changePct.toFixed(2)}%)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Footer: Buy & AI Analysis */}
      <div className="px-5 py-3.5 bg-[#090d14]/80 border-t border-white/5 flex items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onBuy(item.ticker, item.current_price)}
          className="flex-1 bg-[#141a24] hover:bg-emerald-600 hover:text-white border-white/8 hover:border-emerald-500/40 text-gray-200 text-xs font-semibold py-1.5 transition-all duration-200"
        >
          <ShoppingCart className="w-3.5 h-3.5 mr-1.5" />
          Buy
        </Button>
        <Link href={`/ai-analysis?ticker=${encodeURIComponent(item.ticker)}`} className="flex-1">
          <Button
            variant="ghost"
            size="sm"
            className="w-full bg-transparent hover:bg-white/5 border border-white/8 hover:border-white/15 text-gray-300 hover:text-emerald-300 text-xs font-semibold py-1.5 transition-all duration-200"
          >
            <Bot className="w-3.5 h-3.5 mr-1.5 text-emerald-400" />
            AI Research
          </Button>
        </Link>
      </div>
    </Card>
  );
}
