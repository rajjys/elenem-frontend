// app/team/layout.tsx OR components/layouts/TeamAdminLayout.tsx
"use client";
import React, { ReactNode } from 'react';
import {
    FiBarChart2,
    FiGrid,
} from 'react-icons/fi'; // Example icons
// --- Reusable NavLink, CollapsibleNavLink, FlyoutMenu Components ---
import AppLayout from '@/components/layouts/AppLayout';
import { LoadingSpinner } from '@/components/ui';
import { useParams } from 'next/navigation';

interface TeamAdminLayoutProps {
    children: ReactNode;
}

export default function TeamAdminLayout({ children }: TeamAdminLayoutProps) {
    const params = useParams();
    const seasonId = params?.seasonId;
      // Define navigation structure for Team Admin
    const teamNavItems = [
      {
        label: "Dashboard",
        icon: FiGrid,
        subItems: [
              { label: "Overview", basePath:`/season/${seasonId}/dashboard`, icon: FiBarChart2 },
            ]
      },
    ];

    return (
      <React.Suspense fallback={<LoadingSpinner />}>
        <AppLayout navItems={teamNavItems} themeColor="blue">
              {children}
        </AppLayout>
      </React.Suspense>
    );
}