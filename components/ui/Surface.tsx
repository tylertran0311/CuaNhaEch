import type { HTMLAttributes, ReactNode } from "react";
import { cx } from "./cx";

/** Card with a striped title bar; the default container for a block of content */
export function Panel({ title, className, children }: { title?: ReactNode; className?: string; children: ReactNode }) {
  return (
    <div className={cx("panel", className)}>
      {title != null && <h2>{title}</h2>}
      {children}
    </div>
  );
}

/** Sticky-note banner for notices; `bad` for errors */
export function Note({ bad, className, children }: { bad?: boolean; className?: string; children: ReactNode }) {
  return <div className={cx("note", bad && "bad-note", className)}>{children}</div>;
}

/** "Nothing here" line */
export function Empty({ children }: { children: ReactNode }) {
  return <div className="empty">{children}</div>;
}

/** Row of big-number tiles; tiles are tinted in order */
export function Stats({ children }: { children: ReactNode }) {
  return <div className="stats">{children}</div>;
}
export function Stat({ label, value, sub, tone }: { label: ReactNode; value: ReactNode; sub?: ReactNode; tone?: "in" | "out" }) {
  return (
    <div className="stat">
      <small>{label}</small>
      <div className={tone ? "v-" + tone : undefined}>{value}</div>
      {sub && <small>{sub}</small>}
    </div>
  );
}

/** Two equal columns, one on narrow screens */
export function TwoCols({ children }: { children: ReactNode }) {
  return <div className="two">{children}</div>;
}

/** Page title with controls on the right (wraps under the title on phones) */
export function Toolbar({ title, meta, className, children }: { title: ReactNode; meta?: ReactNode; className?: string; children?: ReactNode }) {
  return (
    <div className={cx("calbar", className)}>
      <h2>{title}{meta != null && <> <small>· {meta}</small></>}</h2>
      {children}
    </div>
  );
}

/** Small pill label. Kinds map to the fixed palette, so the same thing is always the same color. */
export type ChipKind = "channel" | "crab" | "shrimp" | "steam" | "raw" | "live" | "late";
const CHIP: Record<ChipKind, string> = {
  channel: "ch", crab: "tg crab", shrimp: "tg shrimp", steam: "otag steam", raw: "otag raw", live: "otag live", late: "wn late",
};
export function Chip({ kind, className, children, ...rest }: HTMLAttributes<HTMLSpanElement> & { kind: ChipKind }) {
  return <span className={cx(CHIP[kind], className)} {...rest}>{children}</span>;
}
/** Chips side by side, aligned with the text around them */
export function Chips({ children }: { children: ReactNode }) {
  return <span className="otags">{children}</span>;
}
