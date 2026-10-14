import type { NextConfig } from "next";

// Static export: the output in /out merges with the protected legacy paths
// (anthropic-certifications, forward-deployed-engineer, functions) before upload.
const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  poweredByHeader: false,
};

export default nextConfig;
