"use client";

import React, { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

interface CandleItem {
  x: number;
  y: number; // base virtual Y
  bodyH: number;
  wickTop: number;
  wickBtm: number;
  width: number;
  isGreen: boolean;
  volHeight: number;
  layer: number; // 0.12 (far), 0.22 (mid), 0.35 (near)
  phase: number;
  label?: string;
  subLabel?: string;
}

interface ExtraMarker {
  x: number;
  y: number;
  layer: number;
  text: string;
  isGreen?: boolean;
}

const DASHBOARD_TICKERS = [
  { sym: "NIFTY 50", sub: "24,812.40", green: true },
  { sym: "SENSEX", sub: "81,643.15", green: true },
  { sym: "TCS", sub: "3,500.00", green: true },
  { sym: "RELIANCE", sub: "2,840.50", green: false },
  { sym: "HDFCBANK", sub: "1,640.20", green: true },
  { sym: "INFY", sub: "1,780.00", green: true },
  { sym: "TATAMOTORS", sub: "960.40", green: false },
  { sym: "ICICIBANK", sub: "1,180.30", green: true },
  { sym: "BHARTIARTL", sub: "1,420.00", green: true },
  { sym: "LT", sub: "3,620.00", green: true },
  { sym: "INDIA VIX", sub: "11.62", green: false },
];

export function MarketCursorLayer() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pathname = usePathname();

  const pageModeRef = useRef<"dashboard" | "portfolio" | "market" | "watchlist" | "transactions" | "news" | "ai-analysis">("dashboard");

  useEffect(() => {
    if (pathname.includes("/portfolio")) {
      pageModeRef.current = "portfolio";
    } else if (pathname.includes("/market")) {
      pageModeRef.current = "market";
    } else if (pathname.includes("/watchlist")) {
      pageModeRef.current = "watchlist";
    } else if (pathname.includes("/transactions")) {
      pageModeRef.current = "transactions";
    } else if (pathname.includes("/news")) {
      pageModeRef.current = "news";
    } else if (pathname.includes("/ai-analysis")) {
      pageModeRef.current = "ai-analysis";
    } else {
      pageModeRef.current = "dashboard";
    }
  }, [pathname]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isTouchDevice = "ontouchstart" in window || navigator.maxTouchPoints > 0;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);
    let dpr = window.devicePixelRatio || 1;

    // Smoothed cursor coordinates (invisible flashlight position)
    let targetX = width * 0.5;
    let targetY = height * 0.35;
    let currentX = targetX;
    let currentY = targetY;

    // Smoothed scroll offset
    let targetScrollY = window.scrollY || 0;
    let currentScrollY = targetScrollY;

    let animFrameId: number;
    let time = 0;

    const virtualHeight = Math.max(height * 3.2, 3400);
    const candles: CandleItem[] = [];
    const extraMarkers: ExtraMarker[] = [];

    const generateCandleField = () => {
      candles.length = 0;
      extraMarkers.length = 0;

      const mode = pageModeRef.current;

      // Spacing configuration per page mode
      let colSpacing = 68;
      let rowSpacing = 82;
      let densityMod = 4; // modulo for placing candles

      if (mode === "market") {
        colSpacing = 56;
        rowSpacing = 68;
        densityMod = 3; // slightly denser
      } else if (mode === "transactions") {
        colSpacing = 95;
        rowSpacing = 110;
        densityMod = 6; // very sparse
      } else if (mode === "news" || mode === "ai-analysis") {
        colSpacing = 78;
        rowSpacing = 90;
        densityMod = 5;
      }

      const cols = Math.ceil(width / colSpacing);
      const rows = Math.ceil(virtualHeight / rowSpacing);

      for (let c = 0; c < cols; c++) {
        for (let r = 0; r < rows; r++) {
          if ((c * 7 + r * 11) % densityMod === 0) {
            // Subtle horizontal jitter for organic market feel
            const jitterX = ((c * 17 + r * 23) % 24) - 12;
            const jitterY = ((c * 19 + r * 29) % 20) - 10;
            const cx = c * colSpacing + colSpacing * 0.5 + jitterX;
            const cy = r * rowSpacing + rowSpacing * 0.5 + jitterY;

            const isGreen = (c * 5 + r * 13) % 2 === 0;
            const bodyH = 6 + ((c * 13 + r * 19) % 18);
            const wickTop = 3 + ((c * 7 + r * 5) % 10);
            const wickBtm = 3 + ((c * 11 + r * 17) % 10);
            const volH = 4 + ((c * 5 + r * 7) % 14);
            const layer = ((c + r) % 3 === 0) ? 0.35 : ((c + r) % 2 === 0 ? 0.22 : 0.12);
            const tickerItem = DASHBOARD_TICKERS[(c + r) % DASHBOARD_TICKERS.length];

            candles.push({
              x: cx,
              y: cy,
              bodyH,
              wickTop,
              wickBtm,
              width: layer > 0.3 ? 3.5 : 2.5,
              isGreen,
              volHeight: volH,
              layer,
              phase: (c * 0.9 + r * 1.4) % (Math.PI * 2),
              label: (c + r) % 4 === 0 ? tickerItem.sym : undefined,
              subLabel: (c + r) % 4 === 0 ? tickerItem.sub : undefined,
            });
          }
        }
      }

      // Page-specific subtle markers
      if (mode === "portfolio") {
        const portTokens = ["+14.2% NAV", "₹PORTFOLIO", "P&L +₹32,450", "WEIGHT 12.8%", "ALPHA +4.1%"];
        for (let i = 0; i < 10; i++) {
          extraMarkers.push({
            x: (width * 0.12) + (Math.random() * width * 0.76),
            y: (virtualHeight * 0.08) + (Math.random() * virtualHeight * 0.84),
            layer: 0.2 + Math.random() * 0.2,
            text: portTokens[i % portTokens.length],
            isGreen: true,
          });
        }
      } else if (mode === "transactions") {
        const times = ["09:15:02 NSE", "09:42:18 BSE", "11:20:45 EXEC", "13:10:00 FILL", "15:29:50 MOC"];
        for (let i = 0; i < 8; i++) {
          extraMarkers.push({
            x: (width * 0.1) + (Math.random() * width * 0.8),
            y: (virtualHeight * 0.05) + (Math.random() * virtualHeight * 0.9),
            layer: 0.18 + Math.random() * 0.18,
            text: times[i % times.length],
            isGreen: i % 2 === 0,
          });
        }
      } else if (mode === "news") {
        const filings = ["REG-30 DISCLOSURE", "BSE NOTIFICATION", "BOARD_MEETING", "PRESS_RELEASE", "Q3_EARNINGS"];
        for (let i = 0; i < 8; i++) {
          extraMarkers.push({
            x: (width * 0.1) + (Math.random() * width * 0.8),
            y: (virtualHeight * 0.06) + (Math.random() * virtualHeight * 0.88),
            layer: 0.18 + Math.random() * 0.18,
            text: filings[i % filings.length],
            isGreen: false,
          });
        }
      } else if (mode === "ai-analysis") {
        const nodes = ["CFO / PAT > 1.1x", "ROCE 22.4%", "WACC 11.2%", "FCF YIELD 4.8%", "GATE_1 PASSED"];
        for (let i = 0; i < 10; i++) {
          extraMarkers.push({
            x: (width * 0.1) + (Math.random() * width * 0.8),
            y: (virtualHeight * 0.06) + (Math.random() * virtualHeight * 0.88),
            layer: 0.2 + Math.random() * 0.2,
            text: nodes[i % nodes.length],
            isGreen: true,
          });
        }
      }
    };

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.scale(dpr, dpr);
      generateCandleField();
      if (prefersReducedMotion || isTouchDevice) {
        drawStaticAmbient();
      }
    };

    const handlePointerMove = (e: PointerEvent) => {
      targetX = e.clientX;
      targetY = e.clientY;
    };

    const handleScroll = () => {
      targetScrollY = window.scrollY || window.pageYOffset || 0;
    };

    const drawStaticAmbient = () => {
      ctx.clearRect(0, 0, width, height);

      // Render candles at resting ambient opacity
      for (const candle of candles) {
        const screenY = candle.y;
        if (screenY < -50 || screenY > height + 50) continue;

        const baseAlpha = 0.018 * candle.layer * 3;
        const color = candle.isGreen
          ? `rgba(111, 227, 166, ${baseAlpha})`
          : `rgba(227, 134, 118, ${baseAlpha})`;

        // Wick
        ctx.beginPath();
        ctx.moveTo(candle.x, screenY - candle.bodyH * 0.5 - candle.wickTop);
        ctx.lineTo(candle.x, screenY + candle.bodyH * 0.5 + candle.wickBtm);
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.stroke();

        // Body
        ctx.fillStyle = candle.isGreen
          ? `rgba(111, 227, 166, ${baseAlpha * 0.6})`
          : `rgba(227, 134, 118, ${baseAlpha * 0.6})`;
        ctx.fillRect(
          candle.x - candle.width * 0.5,
          screenY - candle.bodyH * 0.5,
          candle.width,
          candle.bodyH
        );
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize, { passive: true });
    window.addEventListener("scroll", handleScroll, { passive: true });

    if (!prefersReducedMotion && !isTouchDevice) {
      window.addEventListener("pointermove", handlePointerMove, { passive: true });

      const proximityRadius = 240;
      const proximityRadiusSq = proximityRadius * proximityRadius;

      const render = () => {
        time += 0.015;

        // Smooth invisible flashlight tracking (no React re-render)
        const lerpCursor = 0.08;
        currentX += (targetX - currentX) * lerpCursor;
        currentY += (targetY - currentY) * lerpCursor;

        // Smooth scroll parallax
        const lerpScroll = 0.085;
        currentScrollY += (targetScrollY - currentScrollY) * lerpScroll;

        ctx.clearRect(0, 0, width, height);

        // =====================================================================
        // Candlesticks with Proximity-Based Illumination (Invisible Flashlight)
        // =====================================================================
        for (const candle of candles) {
          // Parallax depth positioning
          const screenY = candle.y - (currentScrollY * candle.layer);

          // Cull candles outside current viewport bounds
          if (screenY < -80 || screenY > height + 80) continue;

          // Distance from candle center to invisible flashlight cursor
          const dx = candle.x - currentX;
          const dy = screenY - currentY;
          const distSq = dx * dx + dy * dy;

          let illumination = 0;
          if (distSq < proximityRadiusSq) {
            const normDist = Math.sqrt(distSq) / proximityRadius;
            // Smooth non-linear cubic falloff: 1 at center, 0 at boundary
            illumination = Math.pow(1 - normDist, 2.2);
          }

          // Subtle natural price pulse breathing
          const pulse = Math.sin(time * 1.5 + candle.phase) * 0.005;
          const baseAlpha = Math.max(0.014 * candle.layer * 2.8 + pulse, 0.01);

          // Illuminated alpha: scales up smoothly near the cursor
          const activeAlpha = baseAlpha + illumination * 0.42;

          // Scale factor: candles closest to cursor expand slightly (+0.5px)
          const widthScale = candle.width * (1 + illumination * 0.18);

          const strokeColor = candle.isGreen
            ? `rgba(111, 227, 166, ${activeAlpha})`
            : `rgba(227, 134, 118, ${activeAlpha})`;

          const bodyFillColor = candle.isGreen
            ? `rgba(111, 227, 166, ${activeAlpha * 0.65})`
            : `rgba(227, 134, 118, ${activeAlpha * 0.65})`;

          const topY = screenY - candle.bodyH * 0.5;
          const btmY = screenY + candle.bodyH * 0.5;

          // 1. Wick
          ctx.beginPath();
          ctx.moveTo(candle.x, topY - candle.wickTop);
          ctx.lineTo(candle.x, btmY + candle.wickBtm);
          ctx.strokeStyle = strokeColor;
          ctx.lineWidth = 1;
          ctx.stroke();

          // 2. Body
          ctx.fillStyle = bodyFillColor;
          ctx.fillRect(
            candle.x - widthScale * 0.5,
            topY,
            widthScale,
            candle.bodyH
          );

          // 3. Micro volume bar at base (only visible when gently illuminated)
          if (illumination > 0.08 || baseAlpha > 0.02) {
            const volAlpha = (baseAlpha + illumination * 0.35) * 0.4;
            ctx.fillStyle = candle.isGreen
              ? `rgba(111, 227, 166, ${volAlpha})`
              : `rgba(227, 134, 118, ${volAlpha})`;
            ctx.fillRect(
              candle.x - 1,
              btmY + candle.wickBtm + 3,
              2,
              candle.volHeight
            );
          }

          // 4. Subtle Monospace Ticker & Price Tag (revealed on closer proximity)
          if (illumination > 0.38 && candle.label) {
            ctx.font = "8.5px 'JetBrains Mono', monospace";
            ctx.fillStyle = `rgba(241, 239, 232, ${illumination * 0.6})`;
            ctx.fillText(candle.label, candle.x + 7, topY + 4);

            if (illumination > 0.62 && candle.subLabel) {
              ctx.font = "7.5px 'JetBrains Mono', monospace";
              ctx.fillStyle = candle.isGreen
                ? `rgba(111, 227, 166, ${illumination * 0.55})`
                : `rgba(227, 134, 118, ${illumination * 0.55})`;
              ctx.fillText(candle.subLabel, candle.x + 7, topY + 14);
            }
          }
        }

        // =====================================================================
        // Page-Specific Subtle Markers (Illuminated only by proximity)
        // =====================================================================
        for (const marker of extraMarkers) {
          const screenY = marker.y - (currentScrollY * marker.layer);
          if (screenY < -50 || screenY > height + 50) continue;

          const dx = marker.x - currentX;
          const dy = screenY - currentY;
          const distSq = dx * dx + dy * dy;

          if (distSq < proximityRadiusSq) {
            const normDist = Math.sqrt(distSq) / proximityRadius;
            const illum = Math.pow(1 - normDist, 2);

            if (illum > 0.2) {
              ctx.font = "8px 'JetBrains Mono', monospace";
              ctx.fillStyle = marker.isGreen
                ? `rgba(111, 227, 166, ${illum * 0.5})`
                : `rgba(227, 134, 118, ${illum * 0.5})`;
              ctx.fillText(marker.text, marker.x, screenY);
            }
          }
        }

        // NOTE: Strictly ZERO visible spotlight circle / radial background disk drawn.
        // The background remains pure deep dark, while only the candles themselves illuminate.

        animFrameId = requestAnimationFrame(render);
      };

      render();
    }

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("pointermove", handlePointerMove);
      if (animFrameId) {
        cancelAnimationFrame(animFrameId);
      }
    };
  }, []);

  return (
    <div
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none"
      aria-hidden="true"
    >
      <canvas ref={canvasRef} className="block w-full h-full" />
    </div>
  );
}
