"use client";

import { useState } from "react";
import { CopyBtn, Segmented } from "@/components/ui";
import type { Dict } from "@/lib/i18n";
import { payAmount, payCode, qrUrl } from "@/lib/pay";
import { DEPOSITED, vnd, type Order } from "@/lib/store";

/**
 * VietQR code for one order, to show the customer or send them: the amount (deposit or everything left) and the
 * order's code as the transfer note, which is how SePay's report finds the order again.
 */
export default function PayQR({ o, t }: { o: Order; t: Dict }) {
  const before = o.stage < DEPOSITED;
  const [full, setFull] = useState(!before);
  const amount = payAmount(o, full), note = payCode(o), src = qrUrl(amount, note);
  return (
    <div className="pq">
      {before && (
        <Segmented options={["dep", "all"] as const} value={full ? "all" : "dep"} onChange={(v) => setFull(v === "all")}
          label={(v) => (v === "all" ? t.payAll : t.payDep)} />
      )}
      {/* The QR comes from SePay's image service; width/height keep its space while it loads */}
      <img className="pq-img" src={src} alt={t.payQrAlt.replace("{x}", vnd(amount))} width={240} height={240} loading="lazy" />
      <div className="pq-row"><span>{t.payNote}</span><b>{note}</b><CopyBtn text={note} label={t.payCopyNote} /></div>
      <div className="pq-row"><span>{vnd(amount)}</span><CopyBtn text={src} label={t.payCopyLink} /></div>
      <p className="pq-hint">{t.payHint}</p>
    </div>
  );
}
