"use client";

import React from "react";
import { motion } from "framer-motion";
import { Sparkles, ArrowRight, ShieldCheck, Target, Layers, Zap, Compass } from "lucide-react";
import Link from "next/link";

export function AIVerdictConclusionSection() {
  return (
    <section className="relative py-24 border-t border-white/[0.06] select-none">
      <div className="space-y-12">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <span className="text-[11px] font-mono tracking-[0.25em] text-emerald-400 uppercase font-semibold block">
              05 / THE INVESTMENT VERDICT
            </span>
            <h2 className="text-3xl sm:text-5xl font-normal tracking-tight text-white font-sans">
              What does this mean for <span className="font-editorial italic font-normal text-emerald-400">your capital</span>?
            </h2>
          </div>
          <p className="text-xs font-mono text-gray-400 max-w-xs leading-relaxed text-left md:text-right">
            THE FINAL SYNTHESIS: CONVICTION, PORTFOLIO IMPACT, AND RISK DEFENSE
          </p>
        </div>

        {/* Grand Institutional Decision Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="rounded-3xl editorial-frame p-8 lg:p-12 relative overflow-hidden space-y-10"
        >
          {/* Top Verdict Banner */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-8 border-b border-white/[0.06]">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                <span className="text-xs font-mono tracking-widest text-emerald-400 font-semibold uppercase">
                  ACTIVE AI SYNTHESIS
                </span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-light font-sans text-white">
                Recommendation: <strong className="font-bold text-emerald-400">OVERWEIGHT / ACCUMULATE</strong>
              </h3>
            </div>

            <div className="flex items-center gap-4 bg-white/[0.03] p-4 rounded-2xl border border-white/[0.06] font-mono">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center text-xl font-bold">
                88
              </div>
              <div>
                <span className="text-xs text-gray-400 block">AI Conviction Score</span>
                <span className="text-xs font-bold text-white uppercase tracking-wider block">High Margin of Safety</span>
              </div>
            </div>
          </div>

          {/* 4 Decision Pillars */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.05] space-y-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <Target className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-mono uppercase tracking-wider font-semibold text-white">1. Valuation Stance</h4>
              <p className="text-xs text-gray-400 leading-relaxed font-sans">
                Trading at 16.4% discount to 5-year historical median multiples with strong reverse-DCF downside support.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.05] space-y-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
                <Zap className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-mono uppercase tracking-wider font-semibold text-white">2. Catalyst Durability</h4>
              <p className="text-xs text-gray-400 leading-relaxed font-sans">
                Multi-year capital expenditure cycle with 180-240 bps operating margin expansion across core revenue streams.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.05] space-y-3">
              <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-mono uppercase tracking-wider font-semibold text-white">3. Invalidation Trigger</h4>
              <p className="text-xs text-gray-400 leading-relaxed font-sans">
                Strict exit discipline triggered if quarterly volume decelerates below 6% or debt leverage exceeds 1.4x EBITDA.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.05] space-y-3">
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
                <Layers className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-mono uppercase tracking-wider font-semibold text-white">4. Portfolio Impact</h4>
              <p className="text-xs text-gray-400 leading-relaxed font-sans">
                Recommended 6.0% - 8.5% portfolio weight with automated weighted cost accounting and periodic rebalancing.
              </p>
            </div>
          </div>

          {/* Action Hub */}
          <div className="pt-6 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs font-mono text-gray-400">
              Institutional intelligence powered by BullCompass Causal Engine · Free of retail noise.
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Link href="/ai-analysis" className="flex-1 sm:flex-initial">
                <button className="w-full sm:w-auto py-3 px-6 rounded-xl text-xs font-mono font-semibold bg-emerald-500 text-black hover:bg-emerald-400 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 hover:scale-[1.02] active:scale-[0.98]">
                  <Compass className="w-4 h-4" />
                  <span>Launch AI Terminal</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </Link>
              <Link href="/portfolio" className="flex-1 sm:flex-initial">
                <button className="w-full sm:w-auto py-3 px-6 rounded-xl text-xs font-mono font-semibold bg-white/[0.04] text-gray-200 hover:text-white hover:bg-white/[0.08] border border-white/[0.08] transition-all flex items-center justify-center gap-2">
                  <span>View Portfolio</span>
                </button>
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
