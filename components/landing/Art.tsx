// Bauhaus illustrations for the landing page, built only from basic shapes in the page's primary colors.

const R = "var(--bh-red)", B = "var(--bh-blue)", Y = "var(--bh-yellow)", K = "var(--bh-black)", P = "var(--bh-paper)";

/**
 * Hero poster: a big geometric crab in a round pool of water, its claws reaching past the edge of the circle.
 * Shown until a hero photo is set.
 */
export function HeroCrab() {
  return (
    <svg className="lp-herocrab" viewBox="0 0 400 400" role="img" aria-label="Cua Cà Mau">
      {/* pool */}
      <circle cx="200" cy="210" r="160" fill={B} />
      <clipPath id="lp-pool"><circle cx="200" cy="210" r="160" /></clipPath>
      <g clipPath="url(#lp-pool)">
        {/* waves: rows of half circles */}
        {[0, 1, 2].map((row) =>
          Array.from({ length: 11 }, (_, i) => (
            <path key={row + "-" + i} d={`M${i * 40 - (row % 2) * 20} ${318 + row * 22} a20 20 0 0 1 40 0 Z`} fill={row === 1 ? Y : P} opacity={row === 1 ? 1 : 0.9} />
          )))}
        <rect x="40" y="374" width="320" height="40" fill={K} />
        {/* legs: staggered bars under the shell, inside the pool (clipped to it, so they never poke out) */}
        {[[72, 282, 50], [80, 298, 42], [90, 314, 32]].map(([x, y, w]) => (
          <g key={y}>
            <rect x={x} y={y} width={w} height="10" fill={K} />
            <rect x={400 - x - w} y={y} width={w} height="10" fill={K} />
          </g>
        ))}
      </g>
      {/* arms */}
      <rect x="92" y="150" width="70" height="14" fill={K} transform="rotate(35 92 157)" />
      <rect x="238" y="150" width="70" height="14" fill={K} transform="rotate(-35 308 157)" />
      {/* claws: circles with a wedge cut out, reaching outside the pool */}
      <path d="M62 112 L96 84 A44 44 0 1 0 104 132 Z" fill={Y} stroke={K} strokeWidth="4" />
      <path d="M338 112 L304 84 A44 44 0 1 1 296 132 Z" fill={Y} stroke={K} strokeWidth="4" />
      {/* eyes on stalks */}
      <rect x="168" y="126" width="9" height="44" fill={K} />
      <rect x="223" y="126" width="9" height="44" fill={K} />
      <circle cx="172.5" cy="122" r="15" fill={K} />
      <circle cx="227.5" cy="122" r="15" fill={K} />
      <circle cx="177" cy="117" r="5" fill={P} />
      <circle cx="232" cy="117" r="5" fill={P} />
      {/* shell with geometric markings */}
      <path d="M96 262 A104 96 0 0 1 304 262 Z" fill={R} stroke={K} strokeWidth="4" />
      <circle cx="160" cy="222" r="14" fill={Y} />
      <rect x="226" y="208" width="26" height="26" fill={K} />
      <polygon points="200,186 214,210 186,210" fill={P} />
      <rect x="92" y="262" width="216" height="14" fill={K} />
    </svg>
  );
}

/** Round stamp with text running around it (spins slowly) */
export function BadgeRing({ text, center }: { text: string; center: string }) {
  return (
    <svg className="lp-ring" viewBox="0 0 120 120" aria-hidden="true">
      <defs><path id="lp-ring-path" d="M60 60 m-44 0 a44 44 0 1 1 88 0 a44 44 0 1 1 -88 0" /></defs>
      <circle cx="60" cy="60" r="58" fill={K} />
      <text className="lp-ring-txt"><textPath href="#lp-ring-path" textLength="270">{text}</textPath></text>
      <circle cx="60" cy="60" r="27" fill={Y} />
      <text x="60" y="66" textAnchor="middle" className="lp-ring-mid">{center}</text>
    </svg>
  );
}

/** Pond: sun over rows of waves (Cà Mau origin) */
export function PondIcon() {
  return (
    <svg className="lp-ficon" viewBox="0 0 64 64" aria-hidden="true">
      <circle cx="40" cy="22" r="13" fill="currentColor" />
      {[0, 1, 2, 3].map((i) => <path key={i} d={`M${i * 16} 46 a8 8 0 0 1 16 0 Z`} fill="currentColor" opacity=".55" />)}
      {[0, 1, 2, 3].map((i) => <path key={"b" + i} d={`M${i * 16 - 8} 58 a8 8 0 0 1 16 0 Z`} fill="currentColor" />)}
    </svg>
  );
}

/** Delivery: a box rushing forward with speed bars */
export function DeliveryIcon() {
  return (
    <svg className="lp-ficon" viewBox="0 0 64 64" aria-hidden="true">
      <rect x="24" y="18" width="34" height="30" fill="currentColor" />
      <rect x="36" y="18" width="10" height="12" fill="var(--tone)" />
      <rect x="2" y="22" width="16" height="5" fill="currentColor" />
      <rect x="8" y="32" width="12" height="5" fill="currentColor" />
      <rect x="4" y="42" width="14" height="5" fill="currentColor" />
      <circle cx="31" cy="54" r="6" fill="currentColor" />
      <circle cx="51" cy="54" r="6" fill="currentColor" />
    </svg>
  );
}

/** Steaming pot: half-circle pot, lid bar, three steam bars */
export function SteamIcon() {
  return (
    <svg className="lp-ficon" viewBox="0 0 64 64" aria-hidden="true">
      <rect x="18" y="4" width="5" height="16" fill="currentColor" />
      <rect x="30" y="2" width="5" height="18" fill="currentColor" />
      <rect x="42" y="6" width="5" height="14" fill="currentColor" />
      <rect x="6" y="26" width="52" height="6" fill="currentColor" />
      <path d="M10 34 H54 A22 22 0 0 1 10 34 Z" fill="currentColor" />
      <rect x="27" y="22" width="10" height="4" fill="currentColor" />
    </svg>
  );
}

/**
 * Underside of a crab with its apron ("yếm"): male = narrow triangle (more meat),
 * female = wide rounded apron (roe).
 */
export function ApronIcon({ kind }: { kind: "male" | "female" }) {
  return (
    <svg className="lp-apron" viewBox="0 0 200 160" aria-hidden="true">
      {/* legs */}
      {[0, 1, 2].map((i) => (
        <g key={i}>
          <rect x="4" y={70 + i * 20} width="40" height="8" fill={K} />
          <rect x="156" y={70 + i * 20} width="40" height="8" fill={K} />
        </g>
      ))}
      {/* belly */}
      <ellipse cx="100" cy="90" rx="66" ry="56" fill={P} stroke={K} strokeWidth="5" />
      <rect x="40" y="86" width="120" height="5" fill={K} opacity=".15" />
      {kind === "male"
        ? <polygon points="100,46 120,134 80,134" fill={B} stroke={K} strokeWidth="5" />
        : <path d="M62 132 A40 52 0 0 1 138 132 Z" fill={R} stroke={K} strokeWidth="5" />}
      {kind === "female" && <circle cx="100" cy="112" r="9" fill={Y} />}
    </svg>
  );
}

/** Dots for "crabs per kg": fewer, bigger dots = bigger crabs */
export function SizeDots({ size }: { size: string }) {
  const m = size.match(/(\d+)/), n = m ? +m[1] : 0, many = /^\s*>/.test(size) || n > 8;
  if (!n) return null;
  return (
    <span className="lp-dots-size" aria-hidden="true" title={size}>
      {Array.from({ length: Math.min(n, 8) }, (_, i) => <i key={i} />)}{many && <b>+</b>}
    </span>
  );
}
