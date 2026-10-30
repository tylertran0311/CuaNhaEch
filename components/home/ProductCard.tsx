import Link from "next/link";
import { piecesPerKg, type Product } from "@/lib/landing";
import { vnd } from "@/lib/store";
import Photo from "./Photo";
import StockNote from "./StockNote";

/** "≈ 72k–90k/con" from the price per kg and a size like "4-5 con/kg" (crabs only; none for ">100 con/kg") */
export function perCrab(p: Product) {
  const n = piecesPerKg(p.size);
  if (p.kind !== "crab" || p.price == null || !n) return "";
  const k = (c: number) => Math.round(p.price! / c / 1000) + "k";
  return `≈ ${k(n[1])}–${k(n[0])}/con`;
}

/** A product in a grid: photo (with its note on hover / tap), name, size, today's stock, price, and a link to its own page */
export default function ProductCard({ p }: { p: Product }) {
  const each = perCrab(p), href = `/san-pham/${p.slug}`;
  return (
    <article className="hm-prod">
      {/* Focusable so a tap on phones (or Tab) opens the note too; hover opens it on desktop */}
      <div className="hm-prod-pic" tabIndex={0}>
        <div className="hm-prod-shot"><Photo img={p.img} alt={p.name} art={p.kind} sizes="(min-width: 900px) 25vw, 50vw" /></div>
        {p.tag && <span className="hm-tag">{p.tag}</span>}
        <span className="hm-peek-hint" aria-hidden="true">i</span>
        <div className="hm-peek">
          <p className="hm-kick">{p.info.sub}</p>
          <p className="hm-peek-text">{p.info.text}</p>
          <p className="hm-peek-cook"><span>Hợp món</span>{p.info.cook.join(" · ")}</p>
        </div>
      </div>
      <h3><Link href={href}>{p.name}</Link></h3>
      <p className="hm-size">{p.size}</p>
      <StockNote s={p.stock} />
      {p.price != null
        ? <p className="hm-price">{vnd(p.price)}<small>/kg</small>{each && <span className="hm-each">{each}</span>}</p>
        : <p className="hm-price hm-price-ask">Nhắn để có giá hôm nay</p>}
      <Link className="hm-btn hm-btn-outline hm-order" href={href}>Đặt món này</Link>
    </article>
  );
}
