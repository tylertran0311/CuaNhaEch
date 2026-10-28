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

/** "47 đường 75, P.Tân Phong, Q.7, TP. Hồ Chí Minh" — empty parts are skipped */
export function composeAddr(a: Address) {
  const street = prefix(a.street.trim(), HAS_STREET, "đường ");
  const ward = prefix(a.ward.trim(), HAS_WARD, "P.");
  const dist = prefix(a.dist.trim(), HAS_DIST, "Q.");
  return [[a.no.trim(), street].filter(Boolean).join(" "), ward, dist, a.city.trim()].filter(Boolean).join(", ");
}
