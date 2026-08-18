import {
  PortfolioSummary,
  PortfolioHistorySnapshot,
  BuyStockPayload,
  SellStockPayload,
  AddHoldingPayload,
  UpdateHoldingPayload,
} from "@/types/portfolio";
import { Transaction } from "@/types/transaction";
import { CompanyQuote, AIAnalysisResult } from "@/types/market";
import {
  NewsItem,
  NewsListResponse,
  NewsMetadataResponse,
  NewsSyncResponse,
  NewsFilterParams,
} from "@/types/news";
import { ComprehensiveResearchReport } from "@/types/research";
import { WatchlistItem, WatchlistResponse } from "@/types/watchlist";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function fetchJson<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
    cache: "no-store",
  });

  if (!response.ok) {
    let errorMessage = `API Error (${response.status}): ${response.statusText}`;
    try {
      const errorJson = await response.json();
      if (errorJson.detail) {
        errorMessage = errorJson.detail;
      }
    } catch {
      // ignore parse error
    }
    throw new Error(errorMessage);
  }

  return response.json();
}

export const api = {
  // Portfolio
  getPortfolio: (): Promise<PortfolioSummary> => {
    return fetchJson<PortfolioSummary>("/api/portfolio");
  },

  addHolding: (payload: AddHoldingPayload): Promise<{ status: string; message: string }> => {
    return fetchJson<{ status: string; message: string }>("/api/portfolio/holdings", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  updateHolding: (
    holdingId: number,
    payload: UpdateHoldingPayload
  ): Promise<{ status: string; message: string }> => {
    return fetchJson<{ status: string; message: string }>(`/api/portfolio/holdings/${holdingId}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },

  deleteHolding: (holdingId: number): Promise<{ status: string; message: string }> => {
    return fetchJson<{ status: string; message: string }>(`/api/portfolio/holdings/${holdingId}`, {
      method: "DELETE",
    });
  },

  // Trading
  buyStock: (payload: BuyStockPayload): Promise<{ status: string; message: string }> => {
    return fetchJson<{ status: string; message: string }>("/api/portfolio/buy", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  sellStock: (payload: SellStockPayload): Promise<{ status: string; message: string }> => {
    return fetchJson<{ status: string; message: string }>("/api/portfolio/sell", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  // History & Transactions
  getPortfolioHistory: (): Promise<PortfolioHistorySnapshot[]> => {
    return fetchJson<PortfolioHistorySnapshot[]>("/api/portfolio/history");
  },

  getTransactions: (ticker?: string): Promise<Transaction[]> => {
    const query = ticker ? `?ticker=${encodeURIComponent(ticker)}` : "";
    return fetchJson<Transaction[]>(`/api/portfolio/transactions${query}`);
  },

  getRealizedProfit: (): Promise<{ realized_profit: number }> => {
    return fetchJson<{ realized_profit: number }>("/api/portfolio/realized-profit");
  },

  triggerSnapshot: (): Promise<{ status: string; message: string }> => {
    return fetchJson<{ status: string; message: string }>("/api/portfolio/snapshot", {
      method: "POST",
    });
  },

  // Market & Comprehensive AI Research
  getCompanyQuote: (ticker: string): Promise<CompanyQuote> => {
    return fetchJson<CompanyQuote>(`/api/market/quote/${encodeURIComponent(ticker)}`);
  },

  analyzeStock: (ticker: string): Promise<AIAnalysisResult> => {
    return fetchJson<AIAnalysisResult>("/api/ai/analyze", {
      method: "POST",
      body: JSON.stringify({ ticker }),
    });
  },

  getResearchReport: (ticker: string): Promise<ComprehensiveResearchReport> => {
    return fetchJson<ComprehensiveResearchReport>("/api/research/analyze", {
      method: "POST",
      body: JSON.stringify({ ticker }),
    });
  },

  // News & Intelligence
  getNews: (params?: NewsFilterParams): Promise<NewsListResponse> => {
    const searchParams = new URLSearchParams();
    if (params) {
      if (params.category && params.category !== "ALL") searchParams.append("category", params.category);
      if (params.importance && params.importance !== "ALL") searchParams.append("importance", params.importance);
      if (params.source && params.source !== "ALL") searchParams.append("source", params.source);
      if (params.search) searchParams.append("search", params.search);
      if (params.ticker && params.ticker !== "ALL") searchParams.append("ticker", params.ticker);
      if (params.company && params.company !== "ALL") searchParams.append("company", params.company);
      if (params.limit) searchParams.append("limit", params.limit.toString());
      if (params.offset) searchParams.append("offset", params.offset.toString());
    }
    const queryString = searchParams.toString() ? `?${searchParams.toString()}` : "";
    return fetchJson<NewsListResponse>(`/api/news${queryString}`);
  },

  getNewsMetadata: (): Promise<NewsMetadataResponse> => {
    return fetchJson<NewsMetadataResponse>("/api/news/metadata");
  },

  syncNews: (): Promise<NewsSyncResponse> => {
    return fetchJson<NewsSyncResponse>("/api/news/sync", {
      method: "POST",
    });
  },

  getNewsArticle: (newsId: string): Promise<NewsItem> => {
    return fetchJson<NewsItem>(`/api/news/${encodeURIComponent(newsId)}`);
  },

  // Watchlist
  getWatchlist: (): Promise<WatchlistResponse> => {
    return fetchJson<WatchlistResponse>("/api/watchlist");
  },

  addToWatchlist: (ticker: string): Promise<WatchlistItem> => {
    return fetchJson<WatchlistItem>("/api/watchlist", {
      method: "POST",
      body: JSON.stringify({ ticker }),
    });
  },

  removeFromWatchlist: (ticker: string): Promise<{ status: string; message: string }> => {
    return fetchJson<{ status: string; message: string }>(`/api/watchlist/${encodeURIComponent(ticker)}`, {
      method: "DELETE",
    });
  },
};
