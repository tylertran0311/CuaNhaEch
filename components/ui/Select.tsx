"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import { Chevron, useDismiss } from "./popup";

/** An option for Select: shown as `label` (defaults to the value), optionally under a `group` heading */
export interface SelOpt { value: string; label?: string; hint?: string; group?: string }

/** Pick-one list (no typing) styled like the other dropdowns */
export function Select({ value, onChange, options, className = "", label }: {
  value: string; onChange: (v: string) => void; options: (string | SelOpt)[]; className?: string; label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [act, setAct] = useState(0);
  const box = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLUListElement>(null);
  useDismiss(open, () => setOpen(false), box);
  const opts: SelOpt[] = options.map((o) => (typeof o === "string" ? { value: o } : o));
  const cur = opts.find((o) => o.value === value);

  useEffect(() => { list.current?.querySelector(".act")?.scrollIntoView({ block: "nearest" }); }, [act, open]);

  function toggle() { setAct(Math.max(0, opts.findIndex((o) => o.value === value))); setOpen(!open); }
  function pick(v: string) { onChange(v); setOpen(false); }
  function key(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") { e.preventDefault(); if (!open) toggle(); else setAct((a) => Math.min(a + 1, opts.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setAct((a) => Math.max(a - 1, 0)); }
    else if (e.key === "Enter" && open) { e.preventDefault(); pick(opts[act].value); }
    else if (e.key === "Tab") setOpen(false);
  }

  return (
    <div ref={box} className={`sl ${className}${open ? " open" : ""}`}>
      <button type="button" className="sl-btn" aria-haspopup="listbox" aria-expanded={open} aria-label={label} onClick={toggle} onKeyDown={key}>
        <span>{cur ? cur.label ?? cur.value : value}</span>
        <span className="dd-tog" aria-hidden="true"><Chevron /></span>
      </button>
      {open && (
        <ul ref={list} className="pop cb-list" role="listbox">
          {opts.map((o, i) => (
            <Fragment key={o.value}>
              {o.group && o.group !== opts[i - 1]?.group && <li className="grp" role="presentation">{o.group}</li>}
              <li role="option" aria-selected={o.value === value} className={`${i === act ? "act" : ""}${o.value === value ? " sel" : ""}`}
                onClick={() => pick(o.value)} onPointerEnter={() => setAct(i)}>
                <span>{o.label ?? o.value}</span>{o.hint && <small>{o.hint}</small>}
              </li>
            </Fragment>
          ))}
        </ul>
      )}
    </div>
  );
}
