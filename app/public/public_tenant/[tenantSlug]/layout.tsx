// app/(app)/layout.tsx
// app/layout.tsx (if this is the root layout) or a specific public group layout
import React, { ReactNode } from 'react';
import { ThemeProvider } from '@/components/providers/ThemeProvider'; // Adjust path
import { PublicFooter, PublicHeader } from '@/components/layouts/';

interface NavLink {
  label: string;
  href: string;
}

const navLinks: NavLink[] = [
  { label: 'Accueil', href: '/' },
  { label: 'Matchs', href: '/games' },
  { label: 'Classements', href: '/standings' },
  { label: 'Equipes', href: '/teams' },
];
export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    
        <ThemeProvider>
          <div className="flex min-h-screen flex-col bg-gray-50 text-gray-800">
            <PublicHeader navLinks={navLinks} />
              <main className="flex-grow">{children}</main>
            <PublicFooter />
          </div>
        </ThemeProvider>
  );
}