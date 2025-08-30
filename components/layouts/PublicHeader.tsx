// components/layouts/PublicHeader.tsx
"use client";

import Link from 'next/link';
import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '@/components/providers/ThemeProvider';
import { FiSun, FiMoon, FiSearch, FiUser, FiChevronDown } from 'react-icons/fi';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
// Import lucide-react icons for sport types
import {  Volleyball, Trophy, Home, Users, Newspaper, ListOrdered, LayoutDashboard, User, Shield, Settings, LogOut, Goal} from 'lucide-react';
import {
  TennisBallIcon,
  BasketballIcon,
  SoccerBallIcon,
} from '@phosphor-icons/react';
import { Roles, SportType } from '@/schemas';
import Image from 'next/image';
import { Skeleton } from '../ui';

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
      return SoccerBallIcon; // Phosphor's accurate football icon
    case SportType.BASKETBALL:
      return BasketballIcon; // Phosphor's basketball icon
    case SportType.VOLLEYBALL:
      return Volleyball; // Lucide volleyball
    case SportType.TENNIS:
      return TennisBallIcon; // Phosphor tennis ball
    case SportType.RUGBY:
      return Goal
    default:
      return SoccerBallIcon; // Lucide trophy as fallback
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
  //appName = 'ELENEM', // Default application name
  //tenantName, // Optional tenant name
  sportType = SportType.FOOTBALL,
  navLinks = defaultNavLinks, // Default navigation links
  primaryColor = 'blue', // Default primary color
  //secondaryColor = 'orange', // Default secondary color
  onSearch, // Optional search handler
}: PublicHeaderProps) => {
  const { theme, toggleTheme } = useTheme(); // Hook for theme toggling
  const pathname = usePathname(); // Hook to get current path for active link styling
  const { user: userAuth, logout, fetchUser } = useAuthStore(); // Auth store for user data and actions
  const router = useRouter();
  const [loadingUser, setLoadingUser] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false); // State for user dropdown menu
  const dropdownRef = useRef<HTMLDivElement>(null);
  // Fetch user data on component mount if not already available
  useEffect(() => {
  const loadUser = async () => {
    try {
      await fetchUser(); // your store will update `userAuth`
    } finally {
      setLoadingUser(false);
    }
  };

  if (userAuth === undefined || userAuth === null) {
    loadUser();
  } else {
    setLoadingUser(false);
  }
}, [userAuth, fetchUser]);
  // Close dropdown menu on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };

    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownOpen]);

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
  const handleLogout = () => {
    logout();
    router.push('/');
  };
  return (
    <>
      {/* Main Header Section */}
      <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/80 backdrop-blur-lg">
          <div className="flex h-14 md:h-16 items-center justify-between mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {/* Branding Section (Left) */}
            <div className="flex items-center">
              <Link href="/" className="flex items-center space-x-2">
                <Image
                  src='/logos/elenem-sport.png'
                  alt='Elenem Logo'
                  width={120}
                  height={70}
                  //fallbackText={userAuth?.username.charAt(0) || "Logo"}
                />
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
                    className={`flex flex-col items-center justify-center p-2 rounded-md transition-all ease-in-out duration-300
                      ${isActive ? `text-${primaryColor}-700 bg-${primaryColor}-100 font-bold` : 'text-gray-600'}
                      hover:bg-${primaryColor}-100  hover:text-${primaryColor}-700`}
                  >
                    {IconComponent && <IconComponent className="h-6 w-6 mb-1" />} {/* Icon on top */}
                    <span className="text-xs">{link.label}</span> {/* Text at bottom */}
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
                  className="rounded-full p-2 text-gray-600 transition-colors hover:bg-gray-100"
                  aria-label="Search"
                >
                  <FiSearch className="h-5 w-5" />
                </button>
              )}

              {/* Theme Toggle Button */}
              <button
                onClick={toggleTheme}
                className="rounded-full p-2 text-gray-600 transition-colors hover:bg-gray-100"
                aria-label="Toggle theme"
                hidden
              >
                {theme === 'light' ? <FiMoon className="h-5 w-5" /> : <FiSun className="h-5 w-5" />}
              </button>

              {/* User Authentication Section */}
              {loadingUser ? (
                // ⏳ Skeleton while fetching
                <div className="flex items-center space-x-2">
                  <Skeleton className="h-10 w-10 rounded-full" />   {/* avatar placeholder */}
                  <Skeleton className="hidden md:block h-6 w-32 rounded" /> {/* username placeholder */}
                </div>
              ) : 
               userAuth ? (
                // If user is logged in
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center space-x-2 rounded-full p-2 text-gray-600 transition-colors hover:bg-gray-100 focus:outline-none"
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
                    {<FiChevronDown className="h-4 w-4 hidden md:block" />}
                  </button>

                  {/* Dropdown Menu for Management Users */}
                  {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                      <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="user-menu-button">
                        {isManagementUser && 
                        <Link href={dashboardLink} onClick={() => setDropdownOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" role="menuitem">
                          <LayoutDashboard className="w-4 h-4" />
                          <span className="truncate">Tableau de Bord</span>
                        </Link>
                        }
                        <Link href="/account/dashboard" onClick={() => setDropdownOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" role="menuitem">
                          <User className="w-4 h-4" />
                          <span className="truncate">Mon Espace</span>
                        </Link>
                        <Link href="/account/security" onClick={() => setDropdownOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" role="menuitem">
                          <Shield className="w-4 h-4" />
                          <span className="truncate">Securite</span>
                        </Link>
                        <Link href="/account/settings" onClick={() => setDropdownOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" role="menuitem">
                          <Settings className="w-4 h-4" />
                          <span className="truncate">Parametres</span>
                        </Link>
                        <button onClick={handleLogout} className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" role="menuitem">
                          <LogOut className="w-4 h-4" />
                          <span className="truncate">Deconnexion</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                // If user is not logged in, show Login/Register buttons (hidden on extra small screens)
                
                  <Link href='/login' 
                        className={`inline-flex items-center justify-center md:space-x-2 md:px-4 md:py-2 font-bold text-${primaryColor}-700 
                                    bg-transparent rounded-full shadow-sm hover:bg-${primaryColor}-100 
                                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition ease-in-out duration-300`}>
                    <FiUser className="h-7 w-7 p-1 border border-blue-200 rounded-full" />
                    <span className='hidden md:inline text-sm'>Se Connecter</span>
                  </Link>
              )}
            </div>
          </div>
      </header>

      {/* Bottom Navigation for Mobile Devices (lg and below) */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 lg:hidden">
        <div className="flex justify-around items-center h-16">
          {updatedNavLinks.map((link) => {
            const IconComponent = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={`bottom-${link.label}`}
                href={link.href}
                className={`flex flex-col items-center justify-center p-2 rounded-md transition-colors duration-200
                  ${isActive ? `text-${primaryColor}-700` : 'text-gray-600'}
                  hover:text-${primaryColor}-700`}
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