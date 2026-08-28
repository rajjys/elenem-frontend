'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Menu } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { Skeleton } from '@/components/ui/';
import { NavbarProfile } from './navbar-profile';

interface AppLayoutNavbarProps {
  onMobileMenuToggle: () => void;
  handleLogout: () => void;
}

/**
 * A thin strip of tools, not a second identity bar.
 *
 * The brand moved to the sidebar, which is the permanent frame — this row holds only what belongs
 * to the *current view*. Today that is the mobile menu trigger and the profile avatar; search,
 * notifications and help slot in beside them without changing the shape. The theme control is
 * gone from here: it lives in the sidebar account menu, and having it in both places meant the
 * same preference had two homes.
 */
export function AppLayoutHeader({ onMobileMenuToggle }: AppLayoutNavbarProps) {
  const { user: userAuth, fetchUser } = useAuthStore();
  const [loadingUser, setLoadingUser] = useState(true);

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

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-line bg-surface px-3 sm:px-6">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onMobileMenuToggle}
          aria-label="Ouvrir le menu"
          className="flex h-9 w-9 items-center justify-center rounded-md text-ink-muted transition-colors hover:bg-surface-sunk hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent md:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      <div className="flex items-center gap-2">
        {/* Search, notifications and help belong here as they arrive. */}
        {loadingUser ? (
          <Skeleton className="h-9 w-9 rounded-full" />
        ) : userAuth ? (
          <NavbarProfile />
        ) : (
          <Link
            href="/login"
            className="rounded-md border border-line px-3 py-1.5 text-sm font-medium text-ink transition-colors hover:bg-surface-sunk"
          >
            Se connecter
          </Link>
        )}
      </div>
    </header>
  );
}
