"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Header } from "@/components/layout/Header";
import { WatchlistStockCard } from "@/components/watchlist/WatchlistStockCard";
import { AddWatchlistModal } from "@/components/watchlist/AddWatchlistModal";
import { BuyModal } from "@/components/portfolio/BuyModal";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { api } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import { WatchlistItem } from "@/types/watchlist";
import { HoldingItem } from "@/types/portfolio";
import {
  Star,
  Plus,
  RefreshCw,
  Search,
  Briefcase,
  TrendingUp,
  TrendingDown,
  Layers,
  AlertCircle,
} from "lucide-react";

export default function WatchlistPage() {
  const { error, success } = useToast();
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMode, setFilterMode] = useState<"ALL" | "GAINERS" | "LOSERS" | "OWNED">("ALL");

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBuyModalOpen, setIsBuyModalOpen] = useState(false);
  const [selectedBuyHolding, setSelectedBuyHolding] = useState<HoldingItem | null>(null);

  const fetchWatchlist = useCallback(async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      const response = await api.getWatchlist();
      setItems(response.items || []);
    } catch (err: any) {
      error("Connection Error", err?.message || "Failed to load watchlist data.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [error]);

  useEffect(() => {
    fetchWatchlist();
  }, [fetchWatchlist]);

  const handleRemove = async (ticker: string) => {
    try {
      await api.removeFromWatchlist(ticker);
      success("Removed", `Stock '${ticker}' was removed from your watchlist.`);
      setItems((prev) => prev.filter((i) => i.ticker !== ticker));
    } catch (err: any) {
      error("Removal Failed", err?.message || "Could not remove stock from watchlist.");
    }
  };

  const handleBuy = (ticker: string, price: number | null) => {
    setSelectedBuyHolding({
      id: null,
      ticker,
      quantity: 1,
      average_buy_price: price || 0,
      current_price: price || 0,
      invested: null,
      current_value: null,
      profit: null,
      returns: null,
    });
    setIsBuyModalOpen(true);
  };

  // Filtered Items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch =
        item.ticker.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.company_name.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (filterMode === "GAINERS") return (item.change ?? 0) > 0;
      if (filterMode === "LOSERS") return (item.change ?? 0) < 0;
      if (filterMode === "OWNED") return item.is_owned;

      return true;
    });
  }, [items, searchQuery, filterMode]);

  // Summary Metrics
  const metrics = useMemo(() => {
    const total = items.length;
    const gainers = items.filter((i) => (i.change ?? 0) > 0).length;
    const losers = items.filter((i) => (i.change ?? 0) < 0).length;
    const owned = items.filter((i) => i.is_owned).length;
    return { total, gainers, losers, owned };
  }, [items]);

  return (
    <>
      <Header />

      <div className="space-y-6">
        {/* Page Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.05] pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Star className="w-4 h-4 fill-emerald-400/20" />
              </div>
              <h1 className="text-2xl font-bold text-white tracking-tight">
                Watchlist
              </h1>
            </div>
            <p className="text-sm text-gray-400">
              Track stocks you&apos;re interested in
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchWatchlist(true)}
              disabled={isLoading || isRefreshing}
              className="bg-[#141a24]/90 hover:bg-[#1a2230] border-white/[0.08] hover:border-white/[0.15] text-gray-300 text-xs shadow-sm"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 mr-2 text-emerald-400 ${
                  isRefreshing ? "animate-spin" : ""
                }`}
              />
              {isRefreshing ? "Refreshing..." : "Refresh Quotes"}
            </Button>

            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsAddModalOpen(true)}
              className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs shadow-lg shadow-emerald-500/20"
            >
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              Add Stock
            </Button>
          </div>
        </div>

        {/* Overview Stat Badges */}
        {items.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="liquid-metric-shell">
              <div className="liquid-metric-inner flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-[11px] font-mono text-gray-400 uppercase tracking-wider">
                    Total Tracked
                  </span>
                  <p className="text-xl font-bold text-white font-mono">{metrics.total}</p>
                </div>
                <div className="p-2 rounded-xl bg-white/[0.04] border border-white/[0.06] text-gray-300">
                  <Layers className="w-4 h-4" />
                </div>
              </div>
            </div>

            <div className="liquid-metric-shell">
              <div className="liquid-metric-inner flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-[11px] font-mono text-gray-400 uppercase tracking-wider">
                    Today Gainers
                  </span>
                  <p className="text-xl font-bold text-emerald-400 font-mono">
                    {metrics.gainers}
                  </p>
                </div>
                <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
            </div>

            <div className="liquid-metric-shell">
              <div className="liquid-metric-inner flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-[11px] font-mono text-gray-400 uppercase tracking-wider">
                    Today Losers
                  </span>
                  <p className="text-xl font-bold text-rose-400 font-mono">
                    {metrics.losers}
                  </p>
                </div>
                <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
                  <TrendingDown className="w-4 h-4" />
                </div>
              </div>
            </div>

            <div className="liquid-metric-shell">
              <div className="liquid-metric-inner flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-[11px] font-mono text-gray-400 uppercase tracking-wider">
                    In Portfolio
                  </span>
                  <p className="text-xl font-bold text-teal-400 font-mono">
                    {metrics.owned}
                  </p>
                </div>
                <div className="p-2 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400">
                  <Briefcase className="w-4 h-4" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filter & Search Bar */}
        {items.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#0d121a]/90 p-3 rounded-2xl border border-white/[0.06] shadow-sm">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
              <Input
                type="text"
                placeholder="Search watchlist symbols..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-[#141a24] border-white/[0.08] focus:border-emerald-500/30 text-xs text-white rounded-xl"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
              {(
                [
                  { key: "ALL", label: `All (${metrics.total})` },
                  { key: "GAINERS", label: `Gainers (${metrics.gainers})` },
                  { key: "LOSERS", label: `Losers (${metrics.losers})` },
                  { key: "OWNED", label: `Owned (${metrics.owned})` },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setFilterMode(tab.key)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                    filterMode === tab.key
                      ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-semibold"
                      : "text-gray-400 hover:text-gray-200 hover:bg-white/[0.04] border border-transparent"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Content Section: Loading, Empty, or Stock Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="h-56 bg-[#0d121a]/60 rounded-2xl border border-white/5 animate-pulse p-5 space-y-4"
              >
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <div className="w-24 h-5 bg-white/10 rounded" />
                    <div className="w-36 h-3.5 bg-white/5 rounded" />
                  </div>
                  <div className="w-8 h-8 bg-white/5 rounded-lg" />
                </div>
                <div className="h-16 bg-white/5 rounded-xl mt-4" />
                <div className="h-9 bg-white/5 rounded-lg mt-4" />
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          /* Empty Watchlist State */
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-white/10 rounded-2xl bg-[#0d121a]/40 space-y-4 my-8"
          >
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/10">
              <Star className="w-7 h-7 fill-emerald-400/20" />
            </div>
            <div className="space-y-1 max-w-sm">
              <h3 className="text-lg font-bold text-white">Your Watchlist is empty</h3>
              <p className="text-sm text-gray-400">
                Add stocks you&apos;re interested in tracking.
              </p>
            </div>
            <Button
              variant="primary"
              onClick={() => setIsAddModalOpen(true)}
              className="bg-emerald-500 hover:bg-emerald-600 text-black font-semibold text-xs py-2.5 px-5 shadow-lg shadow-emerald-500/20 mt-2"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Stock
            </Button>
          </motion.div>
        ) : filteredItems.length === 0 ? (
          /* Search / Filter Empty State */
          <div className="flex flex-col items-center justify-center p-10 text-center border border-white/5 rounded-xl bg-[#0d121a]/40 space-y-2">
            <AlertCircle className="w-6 h-6 text-gray-500" />
            <p className="text-sm text-gray-300 font-semibold">No matching stocks found</p>
            <p className="text-xs text-gray-500">
              Try adjusting your search query or active filter.
            </p>
          </div>
        ) : (
          /* Watchlist Stocks Grid */
          <motion.div
            layout
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            <AnimatePresence>
              {filteredItems.map((item) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  <WatchlistStockCard
                    item={item}
                    onRemove={handleRemove}
                    onBuy={handleBuy}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      {/* Add Stock Modal */}
      <AddWatchlistModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => fetchWatchlist()}
      />

      {/* Buy Stock Modal */}
      <BuyModal
        isOpen={isBuyModalOpen}
        onClose={() => setIsBuyModalOpen(false)}
        onSuccess={() => {
          setIsBuyModalOpen(false);
          fetchWatchlist();
        }}
        initialHolding={selectedBuyHolding}
      />
    </>
  );
}
