import React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "mint" | "coral" | "neutral" | "warning" | "blue";
  size?: "sm" | "md";
  dot?: boolean;
}

export function Badge({
  className,
  variant = "neutral",
  size = "md",
  dot = false,
  children,
  ...props
}: BadgeProps) {
  const variantStyles = {
    mint: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    coral: "bg-rose-500/15 text-rose-400 border-rose-500/30",
    neutral: "bg-white/5 text-gray-300 border-white/10",
    warning: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    blue: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  };

  const dotColors = {
    mint: "bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.8)]",
    coral: "bg-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.8)]",
    neutral: "bg-gray-400",
    warning: "bg-amber-400",
    blue: "bg-blue-400",
  };

  const sizeStyles = {
    sm: "text-[11px] px-2 py-0.5 font-medium",
    md: "text-xs px-2.5 py-1 font-medium",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border tracking-wide select-none",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {dot && <span className={cn("w-1.5 h-1.5 rounded-full animate-pulse", dotColors[variant])} />}
      {children}
    </span>
  );
}
