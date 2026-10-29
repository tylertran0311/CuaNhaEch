import { cx } from "./cx";

/** A few options in one pill, the chosen one filled (e.g. VI / EN) */
export function Segmented<T extends string>({ options, value, onChange, label = (v) => v, className }: {
  options: readonly T[]; value: T; onChange: (v: T) => void; label?: (v: T) => string; className?: string;
}) {
  return (
    <div className={cx("seg", className)}>
      {options.map((o) => (
        <button key={o} type="button" className={o === value ? "on" : ""} aria-pressed={o === value} onClick={() => onChange(o)}>{label(o)}</button>
      ))}
    </div>
  );
}
