"use client";

import { useState } from "react";
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
