'use client'
import React, { useState, ReactNode, RefObject } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {FiShield,FiUser, FiLogOut, FiX } from 'react-icons/fi'; // Keep these imports as your NavLink/CollapsibleNavLink likely use them
import { useAuthStore } from '@/store/auth.store'; // Assuming this path is correct
// Import your existing components. Replace these with your actual paths.
import { CollapsibleNavLink, FlyoutMenu, NavLink } from '.'; // Adjust this import path if needed
import { useContextualLink, useDashboardLinkEligibillity, useSidebarEligibility } from '@/hooks';
import { Roles } from '@/schemas'; // Assuming Role enum is here
import { AppLayoutHeader } from './AppLayoutHeader'; // Import the updated Navbar
import { ArrowLeft,  ChevronLeft, ChevronRight, Settings, Shield, User } from 'lucide-react';

// Type for a React Icon component
type IconType = React.ComponentType<React.SVGProps<SVGSVGElement>>;

// Type for a single navigation item (e.g., a direct link)
interface NavLinkItem {
  label: string;
  basePath: string; // The base path for the link
  icon: IconType;   // React icon component (e.g., FiHome)
  onClick?: () => void; // Optional click handler for mobile menu links
}

// Type for a collapsible navigation category with sub-items
interface NavCategory {
  label: string;
  icon: IconType;
  subItems: NavLinkItem[];
}

interface AppLayoutProps {
  children: ReactNode;
  navItems: NavCategory[]; // Array of navigation categories for the sidebar
  themeColor?: string; // e.g., 'indigo', 'blue', 'emerald' - used for dynamic styling
}

export default function AppLayout({
  children,
  navItems,
  themeColor = 'indigo', // Default theme color
}: AppLayoutProps) {
  const currentPath = usePathname();
  const { user: userAuth, logout } = useAuthStore();
  const router = useRouter();
  const { buildLink } = useContextualLink();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeFlyoutLabel, setActiveFlyoutLabel] = useState<string | null>(null);
  const [flyoutPosition, setFlyoutPosition] = useState<{ top: number; left: number } | null>(null);
  const [currentFlyoutTriggerRef, setCurrentFlyoutTriggerRef] = useState<RefObject<HTMLElement> | null>(null);

  const isSystemAdmin = userAuth?.roles.includes(Roles.SYSTEM_ADMIN);
  const isTenantAdmin = userAuth?.roles.includes(Roles.TENANT_ADMIN);
  const isLeagueAdmin = userAuth?.roles.includes(Roles.LEAGUE_ADMIN);
  const isTeamAdmin   = userAuth?.roles.includes(Roles.TEAM_ADMIN);
  const isPlayer      = userAuth?.roles.includes(Roles.PLAYER);
  const isCoach       = userAuth?.roles.includes(Roles.COACH);
  const isReferee     = userAuth?.roles.includes(Roles.REFEREE);

  // dashboard link based on user roles
  const dashboard = isSystemAdmin ? { label: "Retour au Systeme", link: '/admin/dashboard' }:
                    isTenantAdmin ? { label: "Retour a l'Organisation", link: '/tenant/dashboard' } :
                    isLeagueAdmin ? { label: "Retour a la ligue", link: '/league/dashboard' } :
                    isTeamAdmin   ? { label: "Retour a l'equipe", link: '/team/dashboard' } :
                    isPlayer      ? { label: "Profil athlete", link: '/player/dashboard'} :
                    isCoach       ? { label: "Profil coach", link: '/coach/dashboard' }:
                    isReferee     ? { label: "Profil Arbitre", link: '/referee/dashboard'} :
                                    {label: "Tableau de bord", link: '/account/dashboard'}; // Default fallback
  const shouldShowSidebar = useSidebarEligibility(); // Assuming this hook determines if a sidebar is relevant for the current user/page
  const shouldShowDashboardLink = useDashboardLinkEligibillity(userAuth?.roles, currentPath);
  
  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const handleFlyoutToggle = (label: string, targetElement: HTMLElement) => {
    if (activeFlyoutLabel === label || label === "") {
      setActiveFlyoutLabel(null);
      setFlyoutPosition(null);
      setCurrentFlyoutTriggerRef(null);
    } else {
      const rect = targetElement.getBoundingClientRect();
      setActiveFlyoutLabel(label);
      setFlyoutPosition({
        top: rect.top,
        left: rect.left + rect.width + 2 // Add small gap
      });
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

  // Determine the theme class to apply to the main container
  const themeClass = `${themeColor}-theme`; // e.g., "emerald-theme"

  return (
    <div className={`flex flex-col h-screen bg-gray-100 ${themeClass}`}
         style={{
         ["--hover-bg" as string]: `var(--color-${themeColor}-50)`,
         ["--hover-text" as string]: `var(--color-${themeColor}-600)`,
         ["--color-theme" as string]: `var(--color-${themeColor}-600)`,
         ["--color-theme-light-from" as string]: `color-mix(in srgb, var(--color-${themeColor}-100) 25%, white)`,
         ["--color-theme-light-to" as string]: `color-mix(in srgb, var(--color-${themeColor}-50) 50%, white)`,
         ["--color-theme-hover-from" as string]: `color-mix(in srgb, var(--color-${themeColor}-100) 40%, white)`,
         ["--color-theme-hover-to" as string]: `color-mix(in srgb, var(--color-${themeColor}-200) 60%, white)`,
         ["--color-theme-hover-text" as string]: `var(--color-${themeColor}-700)`,
       }}>
      {/* Navbar is always visible */}
      <AppLayoutHeader onMobileMenuToggle={toggleMobileMenu} handleLogout={handleLogout}/>
      <div className='flex flex-1 overflow-hidden'> {/* This flex container holds sidebar and main content */}
        {/* Sidebar (desktop) */}
        {shouldShowSidebar 
          && (
              <aside className={`bg-white shadow-lg transition-all duration-300 ease-in-out hidden md:flex flex-col sticky top-16 h-[calc(100vh-4rem)]
                                ${isSidebarOpen ? "w-64" : "w-20"}`}>
                {shouldShowDashboardLink && (
                  <div className={`flex items-center p-2 border-b border-gray-200 ${isSidebarOpen ? "justify-start" : "justify-center"}`}>
                    {/* Logo and Title in Desktop Sidebar (Only shows when open) */}
                      <Link href={buildLink(dashboard.link)} className="flex items-center" onClick={closeFlyout}>
                        <div className={`p-2`}>
                          <ChevronLeft className="h-5 w-5 text-slate-400 font-bold" />
                        </div>
                        {isSidebarOpen && (<span className="text-sm text-slate-500 nav-hover">{dashboard.label}</span>)}
                      </Link>
                    {/* The space will be empty when collapsed, but the button is gone */}
                  </div>
                )}
                <nav className="flex-grow p-2 space-y-1 overflow-y-auto">
                  {navItems.map(category => (
                    <CollapsibleNavLink
                      key={category.label}
                      category={category}
                      currentPath={currentPath}
                      isSidebarOpen={isSidebarOpen}
                      onFlyoutToggle={handleFlyoutToggle}
                      activeFlyoutLabel={activeFlyoutLabel}
                      themeColor={themeColor}
                      buildLink={buildLink}
                    />
                  ))}
                  <div className="mt-auto pt-4 border-t border-gray-200">

                    <NavLink
                      item={{ label: "My Profile", basePath: "/account/profile", icon: User }}
                      buildLink={buildLink}
                      currentPath={currentPath}
                      isSidebarOpen={isSidebarOpen}
                      onClick={closeFlyout}
                      themeColor={themeColor} />
                    <NavLink
                      item={{ label: "Security", basePath: "/account/security", icon: Shield }}
                      buildLink={buildLink}
                      currentPath={currentPath}
                      isSidebarOpen={isSidebarOpen}
                      onClick={closeFlyout}
                      themeColor={themeColor} />
                      <NavLink
                      item={{ label: "Settings", basePath: "/account/settings", icon: Settings }}
                      buildLink={buildLink}
                      currentPath={currentPath}
                      isSidebarOpen={isSidebarOpen}
                      onClick={closeFlyout}
                      themeColor={themeColor} />
                    <button onClick={handleLogout} className={`flex items-center text-sm p-2 rounded-md transition-colors w-full ${isSidebarOpen ? "justify-start pl-3" : "justify-center"} text-primary-700 hover:bg-primary-100`}>
                      <FiLogOut className={`w-5 h-5 ${isSidebarOpen ? "mr-3" : ""}`} />
                      {isSidebarOpen && 'Logout'}
                    </button>
                  </div>
                </nav>
              </aside>
            )}

        {/* Mobile Sidebar (Overlay) */}
        {shouldShowSidebar && (
          <div className={`fixed inset-0 z-40 flex md:hidden ${isMobileMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"} transition-opacity duration-300 ease-in-out`}>
            <div className="fixed inset-0 bg-black/50" onClick={closeMobileMenu}></div>
            <aside className={`relative flex flex-col w-64 max-w-xs h-full bg-white shadow-xl py-4 z-50 transform transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
              {/* Mobile Sidebar Header with Close Button and Logo/Title */}
              <div className="flex items-center justify-between px-4 pb-2 border-b">
                <Link href={buildLink(dashboard.link)} className="flex items-center " onClick={closeFlyout}>
                  <div className={`p-2`}>
                    <ArrowLeft className="h-4 w-4 text-slate-400" />
                  </div>
                  <span className="text-xs font-bold text-slate-500">{dashboard.label}</span>
                </Link>
                <button onClick={closeMobileMenu} className="p-2 rounded-md text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500">
                  <FiX className="w-6 h-6" />
                </button>
              </div>
              <nav className="flex-grow p-2 space-y-1 overflow-y-auto">
                {navItems.map(category => (
                  <CollapsibleNavLink
                    key={category.label}
                    category={category}
                    currentPath={currentPath}
                    isSidebarOpen={true} // In mobile, categories always behave as if sidebar is open for accordion
                    onFlyoutToggle={() => {}} // No flyouts in mobile menu
                    activeFlyoutLabel={null}
                    onMobileLinkClick={closeMobileMenu}
                    themeColor={themeColor} // Pass theme color to your CollapsibleNavLink
                    buildLink={buildLink}
                  />
                ))}
                <div className="mt-auto pt-4 border-t border-gray-200">
                  <NavLink
                    item={{ label: "Settings", basePath: "/account/settings", icon: FiUser }}
                    buildLink={buildLink} currentPath={currentPath}
                    isSidebarOpen={true} onClick={closeMobileMenu}
                    themeColor={themeColor}
                  />
                  <NavLink
                    item={{ label: "My Profile", basePath: "/account/profile", icon: FiUser }}
                    buildLink={buildLink} currentPath={currentPath}
                    isSidebarOpen={true} onClick={closeMobileMenu}
                    themeColor={themeColor}
                  />
                  <NavLink
                    item={{ label: "Security", basePath: "/account/security", icon: FiShield }}
                    buildLink={buildLink}
                    currentPath={currentPath}
                    isSidebarOpen={true}
                    onClick={closeMobileMenu}
                    themeColor={themeColor}
                  />
                  <button onClick={handleLogout} className="flex items-center text-sm p-2 rounded-md transition-colors w-full justify-start pl-3 text-primary-700 hover:bg-primary-100">
                    <FiLogOut className="w-5 h-5 mr-3" />
                    Logout
                  </button>
                </div>
              </nav>
            </aside>
          </div>
        )}

        {shouldShowSidebar && (
          <button
            onClick={toggleSidebar}
            className={`
              hidden md:flex items-center justify-center w-6 h-6 z-30
              font-bold text-slate-400 hover:text-slate-700 transition-all duration-300 ease-in-out
              bg-transparent cursor-pointer absolute
            `}
            style={{
              // Position it vertically centered on the screen,
              // and horizontally right next to the sidebar's edge.
              top: 'calc(50% + 2rem)', // + 2rem to account for the fixed Navbar (4rem) / 2
              left: isSidebarOpen ? '16rem' : '5rem', // 16rem = w-64, 5rem = w-20
              transform: 'translateY(-50%)',
            }}
            aria-label={isSidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            {isSidebarOpen ? (
              <ChevronLeft className="w-6 h-6" />
            ) : (
              <ChevronRight className="w-6 h-6" /> // You need to import ArrowRight from 'lucide-react'
            )}
          </button>
        )}

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Main content area no longer has its own header, as AppLayoutNavbar handles it */}
          <main className="flex-1 p-6 overflow-y-auto bg-gray-50">
            {children}
          </main>
        </div>

        {/* Flyout (collapsed sidebar) */}
        {activeFlyoutLabel && !isSidebarOpen && flyoutPosition && (
          <FlyoutMenu
            items={navItems.find(cat => cat.label === activeFlyoutLabel)?.subItems || []}
            position={flyoutPosition}
            currentPath={currentPath}
            onClose={closeFlyout}
            onLinkClick={closeFlyout}
            triggerRef={currentFlyoutTriggerRef}
            themeColor={themeColor}
            buildLink={buildLink}
          />
        )}
      </div>
    </div>
  );
}
