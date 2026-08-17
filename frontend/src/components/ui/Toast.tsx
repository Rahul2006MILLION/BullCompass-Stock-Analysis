"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type ToastType = "success" | "error" | "info";

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
}

interface ToastContextType {
  toast: (title: string, message?: string, type?: ToastType) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (title: string, message?: string, type: ToastType = "success") => {
      const id = Math.random().toString(36).substring(2, 9);
      setToasts((prev) => [...prev, { id, title, message, type }]);
      setTimeout(() => {
        removeToast(id);
      }, 4500);
    },
    [removeToast]
  );

  const success = useCallback((title: string, message?: string) => addToast(title, message, "success"), [addToast]);
  const error = useCallback((title: string, message?: string) => addToast(title, message, "error"), [addToast]);
  const info = useCallback((title: string, message?: string) => addToast(title, message, "info"), [addToast]);

  return (
    <ToastContext.Provider value={{ toast: addToast, success, error, info }}>
      {children}
      {/* Toast Floating Container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className={cn(
                "pointer-events-auto p-4 rounded-xl border shadow-xl flex items-start gap-3 backdrop-blur-md",
                t.type === "success" && "bg-[#0b1b14]/90 border-emerald-500/40 text-emerald-100",
                t.type === "error" && "bg-[#1f0e13]/90 border-rose-500/40 text-rose-100",
                t.type === "info" && "bg-[#0d1624]/90 border-blue-500/40 text-blue-100"
              )}
            >
              <div className="mt-0.5">
                {t.type === "success" && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
                {t.type === "error" && <AlertCircle className="w-5 h-5 text-rose-400" />}
                {t.type === "info" && <Info className="w-5 h-5 text-blue-400" />}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-white">{t.title}</p>
                {t.message && <p className="text-xs text-gray-300 mt-0.5">{t.message}</p>}
              </div>
              <button
                onClick={() => removeToast(t.id)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
