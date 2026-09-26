"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

import { useAuthStore } from "@/store/auth.store";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import UserDropdown from "./user-dropdown";

/**
 * Interim header (5A.1). The full redesign is 5A.2; this pass only stops it pointing at pages that
 * are gone and gives a visitor the two things they came for. It used to offer "Tableau de bord" —
 * which went to /login — and nothing at all that led to sign-up. The FR/EN switch changed its own
 * label and nothing else.
 */
export default function PublicHeader() {
  const { user } = useAuthStore();
  const [open, setOpen] = useState(false);

  const nav = [
    { label: "Comment ça marche", href: "/#how-it-works" },
    { label: "Contact", href: "/contact" },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-surface/80 backdrop-blur">
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
          <nav className="hidden lg:flex items-center gap-8 text-sm font-medium text-ink">
            {nav.map((item) => (
              <NavLink key={item.href} {...item} />
            ))}
          </nav>

          {/* Right cluster */}
          <div className="flex items-center gap-4">
            <ThemeToggle className="hidden lg:inline-flex" />

            {/* Auth */}
            {user ? (
              <UserDropdown />
            ) : (
              <>
                <Link
                  href="/login"
                  className="hidden lg:inline-flex text-sm font-medium text-ink-muted transition-colors hover:text-ink"
                >
                  Se connecter
                </Link>
                <Link
                  href="/register"
                  className="hidden sm:inline-flex rounded-md bg-accent px-4 py-2 text-sm font-semibold text-accent-ink transition-colors hover:bg-accent-hover"
                >
                  Créer ma ligue
                </Link>
              </>
            )}

            {/* Mobile toggle */}
            <button
              onClick={() => setOpen(!open)}
              className="lg:hidden p-2 text-ink"
              aria-label="Toggle menu"
            >
              {open ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="lg:hidden border-t border-line bg-surface">
          <div className="px-4 py-6 space-y-4 text-sm font-medium">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="block text-ink"
              >
                {item.label}
              </Link>
            ))}

            {!user && (
              <div className="pt-4 border-t border-line flex items-center justify-between gap-3">
                <Link href="/login" onClick={() => setOpen(false)} className="text-ink-muted">
                  Se connecter
                </Link>
                <Link
                  href="/register"
                  onClick={() => setOpen(false)}
                  className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-accent-ink"
                >
                  Créer ma ligue
                </Link>
              </div>
            )}
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
        active ? "text-accent-text" : "hover:text-accent-text"
      }`}
    >
      {label}
    </Link>
  );
}
