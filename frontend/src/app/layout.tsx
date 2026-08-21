import type { Metadata } from "next";
import { Newsreader, Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";
import { MarketCursorLayer } from "@/components/layout/MarketCursorLayer";
import { CardInteractionLayer } from "@/components/layout/CardInteractionLayer";
import { ToastProvider } from "@/components/ui/Toast";

const editorialFont = Newsreader({
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-editorial",
  display: "swap",
});

const sansFont = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-sans",
  display: "swap",
});

const monoFont = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "BullCompass | Institutional Investment & Portfolio Intelligence",
  description:
    "Next-generation investment management terminal combining live market feeds, portfolio accounting, forensic balance sheet analysis, and AI conviction research.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`dark ${editorialFont.variable} ${sansFont.variable} ${monoFont.variable}`}
    >
      <body className="bg-[#07080a] text-[#f1efe8] min-h-screen flex antialiased selection:bg-emerald-500/30 selection:text-emerald-300 relative overflow-x-hidden font-sans">
        <MarketCursorLayer />
        <CardInteractionLayer />
        <ToastProvider>
          {/* Main App Layout */}
          <div className="flex w-full min-h-screen relative z-10 p-3 gap-4">
            {/* Floating Liquid Sidebar */}
            <Sidebar />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 pr-2 pb-6">
              <main className="flex-1 max-w-7xl w-full mx-auto space-y-6">
                {children}
              </main>
            </div>
          </div>
        </ToastProvider>
      </body>
    </html>
  );
}


