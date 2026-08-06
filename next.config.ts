import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["three"],
  async rewrites() {
    return [
      { source: "/studio", destination: "/studio/index.html" },
      { source: "/studio/", destination: "/studio/index.html" },
      {
        source: "/studio/tools/pricing",
        destination: "/studio/tools/pricing/index.html",
      },
      {
        source: "/studio/tools/pricing/",
        destination: "/studio/tools/pricing/index.html",
      },
    ];
  },
};

export default nextConfig;
