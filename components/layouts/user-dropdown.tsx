// components/layouts/UserDropdown.tsx
'use client'

import React, { useState, useRef, useEffect, FC } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { LogOut, Settings, User, Shield, LayoutDashboard } from 'lucide-react';
import { FiChevronDown, FiUser } from 'react-icons/fi';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/auth.store'; // Assuming this store provides userAuth
import { Roles } from '@/schemas';
import { useRouter } from 'next/navigation';

export const UserDropdown = ({ }) => {
  const { user: userAuth, logout } = useAuthStore();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const isSystemAdmin = userAuth?.roles?.includes(Roles.SYSTEM_ADMIN);
  const isTenantAdmin = userAuth?.roles?.includes(Roles.TENANT_ADMIN);
  const isLeagueAdmin = userAuth?.roles?.includes(Roles.LEAGUE_ADMIN);
  const isTeamAdmin = userAuth?.roles?.includes(Roles.TEAM_ADMIN);
  const isPlayer = userAuth?.roles?.includes(Roles.PLAYER);
  const isCoach = userAuth?.roles?.includes(Roles.COACH);
  const isReferee = userAuth?.roles?.includes(Roles.REFEREE);
  const isManagementUser = isSystemAdmin || isTenantAdmin || isLeagueAdmin || isTeamAdmin || isPlayer || isCoach || isReferee;

  const dashboardLink = isSystemAdmin ? "/admin/dashboard"
    : isTenantAdmin ? "/tenant/dashboard"
      : isLeagueAdmin ? "/league/dashboard"
        : isTeamAdmin ? "/team/dashboard"
          : isPlayer ? "/player/dashboard"
            : isCoach ? "/coach/dashboard"
              : isReferee ? "/referee/dashboard"
                : "/account/dashboard";

  // Close dropdown on outside click
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen) document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [dropdownOpen]);

  if (!userAuth) {
    // This component assumes the user is authenticated; if not, it shouldn't render,
    // or the parent component should handle the unauthenticated state.
    return null;
  }

  const closeDropdown = () => setDropdownOpen(false);
  const handleLogout = () => {
    logout();
    router.push('/');
  };
  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="flex items-center gap-2 px-2 py-1 rounded-full border border-slate-200 bg-slate-50 nav-hover transition-all duration-150"
      >
        {userAuth.profileImageUrl ? (
          <Image
            src={userAuth.profileImageUrl}
            alt={userAuth.username}
            width={28}
            height={28}
            className="rounded-full object-cover"
          />
        ) : (
          <FiUser className="w-6 h-6 p-1 rounded-full border border-slate-200 dark:border-slate-800" />
        )}
        <span className="hidden sm:inline text-sm font-medium">
          {userAuth.username || userAuth.email}
        </span>
        <FiChevronDown className="w-4 h-4" />
      </button>

      {dropdownOpen && (
        <div className="absolute right-0 mt-2 w-52 rounded-md shadow-md bg-white dark:bg-slate-950 dark:text-gray-200 ring-1 ring-black/5 dark:ring-slate-700 z-40 animate-fadeIn">
          <div>
            {/* Common Dashboard Link */}
            {
                isManagementUser &&
                <Link
                        href={dashboardLink}
                        onClick={closeDropdown}
                        className="flex items-center gap-2 px-4 py-2 text-sm rounded-md nav-hover">
                    <LayoutDashboard className="w-4 h-4" /> Tableau de Bord
                </Link>
            }
            {/* Account Links */}
            <Link
              href="/account/dashboard"
              onClick={closeDropdown}
              className="flex items-center gap-2 px-4 py-2 text-sm rounded-md nav-hover">
              <User className="w-4 h-4" /> Mon Espace
            </Link>
            <Link
              href="/account/security"
              onClick={closeDropdown}
              className="flex items-center gap-2 px-4 py-2 text-sm rounded-md nav-hover">
              <Shield className="w-4 h-4" /> Sécurité
            </Link>
            <Link
              href="/account/settings"
              onClick={closeDropdown}
              className="flex items-center gap-2 px-4 py-2 text-sm rounded-md nav-hover">
              <Settings className="w-4 h-4" /> Paramètres
            </Link>
            {/* Logout Button */}
            <Button
              variant='danger'
              onClick={() => { handleLogout(); closeDropdown(); }}
              className="w-full flex items-center justify-start gap-2 dark:bg-red-950/20">
              <LogOut className="w-4 h-4" /> Déconnexion
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDropdown;