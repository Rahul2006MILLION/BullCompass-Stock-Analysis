"use client";

import React, { useMemo } from "react";
import { Plus, Zap, Activity } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useLiveQuotes } from "@/lib/useLiveQuotes";

interface HeaderProps {
  onOpenAddModal?: () => void;
  onOpenQuickTrade?: () => void;
}

export function Header({ onOpenAddModal, onOpenQuickTrade }: HeaderProps) {
  const indexTickers = useMemo(() => ["^NSEI", "^BSESN", "^INDIAVIX"], []);
  const { quotes, marketStatus, isPolling } = useLiveQuotes({
    tickers: indexTickers,
    intervalMs: 10000,
  });

  const nifty = quotes["^NSEI"];
  const sensex = quotes["^BSESN"];
  const vix = quotes["^INDIAVIX"];

  const niftyPrice = nifty?.current_price
    ? nifty.current_price.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : "24,217.35";
  const niftyChange = nifty?.change_percent ?? 0.68;
  const niftyIsPositive = niftyChange >= 0;

  const sensexPrice = sensex?.current_price
    ? sensex.current_price.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : "77,383.60";
  const sensexChange = sensex?.change_percent ?? 0.54;
  const sensexIsPositive = senseChangeSafe(sensexChange);

  const vixPrice = vix?.current_price
    ? vix.current_price.toFixed(2)
    : "11.62";
  const vixChange = vix?.change_percent ?? -2.15;
  const vixIsPositive = vixChange >= 0;

  function senseChangeSafe(val: number | null | undefined) {
    return (val ?? 0) >= 0;
  }

  const isMarketOpen = marketStatus ? marketStatus.is_open : false;

  return (
    <header className="h-16 apple-liquid-header px-6 flex items-center justify-between sticky top-3 z-30 select-none shadow-xl mb-4">
      {/* Market Indices Ticker Bar */}
      <div className="flex items-center gap-3 overflow-x-auto py-1 text-xs relative z-10">
        {/* NIFTY 50 */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#111622]/90 border border-white/[0.05] shadow-sm backdrop-blur-sm transition-all">
          <span className="font-semibold text-gray-300">NIFTY 50</span>
          <span className="font-mono text-gray-100 font-medium">{niftyPrice}</span>
          <span
            className={`font-mono font-medium ${
              niftyIsPositive ? "text-emerald-400" : "text-rose-400"
            }`}
          >
            {niftyIsPositive ? "+" : ""}
            {niftyChange.toFixed(2)}%
          </span>
        </div>

        {/* SENSEX */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#111622]/90 border border-white/[0.05] shadow-sm backdrop-blur-sm hidden sm:flex transition-all">
          <span className="font-semibold text-gray-300">SENSEX</span>
          <span className="font-mono text-gray-100 font-medium">{sensexPrice}</span>
          <span
            className={`font-mono font-medium ${
              sensexIsPositive ? "text-emerald-400" : "text-rose-400"
            }`}
          >
            {sensexIsPositive ? "+" : ""}
            {sensexChange.toFixed(2)}%
          </span>
        </div>

        {/* INDIA VIX */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#111622]/90 border border-white/[0.05] shadow-sm backdrop-blur-sm hidden md:flex transition-all">
          <span className="font-semibold text-gray-300">INDIA VIX</span>
          <span className="font-mono text-gray-100 font-medium">{vixPrice}</span>
          <span
            className={`font-mono font-medium ${
              vixIsPositive ? "text-rose-400" : "text-emerald-400"
            }`}
          >
            {vixIsPositive ? "+" : ""}
            {vixChange.toFixed(2)}%
          </span>
        </div>

        {/* Live Status Pulse Badge */}
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-semibold border hidden lg:flex ${
            !isMarketOpen
              ? "bg-amber-500/10 text-amber-400 border-amber-500/25"
              : isPolling
              ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/25"
              : "bg-emerald-500/10 text-emerald-400 border-emerald-500/25"
          }`}
          title={
            marketStatus
              ? `Indian Market: ${marketStatus.status} (${marketStatus.current_time_ist})`
              : "Indian Market: CLOSED"
          }
        >
          <span className="relative flex h-2 w-2">
            {isMarketOpen && (
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  isPolling ? "bg-cyan-400" : "bg-emerald-400"
                }`}
              />
            )}
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${
                !isMarketOpen
                  ? "bg-amber-500"
                  : isPolling
                  ? "bg-cyan-400"
                  : "bg-emerald-500"
              }`}
            />
          </span>
          <span>{!isMarketOpen ? "CLOSED" : isPolling ? "SYNCING" : "LIVE 10s"}</span>
        </div>
      </div>

      {/* Header Actions */}
      <div className="flex items-center gap-3 relative z-10">
        {onOpenAddModal && (
          <Button
            variant="mint"
            size="sm"
            onClick={onOpenAddModal}
            className="hidden sm:inline-flex shadow-sm text-xs"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            <span>Add Holding</span>
          </Button>
        )}

        {onOpenQuickTrade && (
          <Button
            variant="primary"
            size="sm"
            onClick={onOpenQuickTrade}
            className="shadow-sm text-xs"
          >
            <Zap className="w-3.5 h-3.5 mr-1" />
            <span>Quick Trade</span>
          </Button>
        )}
      </div>
    </header>
  );
}

