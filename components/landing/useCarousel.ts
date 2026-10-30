"use client";

import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";

/**
 * Logic of a slider built on native horizontal scroll with snap (smooth swipe on phones), shared by the
 * landing pages. Put `track` on the scrolling element whose children are the slides, spread `handlers` on the
 * wrapper. `go(i)` wraps around; autoplay moves every `autoMs` and pauses on hover, focus, touch, a hidden tab
 * or reduced motion.
 */
export function useCarousel(n: number, autoMs = 5000) {
  const track = useRef<HTMLDivElement>(null);
  const [cur, setCur] = useState(0);
  const [paused, setPaused] = useState(false);

  // The dots and counter follow right away; the scroll catches up
  const go = useCallback((i: number) => {
    const k = ((i % n) + n) % n, el = track.current, s = el?.children[k] as HTMLElement | undefined;
    setCur(k);
    if (el && s) el.scrollTo({ left: s.offsetLeft - el.offsetLeft - (el.clientWidth - s.clientWidth) / 2, behavior: "smooth" });
  }, [n]);

  // After a swipe, the current slide is the one closest to the middle (once the scroll settles)
  useEffect(() => {
    const el = track.current;
    if (!el) return;
    let timer = 0;
    const onScroll = () => {
      clearTimeout(timer);
      timer = window.setTimeout(() => {
        const mid = el.scrollLeft + el.clientWidth / 2;
        let best = 0, dist = Infinity;
        [...el.children].forEach((c, i) => {
          const s = c as HTMLElement, d = Math.abs(s.offsetLeft - el.offsetLeft + s.clientWidth / 2 - mid);
          if (d < dist) { dist = d; best = i; }
        });
        setCur(best);
      }, 90);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => { el.removeEventListener("scroll", onScroll); clearTimeout(timer); };
  }, []);

  const auto = !paused && n > 1 && autoMs > 0;
  useEffect(() => {
    if (!auto || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => { if (!document.hidden) go(cur + 1); }, autoMs);
    return () => clearInterval(id);
  }, [auto, cur, go, autoMs]);

  const handlers = {
    onMouseEnter: () => setPaused(true), onMouseLeave: () => setPaused(false),
    onFocus: () => setPaused(true), onBlur: () => setPaused(false), onTouchStart: () => setPaused(true),
    onKeyDown: (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") { e.preventDefault(); go(cur + 1); } else if (e.key === "ArrowLeft") { e.preventDefault(); go(cur - 1); }
    },
  };
  return { track, cur, go, playing: auto, handlers };
}
