"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Header } from "@/components/layout/Header";
import { PageHeader } from "@/components/layout/PageHeader";
import { WatchlistStockCard } from "@/components/watchlist/WatchlistStockCard";
import { AddWatchlistModal } from "@/components/watchlist/AddWatchlistModal";
import { BuyModal } from "@/components/portfolio/BuyModal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { api } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import { useLiveQuotes } from "@/lib/useLiveQuotes";
import { QuoteItem, MarketStatus } from "@/types/market";
import { WatchlistItem } from "@/types/watchlist";
import { HoldingItem } from "@/types/portfolio";
import { formatCurrency } from "@/lib/utils";
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
  Activity,
  Sparkles,
  LayoutGrid,
  Table as TableIcon,
} from "lucide-react";
import Link from "next/link";

export default function WatchlistPage() {
  const { error, success } = useToast();
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"GRID" | "TABLE">("TABLE");

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMode, setFilterMode] = useState<"ALL" | "GAINERS" | "LOSERS" | "OWNED">("ALL");

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBuyModalOpen, setIsBuyModalOpen] = useState(false);
  const [selectedBuyHolding, setSelectedBuyHolding] = useState<HoldingItem | null>(null);

  const watchlistTickers = useMemo(() => {
    return items.map((i) => i.ticker);
  }, [items]);

  const handleQuotesUpdated = useCallback((quotesMap: Record<string, QuoteItem>, status?: MarketStatus | null) => {
    if (status && !status.is_open) {
      return;
    }

    setItems((prevItems) => {
      if (!prevItems || prevItems.length === 0) return prevItems;

      let changed = false;
      const updated = prevItems.map((item) => {
        const quote = quotesMap[item.ticker.toUpperCase()];
        if (quote && quote.current_price !== null && quote.current_price > 0 && quote.current_price !== item.current_price) {
          changed = true;
          return {
            ...item,
            current_price: quote.current_price,
            change: quote.change ?? item.change,
            change_percent: quote.change_percent ?? item.change_percent,
          };
        }
        return item;
      });

      return changed ? updated : prevItems;
    });
  }, []);

  const { isPolling, syncNow } = useLiveQuotes({
    tickers: watchlistTickers,
    intervalMs: 10000,
    onQuotesUpdated: handleQuotesUpdated,
  });

  const fetchWatchlist = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await api.getWatchlist();
      setItems(response.items || []);
    } catch (err: any) {
      error("Connection Error", err?.message || "Failed to load watchlist data.");
    } finally {
      setIsLoading(false);
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

      <div className="space-y-6 select-none">
        {/* Top Header */}
        <PageHeader
          eyebrow="EQUITY RADAR · RESEARCH WATCHLIST"
          actions={
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={syncNow}
                disabled={isPolling}
                className="font-mono text-xs border-white/[0.08] hover:border-white/[0.15] text-gray-300"
              >
                <RefreshCw className={`w-3.5 h-3.5 mr-1.5 text-emerald-400 ${isPolling ? "animate-spin" : ""}`} />
                {isPolling ? "10s Polling..." : "Sync Quotes"}
              </Button>

              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsAddModalOpen(true)}
                className="font-mono text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-black shadow-md shadow-emerald-500/20"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Add Stock
              </Button>
            </>
          }
        />

        {/* Telemetry Stat Strips */}
        {items.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl editorial-frame editorial-frame-hover space-y-1">
              <span className="text-[10px] font-mono text-gray-400 uppercase tracking-widest block">
                TOTAL TRACKED
              </span>
              <p className="text-2xl font-light text-white font-mono">{metrics.total} <span className="text-xs text-gray-500 font-sans">Assets</span></p>
            </div>

            <div className="p-4 rounded-xl editorial-frame editorial-frame-hover space-y-1">
              <span className="text-[10px] font-mono text-gray-400 uppercase tracking-widest block">
                SESSION GAINERS
              </span>
              <p className="text-2xl font-light text-emerald-400 font-mono">
                {metrics.gainers} <span className="text-xs text-emerald-500/70 font-sans">Up</span>
              </p>
            </div>

            <div className="p-4 rounded-xl editorial-frame editorial-frame-hover space-y-1">
              <span className="text-[10px] font-mono text-gray-400 uppercase tracking-widest block">
                SESSION LOSERS
              </span>
              <p className="text-2xl font-light text-rose-400 font-mono">
                {metrics.losers} <span className="text-xs text-rose-500/70 font-sans">Down</span>
              </p>
            </div>

            <div className="p-4 rounded-xl editorial-frame editorial-frame-hover space-y-1">
              <span className="text-[10px] font-mono text-gray-400 uppercase tracking-widest block">
                IN PORTFOLIO
              </span>
              <p className="text-2xl font-light text-teal-400 font-mono">
                {metrics.owned} <span className="text-xs text-teal-500/70 font-sans">Owned</span>
              </p>
            </div>
          </div>
        )}

        {/* Filter, Search & View Toggle Bar */}
        {items.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-3 rounded-xl editorial-frame">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400 pointer-events-none" />
              <Input
                type="text"
                placeholder="Search watchlist symbols or names..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-[#07080a] border-white/[0.08] focus:border-emerald-500/30 text-xs font-mono text-white rounded-lg"
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
                  className={`px-3 py-1.5 rounded-lg font-mono text-xs transition-all ${
                    filterMode === tab.key
                      ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-bold"
                      : "text-gray-400 hover:text-gray-200 hover:bg-white/[0.04] border border-transparent"
                  }`}
                >
                  {tab.label}
                </button>
              ))}

              {/* View Mode Toggle */}
              <div className="ml-2 pl-2 border-l border-white/[0.08] flex items-center gap-1">
                <button
                  onClick={() => setViewMode("TABLE")}
                  className={`p-1.5 rounded-md ${viewMode === "TABLE" ? "bg-white/[0.08] text-emerald-400" : "text-gray-500 hover:text-white"}`}
                  title="Table View"
                >
                  <TableIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode("GRID")}
                  className={`p-1.5 rounded-md ${viewMode === "GRID" ? "bg-white/[0.08] text-emerald-400" : "text-gray-500 hover:text-white"}`}
                  title="Grid View"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Content Section */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="h-48 rounded-2xl editorial-frame animate-pulse"
              />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center rounded-2xl editorial-frame space-y-4 max-w-md mx-auto">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto">
              <Star className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Watchlist is Empty</h3>
              <p className="text-xs text-gray-400 mt-1">Add equities to track pricing, changes, and fundamental AI memos.</p>
            </div>
            <Button variant="primary" size="sm" onClick={() => setIsAddModalOpen(true)} className="font-mono text-xs">
              <Plus className="w-3.5 h-3.5 mr-1" />
              Add First Stock
            </Button>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="p-8 text-center rounded-2xl editorial-frame text-xs text-gray-400 font-mono">
            No matching symbols found for your search/filter criteria.
          </div>
        ) : viewMode === "TABLE" ? (
          /* Institutional Research Table View */
          <div className="rounded-2xl editorial-frame overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-white/[0.06] bg-white/[0.02] text-[10px] text-gray-400 uppercase tracking-widest">
                    <th className="py-3 px-4">Ticker / Company</th>
                    <th className="py-3 px-4 text-right">LTP Price</th>
                    <th className="py-3 px-4 text-right">Change %</th>
                    <th className="py-3 px-4 text-right">52W Position</th>
                    <th className="py-3 px-4 text-center">Holding</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {filteredItems.map((item) => {
                    const price = item.current_price ?? 0;
                    const change = item.change ?? 0;
                    const changePct = item.change_percent ?? 0;
                    const isPositive = change >= 0;
                    const rangeMin = price > 0 ? price * 0.72 : 100;
                    const rangeMax = price > 0 ? price * 1.28 : 200;
                    const rangePct = Math.min(Math.max(((price - rangeMin) / (rangeMax - rangeMin)) * 100, 10), 90);

                    return (
                      <tr key={item.id} className="hover:bg-white/[0.02] transition-colors group">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-sm">{item.ticker}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/[0.04] text-gray-400 border border-white/[0.06]">NSE</span>
                          </div>
                          <div className="text-[11px] text-gray-400 font-sans truncate max-w-xs">{item.company_name}</div>
                        </td>
                        <td className="py-3.5 px-4 text-right font-light text-white text-sm">
                          {price > 0 ? formatCurrency(price) : "—"}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <span className={`font-semibold ${isPositive ? "text-emerald-400" : "text-rose-400"}`}>
                            {isPositive ? "+" : ""}{changePct.toFixed(2)}%
                          </span>
                          <span className="block text-[10px] text-gray-500">
                            {formatCurrency(change)}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="w-24 ml-auto space-y-1">
                            <div className="w-full h-1 bg-white/[0.06] rounded-full overflow-hidden relative">
                              <div className="absolute top-0 bottom-0 w-2 bg-emerald-400 rounded-full" style={{ left: `${rangePct}%` }} />
                            </div>
                            <span className="text-[9px] text-gray-500 block">L: ₹{rangeMin.toFixed(0)} · H: ₹{rangeMax.toFixed(0)}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {item.is_owned ? (
                            <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-semibold">
                              ACTIVE
                            </span>
                          ) : (
                            <span className="text-[10px] text-gray-600">—</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleBuy(item.ticker, item.current_price)}
                              className="px-2.5 py-1 rounded bg-white/[0.03] hover:bg-emerald-500 hover:text-black border border-white/[0.08] text-gray-300 text-xs transition-all font-semibold"
                            >
                              Buy
                            </button>
                            <Link href={`/ai-analysis?ticker=${item.ticker}`}>
                              <button className="px-2 py-1 rounded bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.08] text-gray-300 hover:text-white text-xs transition-all">
                                <Sparkles className="w-3 h-3 text-emerald-400" />
                              </button>
                            </Link>
                            <button
                              onClick={() => handleRemove(item.ticker)}
                              className="p-1 rounded text-gray-600 hover:text-rose-400 transition-colors"
                              title="Remove"
                            >
                              ×
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* Cards Grid View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => (
              <WatchlistStockCard
                key={item.id}
                item={item}
                onRemove={handleRemove}
                onBuy={handleBuy}
              />
            ))}
          </div>
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
