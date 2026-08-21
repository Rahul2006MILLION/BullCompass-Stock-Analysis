"use client";

import React from "react";
import { NewsItem } from "@/types/news";
import {
  ExternalLink,
  Clock,
  Zap,
  Globe,
  Tag,
  Building2,
  ChevronRight,
  TrendingUp,
  TrendingDown,
} from "lucide-react";

interface NewsCardProps {
  article: NewsItem;
  onSelect: (article: NewsItem) => void;
}

function formatRelativeTime(dateStr: string): string {
  try {
    const pubDate = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - pubDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60 && diffMins >= 0) {
      return `${diffMins}m ago`;
    }
    if (diffHours < 24 && diffHours >= 0) {
      return `${diffHours}h ago`;
    }
    if (diffDays <= 7 && diffDays > 0) {
      return `${diffDays}d ago`;
    }
    return dateStr.split(" ")[0] || dateStr;
  } catch {
    return dateStr;
  }
}

export function NewsCard({ article, onSelect }: NewsCardProps) {
  const isHighImportance = article.importance?.toUpperCase() === "HIGH";

  return (
    <div
      onClick={() => onSelect(article)}
      className="editorial-frame editorial-frame-hover p-5 rounded-2xl flex flex-col justify-between cursor-pointer group space-y-4"
    >
      <div>
        {/* Meta telemetry bar */}
        <div className="flex items-center justify-between gap-2 mb-2 text-xs font-mono">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] px-2 py-0.5 rounded bg-white/[0.04] text-gray-300 border border-white/[0.06] flex items-center gap-1">
              <Globe className="w-3 h-3 text-gray-400" />
              {article.source}
            </span>

            <span className="text-[10px] px-2 py-0.5 rounded bg-white/[0.03] text-gray-400 border border-white/[0.05]">
              {article.category}
            </span>

            {isHighImportance && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 flex items-center gap-1 font-semibold">
                <Zap className="w-2.5 h-2.5 text-amber-400" />
                MARKET IMPACT
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 text-[11px] text-gray-400 shrink-0">
            <Clock className="w-3 h-3 text-gray-500" />
            <span>{formatRelativeTime(article.published_at)}</span>
          </div>
        </div>

        {/* Headline */}
        <h3 className="font-medium text-base text-white group-hover:text-emerald-400 transition-colors leading-snug font-sans mb-2">
          {article.title}
        </h3>

        {/* Summary */}
        {article.summary && (
          <p className="text-xs text-gray-400 line-clamp-3 leading-relaxed font-sans">
            {article.summary}
          </p>
        )}
      </div>

      {/* Footer / Entities & Direct Action */}
      <div className="pt-3 border-t border-white/[0.05] flex items-center justify-between gap-2 text-xs font-mono mt-auto">
        <div className="flex items-center gap-1.5 flex-wrap">
          {article.subcategory && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
              <Building2 className="w-2.5 h-2.5" />
              {article.subcategory}
            </span>
          )}
          {article.entities && article.entities.length > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20 font-bold">
              {article.entities[0].ticker || article.entities[0].sector}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          {article.source_url && (
            <a
              href={article.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-white p-1 rounded hover:bg-white/[0.06] transition-colors"
              title="Open source"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
          <button
            onClick={() => onSelect(article)}
            className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 font-semibold"
          >
            <span>View Research →</span>
          </button>
        </div>
      </div>
    </div>
  );
}
