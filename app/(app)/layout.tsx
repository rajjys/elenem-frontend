import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { AppProviders } from '@/components/providers/app-providers';

/**
 * The app behind the login is never indexed. robots.txt already disallows these paths; this is the
 * second layer, for a page reached some other way (PHASE5A_PRODUCT_SITE §8.4).
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AppGroupLayout({ children }: { children: ReactNode }) {
  return <AppProviders>{children}</AppProviders>;
}
