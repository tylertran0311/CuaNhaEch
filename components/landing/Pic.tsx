import Image from "next/image";
import type { Pic as PicData, Tone } from "@/lib/landing";

const FILL: Record<Tone, string> = { red: "var(--bh-red)", blue: "var(--bh-blue)", yellow: "var(--bh-yellow)", black: "var(--bh-black)" };
const NEXT: Record<Tone, Tone> = { red: "yellow", blue: "red", yellow: "blue", black: "yellow" };

/**
 * A photo, or until one is set, a Bauhaus composition in the photo's tone (circle, square, triangle, bars)
 * with a small "photo coming" label. `seed` varies the composition so neighbours don't look alike.
 */
export default function Pic({ pic, seed = 0, sizes = "100vw", priority }: { pic: PicData; seed?: number; sizes?: string; priority?: boolean }) {
  if (pic.img) return <Image className="lp-img" src={pic.img} alt={pic.alt} fill sizes={sizes} priority={priority} />;
  const a = FILL[pic.tone], b = FILL[NEXT[pic.tone]], v = seed % 4;
  return (
    <div className={`lp-ph lp-ph-${pic.tone}`} role="img" aria-label={pic.alt}>
      <svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <rect width="400" height="300" fill="var(--bh-paper)" />
        {v === 0 && <><circle cx="250" cy="150" r="115" fill={a} /><rect x="40" y="40" width="120" height="120" fill={b} /><rect x="0" y="236" width="400" height="18" fill="var(--bh-black)" /></>}
        {v === 1 && <><rect x="190" y="0" width="210" height="300" fill={a} /><circle cx="150" cy="170" r="90" fill={b} /><polygon points="40,280 120,140 200,280" fill="var(--bh-black)" /></>}
        {v === 2 && <><path d="M0 300 A220 220 0 0 1 220 80 L220 300 Z" fill={a} /><circle cx="300" cy="90" r="55" fill={b} /><rect x="250" y="190" width="150" height="16" fill="var(--bh-black)" /><rect x="250" y="222" width="100" height="16" fill="var(--bh-black)" /></>}
        {v === 3 && <><circle cx="130" cy="130" r="95" fill={b} /><rect x="160" y="110" width="200" height="150" fill={a} /><circle cx="330" cy="60" r="22" fill="var(--bh-black)" /></>}
      </svg>
      <span className="lp-ph-tag">Ảnh sẽ cập nhật · {pic.alt}</span>
    </div>
  );
}
