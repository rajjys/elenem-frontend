// components/layouts/TenantAdminLayout.tsx
"use client";

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import React, { useState, ReactNode, useEffect, useRef } from 'react';
import { FiHome, FiBriefcase, FiUsers, FiSettings, FiHelpCircle, FiChevronDown, FiLogOut, FiShield, FiMenu, FiX, FiAward, FiShare2, FiDollarSign, FiTrendingUp, FiUser, FiBarChart2, FiCreditCard, FiMapPin, FiUserCheck, FiGift, FiRepeat, FiVolume2, FiFileText } from 'react-icons/fi';

// Import reusable components and the new hook
import { NavLink, FlyoutMenu, CollapsibleNavLink } from '@/components/layouts';
import { useContextualLink } from '@/hooks';

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
    basePath: "/tenant/support",
  },
];

export default function TenantAdminLayout({ children }: { children: ReactNode }) {
    const currentPath = usePathname();
    const router = useRouter();
    const { buildLink } = useContextualLink();

    // Reusable state and handlers from previous layouts
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [activeFlyout, setActiveFlyout] = useState<{ label: string; position: { top: number; left: number }; triggerRef: React.RefObject<HTMLElement> } | null>(null);

    const handleLogout = () => router.push('/login');
    const toggleSidebar = () => { setIsSidebarOpen(!isSidebarOpen); setActiveFlyout(null); };
    const closeMobileMenu = () => setIsMobileMenuOpen(false);
    const handleFlyoutToggle = (label: string, target: HTMLElement, triggerRef: React.RefObject<HTMLElement>) => {
        if (activeFlyout?.label === label) {
            setActiveFlyout(null);
        } else {
            const rect = target.getBoundingClientRect();
            setActiveFlyout({ label, position: { top: rect.top, left: rect.left + rect.width + 4 }, triggerRef });
        }
    };

    return (
        <div className="flex h-screen bg-gray-100 overflow-hidden dark:bg-gray-900">
            <aside className={`bg-white dark:bg-gray-800 shadow-lg transition-all duration-300 hidden md:flex flex-col sticky top-0 h-full ${isSidebarOpen ? "w-64" : "w-20"}`}>
                <div className="flex items-center p-4 border-b border-gray-200 dark:border-gray-700">
                     <Link href={buildLink("/tenant/dashboard")} className="flex items-center space-x-2 w-full">
                        <div className="bg-purple-600 text-white p-2 rounded-lg"><FiShield className="h-6 w-6"/></div>
                        {isSidebarOpen && <span className="font-bold text-xl text-purple-700 dark:text-purple-400">Tenant Panel</span>}
                    </Link>
                    <button onClick={toggleSidebar} className="p-1.5 rounded-md text-gray-600 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-700 ml-auto">
                        {isSidebarOpen ? <FiX className="w-5 h-5"/> : <FiMenu className="w-5 h-5"/>}
                    </button>
                </div>
                <nav className="flex-grow p-2 space-y-1 overflow-y-auto">
                    {tenantNavItems.map((item) =>
                        item.subItems ? (
                            <CollapsibleNavLink key={item.label} category={item} {...{currentPath, isSidebarOpen, handleFlyoutToggle, activeFlyoutLabel: activeFlyout?.label || null, buildLink}} />
                        ) : (
                            <NavLink key={item.label} item={{...item, basePath: buildLink(item.basePath)}} {...{currentPath, isSidebarOpen}} />
                        )
                    )}
                     <div className="mt-auto pt-4 border-t border-gray-200 dark:border-gray-700">
                        <NavLink item={{label: "My Profile", basePath: buildLink("/account/profile"), icon: FiUser}} {...{currentPath, isSidebarOpen}}/>
                        <NavLink item={{label: "Security", basePath: buildLink("/account/security"), icon: FiShield}} {...{currentPath, isSidebarOpen}}/>
                    </div>
                </nav>
            </aside>
            <div className="flex-1 flex flex-col overflow-hidden">
                <header className="bg-white dark:bg-gray-800 shadow-sm p-4 flex items-center justify-between sticky top-0 z-30 border-b dark:border-gray-700">
                    <div className="flex items-center">
                        <button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden p-2 rounded-md text-gray-600 dark:text-gray-300 mr-2"><FiMenu className="w-6 h-6" /></button>
                        <h1 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Tenant Dashboard</h1>
                    </div>
                    <div className="flex items-center space-x-4">
                        <ContextSwitcher />
                        <div className="flex items-center space-x-3">
                             <div className="w-9 h-9 rounded-full bg-purple-600 text-white flex items-center justify-center text-sm font-semibold">TA</div>
                            <button onClick={handleLogout} className="text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 p-2 rounded-md"><FiLogOut className="w-5 h-5"/></button>
                        </div>
                    </div>
                </header>
                <main className="flex-1 p-6 overflow-y-auto">{children}</main>
            </div>
            {/* Mobile Menu and Flyout Menu would be implemented here as in previous examples, using the tenantNavItems and buildLink function */}
        </div>
    );
}

