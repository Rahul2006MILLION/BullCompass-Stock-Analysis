"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import { Search, IndianRupee, Hash } from "lucide-react";

interface AddHoldingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddHoldingModal({ isOpen, onClose, onSuccess }: AddHoldingModalProps) {
  const { success, error } = useToast();
  const [ticker, setTicker] = useState("");
  const [quantity, setQuantity] = useState("");
  const [averageBuyPrice, setAverageBuyPrice] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingPrice, setIsFetchingPrice] = useState(false);
  const [livePriceHint, setLivePriceHint] = useState<number | null>(null);

  const handleFetchPriceHint = async () => {
    if (!ticker.trim()) return;
    try {
      setIsFetchingPrice(true);
      const quote = await api.getCompanyQuote(ticker.trim());
      if (quote.current_price > 0) {
        setLivePriceHint(quote.current_price);
        if (!averageBuyPrice) {
          setAverageBuyPrice(quote.current_price.toString());
        }
      }
    } catch {
      // ignore
    } finally {
      setIsFetchingPrice(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticker.trim()) {
      error("Validation Error", "Please provide a valid stock ticker symbol.");
      return;
    }
    const qty = parseFloat(quantity);
    const price = parseFloat(averageBuyPrice);

    if (isNaN(qty) || qty <= 0) {
      error("Validation Error", "Quantity must be greater than 0.");
      return;
    }
    if (isNaN(price) || price <= 0) {
      error("Validation Error", "Buy price must be greater than 0.");
      return;
    }

    try {
      setIsLoading(true);
      const res = await api.addHolding({
        ticker: ticker.trim().toUpperCase(),
        quantity: qty,
        average_buy_price: price,
      });

      success("Holding Added", res.message || `Added ${ticker.toUpperCase()} to your portfolio.`);
      setTicker("");
      setQuantity("");
      setAverageBuyPrice("");
      setLivePriceHint(null);
      onSuccess();
      onClose();
    } catch (err: any) {
      error("Failed to Add Holding", err?.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add New Stock Holding"
      subtitle="Track shares you already own in your portfolio"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Input
            label="Stock Symbol / Ticker"
            placeholder="e.g. TCS, INFY, RELIANCE, HDFCBANK"
            value={ticker}
            onChange={(e) => setTicker(e.target.value.toUpperCase())}
            onBlur={handleFetchPriceHint}
            icon={<Search className="w-4 h-4" />}
            required
          />
          {livePriceHint && (
            <p className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1 font-mono">
              <span>●</span> Live NSE Price: ₹{livePriceHint.toFixed(2)}
            </p>
          )}
        </div>

        <Input
          label="Total Quantity"
          type="number"
          step="any"
          min="0.001"
          placeholder="e.g. 25"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          icon={<Hash className="w-4 h-4" />}
          required
        />

        <Input
          label="Average Buy Price (₹)"
          type="number"
          step="any"
          min="0.01"
          placeholder="e.g. 3450.00"
          value={averageBuyPrice}
          onChange={(e) => setAverageBuyPrice(e.target.value)}
          icon={<IndianRupee className="w-4 h-4" />}
          required
        />

        {quantity && averageBuyPrice && (
          <div className="p-3 rounded-xl bg-white/3 border border-white/6 text-xs flex justify-between items-center font-mono">
            <span className="text-gray-400">Total Investment Basis:</span>
            <span className="text-emerald-400 font-semibold text-sm">
              ₹{(parseFloat(quantity) * parseFloat(averageBuyPrice) || 0).toLocaleString("en-IN", {
                minimumFractionDigits: 2,
              })}
            </span>
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/8">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isLoading}>
            Add to Portfolio
          </Button>
        </div>
      </form>
    </Modal>
  );
}
