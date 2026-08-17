"use client";

import React, { useCallback } from "react";
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
  onMouseMove,
  ...props
}: CardProps) {
  const glowStyles = {
    none: "",
    subtle: "fintech-card-glow",
    mint: "shadow-[0_0_30px_-5px_rgba(16,185,129,0.12)] border-emerald-500/20",
    coral: "shadow-[0_0_30px_-5px_rgba(244,63,94,0.12)] border-rose-500/20",
  };

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      e.currentTarget.style.setProperty("--mouse-x", `${x}px`);
      e.currentTarget.style.setProperty("--mouse-y", `${y}px`);

      if (onMouseMove) {
        onMouseMove(e);
      }
    },
    [onMouseMove]
  );

  return (
    <div
      onMouseMove={handleMouseMove}
      className={cn(
        "fintech-card p-5 relative overflow-hidden",
        glowStyles[glow],
        hoverable && "hover:bg-[#131924] cursor-pointer",
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
