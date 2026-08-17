"use client";

import React, { InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  suffix?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, icon, suffix, type = "text", ...props }, ref) => {
    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label className="block text-xs font-medium uppercase tracking-wider text-gray-400">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {icon && (
            <div className="absolute left-3.5 flex items-center pointer-events-none text-gray-400">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            type={type}
            className={cn(
              "w-full bg-[#0d121a] text-gray-100 placeholder-gray-500 rounded-xl border border-white/10 px-4 py-2.5 text-sm transition-all duration-200",
              "focus:outline-none focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/20 focus:bg-[#111622]",
              "hover:border-white/20",
              icon && "pl-10",
              suffix && "pr-12",
              error && "border-rose-500/50 focus:border-rose-500 focus:ring-rose-500/20",
              className
            )}
            {...props}
          />
          {suffix && (
            <div className="absolute right-3.5 flex items-center pointer-events-none text-xs font-medium text-gray-400">
              {suffix}
            </div>
          )}
        </div>
        {error && <p className="text-xs text-rose-400 mt-1">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
