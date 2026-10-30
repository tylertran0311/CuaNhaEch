"use client";

import { useEffect, useState } from "react";
import { CONTACT } from "@/lib/landing";

/**
 * Round buttons floating bottom-right: Zalo (always) and back to top (once the page is scrolled past the hero).
 * On phones they sit above the call/Zalo bar, and the Zalo one is left out since that bar already has it.
 */
export default function FloatingActions() {
  const [up, setUp] = useState(false);

  useEffect(() => {
    // Cheap enough to run on every scroll event; React skips the render while the value stays the same
    const onScroll = () => setUp(window.scrollY > 600);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function toTop() {
    const smooth = !matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: smooth ? "smooth" : "auto" });
  }

  return (
    <div className="hm-fab">
      <button type="button" className={`hm-fab-top${up ? " on" : ""}`} onClick={toTop} aria-label="Lên đầu trang" tabIndex={up ? 0 : -1}>
        <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 19V5M5 12l7-7 7 7" />
        </svg>
      </button>
      <a className="hm-fab-zalo" href={CONTACT.zalo} target="_blank" rel="noopener noreferrer" aria-label="Nhắn Zalo cho shop">
        <span>Zalo</span>
      </a>
    </div>
  );
}
