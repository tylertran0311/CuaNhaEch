"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { checkRequest, REQ_LIMITS, vnNow, type ReqField } from "@/lib/request";
import { formatVN } from "@/lib/phone";
import { steamFeeFor, vnd } from "@/lib/store";
import { kgText } from "@/lib/cart";

// Orders from the website aren't closed on a livestream, so steaming carries the fee
const STEAM_FEE = steamFeeFor(true, false);

type Errors = Partial<Record<ReqField, string>>;
const FIELDS: ReqField[] = ["name", "phone", "dDate", "dTime", "map", "note"];

/**
 * "Đặt giao ngày khác": for the dishes in `lines` (one from a product page, or the whole cart) the customer leaves
 * name, phone, delivery day and time (today or later), a Google Maps link and a note; the request lands in the
 * dashboard's waiting tab and the shop calls back to confirm. Every field is checked here first (errors next to each
 * field), then again on the server and in the database. `onSent` runs once the shop has it (the cart empties itself).
 */
export default function RequestForm({ lines, onSent }: { lines: { item: string; name: string; kg: number }[]; onSent?: () => void }) {
  const [v, setV] = useState({ name: "", phone: "", dDate: "", dTime: "", map: "", note: "", website: "" });
  const [steam, setSteam] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const [msg, setMsg] = useState("");
  const [range, setRange] = useState({ today: "", max: "" });
  const started = useRef(0);
  const form = useRef<HTMLFormElement>(null);
  const doneBox = useRef<HTMLDivElement>(null);
  // The form folds into a short message: bring that message into view
  useEffect(() => { if (state === "done") doneBox.current?.scrollIntoView({ block: "center", behavior: "smooth" }); }, [state]);

  // Dates are the shop's (Vietnam), worked out in the browser so the page itself can stay cached
  useEffect(() => {
    const { today, max } = vnNow();
    started.current = Date.now();
    setRange({ today, max });
    setV((x) => (x.dDate ? x : { ...x, dDate: today }));
  }, []);

  const set = (k: keyof typeof v) => (e: { target: { value: string } }) => {
    setV((x) => ({ ...x, [k]: e.target.value }));
    if (errors[k as ReqField]) setErrors((x) => ({ ...x, [k]: undefined }));
  };

  function showErrors(e: Errors) {
    setErrors(e);
    const first = FIELDS.find((f) => e[f]);
    if (first) form.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (state === "sending") return;
    const { today, now } = vnNow();
    const r = checkRequest({ ...v, items: lines.map((l) => ({ item: l.item, q: l.kg })), steam }, today, now);
    if (!r.ok) { setMsg(""); return showErrors(r.errors); }
    setState("sending"); setMsg("");
    try {
      const res = await fetch("/api/requests", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...r.data, website: v.website, t: started.current }),
      });
      const out = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string; errors?: Errors };
      if (res.ok && out.ok) { setState("done"); onSent?.(); return; }
      setState("idle");
      setMsg(out.error || "Không gửi được yêu cầu, bạn thử lại hoặc nhắn Zalo cho shop nhé.");
      if (out.errors) showErrors(out.errors);
    } catch {
      setState("idle");
      setMsg("Mất kết nối, bạn thử lại hoặc nhắn Zalo cho shop nhé.");
    }
  }

  const what = lines.map((l) => `${l.name} · ${kgText(l.kg)}`).join(", ");
  if (state === "done") {
    return (
      <div ref={doneBox} className="hm-rq hm-rq-done" role="status">
        <p><b>Shop đã nhận yêu cầu của bạn.</b></p>
        <p>{what}{steam ? ` · hấp sẵn (+${vnd(STEAM_FEE)})` : " · giao sống"}, giao {v.dDate.split("-").reverse().join("/")} lúc {v.dTime}. Shop sẽ gọi hoặc nhắn số {formatVN(v.phone)} để xác nhận và báo cọc.</p>
      </div>
    );
  }

  const field = (k: ReqField, lbl: string, input: React.ReactNode, hint?: string) => (
    <div className={`hm-field${errors[k] ? " bad" : ""}`}>
      <label htmlFor={`rq-${k}`}>{lbl}</label>
      {input}
      {errors[k] ? <p className="hm-field-err" id={`rq-${k}-err`}>{errors[k]}</p> : hint && <p className="hm-field-hint" id={`rq-${k}-err`}>{hint}</p>}
    </div>
  );
  const a11y = (k: ReqField) => ({ id: `rq-${k}`, name: k, "aria-invalid": !!errors[k], "aria-describedby": `rq-${k}-err` });

  return (
    <form ref={form} className="hm-rq" onSubmit={submit} noValidate>
      <ul className="hm-rq-what">{lines.map((l) => <li key={l.item}>{l.name} · <b>{kgText(l.kg)}</b></li>)}</ul>
      {errors.items && <p className="hm-field-err">{errors.items}</p>}
      <fieldset className="hm-opts">
        <legend>Cách nhận cua</legend>
        <label className="hm-opt">
          <input type="radio" name="steam" checked={!steam} onChange={() => setSteam(false)} />
          <span><b>Giao sống</b>Tự chế biến tại nhà</span>
        </label>
        <label className="hm-opt">
          <input type="radio" name="steam" checked={steam} onChange={() => setSteam(true)} />
          <span><b>Hấp sẵn</b>+{vnd(STEAM_FEE)} phí hấp</span>
        </label>
      </fieldset>
      {field("name", "Họ tên", <input {...a11y("name")} autoComplete="name" maxLength={REQ_LIMITS.name} value={v.name} onChange={set("name")} required />)}
      {field("phone", "Số điện thoại", <input {...a11y("phone")} type="tel" inputMode="tel" autoComplete="tel" maxLength={20} placeholder="0901 234 567" value={v.phone} onChange={set("phone")} required />)}
      <div className="hm-rq-two">
        {field("dDate", "Ngày giao", <input {...a11y("dDate")} type="date" min={range.today} max={range.max} value={v.dDate} onChange={set("dDate")} required />)}
        {field("dTime", "Giờ giao", <input {...a11y("dTime")} type="time" value={v.dTime} onChange={set("dTime")} required />)}
      </div>
      {field("map", "Link Google Maps chỗ nhận", <input {...a11y("map")} type="url" inputMode="url" autoComplete="off" maxLength={REQ_LIMITS.map} placeholder="https://maps.app.goo.gl/…" value={v.map} onChange={set("map")} required />,
        "Mở Google Maps → chọn chỗ nhận → Chia sẻ → Sao chép đường liên kết.")}
      {field("note", "Ghi chú (không bắt buộc)", <textarea {...a11y("note")} rows={3} maxLength={REQ_LIMITS.note} placeholder="Gọi trước khi giao, để ở bảo vệ…" value={v.note} onChange={set("note")} />,
        `${v.note.length}/${REQ_LIMITS.note}`)}
      {/* Left empty by people; bots that fill every field give themselves away */}
      <div className="hm-hp" aria-hidden="true">
        <label htmlFor="rq-website">Website</label>
        <input id="rq-website" name="website" tabIndex={-1} autoComplete="off" value={v.website} onChange={set("website")} />
      </div>
      <button className="hm-btn hm-rq-send" type="submit" disabled={state === "sending"}>{state === "sending" ? "Đang gửi…" : "Gửi yêu cầu đặt"}</button>
      <p className="hm-rq-msg" role="alert">{msg}</p>
    </form>
  );
}
