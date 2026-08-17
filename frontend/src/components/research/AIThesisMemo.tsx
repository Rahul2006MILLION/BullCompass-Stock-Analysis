"use client";

import React from "react";
import { Card } from "@/components/ui/Card";
import { Bot, Shield, Info, HelpCircle } from "lucide-react";

interface AIThesisMemoProps {
  thesisReport: string;
  ticker: string;
  ollamaStatus: "ONLINE" | "OFFLINE_FALLBACK";
}

export function AIThesisMemo({
  thesisReport,
  ticker,
  ollamaStatus,
}: AIThesisMemoProps) {
  // Format the text by transforming [FACT], [INFERENCE], [ASSUMPTION], [UNCERTAINTY] into badges
  const renderFormattedMarkdown = (text: string) => {
    const lines = text.split("\n");

    return lines.map((line, idx) => {
      // Headers
      if (line.startsWith("### ")) {
        return (
          <h4
            key={idx}
            className="text-base font-bold text-white font-mono tracking-tight mt-6 mb-2 border-b border-white/8 pb-1.5 flex items-center gap-2"
          >
            <span className="text-emerald-400">#</span>
            {line.replace("### ", "")}
          </h4>
        );
      }

      if (line.startsWith("## ")) {
        return (
          <h3 key={idx} className="text-lg font-bold text-white font-mono tracking-tight mt-6 mb-3">
            {line.replace("## ", "")}
          </h3>
        );
      }

      // Empty lines
      if (!line.trim()) {
        return <div key={idx} className="h-2" />;
      }

      // Format inline badges: [FACT], [INFERENCE], [ASSUMPTION], [UNCERTAINTY]
      let renderedContent = line;

      // Replace bold markdown **text**
      const parts = renderedContent.split(/(\[FACT\]|\[INFERENCE\]|\[ASSUMPTION\]|\[UNCERTAINTY\])/g);

      return (
        <p key={idx} className="text-xs text-gray-300 leading-relaxed font-sans py-0.5">
          {parts.map((part, pIdx) => {
            if (part === "[FACT]") {
              return (
                <span
                  key={pIdx}
                  className="inline-block px-1.5 py-0.5 mr-1.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 select-none align-middle"
                >
                  FACT
                </span>
              );
            }
            if (part === "[INFERENCE]") {
              return (
                <span
                  key={pIdx}
                  className="inline-block px-1.5 py-0.5 mr-1.5 rounded text-[10px] font-mono font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 select-none align-middle"
                >
                  INFERENCE
                </span>
              );
            }
            if (part === "[ASSUMPTION]") {
              return (
                <span
                  key={pIdx}
                  className="inline-block px-1.5 py-0.5 mr-1.5 rounded text-[10px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 select-none align-middle"
                >
                  ASSUMPTION
                </span>
              );
            }
            if (part === "[UNCERTAINTY]") {
              return (
                <span
                  key={pIdx}
                  className="inline-block px-1.5 py-0.5 mr-1.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 select-none align-middle"
                >
                  UNCERTAINTY
                </span>
              );
            }

            // Normal text
            return <span key={pIdx}>{part}</span>;
          })}
        </p>
      );
    });
  };

  return (
    <Card className="bg-[#0d121a]/95 border-white/8 space-y-4 shadow-2xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/8 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-bold text-white tracking-tight">
              Institutional AI Investment Memorandum ({ticker})
            </h3>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">
            16-part research report grounded in verified facts with strict epistemic tagging
          </p>
        </div>

        {/* Epistemic Legend */}
        <div className="flex items-center gap-2 flex-wrap text-[10px] font-mono bg-[#141a24] px-3 py-1.5 rounded-xl border border-white/8">
          <span className="text-gray-400 font-semibold">LEGEND:</span>
          <span className="text-emerald-400 font-bold bg-emerald-500/10 px-1 py-0.5 rounded">FACT</span>
          <span className="text-blue-400 font-bold bg-blue-500/10 px-1 py-0.5 rounded">INFERENCE</span>
          <span className="text-purple-400 font-bold bg-purple-500/10 px-1 py-0.5 rounded">ASSUMPTION</span>
          <span className="text-amber-400 font-bold bg-amber-500/10 px-1 py-0.5 rounded">UNCERTAINTY</span>
        </div>
      </div>

      {/* Report Content */}
      <div className="p-4 rounded-xl bg-[#090c12]/70 border border-white/4 space-y-1">
        {renderFormattedMarkdown(thesisReport)}
      </div>
    </Card>
  );
}
