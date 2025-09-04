// components/layouts/PublicHeader.tsx
"use client";

import Link from "next/link";
import React, { useState, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { FiUser, FiChevronDown } from "react-icons/fi";
import { Users, LayoutDashboard, User, Shield, Settings, LogOut,
  Calendar,
  ShieldCheck,
  CreditCard
} from "lucide-react";

import { Roles, SportType } from "@/schemas";
import { useAuthStore } from "@/store/auth.store";
import { Skeleton } from "../ui";
import { AudienceToggle } from "../landing/AudienceToggle";

interface NavLink { label: string; href: string; }
interface PublicHeaderProps {
  logoUrl?: string;
  sportType?: SportType;
  navLinks?: NavLink[];
  primaryColor?: string;
  onSearch?: () => void;
}

/*
const hrefIconMap: Record<string, React.ElementType> = {
  "/": Home,
  "/games": Trophy,
  "/tenants": Users,
  "/news": Newspaper,
  "/standings": ListOrdered,
  "/teams": Users,
};

const getSportIcon = (sportType?: SportType) => {
  switch (sportType) {
    case SportType.FOOTBALL: return SoccerBallIcon;
    case SportType.BASKETBALL: return BasketballIcon;
    case SportType.VOLLEYBALL: return Volleyball;
    case SportType.TENNIS: return TennisBallIcon;
    case SportType.RUGBY: return Goal;
    default: return Trophy;
  }
};

const extendNavLinksWithIcons = (navLinks: NavLink[], sportType?: SportType) =>
  navLinks.map(({ label, href }) => {
    const icon = href === "/games" ? getSportIcon(sportType) : hrefIconMap[href] || undefined;
    return { label, href, icon };
  });
*/
export const PublicHeader = ({
  logoUrl = "/logos/elenem-sport.png",
  //sportType = SportType.FOOTBALL,
  ///primaryColor = "blue",
 // onSearch,
}: PublicHeaderProps) => {
  const pathname = usePathname();
  const router = useRouter();
  const { user: userAuth, logout, fetchUser } = useAuthStore();
  const [loadingUser, setLoadingUser] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const navLinks = [
  { label: 'Matchs', href: '/games'},
  { label: 'Ligues', href: '/tenants'},
  { label: 'Actualités', href: '/news'},
  { separator: true },
  { label: 'Fonctionnalités', href: '/features'},
  { label: 'Tarifs', href: '/pricing' },
  { label: 'API', href: '/api' },
  { label: 'Documentation', href: '/docs' },
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

  //const updatedNavLinks = extendNavLinksWithIcons(navLinks, sportType);
  const handleLogout = () => { logout(); router.push("/"); };

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/95 backdrop-blur-md">
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
                        : 'text-slate-600 dark:text-slate-600 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-sky-50'
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
                        {isManagementUser && (
                          <Link href={dashboardLink} onClick={() => setDropdownOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                            <LayoutDashboard className="w-4 h-4" /> Tableau de Bord
                          </Link>
                        )}
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
          </div>
        </div>
      </header>

      {/* Bottom nav only for small screens */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 lg:hidden">
        <div className="flex items-center justify-around h-16">
          {[
              { label: "Matchs", href: "/games", icon: Calendar},
              { label: "Ligues", href: "/tenants", icon: Users },
              { label: "Fonctionnalités", href: "/features", icon: ShieldCheck },
              { label: "Tarifs", href: "/pricing", icon: CreditCard},
            ].map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link key={link.href} href={link.href} className={`flex flex-col items-center gap-1 text-xs ${isActive ? "text-sky-600" : "text-gray-600"}`}>
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
