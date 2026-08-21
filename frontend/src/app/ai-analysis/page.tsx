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
import { ExecutiveVerdictCard } from "@/components/research/ExecutiveVerdictCard";
import { PortfolioContextCard } from "@/components/research/PortfolioContextCard";
import { PriceMomentumCard } from "@/components/research/PriceMomentumCard";
import { EarningsQualityCard } from "@/components/research/EarningsQualityCard";
import { ValuationContextCard } from "@/components/research/ValuationContextCard";
import { ScenarioAnalysisCard } from "@/components/research/ScenarioAnalysisCard";
import { RiskMatrixCard } from "@/components/research/RiskMatrixCard";
import { ThesisInvalidationCard } from "@/components/research/ThesisInvalidationCard";
import { NewsTransmissionCard } from "@/components/research/NewsTransmissionCard";
import { QualityScoreBreakdownCard } from "@/components/research/QualityScoreBreakdownCard";
import { RatiosGrid } from "@/components/research/RatiosGrid";
import { FinancialStatementsTable } from "@/components/research/FinancialStatementsTable";
import { AIThesisMemo } from "@/components/research/AIThesisMemo";
import { BuyModal } from "@/components/portfolio/BuyModal";
import {
  Bot,
  Sparkles,
  Search,
  AlertTriangle,
  AlertCircle,
  Compass,
  ShoppingCart,
  Copy,
  Check,
  RefreshCw,
} from "lucide-react";

const POPULAR_ANALYSIS_STOCKS = [
  "HDFCBANK",
  "TCS",
  "INFY",
  "RELIANCE",
  "TATAMOTORS",
  "ASIANPAINT",
  "ICICIBANK",
  "LAURUSLABS",
  "LTF",
];

function AIAnalysisContent() {
  const searchParams = useSearchParams();
  const { error, success } = useToast();
  const [ticker, setTicker] = useState("");
  const [report, setReport] = useState<ComprehensiveResearchReport | null>(null);
  const [notFoundTicker, setNotFoundTicker] = useState<string | null>(null);
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
    const cleanTicker = stockTicker.trim().toUpperCase();
    if (!cleanTicker) return;
    try {
      setIsLoading(true);
      setNotFoundTicker(null);
      setReport(null);
      const data = await api.getResearchReport(cleanTicker);
      if (!data || !data.company_name || data.current_price <= 0) {
        setReport(null);
        setNotFoundTicker(cleanTicker);
        return;
      }
      setReport(data);
      setNotFoundTicker(null);
      success("Research Complete", `Generated comprehensive investment report for ${cleanTicker}`);
    } catch (err: any) {
      setReport(null);
      setNotFoundTicker(cleanTicker);
      error("Research Failed", err?.message || `We couldn't find a listed stock matching '${cleanTicker}'.`);
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
          <span>Institutional Long-Term Investment Research Engine</span>
        </h1>
        <p className="text-xs text-gray-400 mt-1">
          Audited multi-year 3-statement analysis, cash flow & earnings quality diagnosis, valuation modeling, scenario projections, and causal transmission
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
                placeholder="Enter stock ticker (e.g. HDFCBANK, TCS, RELIANCE, INFY, LAURUSLABS)..."
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
              Pulls multi-year audited statements → Computes 3Y CAGRs & margins → Evaluates solvency & valuation multiples → Diagnoses earnings quality (PAT vs CFO) → Synthesizes scenarios & institutional thesis.
            </p>
          </div>
        </Card>
      )}

      {/* Stock Not Found State */}
      {notFoundTicker && !report && !isLoading && (
        <Card className="p-8 bg-[#0e1420] border-rose-500/30 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-rose-500 opacity-80" />
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto mb-3.5">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-white tracking-tight">
            Stock Not Found
          </h3>
          <p className="text-sm text-gray-300 mt-2 max-w-md mx-auto">
            We couldn&apos;t find a listed stock matching &apos;<span className="font-mono font-semibold text-rose-400">{notFoundTicker}</span>&apos;.
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Please check the ticker/company name and try again.
          </p>
        </Card>
      )}

      {/* Full Comprehensive Research Report */}
      {report && !isLoading && (
        <div className="space-y-6">
          {/* 1. Hero Executive Verdict Card */}
          <ExecutiveVerdictCard
            verdict={report.final_verdict}
            decision={report.decision}
            valuation={report.valuation_assessment}
            momentum={report.price_momentum}
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

          {/* 2. Portfolio Context Overlay (Holdings / P&L / Allocation Risk) */}
          <PortfolioContextCard
            portfolio={report.portfolio_context}
            ticker={report.ticker}
          />

          {/* 3. Price Momentum & Technical Positioning Grid */}
          <PriceMomentumCard
            momentum={report.price_momentum}
          />

          {/* 4. Earnings Quality & Cash Flow Audit (PAT vs CFO) */}
          <EarningsQualityCard
            earningsQuality={report.earnings_quality}
          />

          {/* 5. Valuation Multiple & Multi-Factor Rationale */}
          <ValuationContextCard
            valuation={report.valuation_assessment}
            ratios={report.ratios}
            incomeStatement={report.income_statement}
          />

          {/* 6. Deterministic Quality Score Breakdown & Trend Signals */}
          <QualityScoreBreakdownCard
            breakdown={report.decision.score_breakdown}
            trends={report.historical_trends}
          />

          {/* 7. Key Financial Ratios Grid */}
          <RatiosGrid
            ratios={report.ratios}
            incomeStatement={report.income_statement}
          />

          {/* 8. Audited Multi-Year Financial Statements (Income Stmt, Balance Sheet, Cash Flow) */}
          <FinancialStatementsTable
            incomeStatement={report.income_statement}
            balanceSheet={report.balance_sheet}
            cashFlow={report.cash_flow}
          />

          {/* 9. News & Macroeconomic Transmission Engine */}
          <NewsTransmissionCard
            newsCausal={report.news_causal_analysis}
            sectorMacro={report.sector_macro}
            recentNews={report.recent_news}
            sector={report.sector}
          />

          {/* 10. Scenario Analysis (Bull, Base, Bear Projections) */}
          <ScenarioAnalysisCard
            scenarioAnalysis={report.scenario_analysis}
          />

          {/* 11. Categorized Downside Risk Radar */}
          <RiskMatrixCard
            riskMatrix={report.risk_matrix}
          />

          {/* 12. Thesis Invalidation Triggers & Numerical Stop Conditions */}
          <ThesisInvalidationCard
            thesisInvalidation={report.thesis_invalidation}
          />

          {/* 13. Institutional AI Research Memorandum with Epistemic Tagging */}
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
