"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  glow?: "mint" | "coral" | "subtle" | "none";
  hoverable?: boolean;
}

export function Card({
  className,
  glow = "none",
  hoverable = false,
  children,
  onPointerMove,
  ...props
}: CardProps) {
  const glowStyles = {
    none: "",
    subtle: "border-white/[0.12] hover:border-white/[0.2]",
    mint: "border-emerald-500/20 hover:border-emerald-500/35 shadow-[0_8px_24px_-8px_rgba(16,185,129,0.12)]",
    coral: "border-rose-500/20 hover:border-rose-500/35 shadow-[0_8px_24px_-8px_rgba(244,63,94,0.12)]",
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    e.currentTarget.style.setProperty("--mouse-x", `${x.toFixed(1)}px`);
    e.currentTarget.style.setProperty("--mouse-y", `${y.toFixed(1)}px`);
    if (onPointerMove) {
      onPointerMove(e);
    }
  };

  return (
    <div
      data-interactive-card="true"
      onPointerMove={handlePointerMove}
      className={cn(
        "fintech-card p-5 relative overflow-hidden",
        glowStyles[glow],
        hoverable && "cursor-pointer",
        className
      )}
      {...props}
    >
      <div className="relative z-10">{children}</div>
    </div>
  );
}

export function CardHeader({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex items-center justify-between mb-4", className)} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={cn("text-base font-semibold text-gray-100 tracking-tight", className)} {...props}>
      {children}
    </h3>
  );
}

export function CardDescription({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn("text-xs text-gray-400 mt-0.5", className)} {...props}>
      {children}
    </p>
  );
}
