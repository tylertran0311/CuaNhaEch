// Bauhaus-style icons built only from basic shapes (half circles, circles, bars, triangles) in the page's
// primary colors. Size them with CSS (width/height on .lp-icon).

/** Crab: half-circle shell, round claws with a wedge cut out, bar legs, eyes on stalks */
export function CrabIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={`lp-icon ${className}`} viewBox="0 0 64 64" aria-hidden="true">
      {/* legs */}
      <rect x="2" y="41" width="12" height="3.5" fill="var(--bh-black)" />
      <rect x="3" y="48" width="11" height="3.5" fill="var(--bh-black)" />
      <rect x="50" y="41" width="12" height="3.5" fill="var(--bh-black)" />
      <rect x="50" y="48" width="11" height="3.5" fill="var(--bh-black)" />
      {/* claws: circles with a wedge cut, opening towards the middle */}
      <path d="M11 24 L17.5 18.5 A9 9 0 1 0 19.8 26.3 Z" fill="var(--bh-yellow)" />
      <path d="M53 24 L46.5 18.5 A9 9 0 1 1 44.2 26.3 Z" fill="var(--bh-yellow)" />
      {/* eyes on stalks */}
      <rect x="24" y="15" width="3" height="10" fill="var(--bh-black)" />
      <rect x="37" y="15" width="3" height="10" fill="var(--bh-black)" />
      <circle cx="25.5" cy="13.5" r="4" fill="var(--bh-black)" />
      <circle cx="38.5" cy="13.5" r="4" fill="var(--bh-black)" />
      {/* shell */}
      <path d="M12 46 A20 20 0 0 1 52 46 Z" fill="var(--bh-red)" />
      <rect x="12" y="46" width="40" height="4" fill="var(--bh-black)" />
    </svg>
  );
}

/** Shrimp curled into a C: thick banded body, round head with an eye, fan tail, two antennae */
export function ShrimpIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={`lp-icon ${className}`} viewBox="0 0 64 64" aria-hidden="true">
      {/* antennae */}
      <path d="M33 9 L14 3 M37 8 L26 1" stroke="var(--bh-black)" strokeWidth="2.6" />
      {/* tail fan at the end of the curl */}
      <polygon points="7,33 21,33 9,17" fill="var(--bh-yellow)" />
      {/* body: three quarters of a ring, cut into bands */}
      <path d="M30 16 A16 16 0 1 1 14 32" fill="none" stroke="var(--bh-blue)" strokeWidth="10" />
      <path d="M40.3 35.8 L49.7 39.2 M31.9 42.8 L33.7 52.7 M21.6 39.1 L13.9 45.5" stroke="var(--bh-paper)" strokeWidth="2.6" />
      {/* head */}
      <circle cx="36" cy="16" r="8.5" fill="var(--bh-red)" />
      <circle cx="39" cy="13.5" r="2.3" fill="var(--bh-black)" />
    </svg>
  );
}
