// app/(app)/layout.tsx
"use client";

// app/layout.tsx (if this is the root layout) or a specific public group layout
import React, { ReactNode } from 'react';
import { ThemeProvider } from '@/components/providers/ThemeProvider'; // Adjust path
import { PublicHeader, PublicFooter } from '@/components/layouts/'; 
import { Inter } from 'next/font/google'; // Example font

const inter = Inter({ subsets: ['latin'] });

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={inter.className} suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <div className="flex min-h-screen flex-col bg-gray-50 text-gray-800 dark:bg-gray-900 dark:text-gray-200">
            <PublicHeader />
            <main className="flex-grow">{children}</main>
            <PublicFooter />
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}