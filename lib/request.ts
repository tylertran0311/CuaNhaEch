// A customer's order request from the public product page ("đặt giao ngày khác"). The same checks run in the browser
// (to show errors next to the fields), in POST /api/requests, and again inside the database (submit_request in
// supabase/schema.sql), so a request that skips the page or the route still can't store anything else.
import { isVNPhone } from "./phone";

/** A request as stored and shown in the dashboard's waiting list */
export interface Req {
  id: number; name: string; phone: string; dDate: string; dTime: string; map: string;
  note?: string; item?: string; q?: number; at?: string;
}
/** What the form sends */
export interface ReqInput { name: string; phone: string; dDate: string; dTime: string; map: string; note: string; item: string; q: number }
export type ReqField = keyof ReqInput;

export const REQ_LIMITS = { name: 50, note: 300, map: 500, item: 60, days: 30, qMin: 0.5, qMax: 20 };

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
    item: clean(r.item, L.item), q: typeof r.q === "number" ? r.q : Number.NaN,
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

  if (!data.item || data.item.length > L.item) errors.item = "Chọn món.";
  if (!(data.q >= L.qMin && data.q <= L.qMax && Number.isInteger(data.q * 2))) errors.q = `Số lượng từ 0,5 đến ${L.qMax} kg, bước 0,5 kg.`;

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
