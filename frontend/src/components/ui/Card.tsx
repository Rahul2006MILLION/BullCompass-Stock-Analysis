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
  ...props
}: CardProps) {
  const glowStyles = {
    none: "",
    subtle: "fintech-card-glow",
    mint: "shadow-[0_0_30px_-5px_rgba(16,185,129,0.12)] border-emerald-500/20",
    coral: "shadow-[0_0_30px_-5px_rgba(244,63,94,0.12)] border-rose-500/20",
  };

  return (
    <div
      className={cn(
        "fintech-card p-5 relative overflow-hidden",
        glowStyles[glow],
        hoverable && "hover:bg-[#131924] hover:scale-[1.008] cursor-pointer",
        className
      )}
      {...props}
    >
      {children}
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
