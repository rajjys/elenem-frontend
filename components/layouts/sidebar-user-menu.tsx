'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, LogOut, MoreHorizontal, Shield, User } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { cn } from '@/utils/cn';

/**
 * The account block that sits at the very bottom of the sidebar.
 *
 * Collapsed it is a single quiet row — avatar, identity, a "more" affordance — so account
 * controls stop competing with the navigation above them. Opening it reveals the things that are
 * about *you* rather than about the competition you are running, including Appearance, which
 * belongs here rather than in the header: it is a preference, set once, not a tool.
 */
export function SidebarUserMenu({
  name,
  email,
  isSidebarOpen,
  onLogout,
  buildLink,
  publicSiteHref = '/',
  onNavigate,
}: {
  name?: string | null;
  email?: string | null;
  isSidebarOpen: boolean;
  onLogout: () => void;
  buildLink: (basePath: string) => string;
  publicSiteHref?: string;
  onNavigate?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const label = name?.trim() || email || 'Mon compte';
  const initial = (name?.trim() || email || '?').charAt(0).toUpperCase();

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const close = () => {
    setOpen(false);
    onNavigate?.();
  };

  const itemClass =
    'flex items-center gap-3 rounded-md px-3 py-2 text-sm text-ink-muted transition-colors hover:bg-surface-sunk hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent';

  return (
    <div ref={ref} className="relative border-t border-line p-2">
      {/* The menu opens upward: this block is pinned to the bottom of the viewport. */}
      {open && (
        <div
          role="menu"
          className={cn(
            'absolute bottom-full mb-2 overflow-hidden rounded-lg border border-line bg-elevated py-1 shadow-e2',
            // Docked, the rail is 5rem wide — the menu has to break out of it rather than be
            // squeezed into a column two letters wide.
            isSidebarOpen ? 'left-2 right-2' : 'left-2 w-64',
          )}
        >
          {/* Account routes are personal: /account/profile?ctxLeagueId=… is meaningless, and the
              contextual builder was appending whatever league you happened to be inside. */}
          <Link href="/account/profile" onClick={close} className={itemClass} role="menuitem">
            <User className="h-4 w-4 shrink-0" />
            Mon profil
          </Link>
          <Link href="/account/security" onClick={close} className={itemClass} role="menuitem">
            <Shield className="h-4 w-4 shrink-0" />
            Sécurité
          </Link>

          <div className="flex items-center justify-between gap-3 px-3 py-2 text-sm text-ink-muted">
            <span>Apparence</span>
            <ThemeToggle />
          </div>

          <div className="my-1 border-t border-line" />

          <a
            href={publicSiteHref}
            target="_blank"
            rel="noopener noreferrer"
            onClick={close}
            className={cn(itemClass, 'justify-between')}
            role="menuitem"
          >
            <span className="flex items-center gap-3">
              <ArrowUpRight className="h-4 w-4 shrink-0" />
              Site public
            </span>
          </a>

          <div className="my-1 border-t border-line" />

          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onLogout();
            }}
            className={cn(itemClass, 'w-full hover:bg-negative-soft hover:text-negative')}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            Se déconnecter
          </button>
        </div>
      )}

      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        title={isSidebarOpen ? undefined : label}
        className={cn(
          'flex w-full items-center gap-2 rounded-md px-2 py-2 text-left transition-colors hover:bg-surface-sunk',
          'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent',
          !isSidebarOpen && 'justify-center',
        )}
      >
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-surface-sunk text-xs font-semibold text-ink-muted">
          {initial}
        </span>
        {isSidebarOpen && (
          <>
            <span className="min-w-0 flex-1 truncate text-sm text-ink">{label}</span>
            <MoreHorizontal className="h-4 w-4 shrink-0 text-ink-subtle" />
          </>
        )}
      </button>
    </div>
  );
}
