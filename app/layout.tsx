// app/(app)/layout.tsx
import "./globals.css";

// app/layout.tsx (if this is the root layout) or a specific public group layout
import React, { ReactNode } from 'react';
import { Inter } from 'next/font/google'; // Example font
import { Toaster } from "sonner";

const inter = Inter({ subsets: ['latin'] , variable: '--font-inter'});
/*
const poppins = Poppins({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-poppins',
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900']
});
*/
export const metadata = {
  title: 'Elenem Systems',
  description: 'Elenem Systems. Scaling your League Management.',
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
      </body>
    </html>
  );
}