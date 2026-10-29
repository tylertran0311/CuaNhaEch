"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Slide } from "@/lib/landing";
import Pic from "./Pic";

const AUTO_MS = 5000;
const SHAPES = ["circle", "square", "triangle"] as const;
const p2 = (n: number) => String(n).padStart(2, "0");

/**
 * Gallery slider: native horizontal scroll with snap (smooth swipe on phones), arrow buttons, shape dots,
 * keyboard arrows, and autoplay that pauses on hover, focus, touch, a hidden tab or reduced motion.
 */
export default function Gallery({ slides }: { slides: Slide[] }) {
  const track = useRef<HTMLDivElement>(null);
  const [cur, setCur] = useState(0);
  const [paused, setPaused] = useState(false);
  const n = slides.length;

  // Wraps around at both ends; the dots and counter follow right away, the scroll catches up
  const go = useCallback((i: number) => {
    const k = ((i % n) + n) % n, el = track.current, s = el?.children[k] as HTMLElement | undefined;
    setCur(k);
    if (el && s) el.scrollTo({ left: s.offsetLeft - el.offsetLeft - (el.clientWidth - s.clientWidth) / 2, behavior: "smooth" });
  }, [n]);

  // The current slide is the one closest to the middle of the track
  useEffect(() => {
    const el = track.current;
    if (!el) return;
    // Fires once the scroll settles (swipe or arrows), so the dots never flicker through slides in between
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

  useEffect(() => {
    if (paused || n < 2 || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => { if (!document.hidden) go(cur + 1); }, AUTO_MS);
    return () => clearInterval(id);
  }, [paused, cur, go, n]);

  return (
    <div className="lp-gal" role="region" aria-roledescription="carousel" aria-label="Thư viện ảnh"
      onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)} onBlur={() => setPaused(false)} onTouchStart={() => setPaused(true)}
      onKeyDown={(e) => { if (e.key === "ArrowRight") { e.preventDefault(); go(cur + 1); } else if (e.key === "ArrowLeft") { e.preventDefault(); go(cur - 1); } }}>
      <div className="lp-gal-track" ref={track} tabIndex={0}>
        {slides.map((s, i) => (
          <figure key={i} className={`lp-slide${i === cur ? " on" : ""}`} aria-roledescription="slide" aria-label={`${i + 1} / ${n}`}>
            <div className="lp-slide-pic"><Pic pic={s} seed={i} sizes="(min-width: 900px) 70vw, 90vw" /></div>
            <figcaption><b>{p2(i + 1)}</b>{s.caption}</figcaption>
          </figure>
        ))}
      </div>
      <div className="lp-gal-bar">
        <button type="button" className="lp-sq" aria-label="Ảnh trước" onClick={() => go(cur - 1)}>←</button>
        <div className="lp-dots">
          {slides.map((_, i) => (
            <button key={i} type="button" className={`lp-dot ${SHAPES[i % 3]}${i === cur ? " on" : ""}`} aria-label={`Ảnh ${i + 1}`}
              aria-current={i === cur} onClick={() => go(i)} />
          ))}
        </div>
        <span className="lp-count">{p2(cur + 1)} / {p2(n)}</span>
        <button type="button" className="lp-sq" aria-label="Ảnh sau" onClick={() => go(cur + 1)}>→</button>
      </div>
    </div>
  );
}
