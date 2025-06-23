import React, { useState, ReactNode, useEffect, useRef, RefObject } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
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
} from 'react-icons/fi'; // Keep these imports as your NavLink/CollapsibleNavLink likely use them
import { useAuthStore } from '@/store/auth.store'; // Assuming this path is correct

// Import your existing components. Replace these with your actual paths.
import { CollapsibleNavLink, FlyoutMenu, NavLink } from '.'; // Adjust this import path if needed
import { useContextualLink } from '@/hooks';

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
  headerTitle?: string; // e.g., "ELENEM Admin", "My App"
  logoIcon?: IconType; // Icon component for the app logo
  showContextSwitcher?: boolean; // Conditionally show the switcher
}

export default function AppLayout({
  children,
  navItems,
  themeColor = 'indigo', // Default theme color
  headerTitle = 'ELENEM Admin', // Default app name
  logoIcon: LogoIcon = FiAward, // Default logo icon
  showContextSwitcher = false,
}: AppLayoutProps) {
  const currentPath = usePathname();
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const { buildLink } = useContextualLink();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeFlyoutLabel, setActiveFlyoutLabel] = useState<string | null>(null);
  const [flyoutPosition, setFlyoutPosition] = useState<{ top: number; left: number } | null>(null);
  const [currentFlyoutTriggerRef, setCurrentFlyoutTriggerRef] = useState<RefObject<HTMLElement> | null>(null);

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

  // Set CSS variables based on themeColor prop
  // These variables are used in inline styles below
  const primary600 = `rgb(var(--color-${themeColor}-600) / <alpha-value>)`;
  const primary700 = `rgb(var(--color-${themeColor}-700) / <alpha-value>)`;
  // primary100 is used within NavLink and CollapsibleNavLink, ensure they receive it
  // and have the necessary CSS variable setup in their own files if they don't use direct props

  return (
    <div
      className="flex h-screen bg-gray-100 overflow-hidden"
      style={{
        // Define CSS variables for dynamic theme colors.
        // These rely on your tailwind.config.js mapping primary colors to CSS variables.
        '--indigo-100': `var(--color-${themeColor}-100)`, // Example mapping, adjust to your Tailwind config
        '--indigo-600': `var(--color-${themeColor}-600)`,
        '--indigo-700': `var(--color-${themeColor}-700)`,
      } as React.CSSProperties} // Cast to allow custom CSS variables
    >
      {/* Desktop Sidebar */}
      <aside className={`bg-white shadow-lg transition-all duration-300 ease-in-out hidden md:flex flex-col sticky top-0 h-full
                         ${isSidebarOpen ? "w-64" : "w-20"}`}>
        <div className={`flex items-center p-4 border-b border-gray-200 ${isSidebarOpen ? "justify-between" : "justify-center"}`}>
          {isSidebarOpen && (
            <Link href={buildLink(navItems[0]?.subItems[0]?.basePath || '/')} className="flex items-center space-x-2" onClick={closeFlyout}>
              <div className={`p-2 rounded-lg`} style={{ backgroundColor: primary600 }}>
                <LogoIcon className="h-6 w-6 text-white" />
              </div>
              <span className="font-bold text-xl" style={{ color: primary700 }}>{headerTitle}</span>
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
              themeColor={themeColor} // Pass theme color to your CollapsibleNavLink
              buildLink={buildLink}
            />
          ))}
          {/* Account/Security links are fixed, but can be made dynamic via props if needed */}
          <div className="mt-auto pt-4 border-t border-gray-200">
            <NavLink item={{ label: "My Profile", basePath: "/account/profile", icon: FiUser }} buildLink={buildLink} currentPath={currentPath} isSidebarOpen={isSidebarOpen} onClick={closeFlyout} themeColor={themeColor} />
            <NavLink item={{ label: "Security", basePath: "/account/security", icon: FiShield }} buildLink={buildLink} currentPath={currentPath} isSidebarOpen={isSidebarOpen} onClick={closeFlyout} themeColor={themeColor} />
            <button onClick={handleLogout} className={`flex items-center text-sm text-gray-600 p-2 rounded-md transition-colors w-full ${isSidebarOpen ? "justify-start pl-3" : "justify-center"}`}>
              <FiLogOut className={`w-5 h-5 ${isSidebarOpen ? "mr-3" : ""}`} />
              {isSidebarOpen && 'Logout'}
            </button>
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
              <div className={`p-2 rounded-lg`} style={{ backgroundColor: primary600 }}>
                <LogoIcon className="h-6 w-6 text-white" />
              </div>
              <span className="font-bold text-xl" style={{ color: primary700 }}>{headerTitle}</span>
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
                themeColor={themeColor} // Pass theme color to your CollapsibleNavLink
                buildLink={buildLink} 
              />
            ))}
            {/* Account/Security links for mobile */}
            <div className="mt-auto pt-4 border-t border-gray-200">
              <NavLink item={{ label: "My Profile", basePath: "/account/profile", icon: FiUser }} buildLink={buildLink} currentPath={currentPath} isSidebarOpen={true} onClick={closeMobileMenu} themeColor={themeColor} />
              <NavLink item={{ label: "Security", basePath: "/account/security", icon: FiShield }} buildLink={buildLink} currentPath={currentPath} isSidebarOpen={true} onClick={closeMobileMenu} themeColor={themeColor} />
              <button onClick={handleLogout} className="flex items-center text-sm text-gray-600 p-2 rounded-md hover:bg-gray-100 transition-colors w-full justify-start pl-3">
                <FiLogOut className="w-5 h-5 mr-3" />
                Logout
              </button>
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
            <h1 className="text-xl font-semibold text-gray-800">Context title Here</h1>
          </div>
          {user && (
            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-700 hidden sm:inline">Welcome, {user.username}</span>
              <div className={`w-9 h-9 rounded-full text-white flex items-center justify-center text-sm font-semibold`} style={{ backgroundColor: primary600 }}>
                {user.firstName?.charAt(0).toUpperCase() || user.username?.charAt(0).toUpperCase()}
              </div>
              <button onClick={handleLogout} className={`flex items-center text-sm text-gray-600 p-2 rounded-md hover:bg-gray-100 transition-colors`} style={{ color: primary700, '--hover-text-color': primary700 } as React.CSSProperties} title="Logout">
                <FiLogOut className="w-5 h-5" />
                Logout
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
          items={navItems.find(cat => cat.label === activeFlyoutLabel)?.subItems || []}
          position={flyoutPosition}
          currentPath={currentPath}
          onClose={closeFlyout}
          onLinkClick={closeFlyout}
          triggerRef={currentFlyoutTriggerRef}
          themeColor={themeColor} // Pass theme color to your FlyoutMenu
          buildLink={buildLink} // Pass down the function
        />
      )}
    </div>
  );
}
