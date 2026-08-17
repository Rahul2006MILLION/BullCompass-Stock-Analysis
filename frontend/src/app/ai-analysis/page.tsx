"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { api } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import { ComprehensiveResearchReport } from "@/types/research";
import { InvestmentAssessmentCard } from "@/components/research/InvestmentAssessmentCard";
import { FinancialStatementsTable } from "@/components/research/FinancialStatementsTable";
import { RatiosGrid } from "@/components/research/RatiosGrid";
import { QualityScoreBreakdownCard } from "@/components/research/QualityScoreBreakdownCard";
import { AIThesisMemo } from "@/components/research/AIThesisMemo";
import { BuyModal } from "@/components/portfolio/BuyModal";
import {
  Bot,
  Sparkles,
  Search,
  AlertTriangle,
  Compass,
  ShoppingCart,
  Copy,
  Check,
  RefreshCw,
  FileSpreadsheet,
  Layers,
} from "lucide-react";

const POPULAR_ANALYSIS_STOCKS = [
  "HDFCBANK",
  "TCS",
  "INFY",
  "RELIANCE",
  "TATAMOTORS",
  "ASIANPAINT",
  "ICICIBANK",
];

function AIAnalysisContent() {
  const searchParams = useSearchParams();
  const { error, success } = useToast();
  const [ticker, setTicker] = useState("");
  const [report, setReport] = useState<ComprehensiveResearchReport | null>(null);
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
      setReport(null);
      const data = await api.getResearchReport(stockTicker.trim().toUpperCase());
      setReport(data);
      success("Research Complete", `Generated comprehensive investment report for ${stockTicker.toUpperCase()}`);
    } catch (err: any) {
      error("Research Failed", err?.message || "Could not complete fundamental analysis.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (!report?.ai_thesis_report) return;
    navigator.clipboard.writeText(report.ai_thesis_report);
    setIsCopied(true);
    success("Copied to Clipboard", "Investment research memorandum copied.");
    setTimeout(() => setIsCopied(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
          <Bot className="w-6 h-6 text-emerald-400" />
          <span>Long-Term Investment Research & Decision Terminal</span>
        </h1>
        <p className="text-xs text-gray-400 mt-1">
          Evidence-grounded fundamental scoring, audited 3-statement analysis, valuation modeling, and AI investment theses
        </p>
      </div>

      {/* Ticker Search Bar */}
      <Card className="p-5 bg-gradient-to-r from-[#0d121a] via-[#111724] to-[#0d121a] border-white/10 shadow-xl">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAnalyze(ticker);
          }}
          className="space-y-3.5"
        >
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="flex-1">
              <Input
                placeholder="Enter stock ticker (e.g. HDFCBANK, TCS, RELIANCE, INFY)..."
                value={ticker}
                onChange={(e) => setTicker(e.target.value.toUpperCase())}
                icon={<Search className="w-4 h-4" />}
                className="py-2.5 text-sm font-mono"
              />
            </div>
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isLoading}
              className="shadow-lg shadow-emerald-500/20"
            >
              <Sparkles className="w-4 h-4 mr-1.5" />
              Analyze Investment
            </Button>
          </div>

          <div className="flex items-center gap-2 flex-wrap text-xs text-gray-400 pt-1">
            <span className="text-[11px] font-semibold text-gray-500 uppercase font-mono">
              Quick Research:
            </span>
            {POPULAR_ANALYSIS_STOCKS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => {
                  setTicker(t);
                  handleAnalyze(t);
                }}
                className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-emerald-500/10 hover:text-emerald-400 border border-white/6 font-mono text-[11px] transition-all hover:-translate-y-0.5 active:scale-95"
              >
                {t}
              </button>
            ))}
          </div>
        </form>
      </Card>

      {/* Loading Radar */}
      {isLoading && (
        <Card className="p-12 text-center space-y-4 border-emerald-500/20 bg-[#0d121a]/95 shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto animate-spin">
            <Compass className="w-7 h-7" />
          </div>
          <div className="space-y-1.5 max-w-md mx-auto">
            <h3 className="text-base font-bold text-white font-mono">
              Executing Multi-Stage Investment Research Pipeline
            </h3>
            <p className="text-xs text-gray-400">
              Pulls multi-year audited statements → Computes 3Y CAGRs & margins → Evaluates solvency & valuation multiples → Computes deterministic Quality Score → Synthesizes institutional thesis via Ollama.
            </p>
          </div>
        </Card>
      )}

      {/* Full Comprehensive Research Report */}
      {report && !isLoading && (
        <div className="space-y-6">
          {/* 1. Hero Investment Assessment Card */}
          <InvestmentAssessmentCard
            decision={report.decision}
            ticker={report.ticker}
            companyName={report.company_name}
            currentPrice={report.current_price}
            marketCap={report.market_cap}
            sector={report.sector}
            industry={report.industry}
            ollamaStatus={report.ollama_status}
          />

          {/* Action Toolbar */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-[#0d121a]/90 border border-white/8">
            <div className="flex items-center gap-2 text-xs text-gray-400 font-mono">
              <span>Report Generated: <strong>{new Date(report.generated_at).toLocaleTimeString()}</strong></span>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleCopy} className="text-xs py-1.5">
                {isCopied ? (
                  <>
                    <Check className="w-3.5 h-3.5 mr-1 text-emerald-400" />
                    Copied Memo
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 mr-1" />
                    Copy Memo
                  </>
                )}
              </Button>

              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsBuyModalOpen(true)}
                className="text-xs py-1.5 font-medium"
              >
                <ShoppingCart className="w-3.5 h-3.5 mr-1" />
                Buy {report.ticker}
              </Button>
            </div>
          </div>

          {/* 2. Deterministic Quality Score Breakdown & Trend Signals */}
          <QualityScoreBreakdownCard
            breakdown={report.decision.score_breakdown}
            trends={report.historical_trends}
          />

          {/* 3. Key Financial Ratios Grid */}
          <RatiosGrid
            ratios={report.ratios}
            incomeStatement={report.income_statement}
          />

          {/* 4. Audited Multi-Year Financial Statements */}
          <FinancialStatementsTable
            incomeStatement={report.income_statement}
            balanceSheet={report.balance_sheet}
            cashFlow={report.cash_flow}
          />

          {/* 5. Institutional AI Research Memorandum with Epistemic Tagging */}
          <AIThesisMemo
            thesisReport={report.ai_thesis_report}
            ticker={report.ticker}
            ollamaStatus={report.ollama_status}
          />

          {/* Regulatory Disclaimer */}
          <div className="p-4 rounded-xl bg-white/2 border border-white/6 text-xs text-gray-500 flex items-start gap-2.5 font-mono">
            <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <span>
              Disclaimer: BullCompass research reports and fundamental scores are produced through deterministic algorithmic calculations and LLM natural-language synthesis for educational and decision-support purposes only. They do not constitute personalized financial or investment advice.
            </span>
          </div>
        </div>
      )}

      {/* Buy Modal from AI terminal */}
      {report && (
        <BuyModal
          isOpen={isBuyModalOpen}
          onClose={() => setIsBuyModalOpen(false)}
          onSuccess={() => {
            window.dispatchEvent(new Event("portfolio-updated"));
          }}
          initialHolding={{
            id: null,
            ticker: report.ticker,
            quantity: 0,
            average_buy_price: report.current_price,
            current_price: report.current_price,
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
      <Suspense fallback={<div className="p-8 text-center text-gray-500">Loading AI Analyst Terminal...</div>}>
        <AIAnalysisContent />
      </Suspense>
    </>
  );
}
