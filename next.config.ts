import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Every client site is a plain static website (fast, cheap, works on any host).
  output: "export",
  images: { unoptimized: true },
  trailingSlash: true,
};

export default nextConfig;
