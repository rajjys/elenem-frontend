// app/team/layout.tsx OR components/layouts/TeamAdminLayout.tsx
"use client";
import React, { ReactNode } from 'react';
import {
    FiBarChart2, FiUsers, FiAward, FiCalendar, FiDollarSign, FiMessageSquare, FiHelpCircle,
     FiList, FiBell,
    FiGrid,
    FiEdit,
    FiUserPlus,
    FiBarChart,
    FiMessageCircle,
    FiRepeat,
    FiVolume2,
    FiFileText,
    FiTrendingUp
} from 'react-icons/fi'; // Example icons
// --- Reusable NavLink, CollapsibleNavLink, FlyoutMenu Components ---
import AppLayout from '@/components/layouts/AppLayout';
import { LoadingSpinner } from '@/components/ui';

interface TeamAdminLayoutProps {
    children: ReactNode;
}

// Define navigation structure for Team Admin
const teamNavItems = [
  {
    label: "Dashboard",
    icon: FiGrid,
    subItems: [
          { label: "Overview", basePath: "/team/dashboard", icon: FiBarChart2 },
          { label: "Analytics", basePath: "/team/analytics", icon: FiTrendingUp },
        ]
  },
  {
    label: "Team Management",
    icon: FiUsers,
    subItems: [
      { label: "Roster", basePath: "/team/roster", icon: FiUsers },
      { label: "Team Profile", basePath: "/team/profile", icon: FiEdit },
      { label: "Staff", basePath: "/team/staff", icon: FiUserPlus },
    ],
  },
  {
    label: "Competition",
    icon: FiAward,
    subItems: [
      { label: "Schedule", basePath: "/team/schedule", icon: FiCalendar },
      { label: "Lineups", basePath: "/team/lineups", icon: FiList },
      { label: "Statistics", basePath: "/team/stats", icon: FiBarChart },
    ],
  },
  {
    label: "Communication",
    icon: FiMessageCircle,
    subItems: [
      { label: "Team Chat", basePath: "/team/chat", icon: FiMessageSquare },
      { label: "Notifications", basePath: "/team/notifications", icon: FiBell },
    ],
  },
  {
    label: "Finances",
    icon: FiDollarSign,
    subItems: [
      { label: "Team Fees", basePath: "/team/finances/fees", icon: FiDollarSign },
      { label: "Transactions", basePath: "/team/finances/transactions", icon: FiList },
    ],
  },
  {
    label: "Support",
    icon: FiHelpCircle,
    subItems: [
          { label: "Help", basePath: "/tenant/operations/transfers", icon: FiRepeat },
          { label: "FAQs", basePath: "/tenant/operations/announcements", icon: FiVolume2 },
          { label: "Issues", basePath: "/tenant/operations/reports", icon: FiFileText },
        ]
  },
];


// --- Main Layout Component for Team Admin ---

export default function TeamAdminLayout({ children }: TeamAdminLayoutProps) {
    
    return (
      <React.Suspense fallback={<LoadingSpinner />}>
        <AppLayout
              navItems={teamNavItems}
              themeColor="emerald" // Or 'blue', 'emerald', etc., as defined in tailwind.config.js
              headerTitle="Team Admin"
              logoIcon={FiAward}>
              {children}
            </AppLayout>
        </React.Suspense>
    );
}