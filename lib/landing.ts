// Content of the public pages (/home, and the Bauhaus version at /bauhaus). Edit texts and images here, not in the components.
// Images: put files in public/landing/ and set `img: "/landing/your-file.jpg"`. Without `img`, a geometric
// placeholder in the page's colors is shown instead.

import { defMenu, type Kind, type MenuItem } from "./store";
import { fold } from "./text";

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
/** The phone number as a link */
export const TEL = `tel:${CONTACT.phone.replace(/\s/g, "")}`;

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

/** A short note about a product, shown on /home when the buyer hovers (or taps) its photo */
export interface ProductInfo { sub: string; text: string; cook: string[] }

/**
 * Products come from the dashboard's menu (names, sizes and prices stay in sync). Here, per menu item name,
 * an optional tag, photo and note for the landing page: e.g. "Gạch": { tag: "Bán chạy", img: "/landing/cua-gach.jpg" }.
 * A menu item added later without a note gets KIND_INFO's general one.
 */
export const PRODUCT_EXTRAS: Record<string, { tag?: string; img?: string; info?: ProductInfo }> = {
  "Thịt Tứ": { info: {
    sub: "Cua đực · cỡ vừa",
    text: "Hàng “tứ” theo cách lựa của dân buôn Cà Mau: 4–5 con một ký, con nào cũng chắc nịch. Gỡ càng ra là thịt trắng ngần, ngọt lịm.",
    cook: ["Hấp bia", "Rang me", "Cháo cua"],
  } },
  "Yếm Vuông": { info: {
    sub: "Cua cái tơ",
    text: "Cua cái còn tơ, yếm vuông vức, chưa vào gạch nên dồn hết vào thịt: chắc, ngọt mà giá mềm hơn cua gạch. Ngon – bổ – rẻ cho bữa cơm nhà.",
    cook: ["Hấp", "Rang muối", "Nấu canh"],
  } },
  "Thịt Y": { tag: "Chắc thịt", info: {
    sub: "Cua đực · cỡ lớn nhất",
    text: "Hàng “Y” — cỡ to nhất của cua thịt, chỉ 2–3 con một ký. Càng to, thịt chắc từng thớ, bày lên mâm là nở mày nở mặt với khách.",
    cook: ["Hấp", "Rang me", "Nướng muối ớt"],
  } },
  "Gạch": { tag: "Bán chạy", info: {
    sub: "Cua cái · gạch son",
    text: "Yếm tròn, mai căng — khui mai là thấy gạch son đỏ au. Béo ngậy, bùi thơm, chấm muối tiêu chanh là hết sảy.",
    cook: ["Hấp", "Cháo cua", "Lẩu"],
  } },
  "Bạc": { info: {
    sub: "Tôm nhỏ · vỏ mỏng",
    text: "Tôm bạc nhỏ xinh, vỏ mỏng, thịt ngọt đậm. Rang nguyên vỏ giòn rụm, ăn khỏi lột — món đưa cơm “bất bại” của các mẹ.",
    cook: ["Rang lá chanh", "Rim mặn ngọt", "Nấu canh"],
  } },
  "Thẻ mix sú": { info: {
    sub: "Tôm thẻ & tôm sú",
    text: "Thẻ và sú chung một mẻ, 40–50 con một ký: vừa miệng, dễ làm, giá hợp lý cho bữa gia đình hay nồi lẩu cuối tuần.",
    cook: ["Hấp", "Chiên bơ tỏi", "Lẩu"],
  } },
  "Sú 20 con": { tag: "Thiên nhiên", info: {
    sub: "Tôm sú thiên nhiên · theo đợt",
    text: "Cỡ 20 con một ký, thân dày, thịt chắc giòn sần sật, ngọt đậm đà. Về theo đợt, khoảng 2 lần mỗi tháng — có là nhanh tay.",
    cook: ["Nướng muối ớt", "Hấp nước dừa", "Rim"],
  } },
};

/** The note for a menu item that has none in PRODUCT_EXTRAS */
const KIND_INFO: Record<Kind, ProductInfo> = {
  crab: {
    sub: "Cua Năm Căn – Cà Mau",
    text: "Tuyển từng con tại Năm Căn: chắc thịt, ngọt nước. Nhắn shop để được tư vấn chọn con hợp món, hợp số người ăn.",
    cook: ["Hấp", "Rang me", "Lẩu"],
  },
  shrimp: {
    sub: "Tôm tuyển chọn",
    text: "Tôm tươi, thịt chắc, ngọt. Nhắn shop để được tư vấn cỡ tôm hợp món.",
    cook: ["Hấp", "Nướng", "Rim"],
  },
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

/**
 * Customer feedback on /home — real feedback only. Each one is a screenshot of the customer's message (put it in
 * public/landing/, e.g. img: "/landing/fb-1.jpg") and/or their words, e.g.
 * { name: "Chị Lan", place: "Q.7", item: "Cua Gạch", text: "Cua chắc, gạch đầy, cả nhà khen.", img: "/landing/fb-1.jpg" }.
 * While the list is empty, the section links to the shop's TikTok and Facebook instead.
 */
export interface Review { name: string; text?: string; img?: string; place?: string; item?: string }
export const REVIEWS: Review[] = [];

/** A menu item shown as a product on the public pages */
export interface Product { key: string; slug: string; kind: Kind; name: string; size: string; price?: number; tag?: string; img?: string; info: ProductInfo; tone: Tone }
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
    return { key: i.id, slug: slugOf(name), kind: i.k, name, size: i.sz, price: live ? i.price : undefined, tag: extra.tag, img: extra.img, info: extra.info ?? KIND_INFO[i.k], tone: TONES[n % TONES.length] };
  });
  return { live, upd: menu?.upd ?? "", all, crabs: all.filter((p) => p.kind === "crab"), shrimps: all.filter((p) => p.kind === "shrimp") };
}

/** The product's address under /san-pham: "Cua Thịt Tứ" → "cua-thit-tu" */
export const slugOf = (name: string) => fold(name).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/** How many pieces in a kg, from a size like "4-5 con/kg" → [4, 5]; null for sizes like ">100 con/kg" */
export function piecesPerKg(size: string): [number, number] | null {
  const m = size.match(/^\s*(\d+)\s*[-–]\s*(\d+)/);
  return m ? [+m[1], +m[2]] : null;
}

/**
 * Texts of the minimal home page (/home). It shares the slides (GALLERY), products, guide, steps and contact
 * above with the Bauhaus page (/bauhaus), so a photo added to GALLERY or PRODUCT_EXTRAS shows on both.
 */
export const HOME = {
  strip: ["Cua Năm Căn – Cà Mau", "Cua lỗi, shop đền", "Giao hàng toàn quốc", "Đặt trước 2 ngày"],
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
    { big: "Đền", title: "Cua lỗi, shop đền", text: "Cua ốp, chết, hay gạch xanh do ăn nhiều rong rêu. Chỉ cần quay video lúc khui thùng và lúc mở cua sau khi nấu." },
  ],
  /**
   * Questions buyers ask before ordering crab online. Answers use only what the shop's rules say; for anything else
   * (delivery time and fee to a given place) they point to a chat. Add more here as the shop's policies grow.
   */
  faq: [
    { q: "Đặt trước bao lâu thì có cua?", a: "Shop nhận đặt trước 2 ngày để chọn được cua đẹp và đúng size bạn muốn." },
    { q: "Cọc thế nào, hủy có mất cọc không?", a: "Bạn cọc 30% tổng tiền hàng để giữ đơn. Hủy trước 2 ngày, shop hoàn lại 100% tiền cọc." },
    { q: "Cua chết, ốp hay gạch xanh thì sao?", a: "Shop đền. Cua ốp (ít thịt), cua chết, hay cua gạch bị xanh gạch do ăn nhiều rong rêu đều được đền. Bạn chỉ cần quay video lúc khui thùng nhận hàng, và quay lúc mở cua sau khi chế biến, rồi gửi shop qua Zalo." },
    { q: "Có hấp sẵn không?", a: "Có. Hấp miễn phí nếu chốt đơn trên live, các đơn khác phụ thu 10k phí hấp." },
    { q: "Ship đi tỉnh được không?", a: "Được, shop giao toàn quốc, cua được đóng thùng giữ tươi. Nhắn shop địa chỉ để biết phí và thời gian giao tới chỗ bạn." },
    { q: "Nên chọn cua thịt hay cua gạch, size nào?", a: "Thích thịt chắc, ngọt thì chọn cua thịt; mê gạch béo thì chọn cua gạch. Con to (2–3 con/kg) hợp đãi khách, con vừa (4–6 con/kg) hợp bữa gia đình. Chưa chắc thì nhắn shop tư vấn." },
    { q: "Tôm thiên nhiên có thường xuyên không?", a: "Tôm thường lúc nào cũng có; tôm thiên nhiên về theo đợt, khoảng 2 lần mỗi tháng — nhắn shop để được báo khi có." },
  ],
};
