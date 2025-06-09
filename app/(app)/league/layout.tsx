// app/league/layout.tsx OR components/layouts/LeagueAdminLayout.tsx
"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import React, { useState, ReactNode, useEffect, useRef, RefObject } from 'react';
import {
    FiBarChart2, FiSettings, FiUsers, FiAward, FiCalendar, FiDollarSign, FiSend, FiImage,
    FiGift, FiShoppingBag, FiHelpCircle, FiUser, FiShield, FiLogOut, FiChevronDown,
    FiChevronRight, FiMenu, FiX, FiFileText, FiBriefcase, FiFlag, FiList, FiCheckSquare, FiClipboard, FiEdit3, FiPercent
} from 'react-icons/fi'; // Example icons
import { useClickAway } from '@/hooks/useClickAway'; // Adjust path if needed
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
        label: "Dashboard", icon: FiBarChart2, subItems: [
            { label: "Overview", href: "/league/dashboard", icon: FiBarChart2 },
            { label: "League Analytics", href: "/league/analytics", icon: FiBarChart2 },
        ]
    },
    {
        label: "People & Teams", icon: FiUsers, subItems: [
            { label: "Teams", href: "/league/teams/", icon: FiAward },
            { label: "Players", href: "/league/players/", icon: FiUsers },
            { label: "Officials", href: "/league/officials/", icon: FiBriefcase },
            { label: "Coaches", href: "/league/coaches/", icon: FiUsers },
            { label: "Stadiums", href: "/league/stadiums/", icon: MdStadium},
            { label: "Users", href: "/league/users/", icon: FiUsers },
           // { label: "Volunteer Opportunities", href: "/league/volunteers/opportunities", icon: FiClipboard },
           //{ label: "Contact Directory", href: "/league/directory", icon: FiUsers },
            
             //{ label: "Team Invitations", href: "/league/teams/invitations", icon: FiSend },
        ]
    },
    {
        label: "Competition", icon: FiCalendar, subItems: [
            { label: "Manage Seasons", href: "/league/seasons", icon: FiCalendar },
            { label: "Schedule Games", href: "/league/games/schedule", icon: FiCalendar },
            { label: "Game Results", href: "/league/games/results", icon: FiCheckSquare },
            { label: "Live Game Center", href: "/league/games/live-management", icon: FiSend },
            { label: "League Standings", href: "/league/standings", icon: FiBarChart2 },
            { label: "View Lineups", href: "/league/lineups/view", icon: FiList },
            { label: "Disciplinary Actions", href: "/league/discipline", icon: FiFlag },
        ]
    },
    {
        label: "League Finances", icon: FiDollarSign, subItems: [
            { label: "Financial Overview", href: "/league/finances/dashboard", icon: FiDollarSign },
            { label: "Registration Fees", href: "/league/finances/registration-fees", icon: FiDollarSign },
            { label: "Sponsorship Income", href: "/league/finances/sponsorships", icon: FiGift },
            { label: "Other Revenue", href: "/league/finances/other-revenue", icon: FiDollarSign },
            { label: "Manage Expenses", href: "/league/finances/expenses", icon: FiDollarSign },
            { label: "Team Invoices", href: "/league/finances/invoices", icon: FiFileText },
            { label: "Payments Log", href: "/league/finances/payments-log", icon: FiList },
            { label: "Financial Reports", href: "/league/finances/reports", icon: FiBarChart2 },
        ]
    },
    {
        label: "Communication", icon: FiSend, subItems: [
            { label: "League Announcements", href: "/league/communication/announcements", icon: FiSend },
            { label: "Compose Message", href: "/league/communication/composer", icon: FiEdit3 },
            { label: "Contact Lists", href: "/league/communication/groups", icon: FiUsers },
            { label: "Newsletter", href: "/league/communication/newsletter", icon: FiFileText },
            { label: "Promo Codes", href: "/league/communication/promos", icon: FiPercent },
        ]
    },
    {
        label: "Content & Media", icon: FiImage, subItems: [
            { label: "League News", href: "/league/content/news", icon: FiFileText },
            { label: "Media Galleries", href: "/league/content/media", icon: FiImage },
            { label: "Document Center", href: "/league/content/documents", icon: FiFileText },
        ]
    },
    {
        label: "Sponsors", icon: FiGift, subItems: [
            { label: "Manage Sponsors", href: "/league/sponsors", icon: FiGift },
        ]
    },
    {
         label: "Events & Tickets", icon: FiBriefcase, subItems: [
             { label: "Manage Events", href: "/league/events/manage", icon: FiCalendar },
             { label: "Ticket Sales", href: "/league/events/ticketing", icon: FiDollarSign },
         ]
     },
     {
         label: "Merchandise", icon: FiShoppingBag, subItems: [
             { label: "Store Settings", href: "/league/merchandise/settings", icon: FiSettings },
             { label: "Manage Products", href: "/league/merchandise/products", icon: FiShoppingBag },
             { label: "View Orders", href: "/league/merchandise/orders", icon: FiList },
         ]
     },
    {
        label: "League Setup", icon: FiSettings, subItems: [
            { label: "General Settings", href: "/league/settings/general", icon: FiSettings },
            { label: "Competition Rules", href: "/league/settings/rules", icon: FiFlag },
            { label: "Branding & Public Page", href: "/league/settings/branding", icon: FiEdit3 },
            { label: "Registration Setup", href: "/league/settings/registration", icon: FiClipboard },
            { label: "Payment Config", href: "/league/settings/payments", icon: FiDollarSign },
            { label: "Manage Staff", href: "/league/staff/manage", icon: FiUsers },
            { label: "Staff Roles", href: "/league/staff/roles", icon: FiShield },
            { label: "User Roles & Permissions", href: "/league/roles", icon: FiShield },
            { label: "User Groups", href: "/league/groups", icon: FiUsers },
            { label: "Activity Log", href: "/league/activity-log", icon: FiList },
        ]
    },
    {
        label: "Support", icon: FiHelpCircle, subItems: [
            { label: "Help Center", href: "/league/support/help", icon: FiHelpCircle },
            { label: "Contact Support", href: "/league/support/contact", icon: FiSend },
            { label: "FAQs", href: "/league/support/faqs", icon: FiHelpCircle},
            { label: "Feedback", href: "/league/support/feedback", icon: FiClipboard},
        ]
    }
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
                        <NavLink item={{ label: "My Profile", href: "/league/account/profile", icon: FiUser }} currentPath={currentPath} isSidebarOpen={isSidebarOpen} onClick={closeFlyout} />
                        <NavLink item={{ label: "Security", href: "/league/account/security", icon: FiShield }} currentPath={currentPath} isSidebarOpen={isSidebarOpen} onClick={closeFlyout} />
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
                            <NavLink item={{ label: "My Profile", href: "/account/profile", icon: FiUser }} currentPath={currentPath} isSidebarOpen={true} onClick={closeMobileMenu} />
                            <NavLink item={{ label: "Security", href: "/account/security", icon: FiShield }} currentPath={currentPath} isSidebarOpen={true} onClick={closeMobileMenu} />
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
                            {user?.league?.id? `${user.league.id} - Management` : "League Management"}
                        </h1>
                    </div>
                    {user && (
                        <div className="flex items-center space-x-3">
                            <span className="text-sm text-gray-700 hidden sm:inline">
                                {user.username} ({user.league?.name || 'League Admin'})
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