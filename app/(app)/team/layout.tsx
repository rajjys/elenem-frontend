// app/team/layout.tsx OR components/layouts/TeamAdminLayout.tsx
"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import React, { useState, ReactNode, useEffect, useRef, RefObject } from 'react';
import {
    FiBarChart2, FiSettings, FiUsers, FiAward, FiCalendar, FiDollarSign, FiMessageSquare, FiImage, FiShoppingBag, FiHelpCircle,
    FiUser, FiShield, FiLogOut, FiChevronDown, FiChevronRight, FiMenu, FiX, FiList, FiEdit3, FiVideo, FiHeart, FiBell,
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
import { CollapsibleNavLink, FlyoutMenu, NavLink } from '@/components/layouts';
import AppLayout from '@/components/layouts/AppLayout';

interface TeamAdminUser {
    username: string;
    teamName?: string;
    avatarInitial?: string;
}

interface TeamAdminLayoutProps {
    children: ReactNode;
}

// Define navigation structure for Team Admin
const teamNavItems = [
  {
    label: "Dashboard",
    icon: FiGrid,
    subItems: [
          { label: "Overview", basePath: "/league/dashboard", icon: FiBarChart2 },
          { label: "Analytics", basePath: "/league/analytics", icon: FiTrendingUp },
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
    const currentPath = usePathname();
    const router = useRouter();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const [activeFlyoutLabel, setActiveFlyoutLabel] = useState<string | null>(null);
    const [flyoutPosition, setFlyoutPosition] = useState<{ top: number; left: number } | null>(null);
    const [currentFlyoutTriggerRef, setCurrentFlyoutTriggerRef] = useState<RefObject<HTMLElement> | null>(null);

    // Placeholder: Replace with actual user data from your auth store
    const teamAdminUser: TeamAdminUser | null = {
        username: "CoachJane",
        teamName: "The Valiant Eagles",
        avatarInitial: "CJ"
    };

    const handleLogout = () => {
        // Call your actual logout function from your auth store
        router.push('/login');
    };

    // --- Handlers for sidebar, flyout, and mobile menu ---
    // These functions are identical to the previous layouts
    const handleFlyoutToggle = (label: string, targetElement: HTMLElement) => { /* ... */ };
    const closeFlyout = () => { /* ... */ };
    const toggleSidebar = () => { /* ... */ };
    const toggleMobileMenu = () => { /* ... */ };
    const closeMobileMenu = () => { /* ... */ };

    // (Copy the implementations for the handler functions from the previous response)

    return (
        <AppLayout
              navItems={teamNavItems}
              themeColor="blue" // Or 'blue', 'emerald', etc., as defined in tailwind.config.js
              headerTitle="Team Admin"
              logoIcon={FiAward}>
              {children}
            </AppLayout>
    );
}