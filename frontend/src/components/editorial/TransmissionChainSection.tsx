"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Newspaper, Zap, Layers, Building2, Scale, Target, CheckCircle2 } from "lucide-react";

interface TransmissionStep {
  step: string;
  stage: string;
  title: string;
  description: string;
  metric: string;
  metricLabel: string;
  icon: React.ElementType;
}

const TRANSMISSION_STEPS: TransmissionStep[] = [
  {
    step: "01",
    stage: "MACRO & NEWS INGESTION",
    title: "Real-time Regulatory & News Filtering",
    description: "Algorithmic parsing of Ministry gazettes, RBI policy minutes, exchange disclosures, and corporate order wins.",
    metric: "4,200+ Feeds/min",
    metricLabel: "NLP Extraction Velocity",
    icon: Newspaper,
  },
  {
    step: "02",
    stage: "CATALYST EXTRACTION",
    title: "Causal Profit Drivers Identified",
    description: "Extracting revenue catalysts: capacity expansions, commodity cost deflators, pricing power, and volume shifts.",
    metric: "88.4%",
    metricLabel: "Catalyst Precision",
    icon: Zap,
  },
  {
    step: "03",
    stage: "SECTOR ROTATION",
    title: "Capital Flow Modeling",
    description: "Tracking institutional liquidity rotation across NSE sectors and identifying multiple expansion tailwinds.",
    metric: "₹18,400 Cr",
    metricLabel: "Rotational Velocity",
    icon: Layers,
  },
  {
    step: "04",
    stage: "COMPANY SELECTION",
    title: "Moat & Management Screening",
    description: "Filtering listed universe for pricing dominance, low debt leverage, and high reinvestment rates.",
    metric: "Top 5%",
    metricLabel: "Universe Filter Gate",
    icon: Building2,
  },
  {
    step: "05",
    stage: "EARNINGS QUALITY",
    title: "Forensic Accounting & Accruals",
    description: "Beneish M-Score manipulation audits, cash conversion verification, and working capital stress tests.",
    metric: "0.94 FCF / NI",
    metricLabel: "Accrual Quality Index",
    icon: Scale,
  },
  {
    step: "06",
    stage: "PRICE DISCOVERY",
    title: "Intrinsic Margin of Safety Target",
    description: "Synthesizing reverse DCF, historical multiple deviations, and AI conviction into actionable price targets.",
    metric: "18.4%",
    metricLabel: "Median Margin of Safety",
    icon: Target,
  },
];

export function TransmissionChainSection() {
  const [activeStep, setActiveStep] = useState(0);

  return (
    <section className="relative py-24 border-t border-white/[0.06] select-none">
      <div className="space-y-12">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <span className="text-[11px] font-mono tracking-[0.25em] text-emerald-400 uppercase font-semibold block">
              02 / CAUSAL TRANSMISSION PIPELINE
            </span>
            <h2 className="text-3xl sm:text-5xl font-normal tracking-tight text-white font-sans">
              From raw catalyst to <span className="font-editorial italic font-normal text-emerald-400">fundamental conviction</span>.
            </h2>
          </div>
          <p className="text-xs font-mono text-gray-400 max-w-sm leading-relaxed text-left md:text-right">
            SIX RIGOROUS GATES CONNECTING MACRO DEVELOPMENTS TO PORTFOLIO VALUATIONS
          </p>
        </div>

        {/* Transmission Chain Interactive Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {TRANSMISSION_STEPS.map((item, idx) => {
            const Icon = item.icon;
            const isHovered = activeStep === idx;

            return (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{ duration: 0.5, delay: idx * 0.06, ease: [0.16, 1, 0.3, 1] }}
                onMouseEnter={() => setActiveStep(idx)}
                className={`p-7 rounded-2xl editorial-frame transition-all duration-300 relative overflow-hidden group cursor-pointer ${
                  isHovered ? "border-emerald-500/40 bg-white/[0.04]" : "hover:border-white/15"
                }`}
              >
                {/* Step Top Bar */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-emerald-400/90">{item.step}</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/50" />
                    <span className="text-[10px] font-mono text-gray-400 tracking-wider uppercase font-semibold">
                      {item.stage}
                    </span>
                  </div>
                  <div className="w-8 h-8 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center text-gray-300 group-hover:text-emerald-400 group-hover:border-emerald-500/30 transition-colors">
                    <Icon className="w-4 h-4" />
                  </div>
                </div>

                {/* Content */}
                <div className="space-y-2">
                  <h3 className="text-base font-semibold text-white tracking-tight group-hover:text-emerald-300 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-xs text-gray-400 leading-relaxed font-sans">
                    {item.description}
                  </p>
                </div>

                {/* Micro Metric Datum */}
                <div className="mt-6 pt-4 border-t border-white/[0.05] flex items-center justify-between font-mono text-xs">
                  <span className="text-gray-500 text-[11px]">{item.metricLabel}</span>
                  <span className="text-emerald-400 font-semibold">{item.metric}</span>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Visual Continuity Bar */}
        <div className="p-6 rounded-2xl editorial-frame bg-gradient-to-r from-[#0a0e17] via-[#0d1320] to-[#0a0e17] flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-xs text-gray-300">
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>TRANSMISSION MODEL: Full Causal Integrity Across 2,800+ NSE Equities</span>
          </div>
          <span className="text-emerald-400 font-semibold tracking-wider uppercase text-[11px]">
            LATENCY: ZERO DATA HALLUCINATIONS
          </span>
        </div>
      </div>
    </section>
  );
}
