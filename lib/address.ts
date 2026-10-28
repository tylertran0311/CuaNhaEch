// Structured Vietnamese delivery address. Since 1/7/2025 Vietnam has two levels (province + ward/commune),
// so the district is optional and only kept for customers who still give one.
export interface Address { no: string; street: string; ward: string; dist: string; city: string }

export const EMPTY_ADDR: Address = { no: "", street: "", ward: "", dist: "", city: "" };

/** The 34 provinces and centrally-run cities after the 2025 merger, for autocomplete */
export const PROVINCES = [
  "TP. Hồ Chí Minh", "Hà Nội", "Hải Phòng", "Đà Nẵng", "Cần Thơ", "Huế",
  "An Giang", "Bắc Ninh", "Cà Mau", "Cao Bằng", "Đắk Lắk", "Điện Biên", "Đồng Nai", "Đồng Tháp",
  "Gia Lai", "Hà Tĩnh", "Hưng Yên", "Khánh Hòa", "Lai Châu", "Lâm Đồng", "Lạng Sơn", "Lào Cai",
  "Nghệ An", "Ninh Bình", "Phú Thọ", "Quảng Ngãi", "Quảng Ninh", "Quảng Trị", "Sơn La", "Tây Ninh",
  "Thái Nguyên", "Thanh Hóa", "Tuyên Quang", "Vĩnh Long",
];

// Prefixes added when the part was typed without one, e.g. "75" → "đường 75", "Tân Phong" → "P.Tân Phong", "7" → "Q.7"
const HAS_STREET = /^(đường|hẻm|ngõ|ngách|kiệt|quốc lộ|tỉnh lộ|đại lộ)(\s|$)|^(đ|ql|tl|dt)\./iu;
const HAS_WARD = /^(phường|xã|thị trấn|đặc khu)(\s|$)|^(p|x|tt)\./iu;
const HAS_DIST = /^(quận|huyện|thị xã|thành phố)(\s|$)|^(q|h|tx|tp)\./iu;
const prefix = (v: string, has: RegExp, p: string) => (v && !has.test(v) ? p + v : v);
// Full unit names (as picked from the lists) are written short: "Phường Tân Phong" → "P.Tân Phong", "Quận 7" → "Q.7"
const SHORT: [RegExp, string][] = [[/^Phường /iu, "P."], [/^Quận /iu, "Q."], [/^Huyện /iu, "H."], [/^Thị trấn /iu, "TT."], [/^Thị xã /iu, "TX."], [/^Thành phố /iu, "TP."]];
const short = (v: string) => SHORT.reduce((s, [re, p]) => s.replace(re, p), v);

/** "47 đường 75, P.Tân Phong, Q.7, TP. Hồ Chí Minh" — empty parts are skipped */
export function composeAddr(a: Address) {
  const street = prefix(a.street.trim(), HAS_STREET, "đường ");
  const ward = short(prefix(a.ward.trim(), HAS_WARD, "P."));
  const dist = short(prefix(a.dist.trim(), HAS_DIST, "Q."));
  return [[a.no.trim(), street].filter(Boolean).join(" "), ward, dist, a.city.trim()].filter(Boolean).join(", ");
}

/** Lowercase without Vietnamese accents, for searching ("tan phong" finds "Phường Tân Phong") */
export const fold = (s: string) => s.normalize("NFD").replace(/\p{M}/gu, "").replace(/đ/g, "d").replace(/Đ/g, "d").toLowerCase();
/** File name for a province's data in public/vn (same rule as scripts/build-vn-address.mjs) */
export const slugVN = (s: string) => fold(s).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/** Pre-2025 districts of a province (with the old province they belonged to, when several merged) and their wards */
export type Geo = [district: string, oldProvince: string, wards: string[]][];
const geoCache = new Map<string, Promise<Geo | null>>();

/** Districts and wards for one of the 34 provinces; null for anything else (typed by hand) */
export function loadGeo(city: string): Promise<Geo | null> {
  const p = PROVINCES.find((x) => fold(x) === fold(city.trim()));
  if (!p) return Promise.resolve(null);
  let q = geoCache.get(p);
  if (!q) {
    q = fetch(`/vn/${slugVN(p)}.json`).then((r) => (r.ok ? r.json() : null)).catch(() => null);
    // Don't keep a failed load, so the next try fetches again
    q.then((g) => { if (!g) geoCache.delete(p); });
    geoCache.set(p, q);
  }
  return q;
}
