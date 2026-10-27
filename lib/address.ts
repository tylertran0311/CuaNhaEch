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

/** "12 Lê Lợi, Bến Thành, Quận 1, TP. Hồ Chí Minh" — empty parts are skipped */
export function composeAddr(a: Address) {
  const p = { no: a.no.trim(), street: a.street.trim(), ward: a.ward.trim(), dist: a.dist.trim(), city: a.city.trim() };
  return [[p.no, p.street].filter(Boolean).join(" "), p.ward, p.dist, p.city].filter(Boolean).join(", ");
}
