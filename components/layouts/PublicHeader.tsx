// components/layouts/PublicHeader.tsx
"use client";

import Link from 'next/link';
import React, { useState, useEffect } from 'react';
import { useTheme } from '@/components/providers/ThemeProvider';
import { FiSun, FiMoon, FiSearch, FiAward, FiUser, FiChevronDown } from 'react-icons/fi';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store'; // Assuming this path
// Import lucide-react icons for sport types
import {  Volleyball, Trophy, Home, Users, Newspaper, ListOrdered} from 'lucide-react';
import { Roles, SportType } from '@/schemas';
import Image from 'next/image';
import UserAvatar from '../users/user-avatar';

const hrefIconMap: Record<string, React.ElementType> = {
  '/': Home,
  '/games': Trophy, // Gets overridden dynamically
  '/tenants': Users,
  '/news': Newspaper,
  '/standings': ListOrdered,
  '/teams': Users,
};

const extendNavLinksWithIcons = (
  navLinks: NavLink[],
  sportType: SportType
): (NavLink & { icon?: React.ElementType })[] => {
  return navLinks.map(({ label, href }) => {
    const icon =
      href === '/games'
        ? getSportIcon(sportType)
        : hrefIconMap[href] || undefined;
    return { label, href, icon };
  });
};


// Define the props interface for PublicHeader
interface NavLink {
  label: string;
  href: string;
}

interface PublicHeaderProps {
  logoUrl?: string; // URL for the branding logo
  appName?: string; // Default app name
  tenantName?: string; // Tenant-specific name, overrides appName if provided
  sportType?: SportType;
  navLinks?: NavLink[]; // Array of navigation links
  primaryColor?: string; // Tailwind color class for primary branding, e.g., 'indigo-600'
  secondaryColor?: string; // Tailwind color class for secondary branding, e.g., 'indigo-400'
  onSearch?: () => void; // Function to call when search button is clicked
}

// Helper function to get sport-specific icon from lucide-react
const getSportIcon = (sportType: PublicHeaderProps['sportType']) => {
  switch (sportType) {
    case SportType.FOOTBALL:
      return Volleyball;
    case SportType.BASKETBALL:
      return Volleyball;
    case SportType.VOLLEYBALL:
      return Volleyball;
    case SportType.TENNIS:
      return Volleyball;
    case SportType.RUGBY:
      return Volleyball;
    default:
      return Trophy; // Default trophy icon for general sports or if type not matched
  }
};

// Default navigation links with their corresponding lucide-react icons
const defaultNavLinks: NavLink[] = [
  { label: 'Accueil', href: '/' },
  { label: 'Matchs', href: '/games' }, // This icon will be dynamically updated
  { label: 'Organisations', href: '/tenants' },
  { label: 'Actualites', href: '/news' }
];

export const PublicHeader = ({
  logoUrl = 'https://placehold.co/40x40/4F46E5/FFFFFF?text=Logo', // Default placeholder logo
  appName = 'ELENEM', // Default application name
  tenantName, // Optional tenant name
  sportType = SportType.FOOTBALL,
  navLinks = defaultNavLinks, // Default navigation links
  primaryColor = 'indigo-600', // Default primary color
  secondaryColor = 'indigo-400', // Default secondary color
  onSearch, // Optional search handler
}: PublicHeaderProps) => {
  const { theme, toggleTheme } = useTheme(); // Hook for theme toggling
  const pathname = usePathname(); // Hook to get current path for active link styling
  const { user: userAuth, logout, fetchUser } = useAuthStore(); // Auth store for user data and actions
  const [dropdownOpen, setDropdownOpen] = useState(false); // State for user dropdown menu

  // Fetch user data on component mount if not already available
  useEffect(() => {
    if (!userAuth) {
      fetchUser();
    }
  }, [userAuth, fetchUser]);

  // Determine user roles for dashboard access
  const isSystemAdmin = userAuth?.roles?.includes(Roles.SYSTEM_ADMIN);
  const isTenantAdmin = userAuth?.roles?.includes(Roles.TENANT_ADMIN);
  const isLeagueAdmin = userAuth?.roles?.includes(Roles.LEAGUE_ADMIN);
  const isTeamAdmin = userAuth?.roles?.includes(Roles.TEAM_ADMIN);
  const isPlayer = userAuth?.roles?.includes(Roles.PLAYER);
  const isCoach = userAuth?.roles?.includes(Roles.COACH);
  const isReferee = userAuth?.roles?.includes(Roles.REFEREE);

  // Check if the user has any management-related role
  const isManagementUser = isSystemAdmin || isTenantAdmin || isLeagueAdmin || isTeamAdmin || isPlayer || isCoach || isReferee;

  // Determine the appropriate dashboard link based on user's highest role
  const dashboardLink = isSystemAdmin ? '/admin/dashboard' :
    isTenantAdmin ? '/tenant/dashboard' :
    isLeagueAdmin ? '/league/dashboard' :
    isTeamAdmin ? '/team/dashboard' :
    isPlayer ? '/player/dashboard' :
    isCoach ? '/coach/dashboard' :
    isReferee ? '/referee/dashboard' :
    '/'; // Fallback for non-management users (though button won't show)

  // Update the 'Matchs' navLink with the correct sport icon based on sportType prop
  const updatedNavLinks = extendNavLinksWithIcons(navLinks, sportType);


  return (
    <>
      {/* Main Header Section */}
      <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/80 backdrop-blur-lg dark:border-gray-800 dark:bg-gray-900/80">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Branding Section (Left) */}
            <div className="flex items-center">
              <Link href="/" className="flex items-center space-x-2">
                {/* Logo with dynamic background gradient and fallback icon */}
                <div className={`rounded-lg p-2 text-white bg-gradient-to-br from-${primaryColor} to-${secondaryColor}`}>
                    <UserAvatar
                          src={userAuth?.profileImageUrl}
                          alt={`${userAuth?.firstName} ${userAuth?.lastName} Profile`}
                          fallbackText={userAuth?.username.charAt(0) || "Logo"}
                        />
                  {/* Fallback icon, initially hidden */}
                  <FiAward className={`h-6 w-6 ${logoUrl ? 'hidden' : 'block'}`} />
                </div>
                {/* App or Tenant Name */}
                <span className={`text-xl font-bold text-${primaryColor} dark:text-${secondaryColor}`}>{tenantName || appName}</span>
              </Link>
            </div>

            {/* Desktop Navigation (Middle) - Hidden on smaller screens */}
            <nav className="hidden lg:flex lg:ml-10 lg:space-x-8 flex-grow justify-center">
              {updatedNavLinks.map((link) => {
                const IconComponent = link.icon;
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.label}
                    href={link.href}
                    className={`flex flex-col items-center justify-center p-2 rounded-md transition-all duration-200
                      ${isActive ? `text-${primaryColor} dark:text-${secondaryColor} bg-gray-100 dark:bg-gray-800` : 'text-gray-600 dark:text-gray-300'}
                      hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-${primaryColor} dark:hover:text-${secondaryColor}`}
                  >
                    {IconComponent && <IconComponent className="h-6 w-6 mb-1" />} {/* Icon on top */}
                    <span className="text-xs font-medium">{link.label}</span> {/* Text at bottom */}
                  </Link>
                );
              })}
            </nav>

            {/* Right Section: Search, Theme Toggle, User/Auth Controls */}
            <div className="flex items-center space-x-2 sm:space-x-4">
              {/* Search Button */}
              {onSearch && (
                <button
                  onClick={onSearch}
                  className="rounded-full p-2 text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                  aria-label="Search"
                >
                  <FiSearch className="h-5 w-5" />
                </button>
              )}

              {/* Theme Toggle Button */}
              <button
                onClick={toggleTheme}
                className="rounded-full p-2 text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                aria-label="Toggle theme"
                hidden
              >
                {theme === 'light' ? <FiMoon className="h-5 w-5" /> : <FiSun className="h-5 w-5" />}
              </button>

              {/* User Authentication Section */}
              {userAuth ? (
                // If user is logged in
                <div className="relative">
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center space-x-2 rounded-full p-2 text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 focus:outline-none"
                    aria-haspopup="true"
                    aria-expanded={dropdownOpen ? 'true' : 'false'}
                  >
                    {/* User Profile Image or Generic Icon */}
                    {userAuth.profileImageUrl ? (
                      <Image
                        src={logoUrl}
                        alt="Logo"
                        width={24}
                        height={24}
                        className="h-6 w-6 rounded-md object-contain"
                        onError={(e) => {
                          // Hide image and show fallback icon if image fails to load
                          (e.target as HTMLImageElement).style.display = 'none';
                          const fallbackIcon = (e.target as HTMLImageElement).nextElementSibling as HTMLElement;
                          if (fallbackIcon) fallbackIcon.style.display = 'block';
                        }}
                      />
                    ) : (
                      <FiUser className="h-8 w-8 rounded-full border border-gray-300 p-1" />
                    )}
                    {/* Username (hidden on small screens) */}
                    <span className="hidden md:block text-sm font-medium">{userAuth.username || userAuth.email}</span>
                    {/* Dropdown arrow for management users (hidden on small screens) */}
                    {isManagementUser && <FiChevronDown className="h-4 w-4 hidden md:block" />}
                  </button>

                  {/* Dropdown Menu for Management Users */}
                  {dropdownOpen && isManagementUser && (
                    <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 dark:bg-gray-700 z-10">
                      <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="user-menu-button">
                        <Link href={dashboardLink} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-600" role="menuitem">
                          Admin Dashboard
                        </Link>
                        <Link href="/my-account/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-600" role="menuitem">
                          My Account
                        </Link>
                        <button onClick={logout} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-600" role="menuitem">
                          Logout
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                // If user is not logged in, show Login/Register buttons (hidden on extra small screens)
                <div className="hidden sm:flex items-center space-x-4">
                  <Link href="/login" className={`text-sm font-medium text-gray-600 hover:text-${primaryColor} dark:text-gray-300 dark:hover:text-${secondaryColor}`}>
                    Login
                  </Link>
                  <Link href="/register" className={`rounded-md bg-${primaryColor} px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-${primaryColor.replace('-600', '-700')}`}>
                    Register
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Bottom Navigation for Mobile Devices (lg and below) */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 dark:bg-gray-900 dark:border-gray-800 lg:hidden">
        <div className="flex justify-around items-center h-16">
          {updatedNavLinks.map((link) => {
            const IconComponent = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={`bottom-${link.label}`}
                href={link.href}
                className={`flex flex-col items-center justify-center p-2 rounded-md transition-colors duration-200
                  ${isActive ? `text-${primaryColor} dark:text-${secondaryColor}` : 'text-gray-600 dark:text-gray-300'}
                  hover:text-${primaryColor} dark:hover:text-${secondaryColor}`}
              >
                {IconComponent && <IconComponent className="h-6 w-6" />}
                <span className="text-xs font-medium mt-1">{link.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
};