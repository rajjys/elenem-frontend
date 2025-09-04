// app/(app)/layout.tsx
// app/layout.tsx (if this is the root layout) or a specific public group layout
import React, { ReactNode } from 'react';
import { PublicTenantHeader } from '@/components/layouts';
import { SportType } from '@/schemas';

export default function PublicLayout({ children }: { children: ReactNode }) {

const tenant = {
          businessProfile: {
            logoUrl: "https://cdn.nba.com/logos/leagues/logo-nba.svg",
            theme: {
              primaryColor: "orange",
              secondaryColor: "blue"
            },
          },
          sportType: SportType.FOOTBALL,
          slug: "nba"
        }
  return (
          <div className="flex min-h-screen flex-col bg-gray-50 text-gray-800">
            <PublicTenantHeader tenant={tenant}/>
              <main className="flex-grow">{children}</main>
            { /*<PublicFooter />*/ }
          </div>
  );
}