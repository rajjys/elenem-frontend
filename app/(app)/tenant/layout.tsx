// components/layouts/TenantAdminLayout.tsx
"use client";

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import React, { useState, ReactNode, useEffect, useRef, RefObject } from 'react';
import { FiHome, FiBriefcase, FiUsers, FiSettings, FiHelpCircle, FiChevronDown, FiAward, FiShare2, FiTrendingUp, FiUser, FiBarChart2, FiCreditCard, FiMapPin, FiUserCheck, FiGift, FiRepeat, FiVolume2, FiFileText } from 'react-icons/fi';

// Import reusable components and the new hook
import { useContextualLink } from '@/hooks';
import { useAuthStore } from '@/store/auth.store';
import AppLayout from '@/components/layouts/AppLayout';

// --- Context Switcher Component ---
interface League { id: string; name: string; }
const tenantLeagues: League[] = [ // Dummy data, fetch this from an API
    { id: 'mens-senior-league-456', name: "Men's Senior League" },
    { id: 'womens-div-123', name: "Women's Division" },
    { id: 'youth-u19-789', name: "Youth U-19 League" },
];

const ContextSwitcher = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);
    
    const currentLeagueId = searchParams.get('contextLeagueId');
    const selectedLeague = tenantLeagues.find(l => l.id === currentLeagueId);

    // Close on click away
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [wrapperRef]);

    const handleSwitch = (leagueId: string | null) => {
        setIsOpen(false);
        if (leagueId) {
            router.push(`/league/dashboard?contextLeagueId=${leagueId}`);
        } else {
            router.push('/tenant/dashboard');
        }
    };

    return (
        <div className="relative" ref={wrapperRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center space-x-2 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
            >
                <span className="truncate max-w-xs">{selectedLeague ? selectedLeague.name : 'Overall Tenant View'}</span>
                <FiChevronDown className={`transform transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
                <div className="absolute right-0 z-50 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 dark:bg-gray-800">
                    <div className="py-1">
                        <a href="#" onClick={() => handleSwitch(null)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700">Overall Tenant View</a>
                        {tenantLeagues.map((league) => (
                            <a key={league.id} href="#" onClick={() => handleSwitch(league.id)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700">{league.name}</a>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

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
      { label: "Leagues", basePath: "/tenant/organization/leagues", icon: FiAward },
      { label: "Users & Staff", basePath: "/tenant/organization/users", icon: FiUsers },
      { label: "Settings", basePath: "/tenant/organization/settings", icon: FiSettings },
      { label: "Billing", basePath: "/tenant/organization/billing", icon: FiCreditCard },
    ],
  },
  {
    label: "Shared Resources",
    icon: FiShare2,
    subItems: [
      { label: "Venues", basePath: "/tenant/resources/venues", icon: FiMapPin },
      { label: "Player Database", basePath: "/tenant/resources/players", icon: FiUsers },
      { label: "Officials Pool", basePath: "/tenant/resources/officials", icon: FiUserCheck },
      { label: "Sponsors", basePath: "/tenant/resources/sponsors", icon: FiGift },
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
    const currentPath = usePathname();
    const router = useRouter();
    const { buildLink } = useContextualLink();
    
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

