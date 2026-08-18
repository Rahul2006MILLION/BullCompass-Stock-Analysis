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
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Portfolio", href: "/portfolio", icon: Briefcase },
  { name: "Watchlist", href: "/watchlist", icon: Star },
  { name: "Transactions", href: "/transactions", icon: History },
  { name: "Market", href: "/market", icon: TrendingUp },
  { name: "News", href: "/news", icon: Newspaper },
  { name: "AI Analysis", href: "/ai-analysis", icon: Bot, badge: "AI" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { success, error } = useToast();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleManualSnapshot = async () => {
    try {
      setIsRefreshing(true);
      await api.triggerSnapshot();
      success("Snapshot Saved", "Portfolio net worth snapshot recorded successfully.");
      window.dispatchEvent(new Event("portfolio-updated"));
    } catch (err: any) {
      error("Snapshot Failed", err?.message || "Could not record snapshot.");
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <aside className="w-64 apple-liquid-sidebar flex flex-col h-screen sticky top-0 z-40 select-none">
      {/* Brand Header */}
      <div className="p-6 border-b border-white/[0.04] flex items-center justify-between relative z-10">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-400 p-0.5 shadow-lg shadow-emerald-500/20 group-hover:shadow-emerald-500/40 group-hover:scale-105 transition-all duration-300">
            <div className="w-full h-full bg-[#090c12]/90 backdrop-blur-sm rounded-[10px] flex items-center justify-center text-xl">
              🐂
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-lg tracking-tight text-white group-hover:text-emerald-400 transition-colors">
                BullCompass
              </span>
            </div>
            <span className="text-[10px] font-mono tracking-widest text-emerald-400/90 uppercase font-semibold">
              Terminal v1.0
            </span>
          </div>
        </Link>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 py-6 px-3.5 space-y-1.5 overflow-y-auto relative z-10">
        <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-gray-500">
          Navigation
        </div>
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors duration-200 group relative",
                isActive
                  ? "text-emerald-400 font-semibold"
                  : "text-gray-400 hover:text-gray-100 hover:bg-white/[0.04] hover:translate-x-0.5 transition-transform"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="sidebar-active-pill"
                  className="absolute inset-0 rounded-xl bg-emerald-500/20 border border-emerald-500/35 backdrop-blur-md shadow-sm"
                  transition={{ type: "spring", stiffness: 380, damping: 32 }}
                />
              )}
              {isActive && (
                <motion.span
                  layoutId="sidebar-active-indicator"
                  className="absolute left-0 top-2 bottom-2 w-1 bg-emerald-400 rounded-r-full shadow-[0_0_12px_rgba(16,185,129,1)] z-10"
                  transition={{ type: "spring", stiffness: 380, damping: 32 }}
                />
              )}

              <div className="flex items-center gap-3 relative z-10">
                <Icon
                  className={cn(
                    "w-4 h-4 transition-all duration-200",
                    isActive
                  ? "text-emerald-400 scale-110"
                  : "text-gray-400 group-hover:text-emerald-300 group-hover:scale-105"
                  )}
                />
                <span className="transition-colors group-hover:text-white">{item.name}</span>
              </div>
              {item.badge && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-emerald-500/25 text-emerald-300 font-mono font-semibold relative z-10 border border-emerald-500/30">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* Market Status & Snapshot Footer */}
      <div className="p-4 border-t border-white/[0.04] space-y-3 bg-black/25 relative z-10">
        <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.05] backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_rgba(16,185,129,0.8)]" />
            <span className="text-xs font-medium text-gray-300">NSE Market</span>
          </div>
          <span className="text-[10px] font-mono font-medium text-emerald-400 bg-emerald-500/15 border border-emerald-500/25 px-1.5 py-0.5 rounded">
            CONNECTED
          </span>
        </div>

        <button
          onClick={handleManualSnapshot}
          disabled={isRefreshing}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-medium bg-[#141a24]/90 hover:bg-[#1a2230] text-gray-300 hover:text-white border border-white/[0.06] transition-all hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-50 shadow-sm"
        >
          <RefreshCw
            className={cn("w-3.5 h-3.5 text-emerald-400", isRefreshing && "animate-spin")}
          />
          <span>{isRefreshing ? "Saving Snapshot..." : "Record Snapshot"}</span>
        </button>
      </div>
    </aside>
  );
}
