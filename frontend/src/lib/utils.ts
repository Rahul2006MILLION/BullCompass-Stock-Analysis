import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format numbers in Indian Rupee format (₹ 1,23,456.78)
 */
export function formatCurrency(amount: number | null | undefined, includeDecimals = true): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return "₹0.00";
  }

  const sign = amount < 0 ? "-" : "";
  const absoluteAmount = Math.abs(amount);

  return `${sign}₹${absoluteAmount.toLocaleString("en-IN", {
    minimumFractionDigits: includeDecimals ? 2 : 0,
    maximumFractionDigits: includeDecimals ? 2 : 0,
  })}`;
}

/**
 * Format percentage with + / - signs
 */
export function formatPercentage(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) {
    return "0.00%";
  }
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

/**
 * Format compact market cap or high volume in Indian style (Cr, L)
 */
export function formatCompactINR(amount: number | null | undefined): string {
  if (!amount || isNaN(amount)) return "₹0";
  const cr = amount / 10000000;
  if (cr >= 1) {
    return `₹${cr.toFixed(2)} Cr`;
  }
  const lakh = amount / 100000;
  if (lakh >= 1) {
    return `₹${lakh.toFixed(2)} L`;
  }
  return formatCurrency(amount);
}

/**
 * Format timestamps into friendly dates
 */
export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return "N/A";
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) {
      return dateString;
    }
    return d.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateString;
  }
}
