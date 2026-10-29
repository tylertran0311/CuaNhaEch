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
  area: "Giao nội thành TP. Hồ Chí Minh",
};

export const HERO = {
  kicker: "Cà Mau · Tươi mỗi ngày",
  title: ["Cua", "Cà Mau", "chính gốc"],
  text: "Cua, tôm tuyển chọn từ Cà Mau, giao tận nhà. Hấp sẵn nóng hổi hoặc giao sống để bạn tự chế biến.",
  pic: { alt: "Cua Cà Mau", tone: "red" } as Pic,
};

export const FEATURES: { title: string; text: string; tone: Tone; shape: "circle" | "square" | "triangle" }[] = [
  { title: "100% Cà Mau", text: "Nguồn cua tuyển chọn, chắc thịt, đầy gạch.", tone: "red", shape: "circle" },
  { title: "Giao trong ngày", text: "Đặt trước, giao đúng giờ hẹn.", tone: "blue", shape: "square" },
  { title: "Hấp sẵn", text: "Miễn phí hấp khi chốt đơn trên live.", tone: "yellow", shape: "triangle" },
];

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
  { caption: "Cua gạch son, hấp sả nóng hổi", alt: "Cua gạch hấp", tone: "red" },
  { caption: "Tuyển chọn từng con tại Cà Mau", alt: "Tuyển chọn cua", tone: "blue" },
  { caption: "Đóng gói kỹ, giữ tươi đến tay bạn", alt: "Đóng gói", tone: "yellow" },
  { caption: "Tôm sú thiên nhiên theo mùa", alt: "Tôm sú", tone: "black" },
  { caption: "Chốt đơn trên live mỗi tối", alt: "Livestream", tone: "red" },
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
