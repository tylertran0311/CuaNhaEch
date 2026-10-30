import type { Metadata } from "next";
import LandingPage from "@/components/landing/LandingPage";
import { getPublicMenu } from "@/lib/publicMenu";

// The earlier Bauhaus landing page, kept as it was (not linked anywhere, not indexed). /home is the live one.
export const metadata: Metadata = {
  title: "Cua Nhà Ếch – Bauhaus",
  robots: { index: false, follow: false },
};

export default async function BauhausPage() {
  return <LandingPage menu={await getPublicMenu()} />;
}
