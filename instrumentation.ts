import * as Sentry from '@sentry/nextjs';

// Server/edge Sentry init. Dormant until NEXT_PUBLIC_SENTRY_DSN is set.
export async function register() {
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN) return;
  if (process.env.NEXT_RUNTIME === 'nodejs' || process.env.NEXT_RUNTIME === 'edge') {
    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      tracesSampleRate: Number(process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE ?? 0.1),
    });
  }
}

export const onRequestError = Sentry.captureRequestError;
