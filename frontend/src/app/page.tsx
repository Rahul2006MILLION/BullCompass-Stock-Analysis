"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Header } from "@/components/layout/Header";
import { PortfolioSummaryCards } from "@/components/portfolio/PortfolioSummaryCards";
import { NetWorthAreaChart } from "@/components/charts/NetWorthAreaChart";
import { AllocationDonut } from "@/components/charts/AllocationDonut";
import { ProfitLossBarChart } from "@/components/charts/ProfitLossBarChart";
import { HoldingsGrid } from "@/components/portfolio/HoldingsGrid";
import { AddHoldingModal } from "@/components/portfolio/AddHoldingModal";
import { BuyModal } from "@/components/portfolio/BuyModal";
import { SellModal } from "@/components/portfolio/SellModal";
import { EditHoldingModal } from "@/components/portfolio/EditHoldingModal";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import { PortfolioSummary, PortfolioHistorySnapshot, HoldingItem } from "@/types/portfolio";
import { ArrowRight, Sparkles, RefreshCw } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const { error, success } = useToast();
  const [portfolio, setPortfolio] = useState<PortfolioSummary | null>(null);
  const [history, setHistory] = useState<PortfolioHistorySnapshot[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBuyModalOpen, setIsBuyModalOpen] = useState(false);
  const [isSellModalOpen, setIsSellModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedHolding, setSelectedHolding] = useState<HoldingItem | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [portfolioData, historyData] = await Promise.all([
        api.getPortfolio(),
        api.getPortfolioHistory(),
      ]);
      setPortfolio(portfolioData);
      setHistory(historyData);
    } catch (err: any) {
      error("Connection Error", err?.message || "Could not connect to BullCompass backend API.");
    } finally {
      setIsLoading(false);
    }
  }, [error]);

  useEffect(() => {
    fetchData();

    const handlePortfolioUpdate = () => {
      fetchData();
    };

    window.addEventListener("portfolio-updated", handlePortfolioUpdate);
    return () => {
      window.removeEventListener("portfolio-updated", handlePortfolioUpdate);
    };
  }, [fetchData]);

  // Modal action handlers
  const handleOpenBuy = (holding?: HoldingItem) => {
    setSelectedHolding(holding || null);
    setIsBuyModalOpen(true);
  };

  const handleOpenSell = (holding: HoldingItem) => {
    setSelectedHolding(holding);
    setIsSellModalOpen(true);
  };

  const handleOpenEdit = (holding: HoldingItem) => {
    setSelectedHolding(holding);
    setIsEditModalOpen(true);
  };

  const handleDeleteHolding = async (holding: HoldingItem) => {
    if (!holding.id) return;
    if (!confirm(`Are you sure you want to delete ${holding.ticker} from your portfolio?`)) return;

    try {
      await api.deleteHolding(holding.id);
      success("Holding Deleted", `${holding.ticker} removed from portfolio.`);
      fetchData();
    } catch (err: any) {
      error("Delete Failed", err?.message || "Failed to delete holding.");
    }
  };

  return (
    <>
      <Header
        onOpenAddModal={() => setIsAddModalOpen(true)}
        onOpenQuickTrade={() => handleOpenBuy()}
      />

      <div className="space-y-8">
        {/* Page Hero Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
              <span>Executive Dashboard</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-mono font-semibold">
                LIVE
              </span>
            </h1>
            <p className="text-xs text-gray-400 mt-1">
              Real-time portfolio valuation, weighted cost tracking, and algorithmic performance
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchData}
              className="text-xs"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1" />
              Sync Data
            </Button>
            <Button
              variant="mint"
              size="sm"
              onClick={() => setIsAddModalOpen(true)}
              className="text-xs"
            >
              Add Holding
            </Button>
          </div>
        </div>

        {/* 1. Hero Metric Cards */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
          <PortfolioSummaryCards
            netWorth={portfolio?.total_current_value || 0}
            invested={portfolio?.total_invested || 0}
            unrealizedProfit={portfolio?.total_unrealized_profit || 0}
            returnPercentage={portfolio?.total_return_percentage || 0}
            realizedProfit={portfolio?.total_realized_profit || 0}
            totalHoldings={portfolio?.total_holdings || 0}
            isLoading={isLoading}
          />
        </motion.div>

        {/* 2. Charts Section (Area History & Allocation Donut) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.45, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
          className="grid grid-cols-1 lg:grid-cols-12 gap-6"
        >
          {/* Performance Area Chart (7 cols) */}
          <Card className="lg:col-span-7 p-6">
            <NetWorthAreaChart data={history} isLoading={isLoading} />
          </Card>

          {/* Allocation Donut (5 cols) */}
          <Card className="lg:col-span-5 p-6">
            <AllocationDonut
              holdings={portfolio?.holdings || []}
              totalValue={portfolio?.total_current_value || 0}
            />
          </Card>
        </motion.div>

        {/* 3. Bar Chart & Quick Actions Row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.45, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="grid grid-cols-1 lg:grid-cols-12 gap-6"
        >
          {/* Profit / Loss Bar Chart */}
          <Card className="lg:col-span-7 p-6">
            <ProfitLossBarChart holdings={portfolio?.holdings || []} />
          </Card>

          {/* AI Terminal Spotlight Promo Card */}
          <Card className="lg:col-span-5 p-6 bg-gradient-to-br from-[#121824] via-[#0d121a] to-[#0a0d14] border-emerald-500/25 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white tracking-tight">
                AI Fundamental Analyst
              </h3>
              <p className="text-xs text-gray-300 leading-relaxed">
                Empowered by Ollama and live company financials. Generate institutional-grade investment memorandums on competitive moats, business health, and risks.
              </p>
            </div>

            <div className="pt-6">
              <Link href="/ai-analysis">
                <Button variant="primary" size="md" className="w-full">
                  <span>Launch AI Analyst</span>
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
              </Link>
            </div>
          </Card>
        </motion.div>

        {/* 4. Active Holdings Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.45, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-4 pt-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                Active Positions
              </h2>
              <p className="text-xs text-gray-400">
                Manage stock holdings, execute buy/sell orders, and track profit margins
              </p>
            </div>
            <Link
              href="/portfolio"
              className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1"
            >
              <span>View Full Terminal</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <HoldingsGrid
            holdings={portfolio?.holdings || []}
            onBuy={handleOpenBuy}
            onSell={handleOpenSell}
            onEdit={handleOpenEdit}
            onDelete={handleDeleteHolding}
            onAddNew={() => setIsAddModalOpen(true)}
            isLoading={isLoading}
          />
        </motion.div>
      </div>

      {/* Interactive Modals */}
      <AddHoldingModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={fetchData}
      />

      <BuyModal
        isOpen={isBuyModalOpen}
        onClose={() => setIsBuyModalOpen(false)}
        onSuccess={fetchData}
        initialHolding={selectedHolding}
      />

      <SellModal
        isOpen={isSellModalOpen}
        onClose={() => setIsSellModalOpen(false)}
        onSuccess={fetchData}
        holding={selectedHolding}
      />

      <EditHoldingModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={fetchData}
        holding={selectedHolding}
      />
    </>
  );
}
