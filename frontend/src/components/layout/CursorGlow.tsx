"use client";

import React, { useEffect, useRef } from "react";

export function CursorGlow() {
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Respect prefers-reduced-motion
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mediaQuery.matches) {
      return;
    }

    const glowEl = glowRef.current;
    if (!glowEl) return;

    let targetX = -1000;
    let targetY = -1000;
    let currentX = -1000;
    let currentY = -1000;
    let isVisible = false;
    let animFrameId: number;

    const handlePointerMove = (e: PointerEvent) => {
      targetX = e.clientX;
      targetY = e.clientY;

      if (!isVisible) {
        isVisible = true;
        glowEl.style.opacity = "1";
        if (currentX === -1000) {
          currentX = targetX;
          currentY = targetY;
        }
      }
    };

    const handlePointerLeave = () => {
      isVisible = false;
      glowEl.style.opacity = "0";
    };

    const animate = () => {
      // Smooth linear interpolation (lerp)
      const ease = 0.08;
      currentX += (targetX - currentX) * ease;
      currentY += (targetY - currentY) * ease;

      glowEl.style.transform = `translate3d(${currentX}px, ${currentY}px, 0) translate(-50%, -50%)`;

      animFrameId = requestAnimationFrame(animate);
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", handlePointerLeave, { passive: true });

    animFrameId = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      document.documentElement.removeEventListener("pointerleave", handlePointerLeave);
      cancelAnimationFrame(animFrameId);
    };
  }, []);

  return (
    <div
      className="fixed inset-0 pointer-events-none overflow-hidden z-0"
      aria-hidden="true"
    >
      <div
        ref={glowRef}
        className="absolute top-0 left-0 w-[550px] h-[550px] rounded-full pointer-events-none will-change-transform opacity-0 transition-opacity duration-700 ease-out"
        style={{
          background:
            "radial-gradient(circle, rgba(16, 185, 129, 0.07) 0%, rgba(16, 185, 129, 0.025) 35%, rgba(16, 185, 129, 0) 70%)",
          filter: "blur(50px)",
          transform: "translate3d(-1000px, -1000px, 0) translate(-50%, -50%)",
        }}
      />
    </div>
  );
}
