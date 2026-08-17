"use client";

import React from "react";
import { Plus, TrendingUp, Search, Zap } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface HeaderProps {
  onOpenAddModal?: () => void;
  onOpenQuickTrade?: () => void;
}

export function Header({ onOpenAddModal, onOpenQuickTrade }: HeaderProps) {
  return (
    <header className="h-16 border-b border-white/8 bg-[#090c12]/80 backdrop-blur-xl px-8 flex items-center justify-between sticky top-0 z-30 select-none">
      {/* Market Indices Ticker Bar */}
      <div className="flex items-center gap-6 overflow-x-auto py-1 text-xs">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#111622] border border-white/6">
          <span className="font-semibold text-gray-300">NIFTY 50</span>
          <span className="font-mono text-gray-100">24,850.30</span>
          <span className="text-emerald-400 font-mono font-medium">+0.68%</span>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#111622] border border-white/6 hidden sm:flex">
          <span className="font-semibold text-gray-300">SENSEX</span>
          <span className="font-mono text-gray-100">81,340.15</span>
          <span className="text-emerald-400 font-mono font-medium">+0.54%</span>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#111622] border border-white/6 hidden md:flex">
          <span className="font-semibold text-gray-300">INDIA VIX</span>
          <span className="font-mono text-gray-100">13.20</span>
          <span className="text-rose-400 font-mono font-medium">-2.15%</span>
        </div>
      </div>

      {/* Header Actions */}
      <div className="flex items-center gap-3">
        {onOpenAddModal && (
          <Button
            variant="mint"
            size="sm"
            onClick={onOpenAddModal}
            className="hidden sm:inline-flex"
          >
            <Plus className="w-4 h-4 mr-1" />
            <span>Add Holding</span>
          </Button>
        )}

        {onOpenQuickTrade && (
          <Button
            variant="primary"
            size="sm"
            onClick={onOpenQuickTrade}
          >
            <Zap className="w-4 h-4 mr-1" />
            <span>Quick Trade</span>
          </Button>
        )}
      </div>
    </header>
  );
}
