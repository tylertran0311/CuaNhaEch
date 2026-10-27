import type { NextConfig } from "next";

// GitHub Pages serves the site from /<repo>/; the deploy workflow passes that in as PAGES_BASE_PATH
const basePath = process.env.PAGES_BASE_PATH || "";

const nextConfig: NextConfig = {
  // Static HTML export: the app runs entirely in the browser (data lives in localStorage)
  output: "export",
  basePath,
  trailingSlash: true,
  // Image optimization needs a server, which GitHub Pages doesn't have
  images: { unoptimized: true },
};

export default nextConfig;
