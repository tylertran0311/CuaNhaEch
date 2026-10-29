"use client";

import { forwardRef, useState, type ComponentProps, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from "react";
import type { Dict } from "@/lib/i18n";
import { cx } from "./cx";

/**
 * Form card: fields flow in wrapping rows and go full width on phones. Inside a <Panel> it drops its own
 * card look. Put <TextInput>, <UnitInput>, pickers and a primary <Button type="submit"> straight inside.
 */
export function FormCard({ className, ...rest }: ComponentProps<"form">) {
  return <form className={cx("add", className)} {...rest} />;
}

/** Text field; `bad` marks it invalid (red border + shake) */
export const TextInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { bad?: boolean }>(
  function TextInput({ bad, className, ...rest }, ref) {
    return <input ref={ref} className={cx(bad && "bad", className) || undefined} {...rest} />;
  });

/** Multi-line text field */
export const TextArea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function TextArea(props, ref) { return <textarea ref={ref} {...props} />; });

/**
 * Number field with a fixed suffix inside it ("kg", ".000 ₫/kg"). Controlled with `value`/`onChange`, or leave
 * `value` out and pass `inputProps` (e.g. defaultValue + onBlur) with an `inputKey` that resets it.
 */
export function UnitInput({ value, onChange, placeholder, suffix, bad, className = "", inputProps, inputKey }: {
  value?: string; onChange?: (v: string) => void; placeholder?: string; suffix: ReactNode; bad?: boolean; className?: string;
  inputProps?: InputHTMLAttributes<HTMLInputElement>; inputKey?: React.Key;
}) {
  return (
    <label className={cx("u", className, bad && "bad")}>
      <input key={inputKey} type="number" min="0" step="any" inputMode="decimal" placeholder={placeholder}
        {...(value !== undefined ? { value, onChange: (e: React.ChangeEvent<HTMLInputElement>) => onChange?.(e.target.value) } : {})}
        {...inputProps} />
      <span>{suffix}</span>
    </label>
  );
}

/** Amount in thousands of đồng, shown with a ".000 ₫" suffix */
export function Money({ value, onChange, placeholder, bad, suffix = ".000 ₫", className = "" }: {
  value: string; onChange: (v: string) => void; placeholder: string; bad?: boolean; suffix?: string; className?: string;
}) {
  return <UnitInput value={value} onChange={onChange} placeholder={placeholder} suffix={suffix} bad={bad} className={className} />;
}

/** Checkbox drawn as a pill that fills in when checked */
export function ToggleChip({ checked, onChange, children }: { checked: boolean; onChange: (v: boolean) => void; children: ReactNode }) {
  return (
    <label className={cx("opt", checked && "on")}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} /> {children}
    </label>
  );
}

/** Validation message under a form; `below` when it sits under a form inside a panel */
export function FormError({ children, below }: { children: ReactNode; below?: boolean }) {
  return <div className={cx("err", below && "below")} role="alert">{children}</div>;
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
