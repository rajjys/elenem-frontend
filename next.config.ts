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
  /**
   * Remote image hosts. `images.domains` is deprecated, and most of the list served the mock news
   * posts deleted in 5A.1 (Facebook CDN, graphassets) or an S3 bucket that was never used. What is
   * left is the placeholder service still used for missing logos, and the R2 domain images will be
   * served from once storage is wired (INFRASTRUCTURE §2).
   */
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'placehold.co' },
      { protocol: 'https', hostname: 'media.dxscores.com' },
    ],
  },

  /**
   * Browsers and crawlers still ask for /favicon.ico by name. The icon is now generated
   * (app/icon.tsx), so that name points at it — on every host, which is what a favicon wants.
   */
  /**
   * The league sites' share cards read Inter from assets/fonts at request time (lib/public-site/og.tsx).
   * A dynamic route's files are only deployed if they are traced, so they are named here.
   */
  outputFileTracingIncludes: {
    '/public/public_tenant/[tenantSlug]/og/**': ['./assets/fonts/**'],
  },

  async redirects() {
    return [{ source: '/favicon.ico', destination: '/icon', permanent: false }];
  },
};

// Only wrap with Sentry when a DSN is configured, so builds without one are
// completely untouched (Sentry stays dormant).
export default process.env.NEXT_PUBLIC_SENTRY_DSN
  ? withSentryConfig(nextConfig, { silent: true })
  : nextConfig;
