import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'kyyeudanang.vn',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'tuonglamphotos.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'utt.edu.vn',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'bffmedia.vn',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
