"use client";

import React, { useState, useMemo } from "react";
import { Header } from "@/components/layout/Header";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { api } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import { useLiveQuotes } from "@/lib/useLiveQuotes";
import { CompanyQuote } from "@/types/market";
import { formatCurrency, formatCompactINR } from "@/lib/utils";
import { BuyModal } from "@/components/portfolio/BuyModal";
import {
  TrendingUp,
  TrendingDown,
  Search,
  AlertCircle,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

const POPULAR_TICKERS = [
  "TCS",
  "INFY",
  "RELIANCE",
  "HDFCBANK",
  "TATAMOTORS",
  "ICICIBANK",
  "SBIN",
  "ITC",
  "BHARTIARTL",
  "LAURUSLABS",
];

const SECTORS_MATRIX = [
  { sector: "NIFTY IT", flow: "in", chg: "+1.42%", leaders: "TCS, INFY, WIPRO", vol: "₹4,280 Cr" },
  { sector: "NIFTY BANK", flow: "in", chg: "+0.85%", leaders: "HDFC, ICICI, KOTAK", vol: "₹8,640 Cr" },
  { sector: "NIFTY AUTO", flow: "in", chg: "+1.15%", leaders: "TATAMOTORS, M&M", vol: "₹3,120 Cr" },
  { sector: "NIFTY PHARMA", flow: "in", chg: "+0.52%", leaders: "SUNPHARMA, LAURUS", vol: "₹1,940 Cr" },
  { sector: "NIFTY METALS", flow: "in", chg: "+2.40%", leaders: "TATASTEEL, JSWSTEEL", vol: "₹2,850 Cr" },
  { sector: "NIFTY FMCG", flow: "out", chg: "-0.28%", leaders: "ITC, HUL", vol: "₹2,100 Cr" },
  { sector: "NIFTY ENERGY", flow: "out", chg: "-0.64%", leaders: "RELIANCE, ONGC", vol: "₹3,400 Cr" },
];

const TOP_GAINERS = [
  { ticker: "TATASTEEL", name: "Tata Steel Ltd", price: 154.20, chg: 3.85, vol: "24.2M" },
  { ticker: "LAURUSLABS", name: "Laurus Labs Ltd", price: 440.00, chg: 3.42, vol: "5.8M" },
  { ticker: "TATAMOTORS", name: "Tata Motors Ltd", price: 960.00, chg: 2.90, vol: "14.1M" },
  { ticker: "INFY", name: "Infosys Ltd", price: 1780.00, chg: 2.15, vol: "8.4M" },
  { ticker: "TCS", name: "Tata Consultancy Services", price: 3500.00, chg: 1.84, vol: "4.1M" },
];

const TOP_LOSERS = [
  { ticker: "ASIANPAINT", name: "Asian Paints Ltd", price: 2840.00, chg: -2.10, vol: "2.8M" },
  { ticker: "ONGC", name: "Oil & Natural Gas Corp", price: 262.40, chg: -1.65, vol: "18.2M" },
  { ticker: "HINDUNILVR", name: "Hindustan Unilever Ltd", price: 2380.00, chg: -1.24, vol: "3.2M" },
  { ticker: "ITC", name: "ITC Ltd", price: 412.50, chg: -0.95, vol: "12.6M" },
  { ticker: "NESTLEIND", name: "Nestle India Ltd", price: 2190.00, chg: -0.80, vol: "1.1M" },
];

export function MarketPage() {
  const { error, success } = useToast();
  const [tickerQuery, setTickerQuery] = useState("");
  const [quote, setQuote] = useState<CompanyQuote | null>(null);
  const [notFoundSymbol, setNotFoundSymbol] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isBuyModalOpen, setIsBuyModalOpen] = useState(false);

  const marketTickers = useMemo(
    () => ["^NSEI", "^BSESN", "^INDIAVIX", "TCS", "INFY", "RELIANCE", "HDFCBANK", "TATAMOTORS", "LAURUSLABS"],
    []
  );

  const { quotes } = useLiveQuotes({
    tickers: marketTickers,
    intervalMs: 10000,
  });

  const handleSearchQuote = async (symbol: string) => {
    const cleanSymbol = symbol.trim().toUpperCase();
    if (!cleanSymbol) return;
    try {
      setIsLoading(true);
      setNotFoundSymbol(null);
      setQuote(null);
      const data = await api.getCompanyQuote(cleanSymbol);
      if (!data || !data.name || data.current_price <= 0) {
        setQuote(null);
        setNotFoundSymbol(cleanSymbol);
        return;
      }
      setQuote(data);
      setNotFoundSymbol(null);
      success("Quote Loaded", `Retrieved live pricing for ${cleanSymbol}`);
    } catch (err: any) {
      setQuote(null);
      setNotFoundSymbol(cleanSymbol);
      error("Stock Not Found", err?.message || `We couldn't find a listed stock matching '${cleanSymbol}'.`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearchQuote(tickerQuery);
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
      <Header />

      <div className="space-y-6 select-none">
        {/* Top Header */}
        <PageHeader
          eyebrow="NSE/BSE SATELLITE · LIVE CAPITAL MARKETS"
          actions={
            <div className="text-xs font-mono text-gray-400">
              <span>BREADTH: 1,412 ADV / 918 DEC (Advancing / Declining · 61% Positive)</span>
            </div>
          }
        />

        {/* 1. Indices Triad Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="p-4 rounded-xl editorial-frame editorial-frame-hover space-y-1">
            <div className="flex items-center justify-between text-[10px] font-mono text-gray-400 uppercase">
              <span>NIFTY 50</span>
              <span className="px-1.5 py-0.2 rounded bg-white/[0.04] border border-white/[0.06]">NSE</span>
            </div>
            <div className="text-2xl font-light font-mono text-white tracking-tight">
              {niftyPrice.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="flex items-center gap-1.5 text-xs font-mono">
              <span className={niftyChg >= 0 ? "text-emerald-400 font-semibold" : "text-rose-400 font-semibold"}>
                {niftyChg >= 0 ? "+" : ""}{niftyChg.toFixed(2)}%
              </span>
              <span className="text-gray-500 text-[10px]">Today</span>
            </div>
          </div>

          <div className="p-4 rounded-xl editorial-frame editorial-frame-hover space-y-1">
            <div className="flex items-center justify-between text-[10px] font-mono text-gray-400 uppercase">
              <span>BSE SENSEX</span>
              <span className="px-1.5 py-0.2 rounded bg-white/[0.04] border border-white/[0.06]">BSE</span>
            </div>
            <div className="text-2xl font-light font-mono text-white tracking-tight">
              {sensexPrice.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="flex items-center gap-1.5 text-xs font-mono">
              <span className={sensexChg >= 0 ? "text-emerald-400 font-semibold" : "text-rose-400 font-semibold"}>
                {sensexChg >= 0 ? "+" : ""}{sensexChg.toFixed(2)}%
              </span>
              <span className="text-gray-500 text-[10px]">Today</span>
            </div>
          </div>

          <div className="p-4 rounded-xl editorial-frame editorial-frame-hover space-y-1">
            <div className="flex items-center justify-between text-[10px] font-mono text-gray-400 uppercase">
              <span>INDIA VIX</span>
              <span className="px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-semibold">TRANQUIL</span>
            </div>
            <div className="text-2xl font-light font-mono text-white tracking-tight">
              {vixPrice.toFixed(2)}
            </div>
            <div className="flex items-center gap-1.5 text-xs font-mono">
              <span className={vixChg < 0 ? "text-emerald-400 font-semibold" : "text-rose-400 font-semibold"}>
                {vixChg.toFixed(2)}%
              </span>
              <span className="text-gray-500 text-[10px]">Volatility</span>
            </div>
          </div>
        </div>

        {/* 2. Interactive Ticker Search Terminal */}
        <div className="p-4 rounded-2xl editorial-frame space-y-3">
          <form onSubmit={handleFormSubmit} className="space-y-3">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="flex-1">
                <Input
                  placeholder="Enter Stock Symbol (e.g. TCS, INFY, RELIANCE, HDFCBANK)..."
                  value={tickerQuery}
                  onChange={(e) => setTickerQuery(e.target.value.toUpperCase())}
                  icon={<Search className="w-4 h-4 text-emerald-400" />}
                  className="py-2 text-xs font-mono bg-[#07080a]"
                />
              </div>
              <Button type="submit" variant="primary" size="sm" isLoading={isLoading} className="font-mono text-xs font-semibold py-2">
                <Search className="w-3.5 h-3.5 mr-1" />
                Query Quote
              </Button>
            </div>

            {/* Quick Suggestions */}
            <div className="flex items-center gap-1.5 flex-wrap text-xs text-gray-400 pt-0.5">
              <span className="text-[10px] font-mono text-gray-500 uppercase">POPULAR:</span>
              {POPULAR_TICKERS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    setTickerQuery(t);
                    handleSearchQuote(t);
                  }}
                  className="px-2 py-0.5 rounded bg-white/[0.03] hover:bg-white/[0.07] hover:text-emerald-400 border border-white/[0.06] font-mono text-[11px] transition-colors"
                >
                  {t}
                </button>
              ))}
            </div>
          </form>
        </div>

        {/* Stock Not Found State */}
        {notFoundSymbol && !quote && !isLoading && (
          <div className="p-6 rounded-xl editorial-frame border-rose-500/30 text-center space-y-1">
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto mb-1">
              <AlertCircle className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-white font-mono">Stock Symbol &apos;{notFoundSymbol}&apos; Not Found</h3>
            <p className="text-xs text-gray-400">Please verify the NSE ticker and try again.</p>
          </div>
        )}

        {/* Quote Result Card */}
        {quote && quote.current_price > 0 && (
          <div className="p-5 rounded-2xl editorial-frame border-emerald-500/30 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/[0.06]">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-bold font-mono text-white tracking-tight">
                    {quote.ticker}
                  </h2>
                  <span className="text-[10px] font-mono px-2 py-0.2 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    NSE
                  </span>
                </div>
                <p className="text-xs text-gray-300 font-sans">{quote.name}</p>
                <p className="text-[10px] text-gray-500 font-mono">{quote.sector} · {quote.industry}</p>
              </div>

              <div className="flex items-center gap-4">
                <div>
                  <span className="text-[9px] font-mono text-gray-400 uppercase tracking-widest block">Live Quote</span>
                  <span className="text-2xl font-light font-mono text-white block">
                    {formatCurrency(quote.current_price)}
                  </span>
                </div>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setIsBuyModalOpen(true)}
                  className="font-mono text-xs font-semibold"
                >
                  Buy {quote.ticker}
                </Button>
              </div>
            </div>

            {/* Fundamentals Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
              <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.05]">
                <span className="text-gray-500 text-[10px] uppercase block">Market Cap</span>
                <span className="text-white font-semibold text-xs mt-0.5 block">
                  {formatCompactINR(quote.market_cap)}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.05]">
                <span className="text-gray-500 text-[10px] uppercase block">Currency</span>
                <span className="text-white font-semibold text-xs mt-0.5 block">
                  {quote.currency}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.05]">
                <span className="text-gray-500 text-[10px] uppercase block">Sector</span>
                <span className="text-white font-semibold text-xs mt-0.5 block truncate">
                  {quote.sector}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.05]">
                <span className="text-gray-500 text-[10px] uppercase block">Industry</span>
                <span className="text-white font-semibold text-xs mt-0.5 block truncate">
                  {quote.industry}
                </span>
              </div>
            </div>

            {/* AI Research Fast Prompt */}
            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
                <p className="text-xs text-gray-300 font-sans">
                  Generate forensic research memorandum for {quote.ticker}
                </p>
              </div>

              <Link href={`/ai-analysis?ticker=${quote.ticker}`}>
                <Button variant="mint" size="sm" className="font-mono text-xs font-semibold py-1">
                  <span>AI Memo</span>
                  <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* 3. Sector Inflow / Outflow Matrix */}
        <section className="space-y-3 pt-2 border-t border-white/[0.06]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono tracking-widest text-emerald-400 uppercase font-semibold">
              SECTOR FLOW MATRIX
            </span>
            <span className="text-xs font-mono text-gray-500">NSE Sectoral Feeds</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {SECTORS_MATRIX.map((s) => {
              const isPos = s.flow === "in";
              return (
                <div
                  key={s.sector}
                  className="p-3.5 rounded-xl editorial-frame editorial-frame-hover space-y-2 font-mono"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">{s.sector}</span>
                    <span
                      className={`text-xs font-bold px-1.5 py-0.2 rounded ${
                        isPos
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                      }`}
                    >
                      {s.chg}
                    </span>
                  </div>
                  <div className="text-[11px] text-gray-400 font-sans">
                    Leaders: <span className="text-gray-300 font-mono">{s.leaders}</span>
                  </div>
                  <div className="pt-1.5 border-t border-white/[0.04] flex items-center justify-between text-[10px] text-gray-500">
                    <span>Volume: {s.vol}</span>
                    <span className={isPos ? "text-emerald-400" : "text-rose-400"}>
                      {isPos ? "Net Inflow" : "Net Outflow"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 4. Top Gainers & Losers Tables */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-2 border-t border-white/[0.06]">
          {/* Top Gainers Table */}
          <div className="p-4 rounded-2xl editorial-frame space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                <h3 className="text-xs font-semibold font-mono text-white uppercase tracking-wider">Top NSE Gainers</h3>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 font-semibold">+MOMENTUM</span>
            </div>

            <div className="divide-y divide-white/[0.04] text-xs font-mono">
              {TOP_GAINERS.map((g) => (
                <div key={g.ticker} className="py-2 flex items-center justify-between hover:bg-white/[0.02] px-1.5 rounded transition-colors">
                  <div>
                    <span className="font-bold text-white block">{g.ticker}</span>
                    <span className="text-[10px] text-gray-500 font-sans">{g.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-semibold text-white block">₹{g.price.toFixed(2)}</span>
                    <span className="text-emerald-400 font-bold text-[10px]">+{g.chg.toFixed(2)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Losers Table */}
          <div className="p-4 rounded-2xl editorial-frame space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
                <h3 className="text-xs font-semibold font-mono text-white uppercase tracking-wider">Top NSE Losers</h3>
              </div>
              <span className="text-[10px] font-mono text-rose-400 font-semibold">-DECLINE</span>
            </div>

            <div className="divide-y divide-white/[0.04] text-xs font-mono">
              {TOP_LOSERS.map((l) => (
                <div key={l.ticker} className="py-2 flex items-center justify-between hover:bg-white/[0.02] px-1.5 rounded transition-colors">
                  <div>
                    <span className="font-bold text-white block">{l.ticker}</span>
                    <span className="text-[10px] text-gray-500 font-sans">{l.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-semibold text-white block">₹{l.price.toFixed(2)}</span>
                    <span className="text-rose-400 font-bold text-[10px]">{l.chg.toFixed(2)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* Buy Modal */}
      {quote && (
        <BuyModal
          isOpen={isBuyModalOpen}
          onClose={() => setIsBuyModalOpen(false)}
          onSuccess={() => {
            window.dispatchEvent(new Event("portfolio-updated"));
          }}
          initialHolding={{
            id: null,
            ticker: quote.ticker,
            quantity: 0,
            average_buy_price: quote.current_price,
            current_price: quote.current_price,
            invested: 0,
            current_value: 0,
            profit: 0,
            returns: 0,
          }}
        />
      )}
    </>
  );
}

export default MarketPage;
