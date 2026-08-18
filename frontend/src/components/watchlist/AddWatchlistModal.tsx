"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import { Star, Sparkles, AlertCircle, Plus, Loader2 } from "lucide-react";

interface AddWatchlistModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const POPULAR_SUGGESTIONS = [
  "TCS",
  "INFY",
  "HDFCBANK",
  "RELIANCE",
  "TATAMOTORS",
  "ICICIBANK",
  "SBIN",
  "BHARTIARTL",
];

export function AddWatchlistModal({
  isOpen,
  onClose,
  onSuccess,
}: AddWatchlistModalProps) {
  const { success, error } = useToast();
  const [ticker, setTicker] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTicker = ticker.trim().toUpperCase();
    if (!cleanTicker) {
      setFormError("Please enter a stock ticker symbol.");
      return;
    }

    setIsLoading(true);
    setFormError(null);

    try {
      const createdItem = await api.addToWatchlist(cleanTicker);
      success(
        "Added to Watchlist",
        `${createdItem.company_name || cleanTicker} has been added to your watchlist.`
      );
      setTicker("");
      onSuccess();
      onClose();
    } catch (err: any) {
      const message =
        err?.message || "Failed to add stock to watchlist. Please verify the symbol.";
      setFormError(message);
      error("Could Not Add Stock", message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (sym: string) => {
    setTicker(sym);
    setFormError(null);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        setTicker("");
        setFormError(null);
        onClose();
      }}
      title="Add Stock to Watchlist"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <label className="text-xs font-mono font-medium text-gray-400 uppercase tracking-wider block">
            NSE Stock Symbol
          </label>
          <div className="relative">
            <Input
              type="text"
              placeholder="e.g. INFY, TCS, HDFCBANK, RELIANCE"
              value={ticker}
              onChange={(e) => {
                setTicker(e.target.value.toUpperCase());
                if (formError) setFormError(null);
              }}
              className="bg-[#141a24] border-white/10 focus:border-emerald-500/50 text-white uppercase font-mono tracking-wider pl-3.5 pr-10 py-2.5 text-sm"
              autoFocus
              disabled={isLoading}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 font-mono text-xs pointer-events-none">
              .NS
            </div>
          </div>
          <p className="text-[11px] text-gray-500">
            Enter the exact NSE symbol or company name (e.g., <code className="text-emerald-400">INFY</code> or <code className="text-emerald-400">HDFCBANK.NS</code>).
          </p>
        </div>

        {/* Quick Suggestions */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-xs text-gray-400 font-medium">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>Popular Indian Stocks:</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {POPULAR_SUGGESTIONS.map((sym) => (
              <button
                key={sym}
                type="button"
                onClick={() => handleSuggestionClick(sym)}
                disabled={isLoading}
                className="px-2.5 py-1 text-xs font-mono font-semibold rounded-lg bg-[#141a24] hover:bg-emerald-500/20 text-gray-300 hover:text-emerald-300 border border-white/5 hover:border-emerald-500/30 transition-all active:scale-95"
              >
                {sym}
              </button>
            ))}
          </div>
        </div>

        {/* Error Feedback */}
        {formError && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-2.5 text-rose-400 text-xs animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-semibold">{formError}</p>
              <p className="text-[11px] text-rose-300/80">
                Ensure the symbol is listed on the National Stock Exchange of India.
              </p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-white/8">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={isLoading}
            className="text-gray-400 hover:text-white"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={isLoading || !ticker.trim()}
            className="bg-emerald-500 hover:bg-emerald-600 text-black font-semibold text-xs py-2 px-4 shadow-lg shadow-emerald-500/20"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                Validating & Adding...
              </>
            ) : (
              <>
                <Plus className="w-3.5 h-3.5 mr-1.5" />
                Add to Watchlist
              </>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
