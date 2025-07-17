import React, { useState, ReactNode, useEffect, useRef, RefObject } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {FiShield,FiUser, FiLogOut, FiMenu, FiX, FiAward} from 'react-icons/fi'; // Keep these imports as your NavLink/CollapsibleNavLink likely use them
import { useAuthStore } from '@/store/auth.store'; // Assuming this path is correct
// Import your existing components. Replace these with your actual paths.
import { CollapsibleNavLink, FlyoutMenu, NavLink } from '.'; // Adjust this import path if needed
import { useContextualLink, useSidebarEligibility } from '@/hooks';
import { Role } from '@/schemas'; // Assuming Role enum is here
import { AppLayoutNavbar } from './AppLayourNavbar'; // Import the updated Navbar

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
  headerTitle?: string; // e.g., "ELENEM Admin", "My App" (Note: Header title is now mainly in Navbar)
  logoIcon?: IconType; // Icon component for the app logo (Note: Logo is now mainly in Navbar)
  showContextSwitcher?: boolean; // Conditionally show the switcher (Note: ContextSwitcher is now in Navbar)
}

export default function AppLayout({
  children,
  navItems,
  themeColor = 'indigo', // Default theme color
  headerTitle = 'ELENEM Admin', // Default app name (used for sidebar logo if needed, but not main header)
  logoIcon: LogoIcon = FiAward, // Default logo icon (used for sidebar logo if needed)
  showContextSwitcher = false, // This prop will now be passed to AppLayoutNavbar
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

  const isSystemAdmin = userAuth?.roles.includes(Role.SYSTEM_ADMIN);
  const isTenantAdmin = userAuth?.roles.includes(Role.TENANT_ADMIN);
  const isLeagueAdmin = userAuth?.roles.includes(Role.LEAGUE_ADMIN);
  const isTeamAdmin   = userAuth?.roles.includes(Role.TEAM_ADMIN);
  const isPlayer       = userAuth?.roles.includes(Role.PLAYER);
  const isCoach        = userAuth?.roles.includes(Role.COACH);
  const isReferee      = userAuth?.roles.includes(Role.REFEREE);

  // dashboard link based on user roles
  const dashboardLink = isSystemAdmin ? '/admin/dashboard' :
                        isTenantAdmin ? '/tenant/dashboard' :
                        isLeagueAdmin ? '/league/dashboard' :
                        isTeamAdmin ? '/team/dashboard' :
                        isPlayer ? '/player/dashboard' :
                        isCoach ? '/coach/dashboard' :
                        isReferee ? '/referee/dashboard' :
                        '/dashboard'; // Default fallback

  const shouldShowSidebar = useSidebarEligibility(); // Assuming this hook determines if a sidebar is relevant for the current user/page

  const handleLogout = () => {
    logout();
    router.push('/login');
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
    <div className={`flex flex-col h-screen bg-gray-100 ${themeClass}`}>
      {/* Navbar is always visible */}
      <AppLayoutNavbar dashboardLink={dashboardLink} onMobileMenuToggle={toggleMobileMenu} />
      <div className='flex flex-1 overflow-hidden'> {/* This flex container holds sidebar and main content */}
        {/* Sidebar (desktop) */}
        {shouldShowSidebar && (
          <aside className={`bg-white shadow-lg transition-all duration-300 ease-in-out hidden md:flex flex-col sticky top-16 h-[calc(100vh-4rem)]
                            ${isSidebarOpen ? "w-64" : "w-20"}`}>
            <div className={`flex items-center p-4 border-b border-gray-200 ${isSidebarOpen ? "justify-between" : "justify-center"}`}>
              {/* Logo and Title in Desktop Sidebar */}
              {isSidebarOpen && (
                <Link href={buildLink(navItems[0]?.subItems[0]?.basePath || '/')} className="flex items-center space-x-2" onClick={closeFlyout}>
                  <div className={`p-2 rounded-lg bg-primary-600`}>
                    <LogoIcon className="h-6 w-6 text-white" />
                  </div>
                  <span className="font-bold text-xl text-primary-700">{headerTitle}</span>
                </Link>
              )}
              {/* Desktop Sidebar Toggle Button */}
              <button onClick={toggleSidebar} className="p-1.5 rounded-md text-gray-600 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500">
                {isSidebarOpen ? <FiX className="w-5 h-5" /> : <FiMenu className="w-5 h-5" />}
              </button>
            </div>

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
                  item={{ label: "My Profile", basePath: "/account/profile", icon: FiUser }}
                  buildLink={buildLink}
                  currentPath={currentPath}
                  isSidebarOpen={isSidebarOpen}
                  onClick={closeFlyout}
                  themeColor={themeColor} />
                <NavLink
                  item={{ label: "Security", basePath: "/account/security", icon: FiShield }}
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
                <Link href={buildLink(navItems[0]?.subItems[0]?.basePath || '/')} className="flex items-center space-x-2" onClick={closeMobileMenu}>
                  <div className={`p-2 rounded-lg bg-primary-600`}>
                    <LogoIcon className="h-6 w-6 text-white" />
                  </div>
                  <span className="font-bold text-xl text-primary-700">{headerTitle}</span>
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
