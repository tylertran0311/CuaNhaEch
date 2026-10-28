// Builds public/vn/<province>.json: the districts and wards for each of the 34 provinces (after the 2025 merger).
// Customers still give pre-merger addresses (district + ward), so each new province lists the old districts and
// wards of every old province that merged into it. Source: provinces.open-api.vn (GSO administrative units, pre-2025).
//   node scripts/build-vn-address.mjs
import { mkdirSync, writeFileSync } from "node:fs";

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

const data = await (await fetch(SRC)).json();
const byName = new Map(data.map((p) => [bare(p.name), p]));
const used = new Set();
mkdirSync("public/vn", { recursive: true });

for (const [prov, olds] of Object.entries(MERGED)) {
  // [district, old province (only when several merged), wards[]]
  const out = olds.flatMap((o) => {
    const p = byName.get(o);
    if (!p) throw new Error("Missing old province " + o);
    used.add(o);
    return p.districts.map((d) => [d.name, olds.length > 1 ? o : "", d.wards.map((w) => w.name)]);
  });
  writeFileSync(`public/vn/${slug(prov)}.json`, JSON.stringify(out));
}
const left = [...byName.keys()].filter((k) => !used.has(k));
if (left.length) throw new Error("Old provinces not mapped: " + left.join(", "));
console.log(`Wrote ${Object.keys(MERGED).length} provinces from ${used.size} old ones`);
