"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { fold } from "@/lib/text";
import { Chevron, useDismiss } from "./popup";

/** A suggestion */
export interface Opt { value: string; hint?: string }

/**
 * Text field with a suggestion list. Typing anything is allowed (values not in the list are kept).
 * The list is searched by what was typed, unless `filter` is false (options already matched elsewhere, e.g. by a server).
 */
export function Combobox({ value, onChange, onPick, options, placeholder, className = "", bad, noMatch, inputProps, filter = true }: {
  value: string; onChange: (v: string) => void; onPick?: (o: Opt) => void; options: Opt[]; placeholder: string;
  className?: string; bad?: boolean; noMatch?: string; inputProps?: React.InputHTMLAttributes<HTMLInputElement>; filter?: boolean;
}) {
  const [open, setOpen] = useState(false);
  // What the user typed since opening; "" lists everything
  const [query, setQuery] = useState("");
  const [act, setAct] = useState(0);
  const box = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLUListElement>(null);
  useDismiss(open, () => setOpen(false), box);

  const shown = useMemo(() => {
    const q = fold(query.trim());
    if (!q || !filter) return options.slice(0, 200);
    return options.filter((o) => fold(o.value + " " + (o.hint || "")).includes(q)).slice(0, 200);
  }, [options, query, filter]);

  useEffect(() => { list.current?.children[act]?.scrollIntoView({ block: "nearest" }); }, [act]);

  function pick(o: Opt) {
    onChange(o.value);
    onPick?.(o);
    setOpen(false);
  }

  function key(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") { e.preventDefault(); setOpen(true); setAct((a) => Math.min(a + 1, shown.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setAct((a) => Math.max(a - 1, 0)); }
    else if (e.key === "Enter" && open && shown[act]) { e.preventDefault(); pick(shown[act]); }
    else if (e.key === "Tab") setOpen(false);
  }

  // Clicking the field (or its arrow) again closes the list. The click that focuses the field only opens it.
  const focusedAt = useRef(0);
  function show() { setQuery(""); setAct(0); setOpen(true); }
  function toggle() { if (open) setOpen(false); else show(); }
  const listShown = open && (shown.length > 0 || !!(noMatch && query));

  return (
    <div ref={box} className={`cb ${className}${listShown ? " open" : ""}`}>
      <input {...inputProps} className={bad ? "bad" : ""} placeholder={placeholder} value={value} autoComplete="off"
        role="combobox" aria-expanded={listShown} aria-autocomplete="list"
        onFocus={() => { focusedAt.current = Date.now(); show(); }}
        onClick={() => { if (Date.now() - focusedAt.current > 300) toggle(); }}
        onChange={(e) => { onChange(e.target.value); setQuery(e.target.value); setAct(0); setOpen(true); }}
        onKeyDown={key} />
      <button type="button" className="dd-tog" tabIndex={-1} aria-label={placeholder}
        onPointerDown={(e) => e.preventDefault()} onClick={() => { box.current?.querySelector("input")?.focus(); toggle(); }}>
        <Chevron />
      </button>
      {listShown && (
        <ul ref={list} className="pop cb-list" role="listbox">
          {shown.map((o, i) => (
            <li key={o.value + i} role="option" aria-selected={o.value === value}
              className={`${i === act ? "act" : ""}${o.value === value ? " sel" : ""}`}
              onPointerDown={(e) => e.preventDefault()} onClick={() => pick(o)} onPointerEnter={() => setAct(i)}>
              <span>{o.value}</span>{o.hint && <small>{o.hint}</small>}
            </li>
          ))}
          {!shown.length && <li className="none">{noMatch}</li>}
        </ul>
      )}
    </div>
  );
}
