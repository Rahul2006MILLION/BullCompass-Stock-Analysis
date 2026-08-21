"use client";

import React from "react";
import { PortfolioContext } from "@/types/research";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import {
  Briefcase,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  PieChart,
  ShieldAlert,
  CheckCircle2,
  Layers,
} from "lucide-react";

interface PortfolioContextCardProps {
  portfolio?: PortfolioContext;
  ticker: string;
}

export function PortfolioContextCard({ portfolio, ticker }: PortfolioContextCardProps) {
  if (!portfolio) return null;

  const isOwned = portfolio.is_owned;
  const pnl = portfolio.unrealized_pnl ?? 0;
  const pnlPct = portfolio.unrealized_pnl_pct ?? 0;
  const isProfit = pnl >= 0;

  const getActionBadgeColor = (action: string) => {
    switch (action.toUpperCase()) {
      case "BUY MORE":
      case "BUY":
        return "bg-emerald-500/20 text-emerald-300 border-emerald-500/40";
      case "HOLD":
        return "bg-amber-500/20 text-amber-300 border-amber-500/40";
      case "REDUCE":
      case "SELL":
        return "bg-rose-500/20 text-rose-300 border-rose-500/40";
      default:
        return "bg-gray-500/20 text-gray-300 border-gray-500/40";
    }
  };

  return (
    <Card className="p-5 bg-gradient-to-r from-[#0d1422] via-[#0e1626] to-[#0d1422] border-white/10 shadow-xl space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/8">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
            <Briefcase className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2 font-mono">
              Portfolio Position & Risk Overlay
            </h3>
            <p className="text-xs text-gray-400">
              {isOwned
                ? `Active holding in BullCompass portfolio (${portfolio.quantity} shares)`
                : "Not currently held in your portfolio"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <span className="text-xs text-gray-400 font-mono">Portfolio Stance:</span>
          <span
            className={`px-3 py-1 rounded-lg border text-xs font-mono font-bold uppercase tracking-wider ${getActionBadgeColor(
              portfolio.recommended_action
            )}`}
          >
            {portfolio.recommended_action}
          </span>
        </div>
      </div>

      {/* Stats Grid (Only if owned) */}
      {isOwned ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-xl bg-black/30 border border-white/6 space-y-1">
            <span className="text-[11px] text-gray-400 font-mono block">Holding Quantity</span>
            <span className="text-sm font-bold font-mono text-white">
              {portfolio.quantity} Shares
            </span>
            <span className="text-[10px] text-gray-500 font-mono block">
              Avg: ₹{portfolio.average_buy_price?.toFixed(2)}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-black/30 border border-white/6 space-y-1">
            <span className="text-[11px] text-gray-400 font-mono block">Current Position Value</span>
            <span className="text-sm font-bold font-mono text-white">
              ₹{portfolio.current_value?.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[10px] text-gray-500 font-mono block">
              Invested: ₹{portfolio.invested_value?.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-black/30 border border-white/6 space-y-1">
            <span className="text-[11px] text-gray-400 font-mono block">Unrealized P&L</span>
            <span
              className={`text-sm font-bold font-mono flex items-center gap-1 ${
                isProfit ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              {isProfit ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
              {isProfit ? "+" : ""}₹{pnl.toLocaleString("en-IN", { minimumFractionDigits: 2 })} ({pnlPct > 0 ? "+" : ""}{pnlPct}%)
            </span>
            <span className="text-[10px] text-gray-500 font-mono block">Live mark-to-market</span>
          </div>

          <div className="p-3 rounded-xl bg-black/30 border border-white/6 space-y-1">
            <span className="text-[11px] text-gray-400 font-mono block flex items-center gap-1">
              <PieChart className="w-3 h-3 text-cyan-400" />
              Portfolio Weight
            </span>
            <span className="text-sm font-bold font-mono text-cyan-300">
              {portfolio.portfolio_allocation_pct ?? 0}%
            </span>
            {portfolio.concentration_risk_flag ? (
              <span className="text-[10px] text-rose-400 font-mono font-semibold flex items-center gap-1">
                <AlertTriangle className="w-2.5 h-2.5" /> Concentration Risk (≥20%)
              </span>
            ) : (
              <span className="text-[10px] text-emerald-400 font-mono block">
                Healthy diversification
              </span>
            )}
          </div>
        </div>
      ) : (
        <div className="p-3.5 rounded-xl bg-white/3 border border-white/6 flex items-start gap-3">
          <Layers className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="text-xs font-semibold text-gray-200 font-mono">
              Unowned Opportunity: Available for Fresh Portfolio Allocation
            </p>
            <p className="text-xs text-gray-400">
              This stock is not currently part of your holdings. Adding it will calculate portfolio weights and allocation risk in real time.
            </p>
          </div>
        </div>
      )}

      {/* Action Reasoning */}
      <div className="p-3 rounded-xl bg-black/25 border border-white/6 text-xs text-gray-300 font-mono flex items-start gap-2">
        <span className="text-gray-500 font-bold uppercase tracking-wider text-[10px] flex-shrink-0 mt-0.5">
          Rationale:
        </span>
        <span className="leading-relaxed">{portfolio.action_reasoning}</span>
      </div>
    </Card>
  );
}
