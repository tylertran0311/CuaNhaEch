"use client";

import { useEffect, useRef, useState } from "react";
import type { State } from "@/lib/store";
import type { Dict } from "@/lib/i18n";

export type Update = (fn: (s: State) => void) => void;
export interface ViewProps { s: State; t: Dict; update: Update }

/** Number input in thousands of đồng, with a ".000 ₫" suffix. */
export function Money({ value, onChange, placeholder, bad, suffix = ".000 ₫", className = "" }: {
  value: string; onChange: (v: string) => void; placeholder: string; bad?: boolean; suffix?: string; className?: string;
}) {
  return (
    <label className={`u ${className}${bad ? " bad" : ""}`}>
      <input type="number" min="0" step="any" inputMode="decimal" placeholder={placeholder}
        value={value} onChange={(e) => onChange(e.target.value)} />
      <span>{suffix}</span>
    </label>
  );
}

/** Tracks which fields failed validation plus the error message. */
export function useErrors() {
  const [bad, setBad] = useState<Record<string, boolean>>({});
  const [err, setErr] = useState("");
  // Returns true when everything is valid. Fields with `msg` show that message instead of "please fill in".
  function check(t: Dict, fields: { key: string; ok: boolean; label: string; msg?: string }[]) {
    const b: Record<string, boolean> = {};
    fields.forEach((f) => { b[f.key] = !f.ok; });
    setBad(b);
    const failed = fields.filter((f) => !f.ok);
    const missing = failed.filter((f) => !f.msg).map((f) => f.label);
    const parts = [missing.length ? t.miss + missing.join(", ") : "", ...failed.map((f) => f.msg || "")].filter(Boolean);
    setErr(parts.join(" · "));
    return !failed.length;
  }
  function clear() { setBad({}); setErr(""); }
  return { bad, err, check, clear };
}

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

/** What a confirm popup asks: `danger` styles the confirm button red and puts focus on Cancel */
export interface Ask { title: string; body?: React.ReactNode; ok: string; cancel: string; danger?: boolean }

/**
 * Themed yes/no popup. Render `node` once, then `if (await ask({...}))` before the action.
 * Esc, Cancel or a click outside answers no.
 */
export function useConfirm() {
  const [q, setQ] = useState<(Ask & { done: (v: boolean) => void }) | null>(null);
  const ask = (a: Ask) => new Promise<boolean>((done) => setQ({ ...a, done }));
  const answer = (v: boolean) => { q?.done(v); setQ(null); };
  return [q && <ConfirmDialog key={q.title} {...q} onAnswer={answer} />, ask] as const;
}

function ConfirmDialog({ title, body, ok, cancel, danger, onAnswer }: Ask & { onAnswer: (v: boolean) => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (d && !d.open) d.showModal();
    (d?.querySelector(danger ? ".cfm-no" : ".cfm-ok") as HTMLButtonElement | null)?.focus();
  }, [danger]);
  return (
    <dialog ref={ref} className="cfm" aria-labelledby="cfm-t"
      onCancel={(e) => { e.preventDefault(); onAnswer(false); }}
      onClick={(e) => { if (e.target === e.currentTarget) onAnswer(false); }}>
      {/* The dialog itself has no padding, so a click on it (not on this box) is a click on the backdrop */}
      <div className="cfm-in">
        <h3 id="cfm-t">{title}</h3>
        {body && <div className="cfm-b">{body}</div>}
        <div className="cfm-acts">
          <button type="button" className="ghost cfm-no" onClick={() => onAnswer(false)}>{cancel}</button>
          <button type="button" className={`btn cfm-ok${danger ? " danger" : ""}`} onClick={() => onAnswer(true)}>{ok}</button>
        </div>
      </div>
    </dialog>
  );
}
