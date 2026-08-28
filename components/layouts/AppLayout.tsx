'use client'
import React, { useState, ReactNode, RefObject } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { FiLogOut, FiX } from 'react-icons/fi';
import { useAuthStore } from '@/store/auth.store'; // Assuming this path is correct
// Import your existing components. Replace these with your actual paths.
import { NavLink } from '.';
import { SidebarBrand } from './sidebar-brand';
import type { NavGroup } from './nav-items';
import { SidebarUserMenu } from './sidebar-user-menu';
import { useContextualLink, useDashboardLinkEligibillity, useSidebarEligibility } from '@/hooks';
import { Roles } from '@/schemas'; // Assuming Role enum is here
import { AppLayoutHeader } from './AppLayoutHeader'; // Import the updated Navbar
import { ArrowLeft } from 'lucide-react';

// Type for a React Icon component
type IconType = React.ComponentType<React.SVGProps<SVGSVGElement>>;

// Type for a single navigation item (e.g., a direct link)
interface NavLinkItem {
  label: string;
  basePath: string; // The base path for the link
  icon: IconType;   // React icon component (e.g., FiHome)
  onClick?: () => void; // Optional click handler for mobile menu links
}

interface AppLayoutProps {
  children: ReactNode;
  /** Silent groups: a hairline and a quiet caption, never a collapsible. */
  navItems: NavGroup[];
  /** Retained so existing call sites keep compiling; the product has one accent now. */
  themeColor?: string;
}


/**
 * One silent group. The caption is deliberately quiet — it separates concerns without asking to
 * be read, and disappears entirely when the sidebar is collapsed to icons, where a hairline does
 * the same job in less space.
 */
function SidebarGroup({
  group,
  isFirst,
  currentPath,
  isSidebarOpen,
  buildLink,
  onItemClick,
}: {
  group: NavGroup;
  isFirst: boolean;
  currentPath: string;
  isSidebarOpen: boolean;
  buildLink: (basePath: string) => string;
  onItemClick?: () => void;
}) {
  return (
    <div className={isFirst ? 'flex flex-col gap-1' : 'mt-4 flex flex-col gap-1 border-t border-line pt-4'}>
      {group.label && isSidebarOpen && (
        <p className="px-3 pb-1 text-[11px] font-medium uppercase tracking-wider text-ink-subtle">
          {group.label}
        </p>
      )}
      {group.items.map((item) => (
        <NavLink
          key={item.basePath}
          item={item}
          currentPath={currentPath}
          isSidebarOpen={isSidebarOpen}
          onClick={onItemClick}
          buildLink={buildLink}
        />
      ))}
    </div>
  );
}

export default function AppLayout({ children, navItems }: AppLayoutProps) {
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

  // The per-role accent (`admin`=indigo, `league`=purple …) is gone: the app has one identity,
  // and it now comes from the token layer, which also resolves light and dark. These variables
  // stay only to feed the legacy `.nav-hover` / `.soft-theme-gradient` rules in globals.css —
  // they read tokens now rather than a palette shade, so nav hover follows the theme.
  return (
    <div
      className="flex h-screen flex-col overflow-hidden bg-canvas"
      style={{
        ['--hover-bg' as string]: 'var(--t-accent-soft)',
        ['--hover-text' as string]: 'var(--t-accent-text)',
        ['--color-theme' as string]: 'var(--t-accent-text)',
        ['--color-theme-light-from' as string]: 'var(--t-surface)',
        ['--color-theme-light-to' as string]: 'var(--t-surface-sunk)',
        ['--color-theme-hover-from' as string]: 'var(--t-accent-soft)',
        ['--color-theme-hover-to' as string]: 'var(--t-accent-soft)',
        ['--color-theme-hover-text' as string]: 'var(--t-accent)',
      }}
    >
      <div className="flex min-h-0 flex-1 overflow-hidden">
        {/* Sidebar (desktop). It starts at the top of the viewport rather than under the navbar:
            it is the permanent frame, and it owns the brand. */}
        {shouldShowSidebar
          && (
              <aside className={`hidden h-full shrink-0 flex-col border-r border-line bg-surface transition-[width] duration-200 ease-in-out md:flex
                                ${isSidebarOpen ? "w-64" : "w-20"}`}>
                {/* The brand is deliberately not contextual: it is the way home to your own
                    dashboard, not a link deeper into whatever you have drilled into. */}
                <SidebarBrand
                  isOpen={isSidebarOpen}
                  onToggle={toggleSidebar}
                  href={dashboard.link}
                />
                <nav className="flex flex-1 flex-col overflow-y-auto p-2">
                  {navItems.map((group, gi) => (
                    <SidebarGroup
                      key={group.label ?? `group-${gi}`}
                      group={group}
                      isFirst={gi === 0}
                      currentPath={currentPath}
                      isSidebarOpen={isSidebarOpen}
                      buildLink={buildLink}
                    />
                  ))}
                </nav>
                <SidebarUserMenu
                  name={[userAuth?.firstName, userAuth?.lastName].filter(Boolean).join(' ')}
                  email={userAuth?.email}
                  isSidebarOpen={isSidebarOpen}
                  onLogout={handleLogout}
                  buildLink={buildLink}
                />
              </aside>
            )}

        {/* Mobile Sidebar (Overlay) */}
        {shouldShowSidebar && (
          <div className={`fixed inset-0 z-40 flex md:hidden ${isMobileMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"} transition-opacity duration-300 ease-in-out`}>
            <div className="fixed inset-0 bg-ink/50" onClick={closeMobileMenu}></div>
            <aside className={`relative flex flex-col w-64 max-w-xs h-full bg-surface shadow-xl py-4 z-50 transform transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
              {/* Mobile Sidebar Header with Close Button and Logo/Title */}
              <div className="flex items-center justify-between px-4 pb-2 border-b border-line">
                <Link href={buildLink(dashboard.link)} className="flex items-center " onClick={closeFlyout}>
                  <div className={`p-2`}>
                    <ArrowLeft className="h-4 w-4 text-ink-subtle" />
                  </div>
                  <span className="text-xs font-bold text-ink-muted">{dashboard.label}</span>
                </Link>
                <button onClick={closeMobileMenu} className="p-2 rounded-md text-ink-muted hover:bg-surface-sunk focus:outline-none focus:ring-2 focus:ring-inset focus:ring-accent">
                  <FiX className="w-6 h-6" />
                </button>
              </div>
              <nav className="flex flex-1 flex-col overflow-y-auto p-2">
                {navItems.map((group, gi) => (
                  <SidebarGroup
                    key={group.label ?? `group-${gi}`}
                    group={group}
                    isFirst={gi === 0}
                    currentPath={currentPath}
                    isSidebarOpen
                    onItemClick={closeMobileMenu}
                    buildLink={buildLink}
                  />
                ))}
              </nav>
              <SidebarUserMenu
                name={[userAuth?.firstName, userAuth?.lastName].filter(Boolean).join(' ')}
                email={userAuth?.email}
                isSidebarOpen
                onLogout={handleLogout}
                buildLink={buildLink}
                onNavigate={closeMobileMenu}
              />
            </aside>
          </div>
        )}

        {/* Main column: the navbar belongs to the content, not to the whole shell, so it can be
            removed later without the app losing its frame. */}
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <AppLayoutHeader onMobileMenuToggle={toggleMobileMenu} handleLogout={handleLogout} />
          <main className="flex-1 overflow-y-auto bg-canvas p-6">{children}</main>
        </div>

      </div>
    </div>
  );
}
