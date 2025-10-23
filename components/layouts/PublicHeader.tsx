// components/layouts/PublicHeader.tsx
"use client";

import Link from "next/link";
import React, { useState, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { useScrollDirection } from "@/hooks";
import { FiUser } from "react-icons/fi";
import { 
  Users,
  ShieldCheck,
  Home,
  CalendarDays
} from "lucide-react";

import { SportType } from "@/schemas";
import { useAuthStore } from "@/store/auth.store";
import { Skeleton } from "../ui";
import { AudienceToggle } from "../landing/AudienceToggle";
import UserDropdown from "./user-dropdown";

interface NavLink { label: string; href: string; }
interface PublicHeaderProps {
  logoUrl?: string;
  sportType?: SportType;
  navLinks?: NavLink[];
  primaryColor?: string;
  onSearch?: () => void;
}

export const PublicHeader = ({
  logoUrl = "/logos/elenem-sport.png",
}: PublicHeaderProps) => {
  const pathname = usePathname();
  const router = useRouter();
  const { user: userAuth, logout, fetchUser } = useAuthStore();
  const [loadingUser, setLoadingUser] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const scrollDir = useScrollDirection();

  const navLinks = [
  { label: 'Accueil', href: '/'},
  { label: 'Matchs', href: '/games'},
  { label: 'Organisations', href: '/tenants'},
  //{ label: 'Actualités', href: '/news'},
  { separator: true },
  { label: 'Logiciel', href: '/features'},
  { label: 'Plans', href: '/plans' },
  { label: 'API', href: '/api' },
  { label: 'Docs', href: '/docs' },
];

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

  //const updatedNavLinks = extendNavLinksWithIcons(navLinks, sportType);
  const handleLogout = () => { logout(); router.push("/"); };

  return (
    <>
      <header className={`sticky top-0 z-50 w-full border-b border-gray-200 bg-slate-50 dark:bg-slate-950 dark:border-gray-700 backdrop-blur-md
                            transition-transform duration-300
                          ${scrollDir === "down" ? "-translate-y-full" : "translate-y-0"}`}>
        <div className="mx-auto max-w-8xl px-2 md:px-6 py-1">
          <div className="flex h-14 items-center justify-between gap-4">
            {/* BRAND */}
            <div className="flex items-center gap-3">
              <Link href="/" className="flex items-center gap-3">
                <Image src={logoUrl} alt="Elenem" width={120} height={48} className="object-contain" />
              </Link>
            </div>
            {/* Desktop nav */}
            <nav className="hidden lg:flex lg:items-center lg:gap-6 text-sm">
              {navLinks.map((link, index) => {
                if (link.separator) {
                  return (
                    <span key={`sep-${index}`} className="h-5 w-px bg-slate-300/70 dark:bg-slate-700" />
                  );
                }
                const isActive = pathname === link.href;

                return (
                  <Link
                    key={link.href}
                    href={link.href || "/"}
                    className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors duration-200 ${
                      isActive
                        ? 'font-semibold text-sky-700 bg-sky-50'
                        : 'text-slate-600 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-sky-50'
                    }`}
                  >
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </nav>
            {/* Right area: search + login (visible on all sizes) */}
            <div className="flex items-center gap-2">
              {pathname === "/" && <AudienceToggle />}
              {loadingUser ? (
                <div className="flex items-center gap-2">
                  <Skeleton className="h-10 w-10 rounded-full" />
                </div>
              ) : userAuth ? (
                // Use the new reusable UserDropdown
                <UserDropdown handleLogout={handleLogout} />
              ) : (
                // LOGIN always visible (mobile & desktop)
                <Link href="/login" className="inline-flex items-center gap-2 px-3 py-2 rounded-full border border-gray-200 hover:bg-gray-50" aria-disabled>
                  <FiUser className="w-5 h-5 p-1 rounded-full border border-gray-200 dark:text-white" />
                  <span className="hidden sm:inline text-sm font-semibold text-sky-500">Se connecter</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Bottom nav only for small screens */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-slate-950 dark:border-gray-700 border-t border-gray-200 lg:hidden">
        <div className="flex items-center justify-around h-16">
          {[
              { label: "Accueil", href: "/", icon: Home},
              { label: "Matchs", href: "/games", icon: CalendarDays},
              { label: "Organisations", href: "/tenants", icon: Users },
              { label: "Logiciel", href: "/features", icon: ShieldCheck },
            ].map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link key={link.href} href={link.href} className={`flex flex-col items-center gap-1 text-xs ${isActive ? "text-sky-600" : "text-gray-600 dark:text-gray-200"}`}>
                {Icon && <Icon className="w-5 h-5" />}
                <span>{link.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
};
export default PublicHeader;
