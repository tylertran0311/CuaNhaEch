// Bank transfer payments. The dashboard shows a VietQR code per order (amount + the order's code as the transfer note);
// when the money arrives SePay calls POST /api/sepay, and sepay_payment() in supabase/schema.sql finds the order by
// that code, records the transfer and moves the order to "Đã chuyển cọc" or "Đã thanh toán" on its own.
import { DEPOSITED, deposit, stillDue, type Order } from "./store";

/** One transfer SePay reported for an order */
export interface Pay { id: number; amt: number; at: string }

// The shop's receiving account (public: it is printed in the QR). Set in .env.local and in Vercel.
const ACC = process.env.NEXT_PUBLIC_BANK_ACC?.trim() ?? "";
const BANK = process.env.NEXT_PUBLIC_BANK_NAME?.trim() ?? "";
export const bankReady = !!(ACC && BANK);

/** Transfer note that ties a payment to an order, e.g. "CNE1761800000000123" (the database looks for CNE + digits) */
export const payCode = (o: Order) => `CNE${o.id}`;

/** What the customer still has to send: the deposit (less any part already sent) or everything still due */
export function payAmount(o: Order, full: boolean) {
  const sent = o.stage < DEPOSITED ? o.part || 0 : 0;
  if (!full && o.stage < DEPOSITED) return Math.max(0, deposit(o.amt) - sent);
  return Math.max(0, stillDue(o) - sent);
}

/** VietQR image from SePay's QR service: scanning it in any banking app fills in account, amount and note */
export const qrUrl = (amount: number, note: string) =>
  `https://qr.sepay.vn/img?${new URLSearchParams({ acc: ACC, bank: BANK, amount: String(Math.round(amount)), des: note, template: "compact" })}`;

/** Money received by transfer for an order */
export const paidByBank = (o: Order) => (o.pays || []).reduce((n, p) => n + p.amt, 0);
