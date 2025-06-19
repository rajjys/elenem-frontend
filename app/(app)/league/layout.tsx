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
        <div className="flex h-screen bg-gray-100 overflow-hidden">
            {/* Desktop Sidebar */}
            <aside className={`bg-white shadow-lg transition-all duration-300 ease-in-out hidden md:flex flex-col sticky top-0 h-full 
                                ${isSidebarOpen ? "w-64" : "w-20"}`}>
                 <div className={`flex items-center p-4 border-b border-gray-200 ${isSidebarOpen ? "justify-between" : "justify-center"}`}>
                    {isSidebarOpen && (
                        <Link href="/league/dashboard" className="flex items-center space-x-2" onClick={closeFlyout}>
                            <div className="bg-green-600 text-white p-2 rounded-lg"><FiAward className="h-6 w-6" /></div> {/* Changed color for LA */}
                            <span className="font-bold text-xl text-green-700">League Panel</span>
                        </Link>
                    )}
                    <button onClick={toggleSidebar} className="p-1.5 rounded-md text-gray-600 hover:bg-gray-200">
                        {isSidebarOpen ? <FiX className="w-5 h-5" /> : <FiMenu className="w-5 h-5" />}
                    </button>
                </div>
                <nav className="flex-grow p-2 space-y-1 overflow-y-auto">
                    {leagueNavItems.map((category) => (
                        <CollapsibleNavLink
                            key={category.label}
                            category={category}
                            currentPath={currentPath}
                            isSidebarOpen={isSidebarOpen}
                            onFlyoutToggle={handleFlyoutToggle}
                            activeFlyoutLabel={activeFlyoutLabel}
                        />
                    ))}
                    {/* Account links common for all users, but styled within this layout context */}
                    <div className="mt-auto pt-4 border-t border-gray-200">
                        <NavLink item={{ label: "My Profile", basePath: "/account/profile", icon: FiUser }} currentPath={currentPath} isSidebarOpen={isSidebarOpen} onClick={closeFlyout} />
                        <NavLink item={{ label: "Security", basePath: "/account/security", icon: FiShield }} currentPath={currentPath} isSidebarOpen={isSidebarOpen} onClick={closeFlyout} />
                    </div>
                </nav>
            </aside>

            {/* Mobile Menu Container */}
            <div className={`fixed inset-0 z-40 flex md:hidden 
                            ${isMobileMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"} 
                            transition-opacity duration-300 ease-in-out`}>
                <div className="fixed inset-0 bg-black/50" onClick={closeMobileMenu}></div>
                <aside className={`relative flex flex-col w-64 max-w-xs h-full bg-white shadow-xl py-4 z-50 
                                 transform transition-transform duration-300 ease-in-out
                                 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                     <div className="flex items-center justify-between px-4 pb-2 border-b">
                        <Link href="/league/dashboard" className="flex items-center space-x-2" onClick={closeMobileMenu}>
                            <div className="bg-green-600 text-white p-2 rounded-lg"><FiAward className="h-6 w-6" /></div>
                            <span className="font-bold text-xl text-green-700">League Panel</span>
                        </Link>
                        <button onClick={closeMobileMenu} className="p-2 rounded-md text-gray-600 hover:bg-gray-100">
                            <FiX className="w-6 h-6" />
                        </button>
                    </div>
                    <nav className="flex-grow p-2 space-y-1 overflow-y-auto">
                        {leagueNavItems.map((category) => (
                            <CollapsibleNavLink
                                key={category.label}
                                category={category}
                                currentPath={currentPath}
                                isSidebarOpen={true} 
                                onFlyoutToggle={() => {}}
                                activeFlyoutLabel={null}
                                onMobileLinkClick={closeMobileMenu}
                            />
                        ))}
                        <div className="mt-auto pt-4 border-t border-gray-200">
                            <NavLink item={{ label: "My Profile", basePath: "/account/profile", icon: FiUser }} currentPath={currentPath} isSidebarOpen={true} onClick={closeMobileMenu} />
                            <NavLink item={{ label: "Security", basePath: "/account/security", icon: FiShield }} currentPath={currentPath} isSidebarOpen={true} onClick={closeMobileMenu} />
                        </div>
                    </nav>
                </aside>
            </div>
            
            {/* Main Content Area */}
            <div className="flex-1 flex flex-col overflow-hidden">
                <header className="bg-white shadow-sm p-4 flex items-center justify-between sticky top-0 z-30">
                    <div className="flex items-center">
                        <button onClick={toggleMobileMenu} className="md:hidden p-2 rounded-md text-gray-600 hover:bg-gray-100 mr-2">
                            <FiMenu className="w-6 h-6" />
                        </button>
                        <h1 className="text-xl font-semibold text-gray-800">
                            {user?.managingLeague? `${user.managingLeague?.name} - Management` : "League Management"}
                        </h1>
                    </div>
                    {user && (
                        <div className="flex items-center space-x-3">
                            <span className="text-sm text-gray-700 hidden sm:inline">
                                {user.username} ({user.managingLeague?.name || 'League Admin'})
                            </span>
                            <div className="w-9 h-9 rounded-full bg-green-600 text-white flex items-center justify-center text-sm font-semibold">
                                {user.username.charAt(0).toUpperCase()}
                            </div>
                            <button onClick={handleLogout} className="flex items-center text-sm text-gray-600 hover:text-green-700 p-2 rounded-md hover:bg-gray-100 transition-colors" title="Logout">
                                <FiLogOut className="w-5 h-5" />
                            </button>
                        </div>
                    )}
                </header>
                <main className="flex-1 p-6 overflow-y-auto bg-gray-50">
                    {children}
                </main>
            </div>

            {/* Desktop Collapsed Sidebar Flyout Menu */}
            {activeFlyoutLabel && !isSidebarOpen && flyoutPosition && (
                <FlyoutMenu
                    items={leagueNavItems.find(cat => cat.label === activeFlyoutLabel)?.subItems || []}
                    categoryLabel={activeFlyoutLabel} // Pass the category label to the flyout
                    position={flyoutPosition}
                    currentPath={currentPath}
                    onClose={closeFlyout}
                    onLinkClick={closeFlyout}
                    triggerRef={currentFlyoutTriggerRef}
                />
            )}
        </div>
    );
}