// app/(app)/layout.tsx
import "./globals.css";
import { Analytics } from "@vercel/analytics/next" ///Vercel Analytics
import { SpeedInsights } from "@vercel/speed-insights/next"
// app/layout.tsx (if this is the root layout) or a specific public group layout
import React, { ReactNode } from 'react';
import { Inter, Poppins } from 'next/font/google'; // Example font
import { Toaster } from "sonner";
import Script from 'next/script';

const inter = Inter({ subsets: ['latin'] , variable: '--font-inter'});

export const metadata = {
  title: 'Elenem Systems',
  description: 'Elenem Systems. Run your sport League without chaos.',
  icons: [
    { rel: 'icon', url: '/favicon.png' },
    //{ rel: 'icon', url: '/favicon-dark.ico', media: '(prefers-color-scheme: dark)' },
  ],
}
export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable}`} suppressHydrationWarning>
      <body>
        {children}
        <Toaster 
            position="top-center" 
            richColors // ✅ success = green, error = red, etc.
            closeButton // ✅ shows an X button on every toast
        />
        <Analytics/>
        <SpeedInsights/>
        {/* Global AdSense Script */}
        <Script
          id="adsbygoogle-init"
          strategy="afterInteractive"
          crossOrigin="anonymous"
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9564658530773384"
        />
      </body>
    </html>
  );
}