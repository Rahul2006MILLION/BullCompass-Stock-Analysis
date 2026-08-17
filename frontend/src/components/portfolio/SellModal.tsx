"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import { HoldingItem } from "@/types/portfolio";
import { formatCurrency, formatPercentage } from "@/lib/utils";
import { TrendingDown, IndianRupee, Hash, AlertTriangle } from "lucide-react";
import confetti from "canvas-confetti";

interface SellModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  holding: HoldingItem | null;
}

export function SellModal({
  isOpen,
  onClose,
  onSuccess,
  holding,
}: SellModalProps) {
  const { success, error } = useToast();
  const [quantity, setQuantity] = useState("");
  const [sellingPrice, setSellingPrice] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (holding) {
      if (holding.current_price) {
        setSellingPrice(holding.current_price.toString());
      } else {
        setSellingPrice(holding.average_buy_price.toString());
      }
      setQuantity(holding.quantity.toString());
    }
  }, [holding, isOpen]);

  if (!holding) return null;

  const parsedQty = parseFloat(quantity) || 0;
  const parsedSellPrice = parseFloat(sellingPrice) || 0;
  const totalSaleAmount = parsedQty * parsedSellPrice;
  const costBasis = parsedQty * holding.average_buy_price;
  const realizedProfit = totalSaleAmount - costBasis;
  const realizedReturnPct = costBasis > 0 ? (realizedProfit / costBasis) * 100 : 0;
  const isOverSelling = parsedQty > holding.quantity;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (parsedQty <= 0) {
      error("Validation Error", "Quantity to sell must be greater than 0.");
      return;
    }
    if (isOverSelling) {
      error("Validation Error", `You only own ${holding.quantity} shares of ${holding.ticker}.`);
      return;
    }
    if (parsedSellPrice <= 0) {
      error("Validation Error", "Selling price must be greater than 0.");
      return;
    }

    try {
      setIsLoading(true);
      const res = await api.sellStock({
        ticker: holding.ticker,
        quantity: parsedQty,
        selling_price: parsedSellPrice,
      });

      if (realizedProfit > 0) {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.8 },
          colors: ["#10b981", "#34d399", "#6ee7b7"],
        });
      }

      success("Sale Executed", res.message);
      onSuccess();
      onClose();
    } catch (err: any) {
      error("Sell Order Failed", err?.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Sell ${holding.ticker}`}
      subtitle={`Available shares: ${holding.quantity} | Avg Cost: ${formatCurrency(holding.average_buy_price)}`}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Input
              label="Quantity to Sell"
              type="number"
              step="any"
              min="0.001"
              max={holding.quantity}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              icon={<Hash className="w-4 h-4" />}
              error={isOverSelling ? `Max ${holding.quantity} shares` : undefined}
              required
            />
            <div className="flex gap-1.5 mt-1.5">
              <button
                type="button"
                onClick={() => setQuantity((holding.quantity * 0.25).toString())}
                className="text-[10px] px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-gray-400 hover:text-gray-200"
              >
                25%
              </button>
              <button
                type="button"
                onClick={() => setQuantity((holding.quantity * 0.5).toString())}
                className="text-[10px] px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-gray-400 hover:text-gray-200"
              >
                50%
              </button>
              <button
                type="button"
                onClick={() => setQuantity(holding.quantity.toString())}
                className="text-[10px] px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-emerald-400 hover:bg-emerald-500/10 font-semibold"
              >
                100% (ALL)
              </button>
            </div>
          </div>

          <Input
            label="Selling Price (₹)"
            type="number"
            step="any"
            min="0.01"
            value={sellingPrice}
            onChange={(e) => setSellingPrice(e.target.value)}
            icon={<IndianRupee className="w-4 h-4" />}
            required
          />
        </div>

        {/* Realized P&L Preview Card */}
        {parsedQty > 0 && parsedSellPrice > 0 && (
          <div className="p-4 rounded-xl bg-[#121824] border border-white/8 space-y-2 text-xs font-mono">
            <div className="flex justify-between items-center text-gray-300">
              <span>Gross Proceeds:</span>
              <span className="text-white font-semibold text-sm">
                {formatCurrency(totalSaleAmount)}
              </span>
            </div>
            <div className="flex justify-between items-center text-gray-400">
              <span>Cost Basis:</span>
              <span>{formatCurrency(costBasis)}</span>
            </div>
            <div className="pt-2 border-t border-white/6 flex justify-between items-center">
              <span className="text-gray-300 font-semibold">Realized Profit / Loss:</span>
              <span
                className={`text-sm font-bold ${
                  realizedProfit >= 0 ? "text-emerald-400" : "text-rose-400"
                }`}
              >
                {formatCurrency(realizedProfit)} ({formatPercentage(realizedReturnPct)})
              </span>
            </div>
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/8">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="danger"
            isLoading={isLoading}
            disabled={isOverSelling}
          >
            <TrendingDown className="w-4 h-4 mr-1.5" />
            Confirm Sell Order
          </Button>
        </div>
      </form>
    </Modal>
  );
}
