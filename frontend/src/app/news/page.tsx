"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { api } from "@/lib/api";
import { NewsItem, NewsMetadataResponse } from "@/types/news";
import { NewsCard } from "@/components/news/NewsCard";
import { ImportantNewsStrip } from "@/components/news/ImportantNewsStrip";
import { ArticleDetailModal } from "@/components/news/ArticleDetailModal";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import {
  Newspaper,
  Search,
  RefreshCw,
  RotateCcw,
  Building2,
  Globe,
  AlertTriangle,
  Zap,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const POPULAR_COMPANIES = [
  "ALL",
  "RELIANCE",
  "TCS",
  "INFY",
  "HDFCBANK",
  "TATAMOTORS",
  "ASIANPAINT",
  "ONGC",
  "ICICIBANK",
  "SBIN",
  "LT",
];

const CATEGORY_TABS = [
  "ALL",
  "Macro & Economy",
  "Policy & Regulation",
  "Commodities & Energy",
  "Geopolitical & Trade",
  "Corporate & Earnings",
  "Sector & Industry",
  "Global Markets",
];

export default function NewsPage() {
  const { success, error, info } = useToast();

  const [articles, setArticles] = useState<NewsItem[]>([]);
  const [metadata, setMetadata] = useState<NewsMetadataResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedCompany, setSelectedCompany] = useState("ALL");
  const [selectedSource, setSelectedSource] = useState("ALL");
  const [selectedImportance, setSelectedImportance] = useState("ALL");

  // Selected Article for Detail Modal
  const [activeArticle, setActiveArticle] = useState<NewsItem | null>(null);

  const fetchNews = useCallback(async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);

      const [newsRes, metaRes] = await Promise.all([
        api.getNews({
          limit: 100,
          category: selectedCategory !== "ALL" ? selectedCategory : undefined,
          company: selectedCompany !== "ALL" ? selectedCompany : undefined,
          source: selectedSource !== "ALL" ? selectedSource : undefined,
          importance: selectedImportance !== "ALL" ? selectedImportance : undefined,
          search: searchQuery.trim() || undefined,
        }),
        api.getNewsMetadata().catch(() => null),
      ]);

      setArticles(newsRes.news || []);
      if (metaRes) {
        setMetadata(metaRes);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || "Failed to load market news from backend.");
      error("News Feed Error", err?.message || "Could not retrieve news items.");
    } finally {
      setIsLoading(false);
    }
  }, [selectedCategory, selectedCompany, selectedSource, selectedImportance, searchQuery, error]);

  useEffect(() => {
    fetchNews();
  }, [fetchNews]);

  const handleSyncNews = async () => {
    try {
      setIsSyncing(true);
      info("Syncing Market Feeds", "Fetching latest regulatory & financial news...");
      const res = await api.syncNews();
      success("Sync Complete", res.message || "Market news synchronized successfully.");
      await fetchNews();
    } catch (err: any) {
      error("Sync Failed", err?.message || "Could not sync news providers.");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedCategory("ALL");
    setSelectedCompany("ALL");
    setSelectedSource("ALL");
    setSelectedImportance("ALL");
  };

  const highImpactArticles = useMemo(() => {
    return articles.filter((a) => a.importance?.toUpperCase() === "HIGH");
  }, [articles]);

  const isAnyFilterActive =
    searchQuery.trim() !== "" ||
    selectedCategory !== "ALL" ||
    selectedCompany !== "ALL" ||
    selectedSource !== "ALL" ||
    selectedImportance !== "ALL";

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 select-none">
      {/* Header */}
      <PageHeader
        eyebrow="REGULATORY & CAPITAL NEWSFEED"
        actions={
          <>
            {metadata && (
              <span className="text-xs font-mono text-gray-400 bg-white/[0.03] px-3 py-1.5 rounded-lg border border-white/[0.06] hidden sm:inline-block">
                <strong className="text-white">{metadata.total_count}</strong> Filings Stored
              </span>
            )}
            <Button
              variant="mint"
              size="sm"
              onClick={handleSyncNews}
              disabled={isSyncing}
              isLoading={isSyncing}
              className="font-mono text-xs font-semibold shadow-lg shadow-emerald-500/10"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isSyncing ? "animate-spin" : ""}`} />
              {isSyncing ? "Syncing..." : "Sync Feeds"}
            </Button>
          </>
        }
      />

      {/* Market Moving Highlights */}
      {!isAnyFilterActive && highImpactArticles.length > 0 && (
        <ImportantNewsStrip
          articles={highImpactArticles}
          onSelect={(article) => setActiveArticle(article)}
        />
      )}

      {/* Filter Hub */}
      <div className="p-5 rounded-2xl editorial-frame space-y-4">
        {/* Search & Source/Importance Dropdowns */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="flex-1 max-w-md">
            <Input
              placeholder="Search filings, policies, keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon={<Search className="w-4 h-4 text-emerald-400" />}
              className="py-1.5 text-xs font-mono bg-[#07080a]"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap text-xs font-mono">
            {/* Importance Filter */}
            <div className="flex items-center gap-1.5 bg-[#07080a] px-2.5 py-1.5 rounded-lg border border-white/[0.08] text-gray-300">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <select
                value={selectedImportance}
                onChange={(e) => setSelectedImportance(e.target.value)}
                className="bg-transparent text-gray-200 focus:outline-none cursor-pointer"
              >
                <option value="ALL" className="bg-[#07080a]">All Impact</option>
                <option value="HIGH" className="bg-[#07080a]">⚡ Market Moving (High)</option>
                <option value="MEDIUM" className="bg-[#07080a]">Normal (Medium)</option>
              </select>
            </div>

            {/* Source Dropdown */}
            {metadata && metadata.sources && metadata.sources.length > 0 && (
              <div className="flex items-center gap-1.5 bg-[#07080a] px-2.5 py-1.5 rounded-lg border border-white/[0.08] text-gray-300">
                <Globe className="w-3.5 h-3.5 text-gray-400" />
                <select
                  value={selectedSource}
                  onChange={(e) => setSelectedSource(e.target.value)}
                  className="bg-transparent text-gray-200 focus:outline-none cursor-pointer max-w-[150px] truncate"
                >
                  <option value="ALL" className="bg-[#07080a]">All Sources</option>
                  {metadata.sources.map((src) => (
                    <option key={src} value={src} className="bg-[#07080a]">
                      {src}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {isAnyFilterActive && (
              <button
                onClick={handleResetFilters}
                className="flex items-center gap-1 text-xs text-rose-400 hover:text-rose-300 px-2.5 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition-colors font-mono"
              >
                <RotateCcw className="w-3 h-3" />
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs font-mono">
          {CATEGORY_TABS.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
                  isSelected
                    ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold"
                    : "bg-white/[0.03] text-gray-400 hover:text-gray-200 hover:bg-white/[0.06] border border-white/[0.05]"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Quick Company Filters */}
        <div className="flex items-center gap-1.5 pt-3 border-t border-white/[0.05] overflow-x-auto pb-1 scrollbar-none text-xs font-mono">
          <span className="text-[10px] text-gray-500 uppercase tracking-wider mr-1 flex items-center gap-1 shrink-0">
            <Building2 className="w-3 h-3" />
            TICKER:
          </span>
          {POPULAR_COMPANIES.map((cmp) => {
            const isSelected = selectedCompany === cmp;
            return (
              <button
                key={cmp}
                onClick={() => setSelectedCompany(cmp)}
                className={`px-2.5 py-1 rounded font-mono text-[11px] whitespace-nowrap transition-all ${
                  isSelected
                    ? "bg-blue-500/20 text-blue-300 border border-blue-500/30 font-bold"
                    : "bg-white/[0.02] text-gray-400 hover:text-white border border-white/[0.04]"
                }`}
              >
                {cmp}
              </button>
            );
          })}
        </div>
      </div>

      {/* Loading Skeletons */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-48 rounded-2xl editorial-frame animate-pulse"
            />
          ))}
        </div>
      ) : errorMessage ? (
        <div className="p-12 text-center rounded-2xl editorial-frame border-rose-500/20 max-w-lg mx-auto space-y-4">
          <div className="w-12 h-12 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto text-xl">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white font-mono">Failed to Load Feeds</h3>
            <p className="text-xs text-gray-400 mt-1 font-sans">{errorMessage}</p>
          </div>
          <Button variant="primary" size="sm" onClick={fetchNews} className="font-mono text-xs">
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            Retry Connection
          </Button>
        </div>
      ) : articles.length === 0 ? (
        <div className="p-12 text-center rounded-2xl editorial-frame border-dashed space-y-4 max-w-lg mx-auto">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto">
            <Newspaper className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white font-mono">No Filings Found</h3>
            <p className="text-xs text-gray-400 mt-1 font-sans">
              No stories match your current filters. Try changing or resetting your search parameters.
            </p>
          </div>
          <div className="flex items-center justify-center gap-2">
            {isAnyFilterActive && (
              <Button variant="outline" size="sm" onClick={handleResetFilters} className="font-mono text-xs">
                <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                Reset Filters
              </Button>
            )}
            <Button variant="mint" size="sm" onClick={handleSyncNews} className="font-mono text-xs">
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
              Sync Fresh News
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.map((article, idx) => (
            <NewsCard
              key={article.id || idx}
              article={article}
              onSelect={(item) => setActiveArticle(item)}
            />
          ))}
        </div>
      )}

      {/* Article Detail Modal */}
      <ArticleDetailModal
        article={activeArticle}
        isOpen={!!activeArticle}
        onClose={() => setActiveArticle(null)}
      />
    </div>
  );
}
