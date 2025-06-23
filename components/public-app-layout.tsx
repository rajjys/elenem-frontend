// components/AppLayout.tsx
"use client";
import Link from 'next/link';
import { useAuthStore } from '@/store/auth.store';
import { useRouter, usePathname } from 'next/navigation';
import { ReactNode, useEffect, useState } from 'react';
import { Role } from '@/prisma';
import { FiMenu, FiX, FiUser, FiLock, FiHome, FiLogOut, FiSettings, FiUsers, FiAward, FiShield, FiDatabase } from 'react-icons/fi';
import { verifyJWT } from '@/utils';

interface AppLayoutProps {
  children: ReactNode;
}

export function PublicAppLayout({ children }: AppLayoutProps) {
  const { user, tokens, logout } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {

    // Handle scroll effect for header
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [tokens, user, logout]);

  const getDashboardLink = () => {
    if (!user) return "/login";
    switch (user.roles[0] as Role) {
      case Role.SYSTEM_ADMIN:
        return "/admin/dashboard";
      case Role.LEAGUE_ADMIN:
        return "/dashboard/league";
      case Role.TEAM_ADMIN:
        return "/dashboard/team";
      default:
        return "/dashboard/";
    }
  };

  const navLinks = [
    { href: getDashboardLink(), label: "Dashboard", icon: <FiHome className="w-5 h-5" /> },
    { href: "/account/profile", label: "Profile", icon: <FiUser className="w-5 h-5" /> },
    { href: "/account/security", label: "Security", icon: <FiLock className="w-5 h-5" /> },
  ];

  if (user?.role === Role.LEAGUE_ADMIN && user.leagueId) {
    navLinks.push({ href: "/league/manage", label: "Manage League", icon: <FiSettings className="w-5 h-5" /> });
    navLinks.push({ href: "/league/admins", label: "Admins Page", icon: <FiShield className="w-5 h-5" /> });
  }
  if (user?.role === Role.TEAM_ADMIN && user.teamManagingId) {
    navLinks.push({ href: "/team/manage", label: "Manage Team", icon:<FiDatabase /> }); // New link for TA
  }

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const roleBadgeColor = () => {
    if (!user) return "bg-gray-200";
    switch (user.role) {
      case Role.SYSTEM_ADMIN: return "bg-red-100 text-red-800";
      case Role.LEAGUE_ADMIN: return "bg-blue-100 text-blue-800";
      case Role.TEAM_ADMIN: return "bg-green-100 text-green-800";
      case Role.REFEREE: return "bg-purple-100 text-purple-800";
      case Role.PLAYER: return "bg-yellow-100 text-yellow-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? "bg-white/90 backdrop-blur-sm shadow-md" : "bg-white"
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="flex items-center space-x-2">
                <div className="bg-indigo-600 text-white p-2 rounded-lg">
                  <FiAward className="h-6 w-6" />
                </div>
                <span className="font-bold text-xl text-indigo-700">ELENEM</span>
              </Link>
              
              {/* Desktop Navigation */}
              {user && (
                <div className="hidden md:block ml-10">
                  <div className="flex space-x-1">
                    {navLinks.map((navLink, index) => (
                      <Link 
                        href={navLink.href} 
                        key={index}
                        className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          pathname === navLink.href 
                            ? "bg-indigo-100 text-indigo-700" 
                            : "text-gray-700 hover:bg-gray-100"
                        }`}
                      >
                        {navLink.icon}
                        <span className="ml-2">{navLink.label}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className="hidden md:block">
              <div className="ml-4 flex items-center md:ml-6">
                {user ? (
                  <div className="flex items-center space-x-4">
                    <div className="flex flex-col items-end">
                      <span className="text-sm font-medium text-gray-900">
                        {user.firstName || user.username}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${roleBadgeColor()}`}>
                        {user.role?.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <div className="relative">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center text-white font-medium">
                        {user.firstName?.charAt(0) || user.username.charAt(0)}
                      </div>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="flex items-center px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors"
                    >
                      <FiLogOut className="mr-1" /> Logout
                    </button>
                  </div>
                ) : (
                  pathname !== "/login" && 
                  <Link 
                    href="/login" 
                    className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors"
                  >
                    Login
                  </Link>
                )}
              </div>
            </div>
            
            {/* Mobile menu button */}
            <div className="md:hidden flex items-center">
              {user && (
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-indigo-600 hover:bg-gray-100 focus:outline-none"
                >
                  {mobileMenuOpen ? (
                    <FiX className="block h-6 w-6" />
                  ) : (
                    <FiMenu className="block h-6 w-6" />
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
        
        {/* Mobile Navigation */}
        {mobileMenuOpen && user && (
          <div className="md:hidden bg-white border-t border-gray-200">
            <div className="pt-2 pb-3 space-y-1 px-4">
              {navLinks.map((navLink, index) => (
                <Link 
                  href={navLink.href} 
                  key={index}
                  className={`flex items-center px-3 py-2 rounded-lg text-base font-medium ${
                    pathname === navLink.href 
                      ? "bg-indigo-100 text-indigo-700" 
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {navLink.icon}
                  <span className="ml-3">{navLink.label}</span>
                </Link>
              ))}
            </div>
            <div className="pt-4 pb-3 border-t border-gray-200 px-4">
              <div className="flex items-center px-3 py-2">
                <div className="h-10 w-10 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center text-white font-medium mr-3">
                  {user.firstName?.charAt(0) || user.username.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {user.firstName || user.username}
                  </p>
                  <p className={`text-xs px-2 py-0.5 rounded-full ${roleBadgeColor()}`}>
                    {user.role?.replace(/_/g, ' ')}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  handleLogout();
                  setMobileMenuOpen(false);
                }}
                className="mt-3 w-full flex items-center justify-center px-4 py-2 rounded-lg bg-red-50 text-red-600 text-base font-medium hover:bg-red-100 transition-colors"
              >
                <FiLogOut className="mr-2" /> Logout
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="pt-20 pb-10">
        <div className="">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-4 md:mb-0">
              <div className="bg-indigo-600 text-white p-1.5 rounded-lg mr-2">
                <FiAward className="h-5 w-5" />
              </div>
              <span className="font-bold text-lg text-indigo-700">ELENEM</span>
            </div>
            
            <div className="flex flex-wrap justify-center gap-6 mb-4 md:mb-0">
              <Link href="/privacy" className="text-gray-600 hover:text-indigo-600 text-sm">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-gray-600 hover:text-indigo-600 text-sm">
                Terms of Service
              </Link>
              <Link href="/contact" className="text-gray-600 hover:text-indigo-600 text-sm">
                Contact
              </Link>
              <Link href="/help" className="text-gray-600 hover:text-indigo-600 text-sm">
                Help Center
              </Link>
            </div>
            
            <div className="text-gray-500 text-sm">
              © {new Date().getFullYear()} ELENEM. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}