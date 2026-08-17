"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { api } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import { CompanyQuote } from "@/types/market";
import { formatCurrency, formatCompactINR } from "@/lib/utils";
import { BuyModal } from "@/components/portfolio/BuyModal";
import {
  TrendingUp,
  Search,
  Building2,
  Globe2,
  Layers,
  IndianRupee,
  ShoppingCart,
  Sparkles,
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
];

export function MarketPage() {
  const { error } = useToast();
  const [tickerQuery, setTickerQuery] = useState("");
  const [quote, setQuote] = useState<CompanyQuote | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isBuyModalOpen, setIsBuyModalOpen] = useState(false);

  const handleSearchQuote = async (symbol: string) => {
    if (!symbol.trim()) return;
    try {
      setIsLoading(true);
      const data = await api.getCompanyQuote(symbol.trim().toUpperCase());
      setQuote(data);
    } catch (err: any) {
      error("Lookup Failed", err?.message || `Could not fetch quote for ${symbol}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearchQuote(tickerQuery);
  };

  return (
    <>
      <Header />

      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-emerald-400" />
            <span>Market Intelligence & Quotes</span>
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Real-time market valuation, company fundamentals, and instant order placement
          </p>
        </div>

        {/* Ticker Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
          <Card className="p-6 bg-gradient-to-r from-[#0d121a] via-[#111724] to-[#0d121a]">
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="flex-1">
                  <Input
                    placeholder="Enter Stock Symbol (e.g. TCS, INFY, RELIANCE)..."
                    value={tickerQuery}
                    onChange={(e) => setTickerQuery(e.target.value.toUpperCase())}
                    icon={<Search className="w-4 h-4" />}
                    className="py-3 text-base font-mono"
                  />
                </div>
                <Button type="submit" variant="primary" size="lg" isLoading={isLoading}>
                  <Search className="w-4 h-4 mr-1.5" />
                  Fetch Live Quote
                </Button>
              </div>

              {/* Quick Suggestions */}
              <div className="flex items-center gap-2 flex-wrap text-xs text-gray-400 pt-1">
                <span className="text-[11px] font-semibold text-gray-500 uppercase">Popular:</span>
                {POPULAR_TICKERS.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => {
                      setTickerQuery(t);
                      handleSearchQuote(t);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 hover:text-emerald-400 border border-white/6 font-mono transition-colors"
                  >
                    {t}
                  </button>
                ))}
              </div>
            </form>
          </Card>
        </motion.div>

        {/* Quote Result Card */}
        {quote && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-6"
          >
            <Card className="p-6 bg-[#0e1420] border-emerald-500/30">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-white/8">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-bold text-white tracking-tight">
                      {quote.name || quote.ticker}
                    </h2>
                    <Badge variant="mint" size="md">
                      {quote.ticker}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-400 mt-1 flex items-center gap-2">
                    <span>{quote.sector}</span>
                    <span>•</span>
                    <span>{quote.industry}</span>
                    <span>•</span>
                    <span>{quote.country}</span>
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className="text-xs text-gray-400 block uppercase tracking-wider">
                      Live Price
                    </span>
                    <span className="text-3xl font-bold font-mono text-white">
                      {formatCurrency(quote.current_price)}
                    </span>
                  </div>

                  <Button
                    variant="primary"
                    size="lg"
                    onClick={() => setIsBuyModalOpen(true)}
                    className="shadow-lg shadow-emerald-500/25"
                  >
                    <ShoppingCart className="w-4 h-4 mr-1.5" />
                    Buy {quote.ticker}
                  </Button>
                </div>
              </div>

              {/* Fundamentals Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 text-xs font-mono">
                <div className="p-3.5 rounded-xl bg-white/3 border border-white/5">
                  <span className="text-gray-400 block text-[11px]">Market Capitalization</span>
                  <span className="text-white font-semibold text-sm mt-1 block">
                    {formatCompactINR(quote.market_cap)}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-white/3 border border-white/5">
                  <span className="text-gray-400 block text-[11px]">Currency</span>
                  <span className="text-white font-semibold text-sm mt-1 block">
                    {quote.currency}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-white/3 border border-white/5">
                  <span className="text-gray-400 block text-[11px]">Sector</span>
                  <span className="text-white font-semibold text-sm mt-1 block truncate">
                    {quote.sector}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-white/3 border border-white/5">
                  <span className="text-gray-400 block text-[11px]">Industry</span>
                  <span className="text-white font-semibold text-sm mt-1 block truncate">
                    {quote.industry}
                  </span>
                </div>
              </div>

              {/* AI Analysis Fast CTA */}
              <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-emerald-950/40 via-[#0d1622] to-transparent border border-emerald-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">
                      Want deeper fundamental research on {quote.ticker}?
                    </p>
                    <p className="text-xs text-gray-400">
                      Run AI competitive moat and valuation analysis with Ollama.
                    </p>
                  </div>
                </div>

                <Link href={`/ai-analysis?ticker=${quote.ticker}`}>
                  <Button variant="mint" size="sm">
                    Analyze with AI
                  </Button>
                </Link>
              </div>
            </Card>
          </motion.div>
        )}
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
