"use client";

import { useState } from "react";

/** Small doodle button that copies `text`; shows a tick for a moment once copied */
export function CopyBtn({ text, label }: { text: string; label: string }) {
  const [ok, setOk] = useState(false);
  async function copy() {
    let done = false;
    try { await navigator.clipboard.writeText(text); done = true; } catch {
      // Older browsers / blocked clipboard: copy through a hidden text box
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.cssText = "position:fixed;opacity:0";
      document.body.appendChild(ta);
      ta.select();
      try { done = document.execCommand("copy"); } catch {}
      ta.remove();
    }
    if (!done) return;
    setOk(true);
    setTimeout(() => setOk(false), 1400);
  }
  return (
    <button type="button" className={`cpy${ok ? " ok" : ""}`} title={label} aria-label={label} onClick={copy}>
      {ok ? "✓" : (
        <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 8.5c0-1.4.6-2 2-2h6.6c1.3 0 1.9.6 1.9 2v7.8c0 1.3-.6 1.9-1.9 1.9H11c-1.4 0-2-.6-2-1.9z" />
          <path d="M15 6.4V5.7c0-1.3-.6-1.9-1.9-1.9H6.4c-1.3 0-1.9.6-1.9 1.9v7.8c0 1.4.6 2 1.9 2H9" />
        </svg>
      )}
    </button>
  );
}
