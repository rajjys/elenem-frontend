// components/layouts/TenantHeader.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import React, { useState, useRef } from "react";
import { usePathname } from "next/navigation";
import { FiUser } from "react-icons/fi";
import { Users, ListOrdered, MoreHorizontal, Volleyball, Goal, Trophy, Home } from "lucide-react";
import { useClickAway } from "@/hooks/useClickAway";
import { SportType } from "@/schemas";
import { useScrollDirection } from "@/hooks";
import { BasketballIcon, SoccerBallIcon, TennisBallIcon } from "@phosphor-icons/react";

interface NavLink {
  label: string;
  href: string;
  icon?: React.ElementType;
}

interface TenantHeaderProps {
  tenant: {
    businessProfile: {
      logoUrl?: string | null;
      theme?: {
        primaryColor?: string | null;
        secondaryColor?: string | null;
      };
    };
    sportType?: SportType;
  };
}

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

export const PublicTenantHeader: React.FC<TenantHeaderProps> = ({ tenant }) => {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const scrollDir = useScrollDirection();
  const moreRef = useRef<HTMLDivElement>(null);
  useClickAway(moreRef, () => setMoreOpen(false));

  const GameIcon = getSportIcon(tenant.sportType);

  const mainLinks: NavLink[] = [
    { label: "Accueil", href: "/", icon: Home },
    { label: "Matchs", href: "/games", icon: GameIcon },
    { label: "Classements", href: "/standings", icon: ListOrdered },
    { label: "Équipes", href: "/teams", icon: Users },
    { label: "Plus", href: "#", icon: MoreHorizontal },
  ];

  const moreLinks: NavLink[] = [
    { label: "Playoff", href: "/playoff"},
    { label: "Joueurs", href: "/players" },
    { label: "Statistiques", href: "/stats" },
    { label: "Actualités", href: "/news" },
    { label: "Vidéos", href: "/videos" },
    { label: "Photos", href: "/photos" },
    { label: "Compétitions", href: "/competitions" },
    { label: "Historique", href: "/history" },
    { label: "A Propos", href: "/about" },
    { label: "Contact", href: "/contact" },
  ];

  const primaryColor = tenant.businessProfile.theme?.primaryColor || "#0284c7"; // default sky-600
  const secondaryColor = tenant.businessProfile.theme?.secondaryColor || "#0369a1";

  return (
    <>
      <header
        className={`w-full border-b border-${secondaryColor}-200 bg-white/95 backdrop-blur-md z-50 transition-transform duration-300
        ${scrollDir === "down" ? "-translate-y-full" : "translate-y-0"}
        md:sticky md:top-0`}
      >
        <div className="mx-auto max-w-7xl px-3 lg:px-6 flex h-12 lg:h-16 items-center justify-between gap-4">
            {/* Brand */}
            <Link href="/" className="flex items-center gap-2">
              {tenant.businessProfile.logoUrl ? (
                <Image
                  src={tenant.businessProfile.logoUrl}
                  alt="Tenant Logo"
                  width={100}
                  height={40}
                  className="object-contain h-10 lg:h-14"
                />
              ) : (
                <Image
                  src="/logos/elenem-sport.png"
                  alt="Elenem"
                  width={100}
                  height={40}
                  className="object-contain h-10 lg:h-14"
                />
              )}
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-6 text-base">
              {mainLinks.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href;
                if (link.label === "Plus") {
                  return (
                    <div className="relative" key="plus" ref={moreRef}>
                      <button
                        onClick={() => setMoreOpen(!moreOpen)}
                        className={`flex flex-col items-center text-xs md:text-sm text-gray-600 hover:text-gray-900 hover:text-${primaryColor}-700 cursor-pointer`}
                      >
                        <MoreHorizontal className="w-6 h-6" />
                        <div className="flex items-center gap-2">
                            <span>{link.label}</span>
                            
                        </div>
                        
                      </button>
                      {moreOpen && (
                        <div className="absolute right-0 mt-2 py-4 text-xs md:text-sm rounded-md border-b bg-white shadow-lg z-40">
                          {moreLinks.map((ml) => (
                            <Link
                              key={ml.href}
                              href={ml.href}
                              onClick={() => setMoreOpen(false)}
                              className={`block pl-4 pr-20 py-2 text-base hover:bg-${primaryColor}-100 transition-colors duration-300 ease-in-out rounded-md`}
                            >
                              {ml.label}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                }
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex flex-col items-center px-2 hover:text-${primaryColor}-700 transition-colors duration-300 ease-in-out ${
                  isActive ? `font-semibold text-${primaryColor}-700` : "text-gray-600"
                }`}
                  >
                    {Icon && <Icon className="w-6 h-6" />}
                    <span className="text-xs md:text-sm">{link.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Login */}
            <div className="flex items-center gap-2">
              {/* Desktop */}
              <Link
                href="/"
                className="hidden md:inline text-sm font-medium px-3 py-1.5 rounded-md border border-gray-200 hover:bg-gray-50"
                style={{ color: primaryColor, borderColor: primaryColor }}
              >
                Se connecter
              </Link>
              {/* Mobile */}
              <Link
                href="/"
                className="md:hidden inline-flex items-center justify-center p-2 rounded-full border border-gray-200 hover:bg-gray-50"
              >
                <FiUser className="w-5 h-5" />
              </Link>
            </div>
        </div>
      </header>

      {/* Mobile Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 md:hidden">
        <div className="flex items-center justify-around h-14">
          {mainLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            if (link.label === "Plus") {
              return (
                <button
                  key="mobile-more"
                  onClick={() => setDrawerOpen(true)}
                  className="flex flex-col items-center text-xs text-gray-600"
                >
                  <MoreHorizontal className="w-5 h-5" />
                  Plus
                </button>
              );
            }
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex flex-col items-center gap-1 text-xs ${isActive ? `font-semibold text-${primaryColor}-700` : "text-gray-600"}`}
              >
                {Icon && <Icon className="w-5 h-5" />}
                {link.label}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Mobile Drawer for More */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 bg-white flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <span className="text-lg font-semibold">Plus</span>
            <button onClick={() => setDrawerOpen(false)} className="p-2">✕</button>
          </div>
          <nav className="flex flex-col divide-y">
            {moreLinks.map((ml) => (
              <Link
                key={ml.href}
                href={ml.href}
                className="px-4 py-3 text-base hover:bg-gray-50"
                onClick={() => setDrawerOpen(false)}
              >
                {ml.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </>
  );
};
