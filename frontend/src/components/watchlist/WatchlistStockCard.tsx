"use client";

import React, { useState } from "react";
import Link from "next/link";
import { WatchlistItem } from "@/types/watchlist";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  Sparkles,
  Trash2,
  CheckCircle2,
  X,
  Briefcase,
  Layers,
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

  // Mock 52W range positioning for visual institutional depth
  const rangeMin = price > 0 ? price * 0.72 : 100;
  const rangeMax = price > 0 ? price * 1.28 : 200;
  const rangePct = Math.min(Math.max(((price - rangeMin) / (rangeMax - rangeMin)) * 100, 10), 90);

  return (
    <div
      data-interactive-card="true"
      className="editorial-frame editorial-frame-hover p-5 rounded-2xl flex flex-col justify-between h-full group space-y-4 relative overflow-hidden"
    >
      <div className="relative z-10 flex flex-col justify-between h-full space-y-4">
        <div>
        {/* Header: Ticker, Badges & Remove */}
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-lg font-bold font-mono text-white tracking-tight group-hover:text-emerald-400 transition-colors">
                {item.ticker}
              </h3>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/[0.04] border border-white/[0.06] text-gray-400">
                NSE
              </span>
              {item.is_owned && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold flex items-center gap-1">
                  <Briefcase className="w-2.5 h-2.5" />
                  HOLDING
                </span>
              )}
            </div>
            <p className="text-xs text-gray-400 font-sans truncate max-w-[200px]" title={item.company_name}>
              {item.company_name}
            </p>
          </div>

          <div className="relative">
            {isConfirmingRemove ? (
              <div className="flex items-center gap-1 bg-[#141a24] p-1 rounded-lg border border-white/10 shadow-lg">
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

        {/* Live Quote & Delta Strip */}
        <div className="mt-4 p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] space-y-2">
          <div className="flex items-baseline justify-between">
            <span className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">
              LTP PRICE
            </span>
            <span className="text-xl font-light font-mono text-white">
              {price > 0 ? formatCurrency(price) : "—"}
            </span>
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-white/[0.04] text-xs font-mono">
            <span className="text-gray-400 text-[10px]">Session Net</span>
            <div
              className={`flex items-center gap-1 font-semibold ${
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
                {changePct.toFixed(2)}% ({formatCurrency(change)})
              </span>
            </div>
          </div>
        </div>

        {/* 52W Range Bar */}
        <div className="mt-3 space-y-1 font-mono text-[10px] text-gray-400">
          <div className="flex justify-between">
            <span>52W Low ₹{(rangeMin).toFixed(0)}</span>
            <span>52W High ₹{(rangeMax).toFixed(0)}</span>
          </div>
          <div className="w-full h-1 bg-white/[0.06] rounded-full overflow-hidden relative">
            <div
              className="absolute top-0 bottom-0 w-2 bg-emerald-400 rounded-full"
              style={{ left: `${rangePct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Action Footer: Buy & AI Analysis */}
      <div className="pt-2 border-t border-white/[0.06] flex items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onBuy(item.ticker, item.current_price)}
          className="flex-1 font-mono text-xs bg-white/[0.03] hover:bg-emerald-500 hover:text-black border border-white/[0.08] transition-all"
        >
          <ShoppingCart className="w-3 h-3 mr-1.5" />
          Buy
        </Button>
        <Link href={`/ai-analysis?ticker=${encodeURIComponent(item.ticker)}`} className="flex-1">
          <Button
            variant="ghost"
            size="sm"
            className="w-full font-mono text-xs bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.08] text-gray-300 hover:text-white transition-all"
          >
            <Sparkles className="w-3 h-3 mr-1.5 text-emerald-400" />
            AI Report
          </Button>
        </Link>
      </div>
      </div>
    </div>
  );
}
