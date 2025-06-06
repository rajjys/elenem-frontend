// app/admin/layout.tsx or components/layouts/SystemAdminLayout.tsx
"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import React, { useState, ReactNode, useEffect, useRef, RefObject } from 'react';
import {
    FiHome, FiGrid, FiUsers, FiDollarSign, FiSettings, FiServer, FiShield,
    FiGlobe, FiHelpCircle, FiFileText, FiSearch, FiSmartphone, FiUser, FiLogOut,
    FiChevronDown, FiChevronRight, FiMenu, FiX, FiBarChart2, FiSliders, FiBell,
    FiShoppingBag, FiFilm, FiSpeaker, FiBriefcase, FiZap, FiDatabase, FiMessageSquare, FiAward, FiEdit3, FiBox
} from 'react-icons/fi';
import { useAuthStore } from '@/store/auth.store';
import { CollapsibleNavLink, FlyoutMenu, NavLink } from '@/components/layouts';

interface SystemAdminLayoutProps {
    children: ReactNode;
}

const navItems = [ // Same navItems structure as before
    {
        label: "Dashboard", icon: FiHome, subItems: [
            { label: "Overview", href: "/admin/dashboard", icon: FiBarChart2 },
            { label: "Platform Analytics", href: "/admin/analytics", icon: FiBarChart2 },
        ]
    },
    {
        label: "Platform Core", icon: FiGrid, subItems: [
            { label: "Manage Leagues", href: "/admin/leagues/", icon: FiAward },
            { label: "Create League", href: "/admin/leagues/create", icon: FiAward },
            { label: "League Defaults", href: "/admin/leagues/defaults", icon: FiAward },
            { label: "Manage All Users", href: "/admin/users/", icon: FiUsers },
            { label: "Create User", href: "/admin/users/create", icon: FiUsers },
            { label: "System Admins", href: "/admin/users/system-admins", icon: FiShield },
            { label: "Roles & Permissions", href: "/admin/users/permissions", icon: FiShield },
            { label: "Global Announcements", href: "/admin/content/announcements", icon: FiSpeaker },
            { label: "Data Management Tools", href: "/admin/content/data-tools", icon: FiDatabase },
            { label: "Static Content Pages", href: "/admin/content/pages", icon: FiFileText },
        ]
    },
    {
        label: "Financials & Billing", icon: FiDollarSign, subItems: [
            { label: "Subscription Plans", href: "/admin/financials/plans", icon: FiDollarSign },
            { label: "League Subscriptions", href: "/admin/financials/league-subscriptions", icon: FiDollarSign },
            { label: "Platform Revenue", href: "/admin/financials/revenue", icon: FiDollarSign },
            { label: "Payment Gateways", href: "/admin/financials/payment-gateways", icon: FiSettings },
            { label: "Transaction Log", href: "/admin/financials/transactions", icon: FiFileText },
            { label: "Payout Management", href: "/admin/financials/payouts", icon: FiDollarSign },
        ]
    },
    {
        label: "Modules & Features", icon: FiBox, subItems: [
            { label: "Sports Core Defaults", href: "/admin/features/sports-core/settings", icon: FiZap },
            { label: "Notification Templates", href: "/admin/features/notifications/templates", icon: FiBell },
            { label: "Delivery Settings", href: "/admin/features/notifications/delivery-settings", icon: FiBell },
            { label: "E-commerce Setup", href: "/admin/features/ecommerce/setup", icon: FiShoppingBag },
            { label: "Ticketing Settings", href: "/admin/features/ticketing/settings", icon: FiBriefcase },
            { label: "Live Streaming Providers", href: "/admin/features/live-streaming/providers", icon: FiFilm },
            { label: "Media Storage & CDN", href: "/admin/features/media/storage-cdn", icon: FiServer },
            { label: "Sponsorship Ads", href: "/admin/features/sponsorship/ad-management", icon: FiSpeaker },
            { label: "Feature Flags", href: "/admin/features/flags", icon: FiSliders },
        ]
    },
    {
        label: "System & Infra", icon: FiServer, subItems: [
            { label: "System Status", href: "/admin/system/status", icon: FiServer },
            { label: "Background Jobs", href: "/admin/system/jobs", icon: FiServer },
            { label: "Error Logs", href: "/admin/system/logs/errors", icon: FiFileText },
            { label: "Request Logs", href: "/admin/system/logs/requests", icon: FiFileText },
            { label: "Public API Config", href: "/admin/system/api/public-api", icon: FiGlobe },
            { label: "Webhook Config", href: "/admin/system/api/webhooks", icon: FiGlobe },
            { label: "3rd Party Integrations", href: "/admin/system/api/integrations", icon: FiGlobe },
            { label: "Audit Logs", href: "/admin/system/security/audit-trail", icon: FiShield },
            { label: "Security Settings", href: "/admin/system/security/settings", icon: FiShield },
            { label: "Maintenance Mode", href: "/admin/system/maintenance", icon: FiSettings },
            { label: "Database Overview", href: "/admin/system/database", icon: FiDatabase },
        ]
    },
    {
        label: "Customization", icon: FiEdit3, subItems: [
            { label: "Platform Appearance", href: "/admin/customization/theme", icon: FiEdit3 },
            { label: "Languages & Translations", href: "/admin/customization/languages", icon: FiGlobe },
            { label: "System Email Templates", href: "/admin/customization/email-templates", icon: FiMessageSquare },
        ]
    },
    {
        label: "Support & Comm.", icon: FiHelpCircle, subItems: [
            { label: "Admin Message Center", href: "/admin/support/messaging", icon: FiMessageSquare },
            { label: "Helpdesk Config", href: "/admin/support/config", icon: FiHelpCircle },
        ]
    },
    {
        label: "Legal & Compliance", icon: FiFileText, subItems: [
            { label: "Manage Documents", href: "/admin/compliance/documents", icon: FiFileText },
            { label: "Data Privacy (GDPR)", href: "/admin/compliance/data-privacy", icon: FiShield },
            { label: "Accessibility", href: "/admin/compliance/accessibility", icon: FiUser },
        ]
    },
    {
        label: "Advanced Search", icon: FiSearch, subItems: [
            { label: "Search Configuration", href: "/admin/search/config", icon: FiSettings },
        ]
    },
    {
        label: "Mobile App", icon: FiSmartphone, subItems: [
            { label: "App Versions", href: "/admin/mobile-app/versions", icon: FiSmartphone },
            { label: "Global Push Control", href: "/admin/mobile-app/push-control", icon: FiBell },
        ]
    },
];
export default function SystemAdminLayout({ children }: SystemAdminLayoutProps) {
    const currentPath = usePathname();
    const { user, logout } = useAuthStore();
    const router = useRouter();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const [activeFlyoutLabel, setActiveFlyoutLabel] = useState<string | null>(null);
    const [flyoutPosition, setFlyoutPosition] = useState<{ top: number; left: number } | null>(null);
    const [currentFlyoutTriggerRef, setCurrentFlyoutTriggerRef] = useState<RefObject<HTMLElement> | null>(null);


    //const user: SystemAdminUser | null = { username: "SysAdmin", avatarInitial: "SA" };
    const handleLogout = () => {
        logout();
        router.push('/login');
    };

    const SIDEBAR_OPEN_WIDTH = 64 * 4; // 256px or w-64
    const SIDEBAR_CLOSED_WIDTH = 20 * 4; // 80px or w-20

    const handleFlyoutToggle = (label: string, targetElement: HTMLElement) => {
        if (activeFlyoutLabel === label || label === "") { // If clicking the same one or explicitly closing
            setActiveFlyoutLabel(null);
            setFlyoutPosition(null);
            setCurrentFlyoutTriggerRef(null);
        } else {
            const rect = targetElement.getBoundingClientRect();
            setActiveFlyoutLabel(label);
            // Position to the right of the collapsed sidebar icon
            setFlyoutPosition({ 
                top: rect.top, 
                left: rect.left + rect.width + 2 // Add small gap
            });
             // Create a temporary ref object for the trigger to pass to useClickAway
            const triggerRefObject = { current: targetElement };
            setCurrentFlyoutTriggerRef(triggerRefObject as RefObject<HTMLElement>);
        }
    };
    
    const closeFlyout = () => {
        setActiveFlyoutLabel(null);
        setFlyoutPosition(null);
        setCurrentFlyoutTriggerRef(null);
    };

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
        closeFlyout(); // Close flyout when sidebar state changes
    }
    const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
    const closeMobileMenu = () => setIsMobileMenuOpen(false);


    return (
        <div className="flex h-screen bg-gray-100 overflow-hidden"> {/* Added overflow-hidden to body */}
            {/* Desktop Sidebar */}
            <aside className={`bg-white shadow-lg transition-all duration-300 ease-in-out hidden md:flex flex-col sticky top-0 h-full 
                                ${isSidebarOpen ? "w-64" : "w-20"}`}>
                <div className={`flex items-center p-4 border-b border-gray-200 ${isSidebarOpen ? "justify-between" : "justify-center"}`}>
                    {isSidebarOpen && (
                        <Link href="/admin/dashboard" className="flex items-center space-x-2" onClick={closeFlyout}>
                            <div className="bg-indigo-600 text-white p-2 rounded-lg"><FiAward className="h-6 w-6" /></div>
                            <span className="font-bold text-xl text-indigo-700">ELENEM Admin</span>
                        </Link>
                    )}
                    <button onClick={toggleSidebar} className="p-1.5 rounded-md text-gray-600 hover:bg-gray-200">
                        {isSidebarOpen ? <FiX className="w-5 h-5" /> : <FiMenu className="w-5 h-5" />}
                    </button>
                </div>
                <nav className="flex-grow p-2 space-y-1 overflow-y-auto">
                    {navItems.map((category) => (
                        <CollapsibleNavLink
                            key={category.label}
                            category={category}
                            currentPath={currentPath}
                            isSidebarOpen={isSidebarOpen}
                            onFlyoutToggle={handleFlyoutToggle}
                            activeFlyoutLabel={activeFlyoutLabel}
                        />
                    ))}
                    <div className="mt-auto pt-4 border-t border-gray-200"> {/* Ensure this is visually separated */}
                        <NavLink item={{ label: "My Profile", href: "/admin/account/profile", icon: FiUser }} currentPath={currentPath} isSidebarOpen={isSidebarOpen} onClick={closeFlyout} />
                        <NavLink item={{ label: "Security", href: "/admin/account/security", icon: FiShield }} currentPath={currentPath} isSidebarOpen={isSidebarOpen} onClick={closeFlyout} />
                    </div>
                </nav>
            </aside>

            {/* Mobile Menu Container (Handles transition) */}
            <div className={`fixed inset-0 z-40 flex md:hidden 
                            ${isMobileMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"} 
                            transition-opacity duration-300 ease-in-out`}>
                {/* Overlay */}
                <div className="fixed inset-0 bg-black/50" onClick={closeMobileMenu}></div>
                {/* Mobile Sidebar */}
                <aside className={`relative flex flex-col w-64 max-w-xs h-full bg-white shadow-xl py-4 z-50 
                                 transform transition-transform duration-300 ease-in-out
                                 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                     <div className="flex items-center justify-between px-4 pb-2 border-b">
                        <Link href="/admin/dashboard" className="flex items-center space-x-2" onClick={closeMobileMenu}>
                            <div className="bg-indigo-600 text-white p-2 rounded-lg"><FiAward className="h-6 w-6" /></div>
                            <span className="font-bold text-xl text-indigo-700">ELENEM Admin</span>
                        </Link>
                        <button onClick={closeMobileMenu} className="p-2 rounded-md text-gray-600 hover:bg-gray-100">
                            <FiX className="w-6 h-6" />
                        </button>
                    </div>
                    <nav className="flex-grow p-2 space-y-1 overflow-y-auto">
                        {navItems.map((category) => (
                            <CollapsibleNavLink
                                key={category.label}
                                category={category}
                                currentPath={currentPath}
                                isSidebarOpen={true} // In mobile, categories always behave as if sidebar is open for accordion
                                onFlyoutToggle={() => {}} // No flyouts in mobile menu
                                activeFlyoutLabel={null}
                                onMobileLinkClick={closeMobileMenu}
                            />
                        ))}
                        <div className="mt-auto pt-4 border-t border-gray-200">
                            <NavLink item={{ label: "My Profile", href: "/admin/account/profile", icon: FiUser }} currentPath={currentPath} isSidebarOpen={true} onClick={closeMobileMenu} />
                            <NavLink item={{ label: "Security", href: "/admin/account/security", icon: FiShield }} currentPath={currentPath} isSidebarOpen={true} onClick={closeMobileMenu} />
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
                        <h1 className="text-xl font-semibold text-gray-800">Admin Panel</h1>
                    </div>
                    {user && (
                        <div className="flex items-center space-x-3">
                            <span className="text-sm text-gray-700 hidden sm:inline">Welcome, {user.username}</span>
                            <div className="w-9 h-9 rounded-full bg-indigo-600 text-white flex items-center justify-center text-sm font-semibold">
                                {user.firstName?.charAt(0).toUpperCase() || user.username?.charAt(0).toUpperCase()}
                            </div>
                            <button onClick={handleLogout} className="flex items-center text-sm text-gray-600 hover:text-indigo-700 p-2 rounded-md hover:bg-gray-100 transition-colors" title="Logout">
                                <FiLogOut className="w-5 h-5" />
                            </button>
                        </div>
                    )}
                </header>
                <main className="flex-1 p-6 overflow-y-auto bg-gray-50"> {/* Added bg-gray-50 to main content for contrast */}
                    {children}
                </main>
            </div>

            {/* Desktop Collapsed Sidebar Flyout Menu */}
            {activeFlyoutLabel && !isSidebarOpen && flyoutPosition && (
                <FlyoutMenu
                    items={navItems.find(cat => cat.label === activeFlyoutLabel)?.subItems || []}
                    position={flyoutPosition}
                    currentPath={currentPath}
                    onClose={closeFlyout}
                    onLinkClick={closeFlyout} // Clicking a link in flyout should close it
                    triggerRef={currentFlyoutTriggerRef}
                />
            )}
        </div>
    );
}