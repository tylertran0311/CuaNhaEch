// Quick order entry: read a customer's reply to the order template and split it into the form's fields.
import { fold } from "./text";

/** The template sent to customers (always Vietnamese) */
export const QUICK_TEMPLATE = ["Tên:", "Sđt:", "Địa chỉ:", "Link Google Maps (nếu có):", "Ngày giao:", "Giờ giao:", "Note:"].join("\n");

export type QuickField = "name" | "phone" | "addr" | "map" | "date" | "time" | "note";
export type QuickRaw = Partial<Record<QuickField, string>>;

// Labels customers may use (compared without accents, case or extra spaces)
const KEYS: [QuickField, RegExp][] = [
  ["name", /^(ten|ho ten|ho va ten|ten khach|ten nguoi nhan|nguoi nhan|name)$/],
  ["phone", /^(sdt|so dt|so dien thoai|dien thoai|dt|phone|sdt nguoi nhan|so dien thoai nguoi nhan)$/],
  ["addr", /^(dia chi|dc|d\/c|dia chi giao|dia chi giao hang|dia chi nhan|dia chi nhan hang|address)$/],
  ["map", /^(link google maps?|google maps?|link maps?|link ban do|ban do|maps?|vi tri|dinh vi|location|link)( \(neu co\))?$/],
  ["date", /^(ngay giao|ngay nhan|ngay nhan hang|ngay giao hang|ngay|date)$/],
  ["time", /^(gio giao|gio nhan|gio nhan hang|gio giao hang|gio|thoi gian|time)$/],
  ["note", /^(note|ghi chu|luu y|notes|yeu cau)$/],
];
const JOIN: Record<QuickField, string> = { name: " ", phone: " ", addr: ", ", map: " ", date: " ", time: " ", note: "\n" };

/** Split "Label: value" lines; lines without a known label continue the field above (e.g. a two-line address) */
export function splitReply(text: string): QuickRaw {
  const out: QuickRaw = {};
  let cur: QuickField | null = null;
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    const m = line.match(/^[-•*+\s]*([^:：]{1,32})[:：]\s*(.*)$/);
    const key = m && KEYS.find(([, re]) => re.test(fold(m[1]).replace(/\s+/g, " ").trim()))?.[0];
    if (key) {
      cur = key;
      out[key] = m![2].trim();
    } else if (cur) {
      out[cur] = out[cur] ? out[cur] + JOIN[cur] + line : line;
    }
  }
  return out;
}

const p2 = (n: number) => String(n).padStart(2, "0");
const iso = (y: number, m: number, d: number) => {
  const t = new Date(y, m - 1, d);
  return t.getFullYear() === y && t.getMonth() === m - 1 && t.getDate() === d ? `${y}-${p2(m)}-${p2(d)}` : "";
};

/** "28/10", "28-10-2026", "hôm nay", "mai", "mốt", "thứ 5", "CN" → YYYY-MM-DD ("" when not understood) */
export function parseDate(s: string, now = new Date()): string {
  const f = fold(s).trim();
  if (!f) return "";
  const add = (n: number) => isoShift(now, n);
  if (/hom nay|bua nay|\btoday\b/.test(f)) return add(0);
  if (/\bmot\b|ngay kia/.test(f)) return add(2);
  if (/\bmai\b|tomorrow/.test(f)) return add(1);
  let m = f.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) return iso(+m[1], +m[2], +m[3]);
  m = f.match(/(\d{1,2})\s*[/\-.]\s*(\d{1,2})(?:\s*[/\-.]\s*(\d{2,4}))?/);
  if (m) {
    const d = +m[1], mo = +m[2];
    if (m[3]) return iso(m[3].length === 2 ? 2000 + +m[3] : +m[3], mo, d);
    // No year: this year, unless that date is long gone (then it means next year)
    const y = now.getFullYear(), here = iso(y, mo, d);
    return here && new Date(here).getTime() < now.getTime() - 60 * 864e5 ? iso(y + 1, mo, d) : here;
  }
  m = f.match(/\b(?:thu|t)\s*([2-7])\b/);
  const wd = m ? +m[1] - 1 : /chu nhat|\bcn\b/.test(f) ? 0 : -1;
  if (wd >= 0) return add((wd - now.getDay() + 7) % 7);
  return "";
}
const isoShift = (now: Date, n: number) => {
  const t = new Date(now.getFullYear(), now.getMonth(), now.getDate() + n);
  return `${t.getFullYear()}-${p2(t.getMonth() + 1)}-${p2(t.getDate())}`;
};

/** "14h", "14h30", "2h chiều", "8 giờ tối", "9:15", "2h rưỡi" → HH:MM ("" when not understood); a range keeps its start */
export function parseTime(s: string): string {
  const f = fold(s);
  const m = f.match(/(\d{1,2})\s*(?:h|g|gio|:|\.)\s*(\d{1,2})?/) || f.match(/^\s*(\d{1,2})\s*$/);
  if (!m) return "";
  let h = +m[1];
  const mi = m[2] ? +m[2] : /ruoi/.test(f) ? 30 : 0;
  if (/chieu|toi|dem|\bpm\b/.test(f) && h < 12) h += 12;
  else if (/trua/.test(f) && h < 11) h += 12;
  return h > 23 || mi > 59 ? "" : `${p2(h)}:${p2(mi)}`;
}
