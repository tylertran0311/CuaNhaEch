// Content of the public landing page (/home). Edit texts and images here, not in the components.
// Images: put files in public/landing/ and set `img: "/landing/your-file.jpg"`. Without `img`, a geometric
// placeholder in the page's colors is shown instead.

export type Tone = "red" | "blue" | "yellow" | "black";
export interface Pic { img?: string; alt: string; tone: Tone }

/** The shop's channels */
export const CONTACT = {
  phone: "0888 041 240",
  facebook: "https://www.facebook.com/share/18d19Wh85u/?mibextid=wwXIfr",
  zalo: "https://zalo.me/84888041240",
  tiktok: "https://www.tiktok.com/@leonhater2001",
  area: "Giao hàng toàn quốc",
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
