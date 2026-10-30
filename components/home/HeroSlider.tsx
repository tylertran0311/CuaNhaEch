"use client";

import { CONTACT, HOME, type Slide } from "@/lib/landing";
import { fd, vnd } from "@/lib/store";
import { useCarousel } from "@/components/landing/useCarousel";
import Photo from "./Photo";

const AUTO_MS = 5500;
const p2 = (n: number) => String(n).padStart(2, "0");

/**
 * The page opens on the food: full-width photos of the crabs, swipeable, with the headline over them and story-style
 * progress bars (each fills while its photo shows). Autoplay pauses on hover, touch, focus or reduced motion.
 */
export default function HeroSlider({ slides, from }: { slides: Slide[]; from?: { price: number; upd: string } }) {
  const n = slides.length;
  const { track, cur, go, playing, handlers } = useCarousel(n, AUTO_MS);
  return (
    <section className="hm-hero" aria-roledescription="carousel" aria-label="Hình ảnh cua của shop" {...handlers}>
      <div className="hm-hero-track" ref={track} tabIndex={0}>
        {slides.map((s, i) => (
          <figure key={i} className="hm-slide" aria-roledescription="slide" aria-label={`${i + 1} / ${n}: ${s.caption}`}>
            <Photo img={s.img} alt={s.alt} priority={i === 0} sizes="100vw" />
          </figure>
        ))}
      </div>
      <div className="hm-hero-shade" aria-hidden="true" />
      <div className="hm-wrap hm-hero-copy">
        <p className="hm-kick">{HOME.kicker}</p>
        <h1>{HOME.title.map((l) => <span key={l}>{l}</span>)}</h1>
        <p className="hm-hero-sub">{HOME.sub}</p>
        {/* Price anchor: buyers want a number before they message */}
        {from && <p className="hm-from">Giá hôm nay từ <b>{vnd(from.price)}</b>/kg{from.upd && <> · cập nhật {fd(from.upd)}</>}</p>}
        {/* Ordering happens in chat, so Zalo is the main action */}
        <div className="hm-ctas">
          <a className="hm-btn hm-btn-light" href={CONTACT.zalo} target="_blank" rel="noopener noreferrer">Nhắn Zalo đặt cua</a>
          <a className="hm-btn hm-btn-ghost" href="#bang-gia">Xem bảng giá</a>
        </div>
      </div>
      <div className="hm-wrap hm-hero-bar">
        <p className="hm-cap" aria-live="polite"><b>{p2(cur + 1)}</b>{slides[cur]?.caption}</p>
        <div className="hm-bars">
          {slides.map((_, i) => (
            <button key={i} type="button" className={`hm-bar${i < cur ? " done" : ""}${i === cur ? " on" : ""}`} aria-label={`Ảnh ${i + 1}`}
              aria-current={i === cur} onClick={() => go(i)}>
              {/* While playing, the current bar fills over AUTO_MS (restarted per slide by its key); paused, it shows full */}
              <i key={i === cur ? `on-${cur}-${playing}` : "off"} className={i === cur && playing ? "run" : undefined}
                style={i === cur && playing ? { animationDuration: AUTO_MS + "ms" } : undefined} />
            </button>
          ))}
        </div>
        <div className="hm-arrows">
          <button type="button" aria-label="Ảnh trước" onClick={() => go(cur - 1)}>←</button>
          <button type="button" aria-label="Ảnh sau" onClick={() => go(cur + 1)}>→</button>
        </div>
      </div>
    </section>
  );
}
