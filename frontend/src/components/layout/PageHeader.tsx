"use client";

import React from "react";

interface PageHeaderProps {
  eyebrow: string;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  eyebrow,
  actions,
  className = "",
}: PageHeaderProps) {
  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.06] pb-3 ${className}`}
    >
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_rgba(111,227,166,0.8)] shrink-0" />
        <span className="text-[11px] font-mono tracking-widest text-emerald-400 uppercase font-semibold">
          {eyebrow}
        </span>
      </div>

      {actions && (
        <div className="flex items-center gap-2 font-mono text-xs shrink-0 self-start sm:self-center">
          {actions}
        </div>
      )}
    </div>
  );
}
