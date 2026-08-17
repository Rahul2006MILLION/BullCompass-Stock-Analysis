"use client";

import React from "react";
import Link from "next/link";
import { NewsItem } from "@/types/news";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  ExternalLink,
  Clock,
  Globe,
  Tag,
  Building2,
  Zap,
  Bot,
  Share2,
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";

interface ArticleDetailModalProps {
  article: NewsItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ArticleDetailModal({
  article,
  isOpen,
  onClose,
}: ArticleDetailModalProps) {
  const { success } = useToast();

  if (!article) return null;

  const isHighImportance = article.importance?.toUpperCase() === "HIGH";
  const associatedTicker = article.subcategory || (article.entities?.[0]?.ticker);

  const handleShare = () => {
    if (article.source_url) {
      navigator.clipboard.writeText(article.source_url);
      success("Link Copied", "Article URL copied to clipboard.");
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Market Intelligence Report"
      subtitle={`${article.source} • ${article.published_at}`}
      maxWidth="lg"
    >
      <div className="space-y-4">
        {/* Top Badges & Meta */}
        <div className="flex items-center justify-between gap-2 flex-wrap pb-3 border-b border-white/8">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="mint" size="sm">
              <Tag className="w-3 h-3 mr-1" />
              {article.category}
            </Badge>

            {isHighImportance && (
              <Badge variant="coral" size="sm">
                <Zap className="w-3 h-3 mr-1 fill-rose-400" />
                High Market Impact
              </Badge>
            )}

            {article.subcategory && (
              <Badge variant="neutral" size="sm">
                <Building2 className="w-3 h-3 mr-1" />
                {article.subcategory}
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-1.5 text-xs text-gray-400 font-mono">
            <Clock className="w-3.5 h-3.5 text-gray-500" />
            <span>{article.published_at}</span>
          </div>
        </div>

        {/* Headline */}
        <h2 className="text-lg font-bold text-white leading-relaxed">
          {article.title}
        </h2>

        {/* Source & Ingestion Metadata */}
        <div className="p-3 rounded-xl bg-[#111722] border border-white/5 flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-emerald-400" />
            <div>
              <span className="text-gray-400 block text-[10px]">Source Wire</span>
              <span className="text-white font-semibold">{article.source}</span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-gray-400 block text-[10px]">Article ID</span>
            <span className="text-gray-300">{article.id}</span>
          </div>
        </div>

        {/* Full Summary / Content */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-gray-400">
            Event Summary & Context
          </h4>
          <div className="p-4 rounded-xl bg-[#080b10] border border-white/6 text-gray-300 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">
            {article.raw_content || article.summary || "No extended summary provided."}
          </div>
        </div>

        {/* Associated Entity Mapping if present */}
        {article.entities && article.entities.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-gray-400">
              Identified Entity Exposures
            </h4>
            <div className="flex gap-2 flex-wrap">
              {article.entities.map((ent, i) => (
                <div
                  key={i}
                  className="px-3 py-1.5 rounded-xl bg-[#141a24] border border-white/8 text-xs font-mono flex items-center gap-2"
                >
                  <span className="font-bold text-emerald-400">
                    {ent.ticker || ent.sector}
                  </span>
                  <span className="text-gray-500">•</span>
                  <span className="text-gray-400 text-[11px]">{ent.exposure_type}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                      ent.sentiment_hint === "POSITIVE"
                        ? "bg-emerald-500/20 text-emerald-300"
                        : ent.sentiment_hint === "NEGATIVE"
                        ? "bg-rose-500/20 text-rose-300"
                        : "bg-gray-500/20 text-gray-300"
                    }`}
                  >
                    {ent.sentiment_hint}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Controls */}
        <div className="flex items-center justify-between gap-3 pt-4 border-t border-white/8">
          <Button variant="ghost" size="sm" onClick={handleShare}>
            <Share2 className="w-3.5 h-3.5 mr-1.5" />
            Share / Copy Link
          </Button>

          <div className="flex items-center gap-2">
            {associatedTicker && (
              <Link href={`/ai-analysis?ticker=${encodeURIComponent(associatedTicker)}`}>
                <Button variant="primary" size="sm">
                  <Bot className="w-3.5 h-3.5 mr-1.5" />
                  AI Analyze {associatedTicker}
                </Button>
              </Link>
            )}

            {article.source_url && (
              <a
                href={article.source_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="outline" size="sm">
                  <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                  Open Source Wire
                </Button>
              </a>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
