import { amountText, type StockView } from "@/lib/stock";

/**
 * Today's stock of a crab, from what the shop entered this morning minus the day's confirmed orders:
 * "Sẵn sàng giao · còn 12 kg · 40 con" or "Đã hết hôm nay". Nothing when the shop hasn't entered today's stock.
 * The words carry the meaning; the icon and color only repeat it.
 */
export default function StockNote({ s, className = "" }: { s: StockView | null; className?: string }) {
  if (!s) return null;
  const left = amountText(s);
  return (
    <p className={`hm-stock${s.out ? " out" : ""} ${className}`.trim()}>
      <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
        {s.out
          ? <circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" strokeWidth="1.5" />
          : <path d="M3 8.5l3.2 3L13 4.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />}
      </svg>
      {s.out ? <b>Đã hết hôm nay</b> : <><b>Sẵn sàng giao</b>{left && <span>còn {left}</span>}</>}
    </p>
  );
}
