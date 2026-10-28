import type { NextConfig } from "next";

// Deployed on Vercel, which runs Next.js natively. The shop dashboard lives at /admin; until there is a
// landing page, the site root sends visitors there.
const nextConfig: NextConfig = {
  async redirects() {
    return [{ source: "/", destination: "/admin", permanent: false }];
  },
};

export default nextConfig;
