import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: [
      "localhost",
      ...(process.env.S3_BUCKET ? [`${process.env.S3_BUCKET}.s3.amazonaws.com`] : []),
    ],
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        pathname: '/aida-public/**',
      },
    ],
  },
  output: "standalone",
  poweredByHeader: false,
};

export default nextConfig;
