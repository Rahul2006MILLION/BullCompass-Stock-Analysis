"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Briefcase,
  Star,
  History,
  TrendingUp,
  Newspaper,
  Bot,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
}

const navItems: NavItem[] = [
  { name: "Terminal", href: "/", icon: LayoutDashboard },
  { name: "Portfolio", href: "/portfolio", icon: Briefcase },
  { name: "Watchlist", href: "/watchlist", icon: Star },
  { name: "Ledger", href: "/transactions", icon: History },
  { name: "Markets", href: "/market", icon: TrendingUp },
  { name: "News & Filings", href: "/news", icon: Newspaper },
  { name: "AI Research", href: "/ai-analysis", icon: Bot, badge: "ALPHA" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { success, error } = useToast();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleManualSnapshot = async () => {
    try {
      setIsRefreshing(true);
      await api.triggerSnapshot();
      success("Snapshot Recorded", "Portfolio net worth valuation point saved.");
      window.dispatchEvent(new Event("portfolio-updated"));
    } catch (err: any) {
      error("Snapshot Failed", err?.message || "Could not record valuation snapshot.");
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <aside className="w-60 editorial-frame rounded-2xl flex flex-col h-[calc(100vh-24px)] sticky top-3 z-40 select-none overflow-hidden">
      {/* Brand Header */}
      <div className="p-5 border-b border-white/[0.06] flex items-center justify-between relative z-10">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl bg-white/[0.03] p-0.5 border border-white/[0.08] shadow-md group-hover:border-emerald-400/40 transition-all duration-300 flex items-center justify-center">
            <span className="text-emerald-400 font-serif font-bold text-base">
              𝔅
            </span>
          </div>
          <div>
            <div className="flex items-center gap-1">
              <span className="font-light text-base tracking-tight text-white group-hover:text-emerald-400 transition-colors font-sans">
                Bull<span className="font-editorial italic font-normal text-emerald-400">Compass</span>
              </span>
            </div>
            <span className="text-[9px] font-mono tracking-widest text-gray-400 uppercase font-semibold block">
              CAPITAL · TERMINAL
            </span>
          </div>
        </Link>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 py-5 px-3 space-y-1 overflow-y-auto relative z-10">
        <div className="px-3 pb-2 text-[9px] font-mono font-bold uppercase tracking-widest text-gray-500">
          COMMAND CENTER
        </div>
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center justify-between px-3 py-2 rounded-xl text-xs font-mono transition-all duration-200 group relative",
                isActive
                  ? "text-emerald-400 font-semibold"
                  : "text-gray-400 hover:text-white hover:bg-white/[0.03]"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="sidebar-active-pill"
                  className="absolute inset-0 rounded-xl bg-emerald-500/10 border border-emerald-500/25"
                  transition={{ type: "spring", stiffness: 380, damping: 32 }}
                />
              )}
              {isActive && (
                <motion.span
                  layoutId="sidebar-active-indicator"
                  className="absolute left-0 top-2 bottom-2 w-0.5 bg-emerald-400 rounded-r-full shadow-[0_0_8px_rgba(111,227,166,0.8)] z-10"
                  transition={{ type: "spring", stiffness: 380, damping: 32 }}
                />
              )}

              <div className="flex items-center gap-2.5 relative z-10">
                <Icon
                  className={cn(
                    "w-3.5 h-3.5 transition-all duration-200",
                    isActive
                      ? "text-emerald-400"
                      : "text-gray-400 group-hover:text-emerald-300"
                  )}
                />
                <span>{item.name}</span>
              </div>
              {item.badge && (
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 font-mono font-bold relative z-10 border border-emerald-500/30">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* Market Status & Snapshot Footer */}
      <div className="p-3.5 border-t border-white/[0.06] space-y-2.5 bg-white/[0.01] relative z-10">
        <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-white/[0.02] border border-white/[0.04]">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_rgba(111,227,166,0.8)]" />
            <span className="text-[11px] font-mono text-gray-300">NSE FEED</span>
          </div>
          <span className="text-[9px] font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded">
            SYNC 10S
          </span>
        </div>

        <button
          onClick={handleManualSnapshot}
          disabled={isRefreshing}
          className="w-full flex items-center justify-center gap-2 py-1.5 px-3 rounded-lg text-xs font-mono bg-white/[0.03] hover:bg-white/[0.07] text-gray-300 hover:text-white border border-white/[0.06] transition-all disabled:opacity-50"
        >
          <RefreshCw
            className={cn("w-3 h-3 text-emerald-400", isRefreshing && "animate-spin")}
          />
          <span>{isRefreshing ? "Saving..." : "Record Snapshot"}</span>
        </button>
      </div>
    </aside>
  );
}
