// Builds public/vn/<province>.json for each of the 34 provinces (after the 1/7/2025 merger):
//   { w: current wards/communes (two-level system, no districts),
//     d: [old district, old province, old wards[]][] — pre-merger districts and their wards, since customers still
//        give addresses the old way (district + ward) }
// Source: provinces.open-api.vn (GSO administrative units): v2 = current units, v1 = pre-2025 units.
//   node scripts/build-vn-address.mjs
import { mkdirSync, writeFileSync } from "node:fs";

const SRC_NEW = "https://provinces.open-api.vn/api/v2/?depth=2";
const SRC = "https://provinces.open-api.vn/api/v1/?depth=3";

// New province → the old provinces it was formed from (Resolution 202/2025/QH15)
const MERGED = {
  "TP. Hồ Chí Minh": ["Hồ Chí Minh", "Bình Dương", "Bà Rịa - Vũng Tàu"],
  "Hà Nội": ["Hà Nội"],
  "Hải Phòng": ["Hải Phòng", "Hải Dương"],
  "Đà Nẵng": ["Đà Nẵng", "Quảng Nam"],
  "Cần Thơ": ["Cần Thơ", "Sóc Trăng", "Hậu Giang"],
  "Huế": ["Huế"],
  "An Giang": ["An Giang", "Kiên Giang"],
  "Bắc Ninh": ["Bắc Ninh", "Bắc Giang"],
  "Cà Mau": ["Cà Mau", "Bạc Liêu"],
  "Cao Bằng": ["Cao Bằng"],
  "Đắk Lắk": ["Đắk Lắk", "Phú Yên"],
  "Điện Biên": ["Điện Biên"],
  "Đồng Nai": ["Đồng Nai", "Bình Phước"],
  "Đồng Tháp": ["Đồng Tháp", "Tiền Giang"],
  "Gia Lai": ["Gia Lai", "Bình Định"],
  "Hà Tĩnh": ["Hà Tĩnh"],
  "Hưng Yên": ["Hưng Yên", "Thái Bình"],
  "Khánh Hòa": ["Khánh Hòa", "Ninh Thuận"],
  "Lai Châu": ["Lai Châu"],
  "Lâm Đồng": ["Lâm Đồng", "Đắk Nông", "Bình Thuận"],
  "Lạng Sơn": ["Lạng Sơn"],
  "Lào Cai": ["Lào Cai", "Yên Bái"],
  "Nghệ An": ["Nghệ An"],
  "Ninh Bình": ["Ninh Bình", "Hà Nam", "Nam Định"],
  "Phú Thọ": ["Phú Thọ", "Vĩnh Phúc", "Hoà Bình"],
  "Quảng Ngãi": ["Quảng Ngãi", "Kon Tum"],
  "Quảng Ninh": ["Quảng Ninh"],
  "Quảng Trị": ["Quảng Trị", "Quảng Bình"],
  "Sơn La": ["Sơn La"],
  "Tây Ninh": ["Tây Ninh", "Long An"],
  "Thái Nguyên": ["Thái Nguyên", "Bắc Kạn"],
  "Thanh Hóa": ["Thanh Hóa"],
  "Tuyên Quang": ["Tuyên Quang", "Hà Giang"],
  "Vĩnh Long": ["Vĩnh Long", "Bến Tre", "Trà Vinh"],
};

// Same as slugVN in lib/address.ts
const slug = (s) => s.normalize("NFD").replace(/\p{M}/gu, "").replace(/đ/g, "d").replace(/Đ/g, "D")
  .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const bare = (s) => s.replace(/^(Tỉnh|Thành phố) /, "");

// The app writes Ho Chi Minh City as "TP. Hồ Chí Minh"; every other province matches by its bare name
const appName = (s) => (bare(s) === "Hồ Chí Minh" ? "TP. Hồ Chí Minh" : bare(s));

const [cur, old] = await Promise.all([SRC_NEW, SRC].map(async (u) => (await fetch(u)).json()));
const newByName = new Map(cur.map((p) => [appName(p.name), p]));
const oldByName = new Map(old.map((p) => [bare(p.name), p]));
const used = new Set();
mkdirSync("public/vn", { recursive: true });

let wards = 0;
for (const [prov, olds] of Object.entries(MERGED)) {
  const p = newByName.get(prov);
  if (!p) throw new Error("Missing province " + prov);
  const d = olds.flatMap((o) => {
    const q = oldByName.get(o);
    if (!q) throw new Error("Missing old province " + o);
    used.add(o);
    return q.districts.map((x) => [x.name, olds.length > 1 ? o : "", x.wards.map((y) => y.name)]);
  });
  // A–Z (Vietnamese order) so a long list is easy to scan
  const w = p.wards.map((x) => x.name).sort(new Intl.Collator("vi").compare);
  wards += w.length;
  writeFileSync(`public/vn/${slug(prov)}.json`, JSON.stringify({ w, d }));
}
const left = [...oldByName.keys()].filter((k) => !used.has(k));
if (left.length) throw new Error("Old provinces not mapped: " + left.join(", "));
if (newByName.size !== Object.keys(MERGED).length) throw new Error("Province count changed: " + newByName.size);
console.log(`Wrote ${Object.keys(MERGED).length} provinces, ${wards} wards`);
