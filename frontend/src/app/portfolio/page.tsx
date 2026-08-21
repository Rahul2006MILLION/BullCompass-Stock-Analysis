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

  const fetchPortfolio = useCallback(async (silent = false) => {
    try {
      if (!silent) {
        setIsLoading(true);
      }
      const data = await api.getPortfolio();
      setPortfolio(data);
    } catch (err: any) {
      if (!silent) {
        error("Connection Error", err?.message || "Failed to load portfolio data.");
      }
    } finally {
      if (!silent) {
        setIsLoading(false);
      }
    }
  }, [error]);

  // Live quotes polling - updates only in-memory quotes map, never triggers full reload/skeletons
  const { quotes, isPolling, syncNow, lastSyncTime } = useLiveQuotes({
    tickers: holdingTickers,
    intervalMs: 10000,
  });

  // Dynamically compute live valuations whenever live quotes or static portfolio holdings update
  const dynamicPortfolio = useMemo(() => {
    if (!portfolio) return null;

    let calculatedInvested = 0;
    let calculatedCurrentValue = 0;

    const dynamicHoldings: HoldingItem[] = (portfolio.holdings || []).map((h) => {
      const cleanTicker = h.ticker.trim().toUpperCase();
      const quote = quotes[cleanTicker] || quotes[h.ticker];
      const livePrice = quote?.current_price && quote.current_price > 0 ? quote.current_price : null;
      const currentPrice = livePrice ?? h.current_price ?? h.average_buy_price;

      const invested = h.invested != null ? Number(h.invested) : Math.round(h.quantity * h.average_buy_price * 100) / 100;
      const currentValue = Math.round(h.quantity * currentPrice * 100) / 100;
      const profit = Math.round((currentValue - invested) * 100) / 100;
      const returns = invested > 0 ? Math.round((profit / invested) * 10000) / 100 : 0;

      calculatedInvested += invested;
      calculatedCurrentValue += currentValue;

      return {
        ...h,
        current_price: currentPrice,
        invested,
        current_value: currentValue,
        profit,
        returns,
      };
    });

    const totalInvested = Math.round(calculatedInvested * 100) / 100;
    const totalCurrentValue = Math.round(calculatedCurrentValue * 100) / 100;
    const totalUnrealizedProfit = Math.round((totalCurrentValue - totalInvested) * 100) / 100;
    const totalReturnPercentage = totalInvested > 0 ? Math.round((totalUnrealizedProfit / totalInvested) * 10000) / 100 : 0;

    return {
      ...portfolio,
      total_holdings: dynamicHoldings.length,
      total_invested: totalInvested,
      total_current_value: totalCurrentValue,
      total_unrealized_profit: totalUnrealizedProfit,
      total_return_percentage: totalReturnPercentage,
      holdings: dynamicHoldings,
    };
  }, [portfolio, quotes]);

  useEffect(() => {
    fetchPortfolio(false);

    const handlePortfolioUpdate = () => {
      // Triggered when a new snapshot is recorded or portfolio changes externally
      fetchPortfolio(true);
    };

    window.addEventListener("portfolio-updated", handlePortfolioUpdate);
    return () => {
      window.removeEventListener("portfolio-updated", handlePortfolioUpdate);
    };
  }, [fetchPortfolio]);

  const handleManualSync = async () => {
    try {
      await syncNow();
      await fetchPortfolio(true);
      success("Quotes Synced", "Live quotes and portfolio valuations updated.");
    } catch (err: any) {
      error("Sync Error", err?.message || "Failed to sync quotes.");
    }
  };

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
      fetchPortfolio(true);
    } catch (err: any) {
      error("Delete Failed", err?.message || "Could not delete holding.");
    }
  };

  const isPositive = (dynamicPortfolio?.total_unrealized_profit || 0) >= 0;

  return (
    <>
      <Header
        onOpenAddModal={() => setIsAddModalOpen(true)}
        onOpenQuickTrade={() => handleOpenBuy()}
      />

      <div className="space-y-6 select-none">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.06] pb-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_rgba(111,227,166,0.8)]" />
            <span className="text-[11px] font-mono tracking-widest text-emerald-400 uppercase font-semibold">
              PORTFOLIO ACCOUNTING · WEIGHTED-AVERAGE COST BASIS
            </span>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs">
            <Button
              variant="outline"
              size="sm"
              onClick={handleManualSync}
              disabled={isPolling}
              className="border-white/10 hover:border-white/20 py-1"
            >
              <RefreshCw className={`w-3 h-3 mr-1 ${isPolling ? "animate-spin text-emerald-400" : ""}`} />
              {isPolling ? "10s Polling..." : "Sync Quotes"}
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsAddModalOpen(true)}
              className="font-semibold py-1 bg-emerald-500 text-black hover:bg-emerald-400"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              Add Holding
            </Button>
          </div>
        </div>

        {/* Portfolio Summary Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-4 rounded-xl editorial-frame editorial-frame-hover space-y-1">
            <span className="text-[10px] font-mono text-gray-400 uppercase tracking-widest block">
              HOLDINGS COUNT
            </span>
            <span className="text-xl sm:text-2xl font-light font-mono text-white mt-1 block">
              {dynamicPortfolio?.total_holdings || 0} <span className="text-xs text-gray-500 font-sans">Assets</span>
            </span>
          </div>

          <div className="p-5 rounded-xl editorial-frame editorial-frame-hover">
            <span className="text-[10px] font-mono text-gray-400 uppercase tracking-widest block">
              TOTAL INVESTED
            </span>
            <span className="text-2xl font-light font-mono text-white mt-1.5 block">
              {formatCurrency(dynamicPortfolio?.total_invested)}
            </span>
          </div>

          <div className="p-5 rounded-xl editorial-frame editorial-frame-hover">
            <span className="text-[10px] font-mono text-gray-400 uppercase tracking-widest block">
              CURRENT MARKET VALUE
            </span>
            <span className="text-2xl font-light font-mono text-emerald-400 mt-1.5 block">
              {formatCurrency(dynamicPortfolio?.total_current_value)}
            </span>
          </div>

          <div className="p-5 rounded-xl editorial-frame editorial-frame-hover">
            <span className="text-[10px] font-mono text-gray-400 uppercase tracking-widest block">
              TOTAL UNREALIZED P&L
            </span>
            <span
              className={`text-2xl font-light font-mono mt-1.5 block ${
                isPositive ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              {formatCurrency(dynamicPortfolio?.total_unrealized_profit)}{" "}
              <span className="text-xs font-semibold">
                ({formatPercentage(dynamicPortfolio?.total_return_percentage)})
              </span>
            </span>
          </div>
        </div>

        {/* Holdings Grid & Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.1 }}
          transition={{ duration: 0.45, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
        >
          <HoldingsGrid
            holdings={dynamicPortfolio?.holdings || []}
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
        onSuccess={() => fetchPortfolio(true)}
      />
      <BuyModal
        isOpen={isBuyModalOpen}
        onClose={() => setIsBuyModalOpen(false)}
        onSuccess={() => fetchPortfolio(true)}
        initialHolding={selectedHolding}
      />
      <SellModal
        isOpen={isSellModalOpen}
        onClose={() => setIsSellModalOpen(false)}
        onSuccess={() => fetchPortfolio(true)}
        holding={selectedHolding}
      />
      <EditHoldingModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={() => fetchPortfolio(true)}
        holding={selectedHolding}
      />
    </>
  );
}

