// components/layouts/TenantAdminLayout.tsx
"use client";

import React, { ReactNode } from 'react';
import { FiHome } from 'react-icons/fi';

// Import reusable components and the new hook
import AppLayout from '@/components/layouts/AppLayout';
import { LoadingSpinner } from '@/components/ui';

// --- Main Layout ---
const userAccountNavItems = [
  {
    label: "Dashboard",
    icon: FiHome,
    subItems: [
        { label: "Tableau de Board", basePath: "/account/dashboard", icon: FiHome },
    ],
  },
];

interface TenantAdminLayoutProps {
    children: ReactNode;
}
export default function TenantAdminLayout({ children }: TenantAdminLayoutProps) {
    
    return (
      <React.Suspense fallback={<LoadingSpinner />}>
        <AppLayout
            navItems={userAccountNavItems}
            themeColor="blue" // Or 'blue', 'emerald', etc., as defined in tailwind.config.js
          >
          {children}
        </AppLayout>
      </React.Suspense>
    );
}

