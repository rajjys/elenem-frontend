'use client'

import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/'
import Link from 'next/link'
import Image from 'next/image'
import { useAuthStore } from '@/store/auth.store'
import { useEffect, useState, useRef } from 'react'
import { FiUser } from 'react-icons/fi'
import UserDropdown from './user-dropdown'

interface AppLayoutNavbarProps {
  logoUrl?: string;
  onMobileMenuToggle: () => void;
  handleLogout: () => void;
}

export function AppLayoutHeader({
  logoUrl = "/logos/elenem-sport.png",
  onMobileMenuToggle,
  handleLogout,
}: AppLayoutNavbarProps) {
  const { user: userAuth, fetchUser } = useAuthStore();
  const [loadingUser, setLoadingUser] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        await fetchUser();
      } finally {
        setLoadingUser(false);
      }
    };
    if (!userAuth) loadUser();
    else setLoadingUser(false);
  }, [userAuth, fetchUser]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen) document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [dropdownOpen]);

  return (
    <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-2 sm:px-6 md:px-12 sticky top-0 z-30">
      {/* Left Section */}
      <div className="flex items-center gap-4">
        {/* Mobile menu toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onMobileMenuToggle}
          className="md:hidden nav-hover p-2 rounded-md"
        >
          <Menu className="h-6 w-6" />
        </Button>

        <Link href="/" className="flex items-center gap-3">
          <Image
            src={logoUrl}
            alt="Elenem"
            width={120}
            height={48}
            className="object-contain"
          />
        </Link>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-2">
        {loadingUser ? (
          <Skeleton className="h-10 w-10 rounded-full" />
        ) : userAuth ? (
          // Use the new reusable UserDropdown
          <UserDropdown />
        ) : (
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-gray-200 nav-hover transition-all duration-150"
          >
            <FiUser className="w-5 h-5 p-1 rounded-full border border-gray-200" />
            <span className="hidden sm:inline text-sm font-semibold">
              Se connecter
            </span>
          </Link>
        )}
      </div>
    </header>
  )
}
