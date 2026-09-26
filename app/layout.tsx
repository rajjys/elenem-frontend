// app/(app)/layout.tsx
import "./globals.css";
import { Analytics } from "@vercel/analytics/next" ///Vercel Analytics
import { SpeedInsights } from "@vercel/speed-insights/next"
// app/layout.tsx (if this is the root layout) or a specific public group layout
import React, { ReactNode } from 'react';
import { Inter } from 'next/font/google'; // Example font
import { Toaster } from "sonner";
import { QueryProvider } from "@/components/providers/query-provider";
import { ThemeProvider, themeInitScript } from "@/components/providers/theme-provider";

const inter = Inter({ subsets: ['latin'] , variable: '--font-inter'});

/**
 * `metadataBase` makes relative canonical and Open Graph URLs absolute — `/home`'s canonical of `/`
 * needs it to mean https://dxscores.com/. The icon link pointed at `/favicon.png`, which does not
 * exist (a 404 on every page); `app/favicon.ico` is served by convention without one. Title and
 * description are rewritten with the rename in 5A.2.
 */
export const metadata = {
  metadataBase: new URL(`https://${process.env.NEXT_PUBLIC_APP_DOMAIN || 'dxscores.com'}`),
  title: 'Elenem Systems',
  description: 'Elenem Systems. Run your sport League without chaos.',
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
        <ThemeProvider>
          <QueryProvider>
            {children}
          </QueryProvider>
        </ThemeProvider>
        <Toaster position="top-center" richColors closeButton theme="system" />
        <Analytics/>
        <SpeedInsights/>
        {/* No AdSense. It loaded on every page — the admin app and every league site included —
            with no ad unit anywhere to show, which is weight for nothing on the connections this
            product is read on (`PHASE5A_PRODUCT_SITE` §3.8). */}
      </body>
    </html>
  );
}