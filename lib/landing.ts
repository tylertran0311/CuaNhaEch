// Content of the public pages (/home, and the Bauhaus version at /bauhaus). Edit texts and images here, not in the components.
// Images: put files in public/landing/ and set `img: "/landing/your-file.jpg"`. Without `img`, a geometric
// placeholder in the page's colors is shown instead.

import { defMenu, type Kind, type MenuItem } from "./store";

export type Tone = "red" | "blue" | "yellow" | "black";
export interface Pic { img?: string; alt: string; tone: Tone }

/** The shop's channels */
export const CONTACT = {
  phone: "0888 041 240",
  facebook: "https://www.facebook.com/share/18d19Wh85u/?mibextid=wwXIfr",
  zalo: "https://zalo.me/84888041240",
  tiktok: "https://www.tiktok.com/@leonhater2001",
  area: "Giao hàng toàn quốc",
  address: "133/38/33 Trần Thị Trọng, P. Tân Sơn, Q. Tân Bình, TP. Hồ Chí Minh",
};

export const HERO = {
  kicker: "Cà Mau · Tươi mỗi ngày",
  title: ["Cua", "Cà Mau", "chính gốc"],
  text: "Cua, tôm tuyển chọn từ Cà Mau, giao tận nhà. Hấp sẵn nóng hổi hoặc giao sống để bạn tự chế biến.",
  pic: { alt: "Cua Cà Mau", tone: "red" } as Pic,
};

/** Running strip at the top of the page */
export const TICKER = ["Cua Cà Mau chính gốc", "Giao hàng toàn quốc", "Hấp sẵn nóng hổi", "Cọc 30% giữ hàng", "Tôm sú thiên nhiên theo mùa", "Đóng thùng giữ tươi"];

export const FEATURES: { title: string; text: string; tone: Tone; icon: "pond" | "delivery" | "steam" }[] = [
  { title: "100% Cà Mau", text: "Cua Năm Căn – Cà Mau nổi tiếng cả nước, tuyển từng con: chắc thịt, đầy gạch.", tone: "red", icon: "pond" },
  { title: "Giao toàn quốc", text: "Đóng thùng giữ tươi, giao tận nhà khắp các tỉnh thành.", tone: "blue", icon: "delivery" },
  { title: "Hấp sẵn", text: "Hấp chín nóng hổi, miễn phí khi chốt đơn trên live.", tone: "yellow", icon: "steam" },
];

/** "Choose like a pro": how to tell meat crabs from roe crabs, plus quick tips */
export const GUIDE = {
  title: "Chọn cua như dân sành",
  kinds: [
    { kind: "male" as const, name: "Cua thịt", sub: "Cua đực", text: "Yếm nhỏ, nhọn hình tam giác. Thịt chắc, ngọt, càng to — hợp hấp, rang me.", tone: "blue" as Tone },
    { kind: "female" as const, name: "Cua gạch", sub: "Cua cái", text: "Yếm tròn, rộng. Gạch son đỏ, béo ngậy — hợp hấp, nấu cháo, lẩu.", tone: "red" as Tone },
  ],
  tips: ["Cầm nặng tay", "Yếm cứng, mai bóng", "Đủ càng, đủ chân", "Còn bò khoẻ"],
};

/**
 * Products come from the dashboard's menu (names, sizes and prices stay in sync). Here, per menu item name,
 * an optional tag and photo for the landing page: e.g. "Gạch": { tag: "Bán chạy", img: "/landing/cua-gach.jpg" }.
 */
export const PRODUCT_EXTRAS: Record<string, { tag?: string; img?: string }> = {
  "Thịt Y": { tag: "Chắc thịt" },
  "Gạch": { tag: "Bán chạy" },
  "Sú 20 con": { tag: "Thiên nhiên" },
};

export interface Slide extends Pic { caption: string }
export const GALLERY: Slide[] = [
  { caption: "Cua gạch son, hấp nóng hổi", alt: "Cua gạch hấp", tone: "red" },
  { caption: "Tuyển chọn từng con tại Cà Mau", alt: "Tuyển chọn cua", tone: "blue" },
  { caption: "Đóng gói kỹ, giữ tươi đến tay bạn", alt: "Đóng gói", tone: "yellow" },
  { caption: "Tôm sú thiên nhiên theo mùa", alt: "Tôm sú", tone: "black" },
  { caption: "Giao toàn quốc, tận cửa nhà bạn", alt: "Giao hàng toàn quốc", tone: "red" },
  { caption: "Bữa tiệc hải sản cho cả nhà", alt: "Bữa tiệc", tone: "blue" },
];

export const STEPS = [
  { title: "Nhắn shop", text: "Qua Facebook, Zalo hoặc TikTok. Shop báo giá hôm nay." },
  { title: "Chốt & cọc 30%", text: "Đặt trước 2 ngày, cọc 30% để giữ hàng." },
  { title: "Nhận hàng", text: "Giao đúng giờ hẹn, sống hoặc hấp sẵn." },
];

export const NOTES = [
  "Hủy trước 2 ngày: hoàn 100% tiền cọc.",
  "Đơn hấp: miễn phí nếu chốt trên live, còn lại phụ thu 10k.",
  "Tôm thiên nhiên có theo đợt, khoảng 2 lần mỗi tháng.",
];

/** A menu item shown as a product on the public pages */
export interface Product { key: string; kind: Kind; name: string; size: string; price?: number; tag?: string; img?: string; tone: Tone }
const TONES: Tone[] = ["red", "blue", "yellow", "black"];
const KIND_WORD: Record<Kind, string> = { crab: "Cua", shrimp: "Tôm" };

/**
 * The menu as products, crabs and shrimps apart: "Gạch" → "Cua Gạch", with PRODUCT_EXTRAS added. `live` is false
 * when the database couldn't be read: then the default menu is used and prices are left out.
 */
export function menuProducts(menu: { items: MenuItem[]; upd: string } | null) {
  const live = !!menu, items = menu?.items ?? defMenu().items;
  const all: Product[] = items.map((i, n) => {
    const word = KIND_WORD[i.k], extra = PRODUCT_EXTRAS[i.name] || {};
    const name = i.name.toLowerCase().startsWith(word.toLowerCase()) ? i.name : `${word} ${i.name}`;
    return { key: i.id, kind: i.k, name, size: i.sz, price: live ? i.price : undefined, tag: extra.tag, img: extra.img, tone: TONES[n % TONES.length] };
  });
  return { live, upd: menu?.upd ?? "", crabs: all.filter((p) => p.kind === "crab"), shrimps: all.filter((p) => p.kind === "shrimp") };
}

/**
 * Texts of the minimal home page (/home). It shares the slides (GALLERY), products, guide, steps and contact
 * above with the Bauhaus page (/bauhaus), so a photo added to GALLERY or PRODUCT_EXTRAS shows on both.
 */
export const HOME = {
  strip: ["Cua Năm Căn – Cà Mau", "Giao hàng toàn quốc", "Đặt trước 2 ngày"],
  kicker: "Năm Căn · Cà Mau",
  title: ["Cua Năm Căn", "ú nu, chắc thịt"],
  sub: "Tươi từ đầm đến bàn ăn — chọn từng con, giao tận nhà khắp cả nước.",
  promises: [
    { title: "Năm Căn – Cà Mau", text: "Chọn từng con tại đầm: chắc thịt, đầy gạch.", icon: "pond" as const },
    { title: "Giao toàn quốc", text: "Đóng thùng giữ tươi, giao tận cửa nhà bạn.", icon: "box" as const },
    { title: "Hấp sẵn", text: "Hấp chín nóng hổi, miễn phí khi chốt đơn trên live.", icon: "steam" as const },
  ],
  /** "Order with peace of mind": only the shop's real rules (same as the dashboard's deposit rules) */
  policies: [
    { big: "30%", title: "Cọc giữ hàng", text: "Chỉ cọc 30% tiền hàng, phần còn lại trả khi nhận." },
    { big: "100%", title: "Hoàn cọc", text: "Hủy trước 2 ngày, shop hoàn lại toàn bộ tiền cọc." },
    { big: "0đ", title: "Phí hấp khi chốt live", text: "Đơn khác chỉ phụ thu 10k nếu muốn hấp sẵn." },
  ],
  /**
   * Questions buyers ask before ordering crab online. Answers use only what the shop's rules say; for anything else
   * (delivery time and fee to a given place) they point to a chat. Add more here as the shop's policies grow.
   */
  faq: [
    { q: "Đặt trước bao lâu thì có cua?", a: "Shop nhận đặt trước 2 ngày để chọn được cua đẹp và đúng size bạn muốn." },
    { q: "Cọc thế nào, hủy có mất cọc không?", a: "Bạn cọc 30% tổng tiền hàng để giữ đơn. Hủy trước 2 ngày, shop hoàn lại 100% tiền cọc." },
    { q: "Có hấp sẵn không?", a: "Có. Hấp miễn phí nếu chốt đơn trên live, các đơn khác phụ thu 10k phí hấp." },
    { q: "Ship đi tỉnh được không?", a: "Được, shop giao toàn quốc, cua được đóng thùng giữ tươi. Nhắn shop địa chỉ để biết phí và thời gian giao tới chỗ bạn." },
    { q: "Nên chọn cua thịt hay cua gạch, size nào?", a: "Thích thịt chắc, ngọt thì chọn cua thịt; mê gạch béo thì chọn cua gạch. Con to (2–3 con/kg) hợp đãi khách, con vừa (4–6 con/kg) hợp bữa gia đình. Chưa chắc thì nhắn shop tư vấn." },
    { q: "Tôm thiên nhiên có thường xuyên không?", a: "Tôm thường lúc nào cũng có; tôm thiên nhiên về theo đợt, khoảng 2 lần mỗi tháng — nhắn shop để được báo khi có." },
  ],
};
