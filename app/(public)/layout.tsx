// app/(app)/layout.tsx
// app/layout.tsx (if this is the root layout) or a specific public group layout
import React, { ReactNode } from 'react';
import { PublicFooter, PublicHeader } from '@/components/layouts/';

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
          <div className="flex min-h-screen flex-col bg-gray-50 text-gray-800">
            <PublicHeader />
              <main className="flex-grow">{children}</main>
            { <PublicFooter /> }
          </div>
  );
}