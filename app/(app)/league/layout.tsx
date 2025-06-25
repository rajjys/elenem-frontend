// app/league/layout.tsx OR components/layouts/LeagueAdminLayout.tsx
"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import React, { useState, ReactNode, useEffect, useRef, RefObject } from 'react';
import {
    FiBarChart2, FiSettings, FiUsers, FiAward, FiCalendar, FiDollarSign, FiSend, FiImage,
    FiGift, FiShoppingBag, FiHelpCircle, FiUser, FiShield, FiLogOut, FiChevronDown,
    FiChevronRight, FiMenu, FiX, FiFileText, FiBriefcase, FiFlag, FiList, FiCheckSquare, FiClipboard, FiEdit3, FiPercent,
    FiTrendingUp,
    FiUserCheck,
    FiUserPlus,
    FiClock,
    FiFilePlus,
    FiFileMinus,
    FiVolume2,
    FiMessageCircle,
    FiMessageSquare
} from 'react-icons/fi'; // Example icons
import { useAuthStore } from '@/store/auth.store';
import { MdStadium } from 'react-icons/md';
// --- Reusable NavLink, CollapsibleNavLink, FlyoutMenu Components --- for components/layout
import { CollapsibleNavLink, FlyoutMenu, NavLink } from '@/components/layouts';
import AppLayout from '@/components/layouts/AppLayout';

interface LeagueAdminUser { // For displaying user info
    username: string;
    leagueName?: string; // Potentially display the league they are managing
    avatarInitial?: string;
}

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
    const currentPath = usePathname();
    const { user, logout } = useAuthStore();
    const router = useRouter();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const [activeFlyoutLabel, setActiveFlyoutLabel] = useState<string | null>(null);
    const [flyoutPosition, setFlyoutPosition] = useState<{ top: number; left: number } | null>(null);
    const [currentFlyoutTriggerRef, setCurrentFlyoutTriggerRef] = useState<RefObject<HTMLElement> | null>(null);

    const handleLogout = () => {
        // Call your actual logout function
        logout();
        router.push('/login');
    };

    const handleFlyoutToggle = (label: string, targetElement: HTMLElement) => {
        if (activeFlyoutLabel === label || label === "") {
            setActiveFlyoutLabel(null); setFlyoutPosition(null); setCurrentFlyoutTriggerRef(null);
        } else {
            const rect = targetElement.getBoundingClientRect();
            setActiveFlyoutLabel(label);
            setFlyoutPosition({ top: rect.top, left: rect.left + rect.width + 2 });
            setCurrentFlyoutTriggerRef({ current: targetElement });
        }
    };
    const closeFlyout = () => {
        setActiveFlyoutLabel(null); setFlyoutPosition(null); setCurrentFlyoutTriggerRef(null);
    };
    const toggleSidebar = () => { setIsSidebarOpen(!isSidebarOpen); closeFlyout(); }
    const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
    const closeMobileMenu = () => setIsMobileMenuOpen(false);

    return (
        <AppLayout
              navItems={leagueNavItems}
              themeColor="blue" // Or 'blue', 'emerald', etc., as defined in tailwind.config.js
              headerTitle="League Admin"
              logoIcon={FiAward}
        >
              {children}
            </AppLayout>
    );
}