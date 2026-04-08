import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/aida-public/**",
      },
      ...(process.env.S3_BUCKET
        ? [
            {
              protocol: "https" as const,
              hostname: `${process.env.S3_BUCKET}.s3.amazonaws.com`,
              pathname: "/**",
            },
          ]
        : []),
    ],
  },
  output: "standalone",
  poweredByHeader: false,
};

export default nextConfig;
