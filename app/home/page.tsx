import type { Metadata } from "next";
import LandingPage from "@/components/landing/LandingPage";

export const metadata: Metadata = {
  title: "Cua Nhà Ếch – Cua Cà Mau chính gốc",
  description: "Cua, tôm tuyển chọn từ Cà Mau, giao tận nhà. Hấp sẵn hoặc giao sống, đặt qua Facebook, Zalo, TikTok.",
};

export default function HomePage() {
  return <LandingPage />;
}
