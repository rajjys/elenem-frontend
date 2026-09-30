// app/(app)/layout.tsx
import "./globals.css";
import { Analytics } from "@vercel/analytics/next" ///Vercel Analytics
import { SpeedInsights } from "@vercel/speed-insights/next"
// app/layout.tsx (if this is the root layout) or a specific public group layout
import React, { ReactNode } from 'react';
import { Inter } from 'next/font/google'; // Example font
import { themeInitScript } from "@/components/providers/theme-provider";

const inter = Inter({ subsets: ['latin'] , variable: '--font-inter'});

/**
 * `metadataBase` makes relative canonical and Open Graph URLs absolute — `/home`'s canonical of `/`
 * needs it to mean https://dxscores.com/. The icon link pointed at `/favicon.png`, which does not
 * exist (a 404 on every page); `app/favicon.ico` is served by convention without one. Title and
 * description are the DXScores ones since 5A.2.
 */
export const metadata = {
  metadataBase: new URL(`https://${process.env.NEXT_PUBLIC_APP_DOMAIN || 'dxscores.com'}`),
  // The full metadata (Open Graph, per-page descriptions) is 5A.3; the name and language are here.
  title: {
    default: 'DXScores — le classement se calcule tout seul',
    template: '%s · DXScores',
  },
  description:
    'Le calendrier, les résultats et le classement de votre ligue, calculés et publiés automatiquement. Gratuit.',
  // Defaults for any page that sets none; the product site's pages set their own (content/seo.ts).
  openGraph: {
    type: 'website',
    siteName: 'DXScores',
    locale: 'fr_FR',
    title: 'DXScores — le classement se calcule tout seul',
    description:
      'Le calendrier, les résultats et le classement de votre ligue, calculés et publiés automatiquement. Gratuit.',
  },
  twitter: { card: 'summary_large_image' },
}
export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr" className={`${inter.variable}`} suppressHydrationWarning>
      <head>
        {/* Applies the viewer's saved theme before first paint. Without this the page renders
            light, then flips once the client reads localStorage — the flash of wrong theme. */}
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        {/* The app's providers — data cache, theme switch, toasts — live in the layouts that use
            them (components/providers/app-providers.tsx), so the landing and the league sites
            do not load them. */}
        {children}
        <Analytics/>
        <SpeedInsights/>
        {/* No AdSense. It loaded on every page — the admin app and every league site included —
            with no ad unit anywhere to show, which is weight for nothing on the connections this
            product is read on (`PHASE5A_PRODUCT_SITE` §3.8). */}
      </body>
    </html>
  );
}