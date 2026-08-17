"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { api } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import { Transaction } from "@/types/transaction";
import { formatCurrency, formatPercentage, formatDate } from "@/lib/utils";
import {
  History,
  Search,
  Filter,
  ArrowDownLeft,
  ArrowUpRight,
  TrendingUp,
  RefreshCw,
  FileSpreadsheet,
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

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <History className="w-6 h-6 text-emerald-400" />
              <span>Trade Audit Ledger</span>
            </h1>
            <p className="text-xs text-gray-400 mt-1">
              Complete chronological audit trail of all buy and sell order executions
            </p>
          </div>

          <Button variant="outline" size="sm" onClick={fetchTransactions} className="text-xs self-start sm:self-auto">
            <RefreshCw className="w-3.5 h-3.5 mr-1" />
            Sync Ledger
          </Button>
        </div>

        {/* Realized P&L Summary Cards */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4"
        >
          <div className="p-4 rounded-2xl bg-[#0d121a] border border-white/8">
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">
              Cumulative Realized P&L
            </span>
            <span
              className={`text-2xl font-bold font-mono mt-1 block ${
                isProfitPositive ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              {formatCurrency(realizedProfit)}
            </span>
            <span className="text-[11px] text-gray-500 mt-1 block">
              Total gains booked from completed sell orders
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-[#0d121a] border border-white/8">
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">
              Buy Transactions
            </span>
            <span className="text-2xl font-bold font-mono text-emerald-400 mt-1 block">
              {totalBuys} Orders
            </span>
            <span className="text-[11px] text-gray-500 mt-1 block">Accumulated positions</span>
          </div>

          <div className="p-4 rounded-2xl bg-[#0d121a] border border-white/8">
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">
              Sell Transactions
            </span>
            <span className="text-2xl font-bold font-mono text-purple-400 mt-1 block">
              {totalSells} Orders
            </span>
            <span className="text-[11px] text-gray-500 mt-1 block">Liquidated positions</span>
          </div>
        </motion.div>

        {/* Filter Controls */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.1 }}
          transition={{ duration: 0.4, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#0d121a]/80 p-3 rounded-2xl border border-white/8"
        >
          <div className="flex-1 max-w-xs">
            <Input
              placeholder="Search ticker symbol..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon={<Search className="w-4 h-4" />}
              className="py-1.5 text-xs"
            />
          </div>

          <div className="flex items-center gap-1.5 bg-[#141a24] p-1 rounded-xl border border-white/8 text-xs">
            {(["ALL", "BUY", "SELL"] as const).map((type) => (
              <button
                key={type}
                onClick={() => setTypeFilter(type)}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                  typeFilter === type
                    ? "bg-white/10 text-white font-semibold shadow-sm"
                    : "text-gray-400 hover:text-gray-200"
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Transactions Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.1 }}
          transition={{ duration: 0.45, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="rounded-2xl border border-white/8 bg-[#0d121a]/95 overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#111622] text-gray-400 border-b border-white/8 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">Date & Time</th>
                  <th className="py-3.5 px-4 font-semibold">Stock</th>
                  <th className="py-3.5 px-4 font-semibold">Type</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Quantity</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Execution Price</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Cost Basis</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Total Trade Amount</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Realized P&L</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
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
                      <tr key={t.id} className="hover:bg-white/3 transition-colors">
                        <td className="py-3.5 px-4 text-gray-400 font-sans text-xs">
                          {formatDate(t.transaction_date)}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-white text-sm">
                          {t.ticker}
                        </td>
                        <td className="py-3.5 px-4">
                          <Badge variant={isBuy ? "mint" : "coral"} size="sm">
                            {isBuy ? (
                              <ArrowDownLeft className="w-3 h-3 mr-0.5" />
                            ) : (
                              <ArrowUpRight className="w-3 h-3 mr-0.5" />
                            )}
                            {t.transaction_type}
                          </Badge>
                        </td>
                        <td className="py-3.5 px-4 text-right text-gray-300">
                          {t.quantity}
                        </td>
                        <td className="py-3.5 px-4 text-right text-white font-semibold">
                          {formatCurrency(t.price)}
                        </td>
                        <td className="py-3.5 px-4 text-right text-gray-400">
                          {t.average_cost ? formatCurrency(t.average_cost) : "-"}
                        </td>
                        <td className="py-3.5 px-4 text-right text-white font-semibold">
                          {formatCurrency(t.total_amount)}
                        </td>
                        <td
                          className={`py-3.5 px-4 text-right font-bold ${
                            !hasProfit
                              ? "text-gray-500"
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
        </motion.div>
      </div>
    </>
  );
}
