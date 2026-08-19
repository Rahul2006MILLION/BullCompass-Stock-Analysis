"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { Header } from "@/components/layout/Header";
import { HoldingsGrid } from "@/components/portfolio/HoldingsGrid";
import { AddHoldingModal } from "@/components/portfolio/AddHoldingModal";
import { BuyModal } from "@/components/portfolio/BuyModal";
import { SellModal } from "@/components/portfolio/SellModal";
import { EditHoldingModal } from "@/components/portfolio/EditHoldingModal";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { api } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import { useLiveQuotes } from "@/lib/useLiveQuotes";
import { QuoteItem, MarketStatus } from "@/types/market";
import { PortfolioSummary, HoldingItem } from "@/types/portfolio";
import { formatCurrency, formatPercentage } from "@/lib/utils";
import { Briefcase, Plus, RefreshCw, Layers, Activity } from "lucide-react";

export default function PortfolioPage() {
  const { error, success } = useToast();
  const [portfolio, setPortfolio] = useState<PortfolioSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBuyModalOpen, setIsBuyModalOpen] = useState(false);
  const [isSellModalOpen, setIsSellModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedHolding, setSelectedHolding] = useState<HoldingItem | null>(null);

  const holdingTickers = useMemo(() => {
    return portfolio?.holdings?.map((h) => h.ticker) || [];
  }, [portfolio?.holdings]);

  const fetchPortfolio = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await api.getPortfolio();
      setPortfolio(data);
    } catch (err: any) {
      error("Connection Error", err?.message || "Failed to load portfolio data.");
    } finally {
      setIsLoading(false);
    }
  }, [error]);

  const handleQuotesUpdated = useCallback((quotesMap: Record<string, QuoteItem>, status?: MarketStatus | null) => {
    // Only re-fetch backend canonical valuation when market is actively OPEN
    if (status?.is_open) {
      fetchPortfolio();
    }
  }, [fetchPortfolio]);

  const { isPolling, syncNow, lastSyncTime } = useLiveQuotes({
    tickers: holdingTickers,
    intervalMs: 10000,
    onQuotesUpdated: handleQuotesUpdated,
  });

  useEffect(() => {
    fetchPortfolio();
  }, [fetchPortfolio]);

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
    if (!confirm(`Are you sure you want to remove ${holding.ticker} from your portfolio?`)) return;

    try {
      await api.deleteHolding(holding.id);
      success("Holding Deleted", `${holding.ticker} was successfully deleted.`);
      fetchPortfolio();
    } catch (err: any) {
      error("Delete Failed", err?.message || "Could not delete holding.");
    }
  };

  const isPositive = (portfolio?.total_unrealized_profit || 0) >= 0;

  return (
    <>
      <Header
        onOpenAddModal={() => setIsAddModalOpen(true)}
        onOpenQuickTrade={() => handleOpenBuy()}
      />

      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <Briefcase className="w-6 h-6 text-emerald-400" />
              <span>Portfolio Terminal</span>
            </h1>
            <p className="text-xs text-gray-400 mt-1">
              Active stock positions, live valuations, and automated weighted-average cost accounting
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={syncNow}
              disabled={isPolling}
              className="text-xs border-white/10 hover:border-white/20"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1 ${isPolling ? "animate-spin text-emerald-400" : ""}`} />
              {isPolling ? "Syncing..." : "Sync Quotes"}
            </Button>
            <Button variant="primary" size="sm" onClick={() => setIsAddModalOpen(true)} className="text-xs">
              <Plus className="w-4 h-4 mr-1" />
              Add Holding
            </Button>
          </div>
        </div>

        {/* Portfolio Summary Strip */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          <div className="p-4 rounded-2xl bg-[#0d121a] border border-white/8">
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">
              Holdings Count
            </span>
            <span className="text-xl font-bold font-mono text-white mt-1 block">
              {portfolio?.total_holdings || 0} Assets
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-[#0d121a] border border-white/8">
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">
              Total Invested
            </span>
            <span className="text-xl font-bold font-mono text-white mt-1 block">
              {formatCurrency(portfolio?.total_invested)}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-[#0d121a] border border-white/8">
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">
              Current Market Value
            </span>
            <span className="text-xl font-bold font-mono text-emerald-400 mt-1 block">
              {formatCurrency(portfolio?.total_current_value)}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-[#0d121a] border border-white/8">
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">
              Total Unrealized P&L
            </span>
            <span
              className={`text-xl font-bold font-mono mt-1 block ${
                isPositive ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              {formatCurrency(portfolio?.total_unrealized_profit)} (
              {formatPercentage(portfolio?.total_return_percentage)})
            </span>
          </div>
        </motion.div>

        {/* Holdings Grid & Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.1 }}
          transition={{ duration: 0.45, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
        >
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

      {/* Modals */}
      <AddHoldingModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={fetchPortfolio}
      />
      <BuyModal
        isOpen={isBuyModalOpen}
        onClose={() => setIsBuyModalOpen(false)}
        onSuccess={fetchPortfolio}
        initialHolding={selectedHolding}
      />
      <SellModal
        isOpen={isSellModalOpen}
        onClose={() => setIsSellModalOpen(false)}
        onSuccess={fetchPortfolio}
        holding={selectedHolding}
      />
      <EditHoldingModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={fetchPortfolio}
        holding={selectedHolding}
      />
    </>
  );
}
