"use client";

import { useEffect } from "react";

export function useAutoScroll(
  ref: React.RefObject<HTMLDivElement | null>,
  speedPx = 28
) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    let last = performance.now();
    let started = false;

    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const half = el.scrollWidth / 2;
      if (half > 0 && !started) {
        el.scrollLeft = half;
        started = true;
      }
      el.scrollLeft -= speedPx * dt;
      if (half > 0 && el.scrollLeft <= 0) {
        el.scrollLeft += half;
      }
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [ref, speedPx]);
}