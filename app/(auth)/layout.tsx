import type { Metadata } from 'next';
import type { ReactNode } from 'react';

/**
 * Sign-in, sign-up and their siblings are doors, not destinations: nobody searches for a login
 * form, and an indexed one competes with the landing for the product's own name. Links are still
 * followed (PHASE5A_PRODUCT_SITE §8.4).
 */
export const metadata: Metadata = {
  robots: { index: false, follow: true },
};

export default function AuthGroupLayout({ children }: { children: ReactNode }) {
  return children;
}
