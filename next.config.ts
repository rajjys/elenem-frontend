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
   * Remote image hosts for next/image. Logos and photos do not go through it: the API stores each at
   * the sizes we show (components/media/entity-image.tsx), and next/image refused the development
   * bucket's host, which crashed the standings (2026-10-07). What is left here is the production
   * media domain, for the two post components that still use next/image until posts get their
   * image slot. placehold.co is gone: missing logos show initials.
   */
  images: {
    remotePatterns: [
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
