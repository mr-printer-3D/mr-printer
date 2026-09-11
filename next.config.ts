import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["three", "@imgly/background-removal"],
  trailingSlash: false,
  serverExternalPackages: ["onnxruntime-web"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "replicate.delivery" },
      { protocol: "https", hostname: "**.replicate.delivery" },
    ],
  },
  async redirects() {
    return [
      { source: "/studio", destination: "/", permanent: false },
      { source: "/studio/", destination: "/", permanent: false },
      { source: "/studio/index.html", destination: "/", permanent: false },
      {
        source: "/studio/tools/pricing",
        destination: "/tools/pricing",
        permanent: false,
      },
      {
        source: "/studio/tools/pricing/",
        destination: "/tools/pricing",
        permanent: false,
      },
      {
        source: "/studio/tools/pricing/index.html",
        destination: "/tools/pricing",
        permanent: false,
      },
      {
        source: "/tools/pricing/",
        destination: "/tools/pricing",
        permanent: false,
      },
      {
        source: "/tools/listing-images",
        destination: "/listing-images",
        permanent: false,
      },
      {
        source: "/tools/listing-images/:path*",
        destination: "/listing-images",
        permanent: false,
      },
      { source: "/product-studio", destination: "/listing-images", permanent: false },
      { source: "/video-flow", destination: "/", permanent: false },
    ];
  },
  async rewrites() {
    return {
      beforeFiles: [
        { source: "/", destination: "/index.html" },
        {
          source: "/tools/pricing",
          destination: "/tools/pricing/index.html",
        },
      ],
    };
  },
};

export default nextConfig;
