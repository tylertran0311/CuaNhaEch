// Quick order entry: read a customer's reply to the order template and split it into the form's fields.
import { CITY_ALIAS, EMPTY_ADDR, PROVINCES, capWords, fold, unitKey, type Address, type Geo } from "./address";

/** The template sent to customers (always Vietnamese) */
export const QUICK_TEMPLATE = ["Tên:", "Sđt:", "Địa chỉ:", "Ngày giao:", "Giờ giao:", "Note:"].join("\n");

export type QuickField = "name" | "phone" | "addr" | "date" | "time" | "note";
export type QuickRaw = Partial<Record<QuickField, string>>;

// Labels customers may use (compared without accents, case or extra spaces)
const KEYS: [QuickField, RegExp][] = [
  ["name", /^(ten|ho ten|ho va ten|ten khach|ten nguoi nhan|nguoi nhan|name)$/],
  ["phone", /^(sdt|so dt|so dien thoai|dien thoai|dt|phone|sdt nguoi nhan|so dien thoai nguoi nhan)$/],
  ["addr", /^(dia chi|dc|d\/c|dia chi giao|dia chi giao hang|dia chi nhan|dia chi nhan hang|address)$/],
  ["date", /^(ngay giao|ngay nhan|ngay nhan hang|ngay giao hang|ngay|date)$/],
  ["time", /^(gio giao|gio nhan|gio nhan hang|gio giao hang|gio|thoi gian|time)$/],
  ["note", /^(note|ghi chu|luu y|notes|yeu cau)$/],
];
const JOIN: Record<QuickField, string> = { name: " ", phone: " ", addr: ", ", date: " ", time: " ", note: "\n" };

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

const plain = (s: string) => fold(s).replace(/[.]/g, " ").replace(/\s+/g, " ").trim();

function matchCity(seg: string): string | null {
  const f = plain(seg);
  const alias = Object.entries(CITY_ALIAS).find(([, a]) => a.split("|").includes(f));
  if (alias) return alias[0];
  const bare = f.replace(/^(tinh|thanh pho|tp)\s+/, "");
  return PROVINCES.find((p) => plain(p).replace(/^tp\s+/, "") === bare) ?? null;
}
const WARD = /^(phuong|xa|thi tran|dac khu)\s|^(p|x|tt)\s*\.|^p\s*\d/;
const DIST = /^(quan|huyen|thi xa)\s|^(q|h|tx)\s*\.|^q\s*\d/;

/**
 * "47 đường 75, P.Tân Phong, Q.7, TP.HCM" → house no., street, ward, district, province.
 * With the province's lists, short forms become the listed names ("Q.7" → "Quận 7", "p.tân sơn" → "Phường Tân Sơn").
 */
export function parseAddress(text: string, geoFor?: (city: string) => Geo | null): Address {
  const ad: Address = { ...EMPTY_ADDR };
  let segs = text.split(/[,;\n]+/).map((x) => x.trim()).filter(Boolean);
  for (let i = segs.length - 1; i >= 0; i--) {
    const c = matchCity(segs[i]);
    if (c) { ad.city = c; segs.splice(i, 1); break; }
  }
  const geo = ad.city && geoFor ? geoFor(ad.city) : null;
  segs = segs.filter((seg) => {
    // Prefixes are checked before dots are dropped, so "P.Tân Phong" and "Q.7" are recognised
    const f = fold(seg).trim(), g = plain(seg);
    if (!ad.ward && WARD.test(f)) { ad.ward = seg; return false; }
    if (!ad.dist && (DIST.test(f) || (ad.city && /^(thanh pho|tp)\s/.test(g)))) { ad.dist = seg; return false; }
    return true;
  });
  if (geo) {
    const d = ad.dist && geo.d.find(([x]) => unitKey(x) === unitKey(ad.dist));
    if (d) ad.dist = d[0];
    // Wards of the district when there is one, otherwise the province's current wards
    const wards = d ? d[2] : geo.w;
    // A ward written without "Phường"/"Xã" is still recognised when it's in the list
    if (!ad.ward) {
      const i = segs.findIndex((seg) => wards.some((w) => unitKey(w) === unitKey(seg)));
      if (i >= 0) ad.ward = segs.splice(i, 1)[0];
    }
    if (ad.ward) ad.ward = wards.find((w) => unitKey(w) === unitKey(ad.ward)) ?? ad.ward;
  }
  const [first, ...rest] = segs;
  if (first) {
    const m = first.match(/^(\S*\d\S*)\s+(.+)$/);
    if (m) { ad.no = m[1]; ad.street = m[2]; }
    else if (/^\S*\d\S*$/.test(first)) ad.no = first;
    else ad.street = first;
  }
  if (rest.length) ad.street = [ad.street, ...rest].filter(Boolean).join(", ");
  ad.street = capWords(ad.street);
  return ad;
}
