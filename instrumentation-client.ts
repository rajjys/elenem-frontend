/**
 * Browser Sentry, loaded only when it is configured.
 *
 * This imported `@sentry/nextjs` statically and then checked for a DSN — so every page of the
 * product, the league sites included, downloaded ~140 KB of Sentry whether or not Sentry was set
 * up. With the DSN read at build time, an unconfigured build has no Sentry at all (the branch and
 * its import are compiled away), and a configured one loads it after the page, not before.
 */
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

let captureTransition: ((href: string, navigationType: string) => void) | undefined;

if (dsn) {
  void import('@sentry/nextjs').then((Sentry) => {
    Sentry.init({
      dsn,
      tracesSampleRate: Number(process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE ?? 0.1),
    });
    captureTransition = Sentry.captureRouterTransitionStart;
  });
}

export function onRouterTransitionStart(href: string, navigationType: string) {
  captureTransition?.(href, navigationType);
}
