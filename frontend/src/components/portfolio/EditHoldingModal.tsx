"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import { HoldingItem } from "@/types/portfolio";
import { Edit3, IndianRupee, Hash } from "lucide-react";

interface EditHoldingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  holding: HoldingItem | null;
}

export function EditHoldingModal({
  isOpen,
  onClose,
  onSuccess,
  holding,
}: EditHoldingModalProps) {
  const { success, error } = useToast();
  const [quantity, setQuantity] = useState("");
  const [averageBuyPrice, setAverageBuyPrice] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (holding) {
      setQuantity(holding.quantity.toString());
      setAverageBuyPrice(holding.average_buy_price.toString());
    }
  }, [holding, isOpen]);

  if (!holding || !holding.id) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      const res = await api.updateHolding(holding.id, {
        quantity: qty,
        average_buy_price: price,
      });

      success("Holding Updated", res.message);
      onSuccess();
      onClose();
    } catch (err: any) {
      error("Update Failed", err?.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Edit Holding: ${holding.ticker}`}
      subtitle="Manually adjust position quantity and cost basis"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Quantity"
          type="number"
          step="any"
          min="0.001"
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
          value={averageBuyPrice}
          onChange={(e) => setAverageBuyPrice(e.target.value)}
          icon={<IndianRupee className="w-4 h-4" />}
          required
        />

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/8">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isLoading}>
            <Edit3 className="w-4 h-4 mr-1.5" />
            Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  );
}
