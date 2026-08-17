"use client";

import React from "react";
import { NewsItem } from "@/types/news";
import { Zap, Clock, ExternalLink, ChevronRight, Flame } from "lucide-react";
import { motion } from "framer-motion";

interface ImportantNewsStripProps {
  articles: NewsItem[];
  onSelect: (article: NewsItem) => void;
}

export function ImportantNewsStrip({ articles, onSelect }: ImportantNewsStripProps) {
  if (!articles || articles.length === 0) return null;

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-amber-500/20 text-amber-400 flex items-center justify-center">
            <Flame className="w-3.5 h-3.5 fill-amber-400" />
          </div>
          <h2 className="text-xs font-bold font-mono uppercase tracking-wider text-amber-300">
            Market Moving & High-Impact Developments
          </h2>
        </div>
        <span className="text-[11px] font-mono text-gray-400">
          {articles.length} priority items
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {articles.slice(0, 3).map((article, idx) => (
          <motion.div
            key={article.id || idx}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: idx * 0.05 }}
            onClick={() => onSelect(article)}
            className="group relative p-3.5 rounded-2xl bg-gradient-to-b from-[#141b26] to-[#0d121a] border border-amber-500/20 hover:border-amber-500/40 transition-all duration-300 cursor-pointer shadow-lg shadow-amber-500/5 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/25 flex items-center gap-1 font-semibold">
                  <Zap className="w-2.5 h-2.5 fill-amber-400" />
                  {article.category}
                </span>
                <span className="text-[10px] text-gray-400 font-mono">
                  {article.source}
                </span>
              </div>

              <h4 className="font-bold text-xs text-white group-hover:text-amber-300 transition-colors leading-snug line-clamp-2 mb-1.5">
                {article.title}
              </h4>

              {article.summary && (
                <p className="text-[11px] text-gray-400 line-clamp-2 leading-relaxed">
                  {article.summary}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between pt-2.5 mt-2.5 border-t border-white/5 text-[11px] text-gray-400">
              <span className="font-mono text-[10px] text-gray-500">
                {article.published_at.split(" ")[1]?.slice(0, 5) || article.published_at.split(" ")[0]}
              </span>
              <span className="flex items-center gap-0.5 text-amber-400 group-hover:translate-x-0.5 transition-transform font-medium text-xs">
                Inspect <ChevronRight className="w-3 h-3" />
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
