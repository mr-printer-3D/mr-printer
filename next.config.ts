import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["three"],
  async redirects() {
    return [
      // Old studio paths → new root tool paths
      { source: "/studio", destination: "/", permanent: false },
      { source: "/studio/", destination: "/", permanent: false },
      { source: "/studio/index.html", destination: "/", permanent: false },
      {
        source: "/studio/tools/pricing",
        destination: "/tools/pricing/",
        permanent: false,
      },
      {
        source: "/studio/tools/pricing/",
        destination: "/tools/pricing/",
        permanent: false,
      },
      {
        source: "/studio/tools/pricing/index.html",
        destination: "/tools/pricing/",
        permanent: false,
      },
      // Force trailing slash so relative assets never break
      {
        source: "/tools/pricing",
        destination: "/tools/pricing/",
        permanent: false,
      },
    ];
  },
  async rewrites() {
    return {
      beforeFiles: [
        { source: "/", destination: "/index.html" },
        {
          source: "/tools/pricing/",
          destination: "/tools/pricing/index.html",
        },
      ],
    };
  },
};

export default nextConfig;
