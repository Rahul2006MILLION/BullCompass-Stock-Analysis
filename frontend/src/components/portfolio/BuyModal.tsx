"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import { HoldingItem } from "@/types/portfolio";
import { formatCurrency } from "@/lib/utils";
import { ShoppingCart, IndianRupee, Hash, ArrowRight, Zap } from "lucide-react";

interface BuyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialHolding?: HoldingItem | null;
}

export function BuyModal({
  isOpen,
  onClose,
  onSuccess,
  initialHolding,
}: BuyModalProps) {
  const { success, error } = useToast();
  const [ticker, setTicker] = useState("");
  const [quantity, setQuantity] = useState("");
  const [buyPrice, setBuyPrice] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingPrice, setIsFetchingPrice] = useState(false);

  useEffect(() => {
    if (initialHolding) {
      setTicker(initialHolding.ticker);
      if (initialHolding.current_price) {
        setBuyPrice(initialHolding.current_price.toString());
      } else {
        setBuyPrice(initialHolding.average_buy_price.toString());
      }
    } else {
      setTicker("");
      setQuantity("");
      setBuyPrice("");
    }
  }, [initialHolding, isOpen]);

  const handleFetchLivePrice = async () => {
    if (!ticker.trim()) return;
    try {
      setIsFetchingPrice(true);
      const quote = await api.getCompanyQuote(ticker.trim());
      if (quote.current_price > 0) {
        setBuyPrice(quote.current_price.toString());
      }
    } catch {
      // ignore
    } finally {
      setIsFetchingPrice(false);
    }
  };

  const parsedQty = parseFloat(quantity) || 0;
  const parsedPrice = parseFloat(buyPrice) || 0;
  const totalCost = parsedQty * parsedPrice;

  let newAveragePrice = parsedPrice;
  if (initialHolding && initialHolding.quantity > 0 && parsedQty > 0) {
    const oldCost = initialHolding.quantity * initialHolding.average_buy_price;
    const totalQty = initialHolding.quantity + parsedQty;
    newAveragePrice = (oldCost + totalCost) / totalQty;
  }

  // Quick preset handlers
  const handleAddQuantityPreset = (addQty: number) => {
    const current = parseFloat(quantity) || 0;
    setQuantity((current + addQty).toString());
  };

  const handleCashPreset = (cashAmount: number) => {
    if (parsedPrice > 0) {
      const calculatedQty = Math.floor(cashAmount / parsedPrice);
      if (calculatedQty > 0) {
        setQuantity(calculatedQty.toString());
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticker.trim()) {
      error("Validation Error", "Please provide a valid stock ticker symbol.");
      return;
    }
    if (parsedQty <= 0) {
      error("Validation Error", "Quantity must be greater than 0.");
      return;
    }
    if (parsedPrice <= 0) {
      error("Validation Error", "Buy price must be greater than 0.");
      return;
    }

    try {
      setIsLoading(true);
      const res = await api.buyStock({
        ticker: ticker.trim().toUpperCase(),
        quantity: parsedQty,
        buy_price: parsedPrice,
      });

      success("Trade Executed", res.message);
      setQuantity("");
      onSuccess();
      onClose();
    } catch (err: any) {
      error("Buy Order Failed", err?.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Buy ${ticker ? ticker.toUpperCase() : "Stock"}`}
      subtitle="Execute buy order & automatically update weighted average cost"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Input
            label="Stock Symbol / Ticker"
            placeholder="e.g. TCS"
            value={ticker}
            onChange={(e) => setTicker(e.target.value.toUpperCase())}
            onBlur={handleFetchLivePrice}
            readOnly={!!initialHolding}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Input
              label="Quantity to Buy"
              type="number"
              step="any"
              min="0.001"
              placeholder="e.g. 10"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              icon={<Hash className="w-4 h-4" />}
              required
            />
            {/* Quick Share Presets */}
            <div className="flex gap-1 mt-1.5 flex-wrap">
              {[5, 10, 25, 50].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleAddQuantityPreset(num)}
                  className="text-[10px] px-2 py-0.5 rounded bg-white/5 hover:bg-emerald-500/15 hover:text-emerald-400 text-gray-400 font-mono transition-colors"
                >
                  +{num}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Input
              label="Execution Price (₹)"
              type="number"
              step="any"
              min="0.01"
              placeholder="e.g. 3500.00"
              value={buyPrice}
              onChange={(e) => setBuyPrice(e.target.value)}
              icon={<IndianRupee className="w-4 h-4" />}
              required
            />
            {/* Quick Budget Presets */}
            {parsedPrice > 0 && (
              <div className="flex gap-1 mt-1.5 flex-wrap">
                {[10000, 25000, 50000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => handleCashPreset(amt)}
                    className="text-[10px] px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-gray-400 font-mono transition-colors"
                  >
                    ₹{amt / 1000}k
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Live Calculation Preview Card */}
        {parsedQty > 0 && parsedPrice > 0 && (
          <div className="p-4 rounded-xl bg-[#121824] border border-white/8 space-y-2.5 text-xs font-mono">
            <div className="flex justify-between items-center text-gray-300">
              <span>Order Value:</span>
              <span className="text-white font-semibold text-sm">
                {formatCurrency(totalCost)}
              </span>
            </div>

            {initialHolding && (
              <div className="pt-2 border-t border-white/6 flex justify-between items-center text-gray-400">
                <span>Weighted Avg Price:</span>
                <div className="flex items-center gap-1.5 font-semibold text-emerald-400">
                  <span className="text-gray-500 line-through">
                    {formatCurrency(initialHolding.average_buy_price)}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
                  <span>{formatCurrency(newAveragePrice)}</span>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/8">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isLoading}>
            <ShoppingCart className="w-4 h-4 mr-1.5" />
            Confirm Buy Order
          </Button>
        </div>
      </form>
    </Modal>
  );
}
