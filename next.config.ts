import type { NextConfig } from "next";

const basePath = (process.env.NEXT_PUBLIC_BASE_PATH || "").replace(/\/$/, "");

const nextConfig: NextConfig = {
  ...(basePath ? { basePath } : {}),
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;
