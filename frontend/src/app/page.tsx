"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
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
import { api } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import { useLiveQuotes } from "@/lib/useLiveQuotes";
import { PortfolioSummary, PortfolioHistorySnapshot, HoldingItem } from "@/types/portfolio";
import { formatCurrency, formatPercentage } from "@/lib/utils";
import {
  TrendingUp,
  TrendingDown,
  RefreshCw,
  BarChart2,
  Sparkles,
  ArrowRight,
  Search,
} from "lucide-react";
import Link from "next/link";

const SECTORS_LIST = [
  { name: "NIFTY IT", chg: "+1.42%", isPos: true },
  { name: "NIFTY BANK", chg: "+0.85%", isPos: true },
  { name: "NIFTY AUTO", chg: "+1.15%", isPos: true },
  { name: "NIFTY PHARMA", chg: "+0.52%", isPos: true },
  { name: "NIFTY METALS", chg: "+2.40%", isPos: true },
  { name: "NIFTY FMCG", chg: "-0.28%", isPos: false },
];

export default function DashboardPage() {
  const { error, success } = useToast();
  const [portfolio, setPortfolio] = useState<PortfolioSummary | null>(null);
  const [history, setHistory] = useState<PortfolioHistorySnapshot[]>([]);
  const [isPortfolioLoading, setIsPortfolioLoading] = useState(true);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);
  const [quickSearchTicker, setQuickSearchTicker] = useState("");

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBuyModalOpen, setIsBuyModalOpen] = useState(false);
  const [isSellModalOpen, setIsSellModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedHolding, setSelectedHolding] = useState<HoldingItem | null>(null);

  const baseTickers = useMemo(() => {
    const defaultTickers = ["^NSEI", "^BSESN", "^INDIAVIX", "TCS", "RELIANCE", "HDFCBANK", "INFY", "TATAMOTORS", "LAURUSLABS"];
    const holdings = portfolio?.holdings?.map((h) => h.ticker) || [];
    return Array.from(new Set([...defaultTickers, ...holdings]));
  }, [portfolio?.holdings]);

  // Fetch portfolio summary
  const fetchPortfolioValuation = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) {
        setIsPortfolioLoading(true);
      }
      const portfolioData = await api.getPortfolio();
      setPortfolio(portfolioData);
    } catch (err: any) {
      if (!isSilent) {
        error("Connection Error", err?.message || "Could not connect to BullCompass backend API.");
      }
    } finally {
      if (!isSilent) {
        setIsPortfolioLoading(false);
      }
    }
  }, [error]);

  // Fetch historical snapshots
  const fetchHistoricalData = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) {
        setIsHistoryLoading(true);
      }
      const historyData = await api.getPortfolioHistory();
      setHistory(historyData);
    } catch (err: any) {
      if (!isSilent) {
        error("Connection Error", err?.message || "Could not load portfolio history.");
      }
    } finally {
      if (!isSilent) {
        setIsHistoryLoading(false);
      }
    }
  }, [error]);

  const fetchAllData = useCallback(async (isSilent = false) => {
    await Promise.all([
      fetchPortfolioValuation(isSilent),
      fetchHistoricalData(isSilent),
    ]);
  }, [fetchPortfolioValuation, fetchHistoricalData]);

  // Live quotes polling - updates in-memory quotes map without full page/chart reloading
  const { quotes, marketStatus, isPolling, syncNow } = useLiveQuotes({
    tickers: baseTickers,
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
    fetchAllData(false);

    const handlePortfolioUpdate = () => {
      fetchAllData(true);
    };

    window.addEventListener("portfolio-updated", handlePortfolioUpdate);
    return () => {
      window.removeEventListener("portfolio-updated", handlePortfolioUpdate);
    };
  }, [fetchAllData]);

  const handleManualSync = async () => {
    try {
      await syncNow();
      await fetchPortfolioValuation(true);
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
    if (!confirm(`Are you sure you want to delete ${holding.ticker} from your portfolio?`)) return;

    try {
      await api.deleteHolding(holding.id);
      success("Holding Deleted", `${holding.ticker} removed from portfolio.`);
      fetchAllData(true);
    } catch (err: any) {
      error("Delete Failed", err?.message || "Failed to delete holding.");
    }
  };

  const nifty = quotes["^NSEI"];
  const sensex = quotes["^BSESN"];
  const vix = quotes["^INDIAVIX"];

  const niftyPrice = nifty?.current_price ?? 24812.35;
  const niftyChg = nifty?.change_percent ?? 0.42;
  const sensexPrice = sensex?.current_price ?? 81643.20;
  const sensexChg = sensex?.change_percent ?? 0.38;
  const vixPrice = vix?.current_price ?? 11.62;
  const vixChg = vix?.change_percent ?? -2.15;

  return (
    <>
      <Header
        onOpenAddModal={() => setIsAddModalOpen(true)}
        onOpenQuickTrade={() => handleOpenBuy()}
      />

      <div className="space-y-6 select-none">
        {/* =========================================================================
            1. TOP LIVE MARKET TELEMETRY (COMPACT TERMINAL HEADER)
            ========================================================================= */}
        <section className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.06] pb-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_rgba(111,227,166,0.8)]" />
              <span className="text-[11px] font-mono tracking-widest text-emerald-400 uppercase font-semibold">
                NATIONAL STOCK EXCHANGE (NSE) · LIVE 10S FEED
              </span>
            </div>

            <div className="flex items-center gap-2 font-mono text-xs">
              <button
                onClick={handleManualSync}
                disabled={isPolling}
                className="px-2.5 py-1 rounded-lg bg-white/[0.03] border border-white/[0.08] text-gray-300 hover:text-white hover:bg-white/[0.06] transition-all flex items-center gap-1.5"
              >
                <RefreshCw className={`w-3 h-3 text-emerald-400 ${isPolling ? "animate-spin" : ""}`} />
                <span>{isPolling ? "10s Polling..." : "Sync Quotes"}</span>
              </button>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="px-3 py-1 rounded-lg font-semibold bg-emerald-500 text-black hover:bg-emerald-400 transition-all"
              >
                + Add Holding
              </button>
            </div>
          </div>

          {/* Indices Triad + Breadth Bar */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {/* NIFTY 50 */}
            <div className="p-4 rounded-xl editorial-frame editorial-frame-hover space-y-1">
              <div className="flex items-center justify-between text-[10px] font-mono text-gray-400 uppercase tracking-wider">
                <span>NIFTY 50</span>
                <span className="px-1.5 py-0.2 rounded bg-white/[0.04] border border-white/[0.06]">NSE</span>
              </div>
              <div className="text-xl sm:text-2xl font-light font-mono text-white tracking-tight">
                {niftyPrice.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="flex items-center gap-1.5 text-xs font-mono">
                <span className={niftyChg >= 0 ? "text-emerald-400 font-semibold" : "text-rose-400 font-semibold"}>
                  {niftyChg >= 0 ? "+" : ""}{niftyChg.toFixed(2)}%
                </span>
                <span className="text-gray-500 text-[10px]">Today</span>
              </div>
            </div>

            {/* BSE SENSEX */}
            <div className="p-4 rounded-xl editorial-frame editorial-frame-hover space-y-1">
              <div className="flex items-center justify-between text-[10px] font-mono text-gray-400 uppercase tracking-wider">
                <span>BSE SENSEX</span>
                <span className="px-1.5 py-0.2 rounded bg-white/[0.04] border border-white/[0.06]">BSE</span>
              </div>
              <div className="text-xl sm:text-2xl font-light font-mono text-white tracking-tight">
                {sensexPrice.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="flex items-center gap-1.5 text-xs font-mono">
                <span className={sensexChg >= 0 ? "text-emerald-400 font-semibold" : "text-rose-400 font-semibold"}>
                  {sensexChg >= 0 ? "+" : ""}{sensexChg.toFixed(2)}%
                </span>
                <span className="text-gray-500 text-[10px]">Today</span>
              </div>
            </div>

            {/* INDIA VIX */}
            <div className="p-4 rounded-xl editorial-frame editorial-frame-hover space-y-1">
              <div className="flex items-center justify-between text-[10px] font-mono text-gray-400 uppercase tracking-wider">
                <span>INDIA VIX</span>
                <span className="px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-semibold">LOW VOL</span>
              </div>
              <div className="text-xl sm:text-2xl font-light font-mono text-white tracking-tight">
                {vixPrice.toFixed(2)}
              </div>
              <div className="flex items-center gap-1.5 text-xs font-mono">
                <span className={vixChg < 0 ? "text-emerald-400 font-semibold" : "text-rose-400 font-semibold"}>
                  {vixChg.toFixed(2)}%
                </span>
                <span className="text-gray-500 text-[10px]">Implied Vol</span>
              </div>
            </div>

            {/* Market Breadth */}
            <div className="p-4 rounded-xl editorial-frame editorial-frame-hover space-y-1">
              <div className="flex items-center justify-between text-[10px] font-mono text-gray-400 uppercase tracking-wider">
                <span>BREADTH</span>
                <span className="text-emerald-400 text-[10px] font-semibold">61% ADV</span>
              </div>
              <div className="text-xl sm:text-2xl font-light font-mono text-white tracking-tight">
                1,412 / 918
              </div>
              <div className="w-full h-1 bg-rose-500/30 rounded-full overflow-hidden flex mt-1">
                <div className="h-full bg-emerald-400 rounded-full" style={{ width: "61%" }} />
              </div>
            </div>
          </div>

          {/* Sector Inflow Strip */}
          <div className="p-3 rounded-xl editorial-frame flex items-center justify-between gap-3 overflow-x-auto text-xs font-mono">
            <span className="text-[10px] text-gray-400 uppercase tracking-widest shrink-0 font-semibold">
              SECTORS:
            </span>
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
              {SECTORS_LIST.map((sec) => (
                <div
                  key={sec.name}
                  className="px-2.5 py-1 rounded-lg bg-white/[0.02] border border-white/[0.05] flex items-center gap-1.5 shrink-0"
                >
                  <span className="text-gray-300 text-[11px]">{sec.name}</span>
                  <span className={`font-semibold ${sec.isPos ? "text-emerald-400" : "text-rose-400"}`}>
                    {sec.chg}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* =========================================================================
            2. PORTFOLIO COMMAND CENTER & ASSET VALUATION
            ========================================================================= */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono tracking-widest text-emerald-400 uppercase font-semibold">
              PORTFOLIO VALUATION & ACTIVE ASSETS
            </span>
            <Link
              href="/portfolio"
              className="text-xs font-mono text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1"
            >
              <span>Full Portfolio Terminal</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Metric Summary Cards */}
          <PortfolioSummaryCards
            netWorth={dynamicPortfolio?.total_current_value || 0}
            invested={dynamicPortfolio?.total_invested || 0}
            unrealizedProfit={dynamicPortfolio?.total_unrealized_profit || 0}
            returnPercentage={dynamicPortfolio?.total_return_percentage || 0}
            realizedProfit={dynamicPortfolio?.total_realized_profit || 0}
            totalHoldings={dynamicPortfolio?.total_holdings || 0}
            isLoading={isPortfolioLoading}
          />

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-7 p-5 rounded-2xl editorial-frame">
              <NetWorthAreaChart data={history} isLoading={isHistoryLoading} />
            </div>
            <div className="lg:col-span-5 p-5 rounded-2xl editorial-frame">
              <AllocationDonut
                holdings={dynamicPortfolio?.holdings || []}
                totalValue={dynamicPortfolio?.total_current_value || 0}
              />
            </div>
          </div>

          {/* Profit Loss Bar Chart */}
          <div className="p-5 rounded-2xl editorial-frame">
            <ProfitLossBarChart holdings={dynamicPortfolio?.holdings || []} />
          </div>

          {/* Active Holdings Grid */}
          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold font-mono text-white uppercase tracking-wider">
                Active Portfolio Positions ({dynamicPortfolio?.total_holdings || 0})
              </h3>
            </div>

            <HoldingsGrid
              holdings={dynamicPortfolio?.holdings || []}
              onBuy={handleOpenBuy}
              onSell={handleOpenSell}
              onEdit={handleOpenEdit}
              onDelete={handleDeleteHolding}
              onAddNew={() => setIsAddModalOpen(true)}
              isLoading={isPortfolioLoading}
            />
          </div>
        </section>

        {/* =========================================================================
            3. QUICK RESEARCH SEARCH BAR
            ========================================================================= */}
        <section className="p-5 rounded-2xl editorial-frame space-y-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <span className="text-[10px] font-mono tracking-widest text-emerald-400 uppercase font-semibold">
                AI RESEARCH ENGINE
              </span>
              <h4 className="text-sm font-medium text-white font-sans">
                Run Forensic Accounting & Valuation Audit
              </h4>
            </div>

            <div className="flex items-center gap-2 max-w-md w-full sm:w-auto">
              <input
                type="text"
                placeholder="Ticker (e.g. TCS, HDFCBANK)..."
                value={quickSearchTicker}
                onChange={(e) => setQuickSearchTicker(e.target.value.toUpperCase())}
                className="px-3 py-1.5 rounded-lg bg-[#07080a] border border-white/[0.08] focus:border-emerald-500/30 text-xs font-mono text-white w-full sm:w-48"
              />
              <Link href={`/ai-analysis?ticker=${quickSearchTicker || "TCS"}`}>
                <button className="px-3 py-1.5 rounded-lg text-xs font-mono font-semibold bg-emerald-500 text-black hover:bg-emerald-400 transition-all flex items-center gap-1.5 shrink-0">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Analyze</span>
                </button>
              </Link>
            </div>
          </div>
        </section>
      </div>

      {/* Interactive Modals */}
      <AddHoldingModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => fetchAllData(true)}
      />

      <BuyModal
        isOpen={isBuyModalOpen}
        onClose={() => setIsBuyModalOpen(false)}
        onSuccess={() => fetchAllData(true)}
        initialHolding={selectedHolding}
      />

      <SellModal
        isOpen={isSellModalOpen}
        onClose={() => setIsSellModalOpen(false)}
        onSuccess={() => fetchAllData(true)}
        holding={selectedHolding}
      />

      <EditHoldingModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={() => fetchAllData(true)}
        holding={selectedHolding}
      />
    </>
  );
}
