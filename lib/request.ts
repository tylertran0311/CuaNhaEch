// A customer's order request from the public product page ("đặt giao ngày khác"). The same checks run in the browser
// (to show errors next to the fields), in POST /api/requests, and again inside the database (submit_request in
// supabase/schema.sql), so a request that skips the page or the route still can't store anything else.
import { isVNPhone } from "./phone";

/** A request as stored and shown in the dashboard's waiting list */
export interface Req {
  id: number; name: string; phone: string; dDate: string; dTime: string; map: string;
  note?: string; items?: ReqItem[]; steam?: boolean; at?: string;
  /** Requests sent before the cart held one dish here instead of `items` */
  item?: string; q?: number;
}
/** One dish and its kilos */
export interface ReqItem { item: string; q: number }
/** What the form sends; `steam` = steamed before delivery instead of raw */
export interface ReqInput { name: string; phone: string; dDate: string; dTime: string; map: string; note: string; items: ReqItem[]; steam: boolean }
export type ReqField = keyof ReqInput;

export const REQ_LIMITS = { name: 50, note: 300, map: 500, item: 60, lines: 10, days: 30, qMin: 0.5, qMax: 20 };

/** A request's dishes, old one-dish requests included */
export const reqItems = (r: Req): ReqItem[] => r.items ?? (r.item ? [{ item: r.item, q: r.q ?? 0 }] : []);

// Letters (any language, with Vietnamese marks), spaces and . ' - only; starts with a letter
const NAME = /^\p{L}[\p{L}\p{M} .'-]*$/u;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
// Google Maps share links only, over https (same pattern as the database check)
export const MAPS_LINK = /^https:\/\/((maps\.app\.goo\.gl|goo\.gl\/maps|maps\.google\.[a-z.]+)\/|(www\.)?google\.[a-z.]+\/maps)/i;
// Control and invisible direction characters (keeps line breaks in the note)
// Built from a string of escapes: as a regex literal, bundlers can write U+2028 out raw and break it
const CTRL = new RegExp("[\\u0000-\\u0009\\u000B-\\u001F\\u007F-\\u009F\\u200B-\\u200F\\u2028-\\u202E\\u2066-\\u2069]", "g");

const clean = (v: unknown, max: number) => (typeof v === "string" ? v.replace(CTRL, "").replace(/[ \t]+/g, " ").trim().slice(0, max + 1) : "");
/** Phone as plain digits with a leading 0: "+84 901 234 567" → "0901234567" */
export const phoneDigits = (s: string) => s.replace(/[\s.\-()]/g, "").replace(/^\+?84(?=\d{9,10}$)/, "0");

function addDays(iso: string, n: number) {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
const realDate = (s: string) => DATE.test(s) && new Date(s + "T00:00:00Z").toISOString().slice(0, 10) === s;

/**
 * Check and tidy a request. `today` and `now` (HH:MM) are the shop's date and time in Vietnam. Only the known fields
 * are kept; each error is a short Vietnamese message for that field.
 */
export function checkRequest(raw: unknown, today: string, now: string):
  { ok: true; data: ReqInput } | { ok: false; errors: Partial<Record<ReqField, string>> } {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const L = REQ_LIMITS, errors: Partial<Record<ReqField, string>> = {};
  const data: ReqInput = {
    name: clean(r.name, L.name), phone: phoneDigits(clean(r.phone, 20)), dDate: clean(r.dDate, 10), dTime: clean(r.dTime, 5),
    map: clean(r.map, L.map), note: typeof r.note === "string" ? r.note.replace(CTRL, "").trim().slice(0, L.note + 1) : "",
    items: (Array.isArray(r.items) ? r.items : []).slice(0, L.lines + 1).map((x) => {
      const i = (x && typeof x === "object" ? x : {}) as Record<string, unknown>;
      return { item: clean(i.item, L.item), q: typeof i.q === "number" ? i.q : Number.NaN };
    }),
    steam: r.steam === true,
  };

  if (data.name.length < 2) errors.name = "Nhập họ tên (ít nhất 2 chữ).";
  else if (data.name.length > L.name || !NAME.test(data.name)) errors.name = `Tên chỉ gồm chữ cái và khoảng trắng, tối đa ${L.name} ký tự.`;

  if (!data.phone) errors.phone = "Nhập số điện thoại.";
  else if (!isVNPhone(data.phone)) errors.phone = "Số điện thoại Việt Nam chưa đúng (vd 0901 234 567).";

  if (!realDate(data.dDate)) errors.dDate = "Chọn ngày giao.";
  else if (data.dDate < today) errors.dDate = "Chỉ nhận giao từ hôm nay trở đi.";
  else if (data.dDate > addDays(today, L.days)) errors.dDate = `Chỉ nhận đặt trước tối đa ${L.days} ngày.`;

  if (!TIME.test(data.dTime)) errors.dTime = "Chọn giờ giao.";
  else if (data.dDate === today && data.dTime <= now) errors.dTime = "Giờ giao hôm nay phải sau giờ hiện tại.";

  if (!data.map) errors.map = "Dán link Google Maps chỗ nhận hàng.";
  else if (data.map.length > L.map || !MAPS_LINK.test(data.map)) errors.map = "Cần link Google Maps (bắt đầu bằng https://maps.app.goo.gl/ hoặc https://www.google.com/maps).";

  if (data.note.length > L.note) errors.note = `Ghi chú tối đa ${L.note} ký tự.`;

  if (!data.items.length || data.items.length > L.lines || new Set(data.items.map((i) => i.item)).size < data.items.length
    || data.items.some((i) => !i.item || i.item.length > L.item)) errors.items = `Chọn từ 1 đến ${L.lines} món khác nhau.`;
  else if (data.items.some((i) => !(i.q >= L.qMin && i.q <= L.qMax && Number.isInteger(i.q * 2)))) errors.items = `Mỗi món từ 0,5 đến ${L.qMax} kg, bước 0,5 kg.`;

  return Object.keys(errors).length ? { ok: false, errors } : { ok: true, data };
}

/** The shop's current date and time in Vietnam: { today: "2026-10-30", now: "14:05", max: last day open to booking } */
export function vnNow() {
  const p = Object.fromEntries(new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).formatToParts(new Date()).map((x) => [x.type, x.value]));
  const today = `${p.year}-${p.month}-${p.day}`;
  return { today, now: `${p.hour}:${p.minute}`, max: addDays(today, REQ_LIMITS.days) };
}
