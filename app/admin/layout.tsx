// app/admin/layout.tsx or components/layouts/SystemAdminLayout.tsx
"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import React, { useState, ReactNode, useEffect, useRef, RefObject } from 'react';
import {
    FiHome, FiGrid, FiUsers, FiDollarSign, FiSettings, FiServer, FiShield,
    FiGlobe, FiHelpCircle, FiFileText, FiSearch, FiSmartphone, FiUser, FiLogOut,
    FiChevronDown, FiChevronRight, FiMenu, FiX, FiBarChart2, FiSliders, FiBell,
    FiShoppingBag, FiFilm, FiSpeaker, FiBriefcase, FiZap, FiDatabase, FiMessageSquare, FiAward, FiEdit3, FiBox,
    FiVolume2,
    FiPackage,
    FiList,
    FiTrendingUp,
    FiCreditCard,
    FiActivity,
    FiAlertTriangle,
    FiCode,
    FiLock,
    FiLayout,
    FiMail,
    FiBookOpen
} from 'react-icons/fi';
import { useAuthStore } from '@/store/auth.store';
import { CollapsibleNavLink, FlyoutMenu, NavLink } from '@/components/layouts';

interface SystemAdminLayoutProps {
    children: ReactNode;
}

const systemNavItems = [
  {
    label: "Dashboard",
    icon: FiGrid,
    subItems: [
      { label: "Overview", basePath: "/admin/dashboard", icon: FiGrid },
      { label: "Platform Analytics", basePath: "/admin/analytics", icon: FiBarChart2 },
    ],
  },
  {
    label: "Platform Core",
    icon: FiBox,
    subItems: [
      { label: "Manage Tenants", basePath: "/admin/tenants", icon: FiUsers },
      { label: "Manage All Users", basePath: "/admin/users", icon: FiUsers },
      { label: "Roles & Permissions", basePath: "/admin/roles", icon: FiShield },
      { label: "Global Announcements", basePath: "/admin/announcements", icon: FiVolume2 },
      { label: "Data Management", basePath: "/admin/data", icon: FiDatabase },
    ],
  },
  {
    label: "Financials & Billing",
    icon: FiDollarSign,
    subItems: [
      { label: "Subscription Plans", basePath: "/admin/financials/plans", icon: FiPackage },
      { label: "Tenant Subscriptions", basePath: "/admin/financials/subscriptions", icon: FiList },
      { label: "Platform Revenue", basePath: "/admin/financials/revenue", icon: FiTrendingUp },
      { label: "Payment Gateways", basePath: "/admin/financials/gateways", icon: FiCreditCard },
    ],
  },
  {
    label: "System & Infrastructure",
    icon: FiServer,
    subItems: [
      { label: "System Status", basePath: "/admin/system/status", icon: FiActivity },
      { label: "Error Logs", basePath: "/admin/system/logs", icon: FiAlertTriangle },
      { label: "API & Integrations", basePath: "/admin/system/api", icon: FiCode },
      { label: "Security Settings", basePath: "/admin/system/security", icon: FiLock },
    ],
  },
  {
    label: "Customization",
    icon: FiEdit3,
    subItems: [
      { label: "Platform Appearance", basePath: "/admin/customization/theme", icon: FiLayout },
      { label: "Email Templates", basePath: "/admin/customization/emails", icon: FiMail },
    ],
  },
  {
    label: "Support",
    icon: FiHelpCircle,
    subItems: [
      { label: "Helpdesk", basePath: "/admin/support/helpdesk", icon: FiHelpCircle },
      { label: "Documentation", basePath: "/admin/support/docs", icon: FiBookOpen },
    ],
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
                    {systemNavItems.map((category) => (
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
                        <NavLink item={{ label: "My Profile", basePath: "/admin/account/profile", icon: FiUser }} currentPath={currentPath} isSidebarOpen={isSidebarOpen} onClick={closeFlyout} />
                        <NavLink item={{ label: "Security", basePath: "/admin/account/security", icon: FiShield }} currentPath={currentPath} isSidebarOpen={isSidebarOpen} onClick={closeFlyout} />
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
                        {systemNavItems.map((category) => (
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
                            <NavLink item={{ label: "My Profile", basePath: "/admin/account/profile", icon: FiUser }} currentPath={currentPath} isSidebarOpen={true} onClick={closeMobileMenu} />
                            <NavLink item={{ label: "Security", basePath: "/admin/account/security", icon: FiShield }} currentPath={currentPath} isSidebarOpen={true} onClick={closeMobileMenu} />
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
                    items={systemNavItems.find(cat => cat.label === activeFlyoutLabel)?.subItems || []}
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