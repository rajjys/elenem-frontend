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
    FiMessageCircle
} from 'react-icons/fi'; // Example icons
// --- Reusable NavLink, CollapsibleNavLink, FlyoutMenu Components ---
import { CollapsibleNavLink, FlyoutMenu, NavLink } from '@/components/layouts';

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
    basePath: "/team/dashboard",
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
    basePath: "/team/support",
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
        <div className="flex h-screen bg-gray-100 overflow-hidden">
            {/* Desktop Sidebar */}
            <aside className={`bg-white shadow-lg transition-all duration-300 ease-in-out hidden md:flex flex-col sticky top-0 h-full
                                ${isSidebarOpen ? "w-64" : "w-20"}`}>
                <div className={`flex items-center p-4 border-b border-gray-200 ${isSidebarOpen ? "justify-between" : "justify-center"}`}>
                    {isSidebarOpen && (
                        <Link href="/team/dashboard" className="flex items-center space-x-2" onClick={closeFlyout}>
                            <div className="bg-blue-600 text-white p-2 rounded-lg"><FiShield className="h-6 w-6" /></div>
                            <span className="font-bold text-xl text-blue-700">Team Panel</span>
                        </Link>
                    )}
                    <button onClick={toggleSidebar} className="p-1.5 rounded-md text-gray-600 hover:bg-gray-200">
                        {isSidebarOpen ? <FiX className="w-5 h-5" /> : <FiMenu className="w-5 h-5" />}
                    </button>
                </div>
                <nav className="flex-grow p-2 space-y-1 overflow-y-auto">
                    {teamNavItems.map((category) => (
                        <CollapsibleNavLink
                            key={category.label}
                            category={category}
                            currentPath={currentPath}
                            isSidebarOpen={isSidebarOpen}
                            onFlyoutToggle={handleFlyoutToggle}
                            activeFlyoutLabel={activeFlyoutLabel}
                        />
                    ))}
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
                    {/* ... Mobile menu content identical to previous layouts, just using teamNavItems ... */}
                </aside>
            </div>
            
            {/* Main Content Area */}
            <div className="flex-1 flex flex-col overflow-hidden">
                <header className="bg-white shadow-sm p-4 flex items-center justify-between sticky top-0 z-30">
                    <div className="flex items-center">
                        <button onClick={toggleMobileMenu} className="md:hidden p-2 rounded-md text-gray-600 hover:bg-gray-100 mr-2">
                            <FiMenu className="w-6 h-6" />
                        </button>
                        <h1 className="text-xl font-semibold text-gray-800 truncate pr-2">
                            {teamAdminUser?.teamName || "Team Management"}
                        </h1>
                    </div>
                    {teamAdminUser && (
                        <div className="flex items-center space-x-3">
                             <div className="hidden sm:flex flex-col items-end">
                                <span className="text-sm text-gray-800 font-semibold">{teamAdminUser.username}</span>
                                <span className="text-xs text-gray-500">Team Admin</span>
                            </div>
                            <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-semibold">
                                {teamAdminUser.avatarInitial}
                            </div>
                            <button onClick={handleLogout} className="flex items-center text-sm text-gray-600 hover:text-blue-700 p-2 rounded-md hover:bg-gray-100 transition-colors" title="Logout">
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
                    items={teamNavItems.find(cat => cat.label === activeFlyoutLabel)?.subItems || []}
                    categoryLabel={activeFlyoutLabel}
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