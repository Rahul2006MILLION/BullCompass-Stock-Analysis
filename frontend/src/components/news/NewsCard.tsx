"use client";

import React from "react";
import { NewsItem } from "@/types/news";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  ExternalLink,
  Clock,
  Zap,
  Globe,
  Tag,
  Building2,
  ChevronRight,
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
    <Card
      className={`group transition-all duration-300 bg-[#0d121a]/95 hover:bg-[#111724] border-white/8 hover:border-white/20 relative flex flex-col justify-between cursor-pointer ${
        isHighImportance ? "hover:border-amber-500/30" : "hover:border-emerald-500/30"
      }`}
      onClick={() => onSelect(article)}
    >
      {/* Top accent bar for high importance */}
      {isHighImportance && (
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-amber-500 via-orange-400 to-amber-500" />
      )}

      <div>
        {/* Top Meta Bar */}
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white/5 text-gray-300 border border-white/8 flex items-center gap-1">
              <Globe className="w-3 h-3 text-gray-400" />
              {article.source}
            </span>

            <Badge variant="neutral" size="sm" className="text-[10px] py-0 px-2">
              <Tag className="w-2.5 h-2.5 mr-1 text-emerald-400" />
              {article.category}
            </Badge>

            {isHighImportance && (
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1 font-semibold">
                <Zap className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
                Market Moving
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 text-[11px] text-gray-400 font-mono shrink-0">
            <Clock className="w-3 h-3 text-gray-500" />
            <span>{formatRelativeTime(article.published_at)}</span>
          </div>
        </div>

        {/* Headline */}
        <h3 className="font-bold text-sm text-white group-hover:text-emerald-400 transition-colors leading-snug line-clamp-2 mb-2">
          {article.title}
        </h3>

        {/* Short Summary */}
        {article.summary && (
          <p className="text-xs text-gray-400 line-clamp-3 leading-relaxed mb-3">
            {article.summary}
          </p>
        )}
      </div>

      {/* Footer / Entities & Direct Action */}
      <div className="pt-3 border-t border-white/5 flex items-center justify-between gap-2 mt-auto">
        <div className="flex items-center gap-1.5 flex-wrap">
          {article.subcategory && (
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 flex items-center gap-1">
              <Building2 className="w-2.5 h-2.5" />
              {article.subcategory}
            </span>
          )}
          {article.entities && article.entities.length > 0 && (
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20">
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
              className="text-xs text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
              title="Open original article"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
          <button
            onClick={() => onSelect(article)}
            className="flex items-center gap-0.5 text-xs text-emerald-400 hover:text-emerald-300 font-medium group/btn"
          >
            <span>Details</span>
            <ChevronRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>
    </Card>
  );
}
