// app/league/layout.tsx OR components/layouts/LeagueAdminLayout.tsx
"use client";

import React, { ReactNode } from 'react';
import {
    FiBarChart2, FiSettings, FiUsers, FiAward, FiCalendar,
     FiUser, FiFileText, FiList, FiCheckSquare,
    FiUserCheck,
    FiUserPlus,
    FiClock
} from 'react-icons/fi'; // Example icons
import AppLayout from '@/components/layouts/AppLayout';
import { LoadingSpinner } from '@/components/ui';
import { UserPlus } from 'lucide-react';

interface LeagueAdminLayoutProps {
    children: ReactNode;
}

// Define navigation structure for League Admin
const leagueNavItems = [
  {
    label: "Tableau de Bord",
    icon: FiBarChart2,
    subItems: [
      { label: "Overview", basePath: "/league/dashboard", icon: FiBarChart2 },
/*      { label: "Analytics", basePath: "/league/analytics", icon: FiTrendingUp }, */
    ],
  },
  {
    label: "Personnes & Equipes",
    icon: FiUsers,
    subItems: [
      { label: "Equipes", basePath: "/league/teams", icon: FiUsers },
      { label: "Athletes", basePath: "/league/players", icon: FiUser },
      { label: "Officiels", basePath: "/league/officials", icon: FiUserCheck },
      { label: "Coachs", basePath: "/league/coaches", icon: FiUserPlus },
    ],
  },
  {
    label: "Competitions",
    icon: FiAward,
    subItems: [
      { label: "Saisons", basePath: "/league/seasons", icon: FiCalendar },
      { label: "Programmes", basePath: "/league/schedule", icon: FiClock },
      { label: "Resultats", basePath: "/league/results", icon: FiCheckSquare },
      { label: "Classements", basePath: "/league/standings", icon: FiList },
    ],
  },
  /* 
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
  }, */
  {
    label: "Parametres",
    icon: FiSettings,
    subItems: [
      { label: "General", basePath: "/league/settings/general", icon: FiSettings },
      { label: "Reglements", basePath: "/league/settings/rules", icon: FiFileText },
      { label: "Profil", basePath: "/league/settings/profile", icon: FiSettings },
      /* { label: "Branding", basePath: "/league/settings/branding", icon: FiImage }, */
      { label: "Admins", basePath: "/league/settings/staff", icon: UserPlus },
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