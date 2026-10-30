"use client";

import { useState } from "react";
import { CONTACT, TEL, piecesPerKg } from "@/lib/landing";
import { vnd } from "@/lib/store";

const STEP = 0.5, MIN = 0.5, MAX = 20;
const kgText = (kg: number) => String(kg).replace(".", ",") + " kg";

/**
 * Pick how many kilos: shows about how many pieces that is, the total and the 30% deposit. Ordering happens in
 * Zalo, which can't be opened with a message filled in, so the button copies the order message first and says
 * so: the buyer only has to paste it.
 */
export default function OrderBox({ name, size, price }: { name: string; size: string; price?: number }) {
  const [kg, setKg] = useState(1);
  const [copied, setCopied] = useState(false);
  const n = piecesPerKg(size);
  const pieces = n && `≈ ${Math.round(n[0] * kg)}–${Math.round(n[1] * kg)} con`;
  const total = price != null ? Math.round(price * kg) : undefined;
  const message = `Shop ơi, mình muốn đặt ${kgText(kg)} ${name} (${size}).`;

  function change(d: number) {
    setKg((v) => Math.min(MAX, Math.max(MIN, Math.round((v + d) / STEP) * STEP)));
    setCopied(false);
  }

  function copy() {
    // The link still opens Zalo if copying isn't allowed; the hint only shows when it worked
    navigator.clipboard?.writeText(message).then(() => setCopied(true), () => {});
  }

  return (
    <div className="hm-ob">
      <div className="hm-ob-row">
        <span className="hm-ob-label">Số lượng</span>
        <div className="hm-ob-qty">
          <button type="button" onClick={() => change(-STEP)} disabled={kg <= MIN} aria-label="Bớt nửa ký">−</button>
          <output aria-live="polite">{kgText(kg)}</output>
          <button type="button" onClick={() => change(STEP)} disabled={kg >= MAX} aria-label="Thêm nửa ký">+</button>
        </div>
      </div>
      {pieces && <p className="hm-ob-pieces">{pieces}</p>}
      {total != null && (
        <dl className="hm-ob-sum">
          <div><dt>Tạm tính</dt><dd className="hm-ob-total">{vnd(total)}</dd></div>
          <div><dt>Cọc 30% để giữ hàng</dt><dd>{vnd(Math.round(total * 0.3))}</dd></div>
        </dl>
      )}
      <a className="hm-btn hm-ob-main" href={CONTACT.zalo} target="_blank" rel="noopener noreferrer" onClick={copy}>
        Nhắn Zalo đặt {kgText(kg)}
      </a>
      <a className="hm-btn hm-btn-outline hm-ob-call" href={TEL}>Gọi {CONTACT.phone}</a>
      <p className="hm-ob-note" aria-live="polite">
        {copied ? <>Đã chép sẵn tin nhắn — <b>dán vào Zalo</b> để gửi shop.</> : "Tạm tính theo giá hôm nay; shop báo lại tổng khi chốt đơn."}
      </p>
    </div>
  );
}
