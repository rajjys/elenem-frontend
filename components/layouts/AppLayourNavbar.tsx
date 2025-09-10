// components/layout/AppLayoutNavbar.tsx
'use client'

import { User, LogOut, Settings, Menu, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Skeleton
} from '@/components/ui/'
import Link from 'next/link'
import Image from 'next/image'
import { useAuthStore } from '@/store/auth.store'
import { useEffect, useState, useRef } from 'react'
import { FiChevronDown, FiUser } from 'react-icons/fi'

interface AppLayoutNavbarProps {
  logoUrl?: string;
  dashboardLink: string;
  onMobileMenuToggle: () => void; // New prop for toggling mobile menu
  handleLogout: () => void;
}

export function AppLayoutNavbar({ logoUrl = "/logos/elenem-sport.png", dashboardLink, onMobileMenuToggle, handleLogout }: AppLayoutNavbarProps) {
  const { user: userAuth, fetchUser } = useAuthStore();
  const [loadingUser, setLoadingUser] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  

  useEffect(() => {
      const loadUser = async () => {
        try { await fetchUser(); } finally { setLoadingUser(false); }
      };
      if (userAuth === undefined || userAuth === null) loadUser();
      else setLoadingUser(false);
    }, [userAuth, fetchUser]);
  
    useEffect(() => {
      const onDoc = (e: MouseEvent) => {
        if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setDropdownOpen(false);
      };
      if (dropdownOpen) document.addEventListener("mousedown", onDoc);
      return () => document.removeEventListener("mousedown", onDoc);
    }, [dropdownOpen]);
    
  return (
    <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-2 sm:px-6 md:px-12 sticky top-0 z-30">
      {/* Left Section */}
      <div className="flex items-center gap-4">
        {/* Mobile menu toggle button - visible only on small screens */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onMobileMenuToggle}
          className="md:hidden" // Hide on medium and larger screens
        >
          <Menu className="h-6 w-6" />
        </Button>

        <Link href={dashboardLink} className="flex items-center gap-3">
                <Image src={logoUrl} alt="Elenem" width={120} height={48} className="object-contain" />
        </Link>
      </div>

      {/* Right area: search + login (visible on all sizes) */}
      <div className="flex items-center gap-2">
        {loadingUser ? (
          <div className="flex items-center gap-2">
            <Skeleton className="h-10 w-10 rounded-full" />
          </div>
        ) : userAuth ? (
          <div className="relative" ref={dropdownRef}>
            <button onClick={() => setDropdownOpen(!dropdownOpen)} className="flex items-center gap-2 rounded-full px-3 py-1.5 border border-gray-100 hover:bg-gray-50">
              {userAuth.profileImageUrl ? (
                <Image src={userAuth.profileImageUrl} alt={userAuth.username} width={28} height={28} className="rounded-full object-cover" />
              ) : (
                <FiUser className="w-6 h-6 p-1 rounded-full border border-gray-200" />
              )}
              <span className="hidden sm:inline text-sm font-medium">{userAuth.username || userAuth.email}</span>
              <FiChevronDown className="w-4 h-4" />
            </button>
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-52 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-40">
                <div className="py-1">
                  <Link href="/account/dashboard" onClick={() => setDropdownOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                    <User className="w-4 h-4" /> Mon Espace
                  </Link>
                  <Link href="/account/security" onClick={() => setDropdownOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                    <Shield className="w-4 h-4" /> Sécurité
                  </Link>
                  <Link href="/account/settings" onClick={() => setDropdownOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                    <Settings className="w-4 h-4" /> Paramètres
                  </Link>
                  <button onClick={handleLogout} className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                    <LogOut className="w-4 h-4" /> Déconnexion
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          // LOGIN always visible (mobile & desktop)
          <Link href="/login" className="inline-flex items-center gap-2 px-3 py-2 rounded-full border border-gray-200 hover:bg-gray-50">
            <FiUser className="w-5 h-5 p-1 rounded-full border border-gray-200" />
            <span className="hidden sm:inline text-sm font-semibold text-sky-700">Se connecter</span>
          </Link>
        )}
      </div>
    </header>
  )
}