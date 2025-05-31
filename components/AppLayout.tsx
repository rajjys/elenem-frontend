// components/AppLayout.tsx
"use client";
import Link from 'next/link';
import { useAuthStore } from '@/store/auth.store';
import { useRouter, usePathname } from 'next/navigation';
import { ReactNode } from 'react';
import { Role } from '@/prisma';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  const getDashboardLink = () => {
    if (!user) return "/login"; // Should not happen if layout is protected
    switch (user.role as Role) { // Cast user.role to Role
      case Role.SYSTEM_ADMIN:
        return "/admin/dashboard"; // System Admins have their own specific dashboard
      case Role.LEAGUE_ADMIN:
        return "/dashboard/league"; // Example path
      case Role.TEAM_ADMIN:
        return "/dashboard/team";   // Example path
      // Add cases for PLAYER, REFEREE if they have dashboards
      default:
        return "/dashboard/user";   // Fallback for GENERAL_USER or simple dashboard
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="font-bold text-xl text-indigo-600">
                ELENEM
              </Link>
              {/* Navigation for authenticated users */}
              {user && (<div className="hidden md:block">
                <div className="ml-10 flex items-baseline space-x-4">
                  <Link href={getDashboardLink()} className="text-gray-700 hover:bg-gray-200 hover:text-black px-3 py-2 rounded-md text-sm font-medium">
                    My Dashboard
                  </Link>
                  <Link href="/account/profile" className="text-gray-700 hover:bg-gray-200 hover:text-black px-3 py-2 rounded-md text-sm font-medium">
                    My Profile
                  </Link>
                  <Link href="/account/security" className="text-gray-700 hover:bg-gray-200 hover:text-black px-3 py-2 rounded-md text-sm font-medium">
                    Security
                  </Link>
                  {/* Add other links for general users if applicable */}
                </div>
              </div>)}
            </div>
            <div className="hidden md:block">
              <div className="ml-4 flex items-center md:ml-6">
                {user ? (
                  <>
                    <span className="text-gray-700 mr-3 text-sm">
                      Hi, {user.firstName || user.username}!
                    </span>
                    <button
                      onClick={handleLogout}
                      className="bg-indigo-600 text-white hover:bg-indigo-700 px-3 py-2 rounded-md text-sm font-medium"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  pathname !== "/login" && 
                  <Link href="/login" className="text-gray-700 hover:text-black px-3 py-2 rounded-md text-sm font-medium">
                    Login
                  </Link>
                )}
              </div>
            </div>
            {/* Mobile menu button (implement if needed) */}
          </div>
        </div>
      </nav>
      <main>
        <div className=''>
          {children}
        </div>
      </main>
    </div>
  );
}
