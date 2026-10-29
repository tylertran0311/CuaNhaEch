"use client";

// Building blocks shared by the pickers: closing on outside click, the dropdown chevron, the popup sheet.
import { useEffect, useRef } from "react";

/** Closes a popup on outside click or Escape */
export function useDismiss(open: boolean, close: () => void, ref: React.RefObject<HTMLElement | null>) {
  const closeRef = useRef(close);
  closeRef.current = close;
  useEffect(() => {
    if (!open) return;
    const down = (e: PointerEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) closeRef.current(); };
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") closeRef.current(); };
    document.addEventListener("pointerdown", down);
    document.addEventListener("keydown", key);
    return () => { document.removeEventListener("pointerdown", down); document.removeEventListener("keydown", key); };
  }, [open, ref]);
}

/** Hand-drawn chevron; CSS turns it to point up while its dropdown is open */
export function Chevron() {
  return (
    <svg className="dd-chev" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none"
      stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4.5 8.8c2.6 2.3 4.9 4.6 7.4 6.9 0 0 .2.1.3 0 2.5-2.4 4.7-4.6 7.3-7.2" />
    </svg>
  );
}

/** Popup that drops under its field on wide screens and becomes a bottom sheet on phones */
export function Sheet({ open, onClose, children }: { open: boolean; onClose: () => void; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <>
      <div className="sheet-bg" onClick={onClose} />
      <div className="pop sheet" role="dialog">{children}</div>
    </>
  );
}
