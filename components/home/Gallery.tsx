"use client";

import { useCarousel } from "@/components/landing/useCarousel";
import Photo from "./Photo";

const Chevron = ({ left }: { left?: boolean }) => (
  <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d={left ? "M15 5l-7 7 7 7" : "M9 5l7 7-7 7"} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
);

/**
 * The product page's photos: a big photo that swipes (scroll snap) with arrows and a counter, and a row of thumbnails
 * under it. Arrow keys work once it has focus. With one photo (or none yet: a placeholder) it is just the big photo.
 */
export default function Gallery({ imgs, alt, art, tag }: { imgs: string[]; alt: string; art: "crab" | "shrimp"; tag?: string }) {
  const n = imgs.length;
  const { track, cur, go, handlers } = useCarousel(n, 0);
  const sizes = "(min-width: 900px) 50vw, 100vw";

  if (n < 2) {
    return (
      <div className="hm-gal">
        <div className="hm-pd-pic">
          <div className="hm-prod-shot"><Photo img={imgs[0]} alt={alt} art={art} priority sizes={sizes} /></div>
          {tag && <span className="hm-tag">{tag}</span>}
        </div>
      </div>
    );
  }

  return (
    <div className="hm-gal" aria-roledescription="carousel" aria-label={`Ảnh ${alt}`} {...handlers}>
      <div className="hm-pd-pic">
        <div className="hm-gal-track" ref={track} tabIndex={0} aria-label={`Ảnh ${alt}, dùng phím mũi tên để xem ảnh khác`}>
          {imgs.map((img, i) => (
            <figure key={img} className="hm-gal-slide" aria-roledescription="slide" aria-label={`${i + 1} / ${n}`}>
              <Photo img={img} alt={`${alt} – ảnh ${i + 1}`} art={art} priority={i === 0} sizes={sizes} />
            </figure>
          ))}
        </div>
        <button type="button" className="hm-gal-arrow prev" aria-label="Ảnh trước" onClick={() => go(cur - 1)}><Chevron left /></button>
        <button type="button" className="hm-gal-arrow next" aria-label="Ảnh sau" onClick={() => go(cur + 1)}><Chevron /></button>
        <span className="hm-gal-count" aria-live="polite">{cur + 1} / {n}</span>
        {tag && <span className="hm-tag">{tag}</span>}
      </div>
      <div className="hm-gal-thumbs">
        {imgs.map((img, i) => (
          <button key={img} type="button" className="hm-gal-thumb" aria-label={`Xem ảnh ${i + 1}`} aria-current={i === cur} onClick={() => go(i)}>
            <Photo img={img} alt="" art={art} sizes="96px" />
          </button>
        ))}
      </div>
    </div>
  );
}
