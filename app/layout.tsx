// app/(app)/layout.tsx
"use client";
import "./globals.css";

// app/layout.tsx (if this is the root layout) or a specific public group layout
import React, { ReactNode } from 'react';
import { Inter } from 'next/font/google'; // Example font

const inter = Inter({ subsets: ['latin'] });

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={inter.className} suppressHydrationWarning>
      <body>
        {children}
        </body>
    </html>
  );
}