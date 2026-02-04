"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

import { useAuthStore } from "@/store/auth.store";
import useI18n from "@/hooks/useI18n";
import UserDropdown from "./user-dropdown";

export default function PublicHeader() {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const { locale, setLocale } = useI18n();
  const [open, setOpen] = useState(false);

  const nav = [
    { label: "Solution", href: "/features" },
    { label: "Comment ça marche", href: "/how-it-works" },
    { label: "Tarifs", href: "/pricing" },
    { label: "Ressources", href: "/docs" },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex h-16 items-center justify-between">
          
          {/* Brand */}
          <Link href="/" className="flex items-center">
            <Image
              src="/logos/elenem-sport.png"
              alt="Elenem"
              width={120}
              height={40}
              priority
            />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-8 text-sm font-medium text-slate-700">
            {nav.map((item) => (
              <NavLink key={item.href} {...item} />
            ))}
          </nav>

          {/* Right cluster */}
          <div className="flex items-center gap-4">
            {/* Language */}
            <button
              onClick={() => setLocale(locale === "fr" ? "en" : "fr")}
              className="hidden lg:block text-xs text-slate-500 hover:text-slate-700"
            >
              {locale === "fr" ? "EN" : "FR"}
            </button>

            {/* Auth */}
            {user ? (
              <UserDropdown />
            ) : (
              <Link
                href="/login"
                className="hidden lg:inline-flex rounded-md bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700"
              >
                Tableau de bord
              </Link>
            )}

            {/* Mobile toggle */}
            <button
              onClick={() => setOpen(!open)}
              className="lg:hidden p-2 text-slate-700"
              aria-label="Toggle menu"
            >
              {open ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="lg:hidden border-t border-slate-200 bg-white">
          <div className="px-4 py-6 space-y-4 text-sm font-medium">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="block text-slate-700"
              >
                {item.label}
              </Link>
            ))}

            <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
              <button
                onClick={() => setLocale(locale === "fr" ? "en" : "fr")}
                className="text-xs text-slate-500"
              >
                {locale === "fr" ? "EN" : "FR"}
              </button>

              {!user && (
                <Link
                  href="/login"
                  className="rounded-md bg-sky-600 px-4 py-2 text-sm font-semibold text-white"
                >
                  Tableau de bord
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

function NavLink({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  const pathname = usePathname();
  const active = pathname === href;

  return (
    <Link
      href={href}
      className={`transition-colors ${
        active ? "text-sky-600" : "hover:text-sky-600"
      }`}
    >
      {label}
    </Link>
  );
}
