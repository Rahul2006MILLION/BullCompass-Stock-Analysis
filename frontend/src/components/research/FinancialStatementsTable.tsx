"use client";

import React, { useState } from "react";
import {
  IncomeStatementData,
  BalanceSheetData,
  CashFlowData,
} from "@/types/research";
import { Card } from "@/components/ui/Card";
import { formatCurrency } from "@/lib/utils";
import { FileSpreadsheet, Layers, Coins } from "lucide-react";

interface FinancialStatementsTableProps {
  incomeStatement: IncomeStatementData;
  balanceSheet: BalanceSheetData;
  cashFlow: CashFlowData;
}

export function FinancialStatementsTable({
  incomeStatement,
  balanceSheet,
  cashFlow,
}: FinancialStatementsTableProps) {
  const [activeTab, setActiveTab] = useState<"income" | "balance" | "cashflow">("income");

  const years = incomeStatement.years || [];

  const renderVal = (val: number | null | undefined, isPct = false, isRaw = false) => {
    if (val === null || val === undefined || isNaN(val)) {
      return <span className="text-gray-600 font-mono">N/A</span>;
    }
    if (isPct) {
      const isPositive = val >= 0;
      return (
        <span className={`font-mono font-medium ${isPositive ? "text-emerald-400" : "text-rose-400"}`}>
          {val > 0 ? `+${val.toFixed(1)}%` : `${val.toFixed(1)}%`}
        </span>
      );
    }
    if (isRaw) {
      return <span className="font-mono text-gray-200">{val.toFixed(2)}</span>;
    }
    return (
      <span className="font-mono text-gray-200">
        ₹{val.toLocaleString("en-IN", { maximumFractionDigits: 1 })} Cr
      </span>
    );
  };

  return (
    <Card className="bg-[#0d121a]/95 border-white/8 space-y-4 shadow-xl">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/8 pb-4">
        <div>
          <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            Audited Financial Statements (Multi-Year)
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">
            Historical figures in ₹ Crores across audited fiscal year filings
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-[#141a24] p-1 rounded-xl border border-white/8 text-xs self-start sm:self-center">
          <button
            onClick={() => setActiveTab("income")}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === "income"
                ? "bg-emerald-500/20 text-emerald-400 font-semibold shadow-sm"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            Income Statement
          </button>
          <button
            onClick={() => setActiveTab("balance")}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === "balance"
                ? "bg-emerald-500/20 text-emerald-400 font-semibold shadow-sm"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            Balance Sheet
          </button>
          <button
            onClick={() => setActiveTab("cashflow")}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === "cashflow"
                ? "bg-emerald-500/20 text-emerald-400 font-semibold shadow-sm"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            Cash Flow
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#111622] text-gray-400 border-b border-white/8 uppercase text-[10px] tracking-wider font-mono">
            <tr>
              <th className="py-3 px-4 font-semibold">Line Item</th>
              {years.map((yr) => (
                <th key={yr} className="py-3 px-4 font-semibold text-right">
                  {yr}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 font-mono">
            {activeTab === "income" && (
              <>
                <tr className="hover:bg-white/2">
                  <td className="py-2.5 px-4 font-bold text-white">Total Revenue</td>
                  {years.map((yr) => (
                    <td key={yr} className="py-2.5 px-4 text-right">
                      {renderVal(incomeStatement.revenue[yr])}
                    </td>
                  ))}
                </tr>
                <tr className="hover:bg-white/2">
                  <td className="py-2.5 px-4 text-gray-400 pl-8">Operating Income (EBIT)</td>
                  {years.map((yr) => (
                    <td key={yr} className="py-2.5 px-4 text-right">
                      {renderVal(incomeStatement.operating_income[yr])}
                    </td>
                  ))}
                </tr>
                <tr className="hover:bg-white/2">
                  <td className="py-2.5 px-4 text-gray-400 pl-8">Operating Margin (%)</td>
                  {years.map((yr) => (
                    <td key={yr} className="py-2.5 px-4 text-right">
                      {renderVal(incomeStatement.operating_margin[yr], true)}
                    </td>
                  ))}
                </tr>
                <tr className="hover:bg-white/2">
                  <td className="py-2.5 px-4 text-gray-400 pl-8">EBITDA</td>
                  {years.map((yr) => (
                    <td key={yr} className="py-2.5 px-4 text-right">
                      {renderVal(incomeStatement.ebitda[yr])}
                    </td>
                  ))}
                </tr>
                <tr className="hover:bg-white/2 bg-white/1">
                  <td className="py-2.5 px-4 font-bold text-emerald-400">Net Profit (PAT)</td>
                  {years.map((yr) => (
                    <td key={yr} className="py-2.5 px-4 text-right font-bold text-emerald-400">
                      {renderVal(incomeStatement.net_income[yr])}
                    </td>
                  ))}
                </tr>
                <tr className="hover:bg-white/2">
                  <td className="py-2.5 px-4 text-gray-400 pl-8">Net Profit Margin (%)</td>
                  {years.map((yr) => (
                    <td key={yr} className="py-2.5 px-4 text-right">
                      {renderVal(incomeStatement.net_margin[yr], true)}
                    </td>
                  ))}
                </tr>
                <tr className="hover:bg-white/2">
                  <td className="py-2.5 px-4 text-gray-400 pl-8">Diluted EPS (₹)</td>
                  {years.map((yr) => (
                    <td key={yr} className="py-2.5 px-4 text-right">
                      {renderVal(incomeStatement.eps[yr], false, true)}
                    </td>
                  ))}
                </tr>
              </>
            )}

            {activeTab === "balance" && (
              <>
                <tr className="hover:bg-white/2">
                  <td className="py-2.5 px-4 font-bold text-white">Total Assets</td>
                  {years.map((yr) => (
                    <td key={yr} className="py-2.5 px-4 text-right">
                      {renderVal(balanceSheet.total_assets[yr])}
                    </td>
                  ))}
                </tr>
                <tr className="hover:bg-white/2">
                  <td className="py-2.5 px-4 text-gray-400 pl-8">Total Liabilities</td>
                  {years.map((yr) => (
                    <td key={yr} className="py-2.5 px-4 text-right">
                      {renderVal(balanceSheet.total_liabilities[yr])}
                    </td>
                  ))}
                </tr>
                <tr className="hover:bg-white/2 bg-white/1">
                  <td className="py-2.5 px-4 font-bold text-white">Shareholders Equity</td>
                  {years.map((yr) => (
                    <td key={yr} className="py-2.5 px-4 text-right font-bold text-white">
                      {renderVal(balanceSheet.total_equity[yr])}
                    </td>
                  ))}
                </tr>
                <tr className="hover:bg-white/2">
                  <td className="py-2.5 px-4 text-gray-400 pl-8">Cash & Equivalents</td>
                  {years.map((yr) => (
                    <td key={yr} className="py-2.5 px-4 text-right text-emerald-400">
                      {renderVal(balanceSheet.cash_and_equivalents[yr])}
                    </td>
                  ))}
                </tr>
                {!balanceSheet.is_financial_institution ? (
                  <>
                    <tr className="hover:bg-white/2">
                      <td className="py-2.5 px-4 text-gray-400 pl-8">Total Debt</td>
                      {years.map((yr) => (
                        <td key={yr} className="py-2.5 px-4 text-right text-rose-300">
                          {renderVal(balanceSheet.total_debt[yr])}
                        </td>
                      ))}
                    </tr>
                    <tr className="hover:bg-white/2">
                      <td className="py-2.5 px-4 text-gray-400 pl-8">Net Debt</td>
                      {years.map((yr) => (
                        <td key={yr} className="py-2.5 px-4 text-right">
                          {renderVal(balanceSheet.net_debt[yr])}
                        </td>
                      ))}
                    </tr>
                  </>
                ) : (
                  <>
                    <tr className="hover:bg-white/2">
                      <td className="py-2.5 px-4 text-blue-400 pl-8">Total Deposits (CASA + Term)</td>
                      {years.map((yr) => (
                        <td key={yr} className="py-2.5 px-4 text-right text-blue-300">
                          {renderVal(balanceSheet.deposits?.[yr])}
                        </td>
                      ))}
                    </tr>
                    <tr className="hover:bg-white/2">
                      <td className="py-2.5 px-4 text-blue-400 pl-8">Net Advances / Loan Book</td>
                      {years.map((yr) => (
                        <td key={yr} className="py-2.5 px-4 text-right text-blue-300">
                          {renderVal(balanceSheet.advances?.[yr])}
                        </td>
                      ))}
                    </tr>
                  </>
                )}
              </>
            )}

            {activeTab === "cashflow" && (
              <>
                {!cashFlow.is_applicable ? (
                  <tr>
                    <td colSpan={years.length + 1} className="py-8 text-center text-gray-400 font-mono">
                      Banking institutions are evaluated on Capital Adequacy, NIM, and Asset Quality (NPA) rather than standard industrial Free Cash Flow.
                    </td>
                  </tr>
                ) : (
                  <>
                    <tr className="hover:bg-white/2">
                      <td className="py-2.5 px-4 font-bold text-white">Cash from Operations (CFO)</td>
                      {years.map((yr) => (
                        <td key={yr} className="py-2.5 px-4 text-right font-bold text-emerald-400">
                          {renderVal(cashFlow.operating_cash_flow[yr])}
                        </td>
                      ))}
                    </tr>
                    <tr className="hover:bg-white/2">
                      <td className="py-2.5 px-4 text-gray-400 pl-8">Capital Expenditure (CapEx)</td>
                      {years.map((yr) => (
                        <td key={yr} className="py-2.5 px-4 text-right text-rose-300">
                          {renderVal(cashFlow.capital_expenditure[yr])}
                        </td>
                      ))}
                    </tr>
                    <tr className="hover:bg-white/2 bg-white/1">
                      <td className="py-2.5 px-4 font-bold text-emerald-300">Free Cash Flow (FCF)</td>
                      {years.map((yr) => (
                        <td key={yr} className="py-2.5 px-4 text-right font-bold text-emerald-300">
                          {renderVal(cashFlow.free_cash_flow[yr])}
                        </td>
                      ))}
                    </tr>
                  </>
                )}
              </>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
