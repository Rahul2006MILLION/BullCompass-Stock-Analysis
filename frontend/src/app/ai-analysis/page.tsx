"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { api } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import { AIAnalysisResult } from "@/types/market";
import { BuyModal } from "@/components/portfolio/BuyModal";
import {
  Bot,
  Sparkles,
  Search,
  CheckCircle,
  AlertTriangle,
  Compass,
  ArrowRight,
  ShoppingCart,
  Copy,
  Check,
} from "lucide-react";

const POPULAR_ANALYSIS_STOCKS = ["TCS", "INFY", "RELIANCE", "HDFCBANK", "TATAMOTORS"];

function AIAnalysisContent() {
  const searchParams = useSearchParams();
  const { error, success } = useToast();
  const [ticker, setTicker] = useState("");
  const [result, setResult] = useState<AIAnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isBuyModalOpen, setIsBuyModalOpen] = useState(false);

  useEffect(() => {
    const urlTicker = searchParams.get("ticker");
    if (urlTicker) {
      setTicker(urlTicker.toUpperCase());
      handleAnalyze(urlTicker.toUpperCase());
    }
  }, [searchParams]);

  const handleAnalyze = async (stockTicker: string) => {
    if (!stockTicker.trim()) return;
    try {
      setIsLoading(true);
      setResult(null);
      const data = await api.analyzeStock(stockTicker.trim().toUpperCase());
      setResult(data);
    } catch (err: any) {
      error("AI Analysis Failed", err?.message || "Could not complete analysis. Ensure Ollama service is running.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (!result?.analysis) return;
    navigator.clipboard.writeText(result.analysis);
    setIsCopied(true);
    success("Copied to Clipboard", "Analysis memorandum copied.");
    setTimeout(() => setIsCopied(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          <Bot className="w-6 h-6 text-emerald-400" />
          <span>AI Investment Analyst Terminal</span>
        </h1>
        <p className="text-xs text-gray-400 mt-1">
          Deep fundamental research, economic moat evaluations, and risk assessments powered by Ollama
        </p>
      </div>

      {/* Ticker Selector Input */}
      <Card className="p-6 bg-gradient-to-r from-[#0d121a] via-[#111724] to-[#0d121a]">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAnalyze(ticker);
          }}
          className="space-y-4"
        >
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="flex-1">
              <Input
                placeholder="Enter stock ticker (e.g. TCS, INFY, RELIANCE)..."
                value={ticker}
                onChange={(e) => setTicker(e.target.value.toUpperCase())}
                icon={<Search className="w-4 h-4" />}
                className="py-3 text-base font-mono"
              />
            </div>
            <Button type="submit" variant="primary" size="lg" isLoading={isLoading}>
              <Sparkles className="w-4 h-4 mr-1.5" />
              Generate AI Report
            </Button>
          </div>

          <div className="flex items-center gap-2 flex-wrap text-xs text-gray-400 pt-1">
            <span className="text-[11px] font-semibold text-gray-500 uppercase">Quick Analyze:</span>
            {POPULAR_ANALYSIS_STOCKS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => {
                  setTicker(t);
                  handleAnalyze(t);
                }}
                className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 hover:text-emerald-400 border border-white/6 font-mono transition-colors"
              >
                {t}
              </button>
            ))}
          </div>
        </form>
      </Card>

      {/* Loading Animation */}
      {isLoading && (
        <Card className="p-12 text-center space-y-4 border-emerald-500/20 bg-[#0d121a]/90 animate-pulse">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto animate-spin">
            <Compass className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Synthesizing Fundamental Intelligence</h3>
            <p className="text-xs text-gray-400 mt-1 max-w-md mx-auto">
              Connecting live yfinance market metrics with the Ollama reasoning engine to produce your institutional report...
            </p>
          </div>
        </Card>
      )}

      {/* Analysis Result Container */}
      {result && !isLoading && (
        <Card className="p-8 bg-[#0d121a] border-emerald-500/30 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white tracking-tight">
                  {result.company_name || result.ticker}
                </h2>
                <Badge variant="mint" size="sm">
                  {result.ticker} Investment Memorandum
                </Badge>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleCopy} className="text-xs">
                {isCopied ? (
                  <>
                    <Check className="w-3.5 h-3.5 mr-1 text-emerald-400" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 mr-1" />
                    Copy
                  </>
                )}
              </Button>

              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsBuyModalOpen(true)}
                className="text-xs"
              >
                <ShoppingCart className="w-3.5 h-3.5 mr-1" />
                Buy {result.ticker}
              </Button>
            </div>
          </div>

          {/* Formatted Analysis Body */}
          <div className="prose prose-invert max-w-none text-gray-300 text-sm leading-relaxed whitespace-pre-line font-sans space-y-4">
            {result.analysis}
          </div>

          {/* Compliance Disclaimer */}
          <div className="p-3.5 rounded-xl bg-white/2 border border-white/5 text-[11px] text-gray-500 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <span>
              Disclaimer: AI investment analysis is generated algorithmically for informational purposes only and does not constitute official financial or investment advice.
            </span>
          </div>
        </Card>
      )}

      {/* Buy Modal from AI terminal */}
      {result && (
        <BuyModal
          isOpen={isBuyModalOpen}
          onClose={() => setIsBuyModalOpen(false)}
          onSuccess={() => {
            window.dispatchEvent(new Event("portfolio-updated"));
          }}
          initialHolding={{
            id: null,
            ticker: result.ticker,
            quantity: 0,
            average_buy_price: 0,
            current_price: null,
            invested: 0,
            current_value: 0,
            profit: 0,
            returns: 0,
          }}
        />
      )}
    </div>
  );
}

export default function AIAnalysisPage() {
  return (
    <>
      <Header />
      <Suspense fallback={<div className="p-8 text-center text-gray-500">Loading AI Analyst...</div>}>
        <AIAnalysisContent />
      </Suspense>
    </>
  );
}
