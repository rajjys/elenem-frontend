import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here 
async rewrites() {
    return [
      {
        source: '/path*',
        destination: 'http://localhost:3333/path*', // Proxy to NestJS
      },
    ];
  },*/
  images: {
    domains: ["scontent-mba2-1.xx.fbcdn.net"],
  }
};

export default nextConfig;
