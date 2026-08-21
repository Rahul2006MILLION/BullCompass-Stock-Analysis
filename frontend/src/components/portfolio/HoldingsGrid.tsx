"use client";

import React, { useState, useMemo } from "react";
import { HoldingItem } from "@/types/portfolio";
import { StockCard } from "@/components/portfolio/StockCard";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency, formatPercentage } from "@/lib/utils";
import {
  Search,
  LayoutGrid,
  List as ListIcon,
  ArrowUpDown,
  Plus,
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  MinusCircle,
  Edit2,
  Trash2,
  Filter,
  RotateCcw,
} from "lucide-react";
import { motion, AnimatePresence, Variants } from "framer-motion";

interface HoldingsGridProps {
  holdings: HoldingItem[];
  onBuy: (holding: HoldingItem) => void;
  onSell: (holding: HoldingItem) => void;
  onEdit: (holding: HoldingItem) => void;
  onDelete: (holding: HoldingItem) => void;
  onAddNew: () => void;
  isLoading?: boolean;
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: Math.min(i * 0.04, 0.3),
      duration: 0.35,
      ease: "easeOut",
    },
  }),
};

export function HoldingsGrid({
  holdings,
  onBuy,
  onSell,
  onEdit,
  onDelete,
  onAddNew,
  isLoading = false,
}: HoldingsGridProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"ALL" | "PROFIT" | "LOSS">("ALL");
  const [sortBy, setSortBy] = useState<"value" | "profit" | "returns" | "ticker">("value");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  const totalPortfolioValue = useMemo(() => {
    return holdings.reduce(
      (sum, h) => sum + (h.current_value != null ? h.current_value : h.quantity * (h.current_price || h.average_buy_price)),
      0
    );
  }, [holdings]);

  const profitableCount = holdings.filter((h) => (h.profit || 0) >= 0).length;
  const lossCount = holdings.filter((h) => (h.profit || 0) < 0).length;

  const filteredHoldings = useMemo(() => {
    let result = holdings.filter((h) => {
      const matchesSearch = h.ticker.toLowerCase().includes(searchQuery.toLowerCase().trim());
      const isProfitable = (h.profit || 0) >= 0;

      if (filterType === "PROFIT") return matchesSearch && isProfitable;
      if (filterType === "LOSS") return matchesSearch && !isProfitable;
      return matchesSearch;
    });

    result.sort((a, b) => {
      if (sortBy === "value") {
        const valA = a.current_value != null ? a.current_value : a.quantity * (a.current_price || a.average_buy_price);
        const valB = b.current_value != null ? b.current_value : b.quantity * (b.current_price || b.average_buy_price);
        return valB - valA;
      }
      if (sortBy === "profit") {
        return (b.profit || 0) - (a.profit || 0);
      }
      if (sortBy === "returns") {
        return (b.returns || 0) - (a.returns || 0);
      }
      return a.ticker.localeCompare(b.ticker);
    });

    return result;
  }, [holdings, searchQuery, filterType, sortBy]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-48 rounded-2xl bg-white/3 animate-pulse border border-white/5" />
        ))}
      </div>
    );
  }

  if (holdings.length === 0) {
    return (
      <div className="p-12 text-center rounded-2xl editorial-frame space-y-4 max-w-lg mx-auto">
        <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto text-2xl">
          🐂
        </div>
        <div>
          <h3 className="text-lg font-bold text-white font-mono">Your Portfolio is Empty</h3>
          <p className="text-xs text-gray-400 mt-1 font-sans">
            Add existing holdings or execute your first buy trade to start tracking live gains.
          </p>
        </div>
        <Button variant="primary" size="md" onClick={onAddNew} className="font-mono text-xs font-semibold">
          <Plus className="w-4 h-4 mr-1.5" />
          Add First Holding
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Controls Bar: Search, Filters, Sort, View Toggle */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 editorial-frame p-3 rounded-xl">
        {/* Search */}
        <div className="flex-1 max-w-xs">
          <Input
            placeholder="Search holdings..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            icon={<Search className="w-4 h-4 text-emerald-400" />}
            className="py-1.5 text-xs font-mono bg-[#07080a]"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 font-mono text-xs self-start sm:self-center">
          <button
            onClick={() => setFilterType("ALL")}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filterType === "ALL"
                ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-bold"
                : "text-gray-400 hover:text-gray-200 hover:bg-white/[0.04] border border-transparent"
            }`}
          >
            All ({holdings.length})
          </button>
          <button
            onClick={() => setFilterType("PROFIT")}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filterType === "PROFIT"
                ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-bold"
                : "text-gray-400 hover:text-emerald-400 hover:bg-emerald-500/10 border border-transparent"
            }`}
          >
            Gainers ({profitableCount})
          </button>
          <button
            onClick={() => setFilterType("LOSS")}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filterType === "LOSS"
                ? "bg-rose-500/15 text-rose-300 border border-rose-500/30 font-bold"
                : "text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent"
            }`}
          >
            Decliners ({lossCount})
          </button>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center">
          {/* Sort Selector */}
          <div className="flex items-center gap-1.5 bg-[#07080a] px-2.5 py-1.5 rounded-lg border border-white/[0.08] text-xs text-gray-300 font-mono">
            <ArrowUpDown className="w-3.5 h-3.5 text-gray-400" />
            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="bg-transparent text-gray-200 focus:outline-none cursor-pointer"
            >
              <option value="value" className="bg-[#07080a]">Sort by Value</option>
              <option value="profit" className="bg-[#07080a]">Sort by P&L (₹)</option>
              <option value="returns" className="bg-[#07080a]">Sort by Returns (%)</option>
              <option value="ticker" className="bg-[#07080a]">Sort by Ticker (A-Z)</option>
            </select>
          </div>

          {/* Grid / Table Toggle */}
          <div className="flex items-center bg-[#07080a] p-1 rounded-lg border border-white/[0.08]">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === "grid" ? "bg-white/[0.08] text-emerald-400" : "text-gray-400 hover:text-white"
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === "table" ? "bg-white/[0.08] text-emerald-400" : "text-gray-400 hover:text-white"
              }`}
              title="Table View"
            >
              <ListIcon className="w-3.5 h-3.5" />
            </button>
          </div>

          <Button variant="mint" size="sm" onClick={onAddNew} className="font-mono text-xs py-1.5 font-semibold">
            <Plus className="w-3.5 h-3.5 mr-1" />
            Add Holding
          </Button>
        </div>
      </div>

      {/* Filter summary when search or filter active */}
      {(searchQuery || filterType !== "ALL") && (
        <div className="flex items-center justify-between px-3 py-1.5 text-xs text-gray-400">
          <span>
            Showing <strong className="text-white">{filteredHoldings.length}</strong> of{" "}
            <strong>{holdings.length}</strong> holdings
          </span>
          <button
            onClick={() => {
              setSearchQuery("");
              setFilterType("ALL");
            }}
            className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-medium"
          >
            <RotateCcw className="w-3 h-3" />
            Reset filters
          </button>
        </div>
      )}

      {/* Grid View */}
      {viewMode === "grid" ? (
        filteredHoldings.length === 0 ? (
          <div className="p-8 text-center rounded-xl bg-white/2 border border-white/5 text-gray-400 text-xs">
            No holdings found matching &quot;{searchQuery}&quot;.
          </div>
        ) : (
          <motion.div
            layout
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            <AnimatePresence>
              {filteredHoldings.map((h, idx) => (
                <motion.div
                  key={h.id || h.ticker}
                  layout
                  custom={idx}
                  initial="hidden"
                  animate="visible"
                  exit={{ opacity: 0, scale: 0.95 }}
                  variants={itemVariants}
                >
                  <StockCard
                    holding={h}
                    totalPortfolioValue={totalPortfolioValue}
                    onBuy={onBuy}
                    onSell={onSell}
                    onEdit={onEdit}
                    onDelete={onDelete}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )
      ) : (
        /* Table View */
        <div className="rounded-2xl editorial-frame overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-white/[0.02] text-gray-400 border-b border-white/[0.06] uppercase text-[10px] tracking-widest">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">Stock</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Quantity</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Avg Buy Price</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Live Price</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Invested</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Current Value</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Unrealized P&L</th>
                  <th className="py-3.5 px-4 font-semibold text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {filteredHoldings.map((h) => {
                  const isPositive = (h.profit || 0) >= 0;
                  const investedVal = h.invested ?? h.quantity * h.average_buy_price;
                  const currentVal = h.current_value ?? h.quantity * (h.current_price || h.average_buy_price);

                  return (
                    <tr key={h.id || h.ticker} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3.5 px-4 font-bold text-white text-sm">
                        {h.ticker}
                      </td>
                      <td className="py-3.5 px-4 text-right text-gray-300">{h.quantity}</td>
                      <td className="py-3.5 px-4 text-right text-gray-300">
                        {formatCurrency(h.average_buy_price)}
                      </td>
                      <td className="py-3.5 px-4 text-right text-white font-light">
                        {h.current_price ? formatCurrency(h.current_price) : "—"}
                      </td>
                      <td className="py-3.5 px-4 text-right text-gray-300">
                        {formatCurrency(investedVal)}
                      </td>
                      <td className="py-3.5 px-4 text-right text-white font-light">
                        {formatCurrency(currentVal)}
                      </td>
                      <td className={`py-3.5 px-4 text-right font-bold ${isPositive ? "text-emerald-400" : "text-rose-400"}`}>
                        {formatCurrency(h.profit)}
                        <span className="text-[10px] block font-normal text-gray-400">
                          {formatPercentage(h.returns)}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => onBuy(h)}
                            className="px-2 py-1 rounded bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-black border border-emerald-500/20 text-[11px] font-semibold transition-all"
                            title="Buy"
                          >
                            Buy
                          </button>
                          <button
                            onClick={() => onSell(h)}
                            className="px-2 py-1 rounded bg-rose-500/10 hover:bg-rose-500 text-rose-300 hover:text-white border border-rose-500/20 text-[11px] font-semibold transition-all"
                            title="Sell"
                          >
                            Sell
                          </button>
                          <button
                            onClick={() => onEdit(h)}
                            className="p-1 rounded text-gray-400 hover:text-white hover:bg-white/[0.06] transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDelete(h)}
                            className="p-1 rounded text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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
      )}
    </div>
  );
}
