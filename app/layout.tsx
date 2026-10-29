import type { Metadata, Viewport } from "next";
// Styles, in cascade order: tokens → base → UI kit → app shell → one file per tab (see docs/design-system.md)
import "./styles/tokens.css";
import "./styles/base.css";
import "./styles/ui.css";
import "./styles/layout.css";
import "./styles/orders.css";
import "./styles/calendar.css";
import "./styles/insights.css";

// Fonts load from Google at runtime (not next/font) so builds don't need to download them
const FONTS = "https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;800&family=Paytone+One&family=VT323&family=Be+Vietnam+Pro:wght@400;500;700&display=swap";

export const metadata: Metadata = {
  title: "Cua Nhà Ếch – Shop dashboard",
  description: "Theo dõi đơn cua, tôm, thu chi và khách hàng ở một chỗ.",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link rel="stylesheet" href={FONTS} />
      </head>
      <body>{children}</body>
    </html>
  );
}
