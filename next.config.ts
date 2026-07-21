import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

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
    domains: ["scontent-mba2-1.xx.fbcdn.net", "scontent.fgom1-1.fna.fbcdn.net", "scontent-jnb2-1.xx.fbcdn.net", "placehold.co", "via.placeholder.com", "eu-central-1-shared-euc1-02.graphassets.com",
              "elenem-sports-media-prod.s3.eu-west-3.amazonaws.com"
    ],
  }
};

// Only wrap with Sentry when a DSN is configured, so builds without one are
// completely untouched (Sentry stays dormant).
export default process.env.NEXT_PUBLIC_SENTRY_DSN
  ? withSentryConfig(nextConfig, { silent: true })
  : nextConfig;
