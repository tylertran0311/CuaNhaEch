import Image from "next/image";
import { LineCrab, LineShrimp } from "./LineArt";

/**
 * A food photo filling its box. Until the shop's own photo is set (`img` in lib/landing.ts), a calm placeholder
 * in the page's colors shows where it goes — the page is meant for real photos of the real crabs.
 */
export default function Photo({ img, alt, sizes = "100vw", priority, art = "crab" }: {
  img?: string; alt: string; sizes?: string; priority?: boolean; art?: "crab" | "shrimp";
}) {
  if (img) return <Image className="hm-img" src={img} alt={alt} fill sizes={sizes} priority={priority} />;
  return (
    <div className="hm-ph" role="img" aria-label={alt}>
      {art === "shrimp" ? <LineShrimp className="hm-ph-art" /> : <LineCrab className="hm-ph-art" />}
    </div>
  );
}
