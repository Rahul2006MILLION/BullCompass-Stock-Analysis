"use client";

import React from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { AnimatedNumber } from "@/components/common/AnimatedNumber";
import { formatCurrency, formatPercentage } from "@/lib/utils";
import {
  Wallet,
  TrendingUp,
  PiggyBank,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { motion } from "framer-motion";

interface PortfolioSummaryCardsProps {
  netWorth: number;
  invested: number;
  unrealizedProfit: number;
  returnPercentage: number;
  realizedProfit: number;
  totalHoldings: number;
  isLoading?: boolean;
}

export function PortfolioSummaryCards({
  netWorth,
  invested,
  unrealizedProfit,
  returnPercentage,
  realizedProfit,
  totalHoldings,
  isLoading = false,
}: PortfolioSummaryCardsProps) {
  const isUnrealizedPositive = unrealizedProfit >= 0;
  const isRealizedPositive = realizedProfit >= 0;

  const cardVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.08,
        duration: 0.4,
        ease: [0.16, 1, 0.3, 1],
      },
    }),
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 select-none">
      {/* 1. Net Worth Card */}
      <motion.div custom={0} initial="hidden" animate="visible" variants={cardVariants}>
        <Card
          glow="mint"
          className="bg-gradient-to-br from-[#0e1620] via-[#0c121a] to-[#090c12] border-emerald-500/20"
        >
          <div className="flex items-center justify-between text-gray-400 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              Total Net Worth
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Wallet className="w-4 h-4" />
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-2xl font-bold tracking-tight text-white font-mono">
              <AnimatedNumber value={netWorth} />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <Badge variant={isUnrealizedPositive ? "mint" : "coral"} size="sm" dot>
                {formatPercentage(returnPercentage)}
              </Badge>
              <span className="text-xs text-gray-400">({totalHoldings} assets)</span>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* 2. Total Invested */}
      <motion.div custom={1} initial="hidden" animate="visible" variants={cardVariants}>
        <Card className="bg-gradient-to-br from-[#10141e] via-[#0c121a] to-[#090c12]">
          <div className="flex items-center justify-between text-gray-400 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              Total Invested
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <PiggyBank className="w-4 h-4" />
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-2xl font-bold tracking-tight text-white font-mono">
              <AnimatedNumber value={invested} />
            </div>
            <p className="text-xs text-gray-400 pt-1">Principal Capital Deployed</p>
          </div>
        </Card>
      </motion.div>

      {/* 3. Unrealized Returns */}
      <motion.div custom={2} initial="hidden" animate="visible" variants={cardVariants}>
        <Card
          glow={isUnrealizedPositive ? "mint" : "coral"}
          className="bg-gradient-to-br from-[#10141e] via-[#0c121a] to-[#090c12]"
        >
          <div className="flex items-center justify-between text-gray-400 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              Unrealized P&L
            </span>
            <div
              className={`w-8 h-8 rounded-xl border flex items-center justify-center ${
                isUnrealizedPositive
                  ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
                  : "bg-rose-500/15 border-rose-500/30 text-rose-400"
              }`}
            >
              {isUnrealizedPositive ? (
                <ArrowUpRight className="w-4 h-4" />
              ) : (
                <ArrowDownRight className="w-4 h-4" />
              )}
            </div>
          </div>

          <div className="space-y-1">
            <div
              className={`text-2xl font-bold tracking-tight font-mono ${
                isUnrealizedPositive ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              <AnimatedNumber value={unrealizedProfit} />
            </div>
            <p className="text-xs text-gray-400 pt-1">
              Overall Return:{" "}
              <span className={isUnrealizedPositive ? "text-emerald-400" : "text-rose-400"}>
                {formatPercentage(returnPercentage)}
              </span>
            </p>
          </div>
        </Card>
      </motion.div>

      {/* 4. Realized Profit */}
      <motion.div custom={3} initial="hidden" animate="visible" variants={cardVariants}>
        <Card className="bg-gradient-to-br from-[#10141e] via-[#0c121a] to-[#090c12]">
          <div className="flex items-center justify-between text-gray-400 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              Realized P&L
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>

          <div className="space-y-1">
            <div
              className={`text-2xl font-bold tracking-tight font-mono ${
                isRealizedPositive ? "text-purple-300" : "text-rose-400"
              }`}
            >
              <AnimatedNumber value={realizedProfit} />
            </div>
            <p className="text-xs text-gray-400 pt-1">Booked from Closed Positions</p>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
