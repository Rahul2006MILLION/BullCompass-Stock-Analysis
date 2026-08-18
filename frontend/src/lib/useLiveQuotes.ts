"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { api } from "@/lib/api";
import { QuoteItem, MarketStatus } from "@/types/market";

export const DEFAULT_LIVE_POLL_INTERVAL_MS = 10000; // 10 seconds (changeable to 6000 for 6s testing)
export const CLOSED_MARKET_POLL_INTERVAL_MS = 60000; // 60 seconds when Indian market is closed

export interface UseLiveQuotesOptions {
  tickers: string[];
  intervalMs?: number;
  enabled?: boolean;
  onQuotesUpdated?: (
    quotes: Record<string, QuoteItem>,
    marketStatus: MarketStatus | null
  ) => void;
}

export interface UseLiveQuotesReturn {
  quotes: Record<string, QuoteItem>;
  marketStatus: MarketStatus | null;
  isPolling: boolean;
  lastSyncTime: Date | null;
  error: string | null;
  syncNow: () => Promise<void>;
}

export function useLiveQuotes({
  tickers,
  intervalMs = DEFAULT_LIVE_POLL_INTERVAL_MS,
  enabled = true,
  onQuotesUpdated,
}: UseLiveQuotesOptions): UseLiveQuotesReturn {
  const [quotes, setQuotes] = useState<Record<string, QuoteItem>>({});
  const [marketStatus, setMarketStatus] = useState<MarketStatus | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isFetchingRef = useRef(false);
  const tickersRef = useRef(tickers);
  tickersRef.current = tickers;

  const onQuotesUpdatedRef = useRef(onQuotesUpdated);
  onQuotesUpdatedRef.current = onQuotesUpdated;

  const fetchQuotes = useCallback(async (isManual = false) => {
    const currentTickers = tickersRef.current;
    if (!currentTickers || currentTickers.length === 0) {
      return;
    }

    if (isFetchingRef.current) {
      return;
    }

    try {
      isFetchingRef.current = true;
      setIsPolling(true);

      const response = await api.getBatchQuotes(currentTickers);

      if (response && response.quotes) {
        setQuotes((prev) => {
          const next = { ...prev };
          for (const [key, quote] of Object.entries(response.quotes)) {
            // Keep previous valid price if response has null/missing price
            if (quote.current_price !== null && quote.current_price > 0) {
              next[key] = quote;
            } else if (!next[key]) {
              next[key] = quote;
            }
          }
          return next;
        });

        if (response.market_status) {
          setMarketStatus(response.market_status);
        }

        const now = new Date();
        setLastSyncTime(now);
        setError(null);

        if (onQuotesUpdatedRef.current) {
          onQuotesUpdatedRef.current(response.quotes, response.market_status || null);
        }
      }
    } catch (err: any) {
      // Keep previous quote state on failure - do not wipe prices or show fake data
      setError(err?.message || "Failed to sync live quotes.");
    } finally {
      isFetchingRef.current = false;
      setIsPolling(false);
    }
  }, []);

  const syncNow = useCallback(async () => {
    await fetchQuotes(true);
  }, [fetchQuotes]);

  // Main polling effect with tab visibility handling
  useEffect(() => {
    if (!enabled || tickers.length === 0) {
      return;
    }

    // Initial silent poll if tickers change
    fetchQuotes();

    // Determine current effective polling interval
    const effectiveInterval =
      marketStatus && !marketStatus.is_open
        ? Math.max(intervalMs, CLOSED_MARKET_POLL_INTERVAL_MS)
        : intervalMs;

    let timerId: NodeJS.Timeout | null = setInterval(() => {
      // Only poll when page tab is active and visible
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        fetchQuotes();
      }
    }, effectiveInterval);

    // Event listener for tab visibility change
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        fetchQuotes();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      if (timerId) clearInterval(timerId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [enabled, JSON.stringify(tickers), intervalMs, marketStatus?.is_open, fetchQuotes]);

  return {
    quotes,
    marketStatus,
    isPolling,
    lastSyncTime,
    error,
    syncNow,
  };
}
