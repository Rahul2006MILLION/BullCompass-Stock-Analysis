import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";
import { ToastProvider } from "@/components/ui/Toast";

export const metadata: Metadata = {
  title: "BullCompass | Modern Investment & Portfolio Intelligence Terminal",
  description:
    "Next-generation investment management terminal with real-time valuations, weighted average pricing, audit transactions, and AI analysis.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#080a0f] text-gray-100 min-h-screen flex antialiased selection:bg-emerald-500/30 selection:text-emerald-300 relative">
        {/* Ambient Subtle Background Orbs */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
          <div className="ambient-orb-mint -top-40 -right-40" />
          <div className="ambient-orb-coral -bottom-40 -left-40" />
        </div>

        <ToastProvider>
          {/* Main App Layout */}
          <div className="flex w-full min-h-screen relative z-10">
            {/* Sidebar */}
            <Sidebar />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0">
              <main className="flex-1 p-8 max-w-7xl w-full mx-auto space-y-8">
                {children}
              </main>
            </div>
          </div>
        </ToastProvider>
      </body>
    </html>
  );
}
