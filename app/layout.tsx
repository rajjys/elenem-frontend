// app/(app)/layout.tsx
"use client";
import "./globals.css";

// app/layout.tsx (if this is the root layout) or a specific public group layout
import React, { ReactNode } from 'react';
import { Inter } from 'next/font/google'; // Example font

const inter = Inter({ subsets: ['latin'] , variable: '--font-inter'});
/*
const poppins = Poppins({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-poppins',
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900']
});
*/
export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable}`} suppressHydrationWarning>
      <body>
        {children}
        </body>
    </html>
  );
}