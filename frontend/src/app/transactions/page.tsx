"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Header } from "@/components/layout/Header";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { api } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import { Transaction } from "@/types/transaction";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  History,
  Search,
  ArrowDownLeft,
  ArrowUpRight,
  RefreshCw,
} from "lucide-react";

export default function TransactionsPage() {
  const { error } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [realizedProfit, setRealizedProfit] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"ALL" | "BUY" | "SELL">("ALL");

  const fetchTransactions = useCallback(async () => {
    try {
      setIsLoading(true);
      const [transData, profitData] = await Promise.all([
        api.getTransactions(),
        api.getRealizedProfit(),
      ]);
      setTransactions(transData);
      setRealizedProfit(profitData.realized_profit || 0);
    } catch (err: any) {
      error("Connection Error", err?.message || "Failed to fetch transactions.");
    } finally {
      setIsLoading(false);
    }
  }, [error]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const matchesSearch = t.ticker.toLowerCase().includes(searchQuery.toLowerCase().trim());
      const matchesType = typeFilter === "ALL" || t.transaction_type === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [transactions, searchQuery, typeFilter]);

  const totalBuys = transactions.filter((t) => t.transaction_type === "BUY").length;
  const totalSells = transactions.filter((t) => t.transaction_type === "SELL").length;
  const isProfitPositive = realizedProfit >= 0;

  return (
    <>
      <Header />

      <div className="space-y-6 select-none">
        {/* Header */}
        <PageHeader
          eyebrow="AUDIT COMPLIANCE · SETTLEMENT TRAIL"
          actions={
            <Button
              variant="outline"
              size="sm"
              onClick={fetchTransactions}
              className="font-mono text-xs border-white/[0.08] hover:border-white/[0.15] text-gray-300"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 text-emerald-400 ${isLoading ? "animate-spin" : ""}`} />
              Sync Ledger
            </Button>
          }
        />

        {/* Realized P&L Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-xl editorial-frame editorial-frame-hover space-y-1">
            <span className="text-[10px] font-mono text-gray-400 uppercase tracking-widest block">
              CUMULATIVE REALIZED P&L
            </span>
            <span
              className={`text-2xl font-light font-mono mt-1 block ${
                isProfitPositive ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              {formatCurrency(realizedProfit)}
            </span>
            <span className="text-[11px] text-gray-500 font-sans block">
              Net profit & loss booked from closed positions
            </span>
          </div>

          <div className="p-5 rounded-xl editorial-frame editorial-frame-hover space-y-1">
            <span className="text-[10px] font-mono text-gray-400 uppercase tracking-widest block">
              BUY ORDERS EXECUTED
            </span>
            <span className="text-2xl font-light font-mono text-white mt-1 block">
              {totalBuys} <span className="text-xs text-gray-500 font-sans">Trades</span>
            </span>
            <span className="text-[11px] text-gray-500 font-sans block">Capital acquisition entries</span>
          </div>

          <div className="p-5 rounded-xl editorial-frame editorial-frame-hover space-y-1">
            <span className="text-[10px] font-mono text-gray-400 uppercase tracking-widest block">
              SELL ORDERS EXECUTED
            </span>
            <span className="text-2xl font-light font-mono text-white mt-1 block">
              {totalSells} <span className="text-xs text-gray-500 font-sans">Trades</span>
            </span>
            <span className="text-[11px] text-gray-500 font-sans block">Realization & liquidation entries</span>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-xl editorial-frame">
          <div className="flex-1 max-w-xs">
            <Input
              placeholder="Search ticker symbol (e.g. TCS)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon={<Search className="w-4 h-4 text-emerald-400" />}
              className="py-1.5 text-xs font-mono bg-[#07080a]"
            />
          </div>

          <div className="flex items-center gap-1.5 font-mono text-xs">
            {(["ALL", "BUY", "SELL"] as const).map((type) => (
              <button
                key={type}
                onClick={() => setTypeFilter(type)}
                className={`px-3 py-1.5 rounded-lg font-mono text-xs transition-all ${
                  typeFilter === type
                    ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-bold"
                    : "text-gray-400 hover:text-gray-200 hover:bg-white/[0.04] border border-transparent"
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Transactions Ledger Table */}
        <div className="rounded-2xl editorial-frame overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-white/[0.02] text-gray-400 border-b border-white/[0.06] uppercase text-[10px] tracking-widest">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">Execution Timestamp</th>
                  <th className="py-3.5 px-4 font-semibold">Stock</th>
                  <th className="py-3.5 px-4 font-semibold">Side</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Quantity</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Filled Price</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Cost Basis</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Total Consideration</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Realized Gain/Loss</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-gray-500">
                      Loading trade audit ledger...
                    </td>
                  </tr>
                ) : filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-gray-500">
                      No transaction records found matching your filters.
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((t) => {
                    const isBuy = t.transaction_type === "BUY";
                    const hasProfit = t.profit_loss !== null;
                    const isProfitable = (t.profit_loss || 0) >= 0;

                    return (
                      <tr key={t.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-3.5 px-4 text-gray-400 font-sans text-xs">
                          {formatDate(t.transaction_date)}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-white text-sm">
                          {t.ticker}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                              isBuy
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                            }`}
                          >
                            {isBuy ? (
                              <ArrowDownLeft className="w-3 h-3 mr-0.5" />
                            ) : (
                              <ArrowUpRight className="w-3 h-3 mr-0.5" />
                            )}
                            {t.transaction_type}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right text-gray-300">
                          {t.quantity}
                        </td>
                        <td className="py-3.5 px-4 text-right text-white font-light">
                          {formatCurrency(t.price)}
                        </td>
                        <td className="py-3.5 px-4 text-right text-gray-400">
                          {t.average_cost ? formatCurrency(t.average_cost) : "—"}
                        </td>
                        <td className="py-3.5 px-4 text-right text-white font-light">
                          {formatCurrency(t.total_amount)}
                        </td>
                        <td
                          className={`py-3.5 px-4 text-right font-bold ${
                            !hasProfit
                              ? "text-gray-600"
                              : isProfitable
                              ? "text-emerald-400"
                              : "text-rose-400"
                          }`}
                        >
                          {hasProfit ? formatCurrency(t.profit_loss) : "—"}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
