// app/league/layout.tsx OR components/layouts/LeagueAdminLayout.tsx
"use client";

import React, { ReactNode } from 'react';
import {
    FiBarChart2, FiSettings, FiUsers, FiAward, FiCalendar, FiDollarSign, FiImage,
    FiGift, FiUser, FiFileText, FiList, FiCheckSquare,
    FiTrendingUp,
    FiUserCheck,
    FiUserPlus,
    FiClock,
    FiFilePlus,
    FiVolume2,
    FiMessageCircle,
    FiMessageSquare,
    FiFileMinus
} from 'react-icons/fi'; // Example icons
import AppLayout from '@/components/layouts/AppLayout';
import { LoadingSpinner } from '@/components/ui';

interface LeagueAdminLayoutProps {
    children: ReactNode;
}

// Define navigation structure for League Admin
const leagueNavItems = [
  {
    label: "Dashboard",
    icon: FiBarChart2,
    subItems: [
      { label: "Overview", basePath: "/league/dashboard", icon: FiBarChart2 },
      { label: "Analytics", basePath: "/league/analytics", icon: FiTrendingUp },
    ],
  },
  {
    label: "People & Teams",
    icon: FiUsers,
    subItems: [
      { label: "Teams", basePath: "/league/teams", icon: FiUsers },
      { label: "Players", basePath: "/league/players", icon: FiUser },
      { label: "Officials", basePath: "/league/officials", icon: FiUserCheck },
      { label: "Coaches", basePath: "/league/coaches", icon: FiUserPlus },
    ],
  },
  {
    label: "Competition",
    icon: FiAward,
    subItems: [
      { label: "Seasons", basePath: "/league/seasons", icon: FiCalendar },
      { label: "Schedule", basePath: "/league/schedule", icon: FiClock },
      { label: "Results", basePath: "/league/results", icon: FiCheckSquare },
      { label: "Standings", basePath: "/league/standings", icon: FiList },
    ],
  },
  {
    label: "Finances",
    icon: FiDollarSign,
    subItems: [
      { label: "Overview", basePath: "/league/finances/overview", icon: FiTrendingUp },
      { label: "Registration Fees", basePath: "/league/finances/fees", icon: FiFilePlus },
      { label: "Sponsorships", basePath: "/league/finances/sponsorships", icon: FiGift },
      { label: "Expenses", basePath: "/league/finances/expenses", icon: FiFileMinus },
      { label: "Invoices", basePath: "/league/finances/invoices", icon: FiFileText },
    ],
  },
  {
    label: "Communication",
    icon: FiMessageSquare,
    subItems: [
      { label: "Announcements", basePath: "/league/communication/announcements", icon: FiVolume2 },
      { label: "Messaging", basePath: "/league/communication/messaging", icon: FiMessageCircle },
      { label: "Contact Lists", basePath: "/league/communication/lists", icon: FiUsers },
    ],
  },
  {
    label: "Settings",
    icon: FiSettings,
    subItems: [
      { label: "General", basePath: "/league/settings/general", icon: FiSettings },
      { label: "Rules", basePath: "/league/settings/rules", icon: FiFileText },
      { label: "Branding", basePath: "/league/settings/branding", icon: FiImage },
      { label: "Staff", basePath: "/league/settings/staff", icon: FiUsers },
    ],
  },
];

export default function LeagueAdminLayout({ children }: LeagueAdminLayoutProps) {
    
    return (
      <React.Suspense fallback={<LoadingSpinner />}>
        <AppLayout
              navItems={leagueNavItems}
              themeColor="purple" // Or 'blue', 'emerald', etc., as defined in tailwind.config.js
              headerTitle="League Admin"
              logoIcon={FiAward}>
              {children}
            </AppLayout>
      </React.Suspense>
    );
}