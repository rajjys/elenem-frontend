// components/layouts/TenantAdminLayout.tsx
"use client";

import React, { ReactNode } from 'react';
import { FiHome, FiBriefcase, FiUsers, FiSettings, FiHelpCircle, FiAward, FiShare2, FiTrendingUp,  FiBarChart2, FiCreditCard, FiMapPin, FiUserCheck, FiGift, FiRepeat, FiVolume2, FiFileText } from 'react-icons/fi';

// Import reusable components and the new hook
import AppLayout from '@/components/layouts/AppLayout';

// --- Main Layout ---
const tenantNavItems = [
  {
    label: "Dashboard",
    icon: FiHome,
    subItems: [
        { label: "Overview", basePath: "/tenant/dashboard", icon: FiHome },
        { label: "Analytics", basePath: "/tenant/analytics", icon: FiBarChart2 },
    ],
  },
  {
    label: "Organization",
    icon: FiBriefcase,
    subItems: [
      { label: "Leagues", basePath: "/tenant/leagues", icon: FiAward },
      { label: "Users & Staff", basePath: "/tenant/users", icon: FiUsers },
      { label: "Settings", basePath: "/tenant/settings", icon: FiSettings },
      { label: "Billing", basePath: "/tenant/billing", icon: FiCreditCard },
    ],
  },
  {
    label: "Shared Resources",
    icon: FiShare2,
    subItems: [
      { label: "Venues", basePath: "/tenant/venues", icon: FiMapPin },
      { label: "Player Database", basePath: "/tenant/players", icon: FiUsers },
      { label: "Officials Pool", basePath: "/tenant/officials", icon: FiUserCheck },
      { label: "Sponsors", basePath: "/tenant/sponsors", icon: FiGift },
    ],
  },
  {
    label: "Operations",
    icon: FiTrendingUp,
    subItems: [
      { label: "Player Transfers", basePath: "/tenant/operations/transfers", icon: FiRepeat },
      { label: "Announcements", basePath: "/tenant/operations/announcements", icon: FiVolume2 },
      { label: "Reports", basePath: "/tenant/operations/reports", icon: FiFileText },
    ],
  },
  {
    label: "Support",
    icon: FiHelpCircle,
    subItems: [
      { label: "Help", basePath: "/tenant/operations/transfers", icon: FiRepeat },
      { label: "FAQs", basePath: "/tenant/operations/announcements", icon: FiVolume2 },
      { label: "Issues", basePath: "/tenant/operations/reports", icon: FiFileText },
    ],
  },
];

interface TenantAdminLayoutProps {
    children: ReactNode;
}
export default function TenantAdminLayout({ children }: TenantAdminLayoutProps) {
    
    return (
    <AppLayout
        navItems={tenantNavItems}
        themeColor="blue" // Or 'blue', 'emerald', etc., as defined in tailwind.config.js
        headerTitle="Tenant Admin"
        logoIcon={FiAward}
      >
      {children}
    </AppLayout>
    );
}

