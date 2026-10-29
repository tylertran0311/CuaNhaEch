// Small pieces of an order shown in several places (board cards, calendar, confirm popups, trash).
import { Chip, Chips } from "@/components/ui";
import type { Dict } from "@/lib/i18n";
import { SHIPPED, day, fdw, kl, vnd, type Order } from "@/lib/store";

/** Steamed or raw, plus closed-on-live */
export function OrderTags({ o, t }: { o: Order; t: Dict }) {
  return (
    <Chips>
      {o.steam ? <Chip kind="steam">🔥 {t.steam}</Chip> : <Chip kind="raw">🦀 {t.raw}</Chip>}
      {o.live && <Chip kind="live">📺 {t.live}</Chip>}
    </Chips>
  );
}

/** One line per item with its kind; older orders saved as free text show that text */
export function ItemsList({ o, t }: { o: Order; t: Dict }) {
  if (o.lines && o.lines.length)
    return <>{o.lines.map((l, i) => (
      <div key={i}><Chip kind={l.k}>{kl(t, l.k)}</Chip> {l.name} · {l.q} {l.u === "kg" ? "kg" : t.piece}</div>
    ))}</>;
  return (
    <>
      {o.crab && <div><Chip kind="crab">{kl(t, "crab")}</Chip> {o.crab}</div>}
      {o.shrimp && <div><Chip kind="shrimp">{kl(t, "shrimp")}</Chip> {o.shrimp}</div>}
      {o.item && !o.crab && !o.shrimp && <div>{o.item}</div>}
    </>
  );
}

/** Items as one line of text: "Thịt Tứ 1kg, Tôm 2kg" */
export function itemsText(o: Order, t: Dict) {
  if (o.lines && o.lines.length) return o.lines.map((l) => `${l.name} ${l.q}${l.u === "kg" ? "kg" : " " + t.piece}`).join(", ");
  return [o.crab && kl(t, "crab") + " " + o.crab, o.shrimp && kl(t, "shrimp") + " " + o.shrimp, o.item].filter(Boolean).join(", ");
}

/** Delivery day/time with the order's tags; flagged when overdue (until the order is shipped) */
export function When({ o, t }: { o: Order; t: Dict }) {
  const flag = o.dDate && o.stage < SHIPPED && o.dDate < day(0) ? <Chip kind="late">{t.late}</Chip> : null;
  return (
    <div className="ci">
      {(o.dDate || o.dTime) && <>🗓 {t.deliver}: <b className="wt">{[o.dDate && fdw(t, o.dDate), o.dTime].filter(Boolean).join(" · ")}</b> {flag} </>}
      <OrderTags o={o} t={t} />
    </div>
  );
}

/** Which order this is, in one line: name · delivery day/time · total */
export function OrderLine({ o, t }: { o: { name: string; dDate?: string; dTime?: string; amt: number }; t: Dict }) {
  return <><b>{o.name}</b>{(o.dDate || o.dTime) && <> · {[o.dDate && fdw(t, o.dDate), o.dTime].filter(Boolean).join(" ")}</>} · {vnd(o.amt)}</>;
}
