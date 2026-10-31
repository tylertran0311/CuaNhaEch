"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CONTACT } from "@/lib/landing";
import { vnd } from "@/lib/store";
import { KG, cartMessage, cartTotal, clearCart, kgText, removeFromCart, setKg, useCart, type CartLine } from "@/lib/cart";
import RequestForm from "./RequestForm";

/** Shopping bag outline */
export function CartIcon() {
  return (
    <svg className="hm-cart-ic" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 8h14l-1.2 11.1a1 1 0 0 1-1 .9H7.2a1 1 0 0 1-1-.9L5 8Z" /><path d="M9 8V6.5a3 3 0 0 1 6 0V8" />
    </svg>
  );
}

/**
 * The header's cart: a bag with how many kinds are in it, opening a side sheet (a modal <dialog>, so Esc and focus
 * work) with each crab's kilos, the estimated total and 30% deposit, and the two ways to order: a Zalo message with
 * everything (copied first, Zalo can't be opened with text filled in) or the order request form for another day.
 */
export default function CartButton() {
  const lines = useCart();
  const box = useRef<HTMLDialogElement>(null);
  const [copied, setCopied] = useState(false);
  // The form keeps the lines it was opened with: sending empties the cart but the thank-you message stays
  const [form, setForm] = useState<CartLine[] | null>(null);

  const open = () => { setCopied(false); box.current?.showModal(); };
  useEffect(() => {
    window.addEventListener("cne-cart-open", open);
    return () => window.removeEventListener("cne-cart-open", open);
  }, []);

  const close = () => box.current?.close();
  const { total, known } = cartTotal(lines);
  const count = lines.length;

  function copy() {
    navigator.clipboard?.writeText(cartMessage(lines)).then(() => setCopied(true), () => {});
  }

  return (
    <>
      <button type="button" className="hm-cart-btn" onClick={open} aria-label={`Giỏ hàng, ${count} món`}>
        <CartIcon />
        {count > 0 && <span className="hm-cart-n" aria-hidden="true">{count}</span>}
      </button>

      {/* A click on the dimmed backdrop lands on the dialog itself: close */}
      <dialog ref={box} className="hm-cart" aria-labelledby="hm-cart-t" onClose={() => setForm(null)} onClick={(e) => { if (e.target === e.currentTarget) close(); }}>
        <div className="hm-cart-in">
          <div className="hm-cart-head">
            <h2 id="hm-cart-t">Giỏ hàng{count > 0 && <span> · {count} món</span>}</h2>
            <button type="button" className="hm-cart-x" onClick={close} aria-label="Đóng giỏ hàng">
              <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M6 6l12 12M18 6 6 18" /></svg>
            </button>
          </div>

          {form ? (
            <div className="hm-cart-body">
              <button type="button" className="hm-link hm-cart-back" onClick={() => setForm(null)}>← Quay lại giỏ</button>
              <RequestForm lines={form} onSent={clearCart} />
            </div>
          ) : count === 0 ? (
            <div className="hm-cart-body hm-cart-empty">
              <p>Giỏ đang trống.</p>
              <Link className="hm-btn hm-btn-outline" href="/home#bang-gia" onClick={close}>Xem bảng giá hôm nay</Link>
            </div>
          ) : (
            <>
              <ul className="hm-cart-body hm-cart-list">
                {lines.map((l) => (
                  <li key={l.item} className="hm-cart-line">
                    <div className="hm-cart-name">
                      <Link href={`/san-pham/${l.slug}`} onClick={close}>{l.name}</Link>
                      <span>{l.size}{l.price != null && ` · ${vnd(l.price)}/kg`}</span>
                    </div>
                    <div className="hm-cart-row">
                      <div className="hm-ob-qty">
                        <button type="button" onClick={() => setKg(l.item, l.kg - KG.step)} disabled={l.kg <= KG.min} aria-label={`Bớt nửa ký ${l.name}`}>−</button>
                        <output aria-live="polite">{kgText(l.kg)}</output>
                        <button type="button" onClick={() => setKg(l.item, l.kg + KG.step)} disabled={l.kg >= KG.max} aria-label={`Thêm nửa ký ${l.name}`}>+</button>
                      </div>
                      <b className="hm-cart-sum">{l.price != null ? vnd(Math.round(l.price * l.kg)) : "Báo giá sau"}</b>
                    </div>
                    <button type="button" className="hm-link hm-cart-rm" onClick={() => removeFromCart(l.item)}>Bỏ khỏi giỏ</button>
                  </li>
                ))}
              </ul>

              <div className="hm-cart-foot">
                <dl className="hm-ob-sum">
                  <div><dt>Tạm tính{known ? "" : " (chưa gồm món chưa có giá)"}</dt><dd className="hm-ob-total">{vnd(total)}</dd></div>
                  <div><dt>Cọc 30% để giữ hàng</dt><dd>{vnd(Math.round(total * 0.3))}</dd></div>
                </dl>
                <a className="hm-btn hm-ob-main" href={CONTACT.zalo} target="_blank" rel="noopener noreferrer" onClick={copy}>Nhắn Zalo đặt cả giỏ</a>
                <p className="hm-ob-note" aria-live="polite">
                  {copied ? <>Đã chép sẵn tin nhắn — <b>dán vào Zalo</b> để gửi shop.</> : "Tạm tính theo giá hôm nay; shop báo lại tổng khi chốt đơn."}
                </p>
                <button type="button" className="hm-btn hm-btn-outline" onClick={() => setForm(lines)}>Đặt giao ngày khác (điền form)</button>
              </div>
            </>
          )}
        </div>
      </dialog>
    </>
  );
}
