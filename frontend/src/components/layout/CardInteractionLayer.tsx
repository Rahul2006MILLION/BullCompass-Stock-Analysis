"use client";

import { useEffect } from "react";

/**
 * CardInteractionLayer
 *
 * Attaches a high-performance passive pointer listener to the document to
 * calculate mouse coordinates relative to any hovered card and update the
 * `--mouse-x` and `--mouse-y` CSS custom properties directly on the element.
 *
 * This enables a localized, cursor-following radial highlight clipped strictly
 * inside the card with ZERO React re-renders.
 */
export function CardInteractionLayer() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    let activeCard: HTMLElement | null = null;

    const handlePointerMove = (e: PointerEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      const card = target.closest(
        ".editorial-frame, .editorial-frame-hover, .fintech-card, .liquid-card-shell, .liquid-metric-shell, [data-interactive-card]"
      ) as HTMLElement | null;

      if (card) {
        activeCard = card;
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        card.style.setProperty("--mouse-x", `${x.toFixed(1)}px`);
        card.style.setProperty("--mouse-y", `${y.toFixed(1)}px`);
      } else if (activeCard) {
        activeCard = null;
      }
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
    };
  }, []);

  return null;
}
