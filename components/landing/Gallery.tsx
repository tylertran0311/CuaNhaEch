"use client";

import type { Slide } from "@/lib/landing";
import Pic from "./Pic";
import { useCarousel } from "./useCarousel";

const SHAPES = ["circle", "square", "triangle"] as const;
const p2 = (n: number) => String(n).padStart(2, "0");

/** Bauhaus gallery slider: big slide with caption, square arrows, shape dots, counter */
export default function Gallery({ slides }: { slides: Slide[] }) {
  const n = slides.length;
  const { track, cur, go, handlers } = useCarousel(n);

  return (
    <div className="lp-gal" role="region" aria-roledescription="carousel" aria-label="Thư viện ảnh" {...handlers}>
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
