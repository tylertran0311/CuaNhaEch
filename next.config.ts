import type { NextConfig } from "next";

// Deployed on Vercel, which runs Next.js natively. The site root opens the public landing page (/home);
// the shop dashboard lives at /admin.
const nextConfig: NextConfig = {
  async redirects() {
    return [{ source: "/", destination: "/home", permanent: false }];
  },
};

export default nextConfig;
