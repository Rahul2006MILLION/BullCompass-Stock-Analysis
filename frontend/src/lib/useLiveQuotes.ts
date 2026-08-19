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

  const marketStatusRef = useRef<MarketStatus | null>(null);
  marketStatusRef.current = marketStatus;

  const onQuotesUpdatedRef = useRef(onQuotesUpdated);
  onQuotesUpdatedRef.current = onQuotesUpdated;

  const fetchQuotes = useCallback(async (isManual = false) => {
    const currentTickers = tickersRef.current;
    if (!currentTickers || currentTickers.length === 0) {
      return;
    }

    // If market is known to be CLOSED and this is an automatic background fetch, skip entirely
    if (!isManual && marketStatusRef.current && !marketStatusRef.current.is_open) {
      return;
    }

    if (isFetchingRef.current) {
      return;
    }

    try {
      isFetchingRef.current = true;
      // Only show polling/syncing state if market is open or triggered manually
      if (isManual || !marketStatusRef.current || marketStatusRef.current.is_open) {
        setIsPolling(true);
      }

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

  // Main polling effect: Strictly only poll if enabled, tickers present, and market is OPEN
  useEffect(() => {
    if (!enabled || tickers.length === 0) {
      return;
    }

    // Initial single fetch if market status is not yet determined
    if (!marketStatus) {
      fetchQuotes(false);
      return;
    }

    // If market is CLOSED, strictly DO NOT set any interval timer or poll
    if (!marketStatus.is_open) {
      return;
    }

    // Market is OPEN: Poll at intervalMs
    const timerId: NodeJS.Timeout = setInterval(() => {
      // Only poll when page tab is active and visible
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        fetchQuotes(false);
      }
    }, intervalMs);

    // Event listener for tab visibility change
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        fetchQuotes(false);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(timerId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [enabled, JSON.stringify(tickers), intervalMs, marketStatus?.is_open, fetchQuotes]);

  return {
    quotes,
    marketStatus,
    isPolling: marketStatus?.is_open ? isPolling : false,
    lastSyncTime,
    error,
    syncNow,
  };
}
