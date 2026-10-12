'use client';

import { useEffect } from 'react';
import { Menu } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { ContextBreadcrumb } from './context-breadcrumb';

interface AppLayoutNavbarProps {
  onMobileMenuToggle: () => void;
}

/**
 * A thin strip of tools, not a second identity bar.
 *
 * The brand moved to the sidebar, which is the permanent frame — this row holds only what belongs
 * to the *current view*: the mobile menu trigger and where you are. Search, notifications and help
 * slot in on the right as they arrive, without changing the shape.
 *
 * It used to carry a profile avatar too, opening a card about who you are. That was a second door
 * to the account menu at the bottom of the sidebar, and the two drifted apart, so the identity
 * moved into that menu (`SidebarUserMenu`) and this row went back to being about the page. The
 * theme control left for the same reason: one preference, one home.
 */
export function AppLayoutHeader({ onMobileMenuToggle }: AppLayoutNavbarProps) {
  const { user: userAuth, fetchUser } = useAuthStore();

  // Still loads the signed-in user when the store has none (a fresh tab with only the token): the
  // sidebar's account menu and every role check in the shell read it.
  useEffect(() => {
    if (!userAuth) fetchUser();
  }, [userAuth, fetchUser]);

  return (
    <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center gap-4 border-b border-line bg-surface px-3 sm:px-6">
      <div className="flex min-w-0 items-center gap-2">
        <button
          type="button"
          onClick={onMobileMenuToggle}
          aria-label="Ouvrir le menu"
          className="flex h-9 w-9 items-center justify-center rounded-md text-ink-muted transition-colors hover:bg-surface-sunk hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent md:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
        <ContextBreadcrumb />
      </div>
    </header>
  );
}
