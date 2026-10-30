// Fine line drawings for the minimal home page: one thin stroke in the current text color, no fills.

const base = { fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

/** A crab: rounded shell, eyes on stalks, two claws, three legs a side */
export function LineCrab({ className = "" }: { className?: string }) {
  return (
    <svg className={`hm-line ${className}`} viewBox="0 0 64 64" aria-hidden="true" {...base}>
      <path d="M14 36C14 26 22 21 32 21s18 5 18 15c0 5-8 8-18 8s-18-3-18-8Z" />
      <path d="M22 33c3 2 6 3 10 3s7-1 10-3" opacity=".55" />
      <path d="M27 21l-1-5M37 21l1-5" />
      <circle cx="26" cy="14.6" r="1.5" /><circle cx="38" cy="14.6" r="1.5" />
      <path d="M17 29c-6-2-8-7-6-12M11 17c-3-2-3-7 1-8M11 17c3-3 5-5 4-8" />
      <path d="M47 29c6-2 8-7 6-12M53 17c3-2 3-7-1-8M53 17c-3-3-5-5-4-8" />
      <path d="M15 38c-5 1-8 4-10 8M17 41c-5 2-7 6-8 10M20 43c-3 3-4 7-4 11" />
      <path d="M49 38c5 1 8 4 10 8M47 41c5 2 7 6 8 10M44 43c3 3 4 7 4 11" />
    </svg>
  );
}

/** A curled shrimp: banded body, fan tail, long antennae */
export function LineShrimp({ className = "" }: { className?: string }) {
  return (
    <svg className={`hm-line ${className}`} viewBox="0 0 64 64" aria-hidden="true" {...base}>
      <path d="M40 12c12 2 18 16 12 28-5 10-16 14-26 12" />
      <path d="M38 20c8 2 11 11 7 19-4 6-11 8-17 7" />
      <path d="M40 12c-6 0-8 4-7 7 1 2 3 2 5 1" />
      <path d="M50 26l-4 2M51 36h-5M45 46l-4-4M36 51l-2-5" opacity=".7" />
      <path d="M27 49 16 56l-2-9Z" />
      <circle cx="37" cy="15" r="1.2" />
      <path d="M36 13C28 6 20 6 12 9M38 12C32 4 26 2 20 2" />
    </svg>
  );
}

/** Underside of a crab with its apron: male = narrow triangle (meat), female = wide dome (roe) */
export function LineApron({ kind, className = "" }: { kind: "male" | "female"; className?: string }) {
  return (
    <svg className={`hm-line ${className}`} viewBox="0 0 120 100" aria-hidden="true" {...base} strokeWidth={1.8}>
      <ellipse cx="60" cy="52" rx="42" ry="34" />
      <path d="M18 44H6M18 54H4M20 64H8M102 44h12M102 54h14M100 64h12" />
      {kind === "male" ? <path d="M60 24 70 82H50Z" /> : <path d="M36 82c0-30 48-30 48 0Z" />}
    </svg>
  );
}

/** Sun over water: the Năm Căn ponds */
export function LinePond({ className = "" }: { className?: string }) {
  return (
    <svg className={`hm-line ${className}`} viewBox="0 0 48 48" aria-hidden="true" {...base}>
      <circle cx="24" cy="18" r="7" />
      <path d="M24 5v3M13 9l2 2M35 9l-2 2M8 18h3M37 18h3" />
      <path d="M6 32c3-3 6-3 9 0s6 3 9 0 6-3 9 0 6 3 9 0M6 40c3-3 6-3 9 0s6 3 9 0 6-3 9 0 6 3 9 0" />
    </svg>
  );
}

/** A packed box: nationwide delivery */
export function LineBox({ className = "" }: { className?: string }) {
  return (
    <svg className={`hm-line ${className}`} viewBox="0 0 48 48" aria-hidden="true" {...base}>
      <path d="M24 6 41 14v20L24 42 7 34V14Z" />
      <path d="M7 14l17 8 17-8M24 22v20" />
      <path d="M15.5 10 32 18v7" />
    </svg>
  );
}

/** A steaming pot: steamed to order */
export function LineSteam({ className = "" }: { className?: string }) {
  return (
    <svg className={`hm-line ${className}`} viewBox="0 0 48 48" aria-hidden="true" {...base}>
      <path d="M17 13c-2-2 2-4 0-7M24 13c-2-2 2-4 0-7M31 13c-2-2 2-4 0-7" />
      <path d="M8 22h32M10 22v8c0 6 6 10 14 10s14-4 14-10v-8" />
      <path d="M20 18h8M5 25h3M40 25h3" />
    </svg>
  );
}
