'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, Building2, Home, LogOut, MoreHorizontal, Shield, User } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Tooltip } from '@/components/ui/tooltip';
import { useAuthStore } from '@/store/auth.store';
import { meaningfulRoles, roleLabel } from '@/utils/role-labels';
import { cn } from '@/utils/cn';

/**
 * The account menu, and the only one.
 *
 * It sits at the very bottom of the sidebar. Collapsed it is a single quiet row — avatar, identity,
 * a "more" affordance — so account controls stop competing with the navigation above them.
 *
 * There used to be a second one: an avatar in the navbar opening a card about *who you are* (photo,
 * email, roles, organisation) while this menu held *what you can do* (profile, security,
 * appearance, sign out). Two doors to one account, each half-furnished — the card's sign-out skipped
 * the hard navigation this one makes, and its « change your photo » button was wired to nothing,
 * because no screen uploads a personal photo. So the identity moved in here, as the menu's header,
 * and the navbar went back to being about the current page.
 */
export function SidebarUserMenu({
  isSidebarOpen,
  onLogout,
  publicSiteHref = '/home',
  onNavigate,
}: {
  isSidebarOpen: boolean;
  onLogout: () => void;
  publicSiteHref?: string;
  onNavigate?: () => void;
}) {
  const user = useAuthStore((s) => s.user);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim();
  const label = fullName || user?.username || user?.email || 'Mon compte';
  const initial = label.charAt(0).toUpperCase();
  const avatar = user?.profileImageUrl;
  // Everybody also holds GENERAL_USER; it says nothing, so it only shows when it is all there is.
  const roles = meaningfulRoles(user?.roles ?? []);

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

  const avatarFace = (size: number) =>
    avatar ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={avatar} alt="" width={size} height={size} className="h-full w-full object-cover" />
    ) : (
      initial
    );

  return (
    <div ref={ref} className="relative border-t border-line p-2">
      {/* The menu opens upward: this block is pinned to the bottom of the viewport. */}
      {open && (
        <div
          role="menu"
          className={cn(
            'absolute bottom-full mb-2 overflow-hidden rounded-lg border border-line bg-elevated shadow-e2',
            // Docked, the rail is 5rem wide — the menu has to break out of it rather than be
            // squeezed into a column two letters wide.
            isSidebarOpen ? 'left-2 right-2' : 'left-2 w-72',
          )}
        >
          {/* Who you are, before what you can do. Roles and organisation are the two facts the
              sidebar row has no room for, and the ones that explain why the navigation above
              looks the way it does. */}
          <div className="border-b border-line px-3 py-3">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-sunk text-sm font-semibold text-ink-muted">
                {avatarFace(40)}
              </span>
              {/* Wrapped, never truncated: the row underneath already shows the short version, and
                  this is the one place the whole name and address can be read. */}
              <div className="min-w-0">
                <p className="break-words text-sm font-semibold leading-snug text-ink">{label}</p>
                {user?.email && user.email !== label && (
                  <p className="break-all text-xs text-ink-muted">{user.email}</p>
                )}
              </div>
            </div>

            {roles.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5" aria-label={roles.length > 1 ? 'Rôles' : 'Rôle'}>
                {roles.map((r) => (
                  <span
                    key={r}
                    className="rounded-full bg-accent-soft px-2 py-0.5 text-xs font-medium text-accent-text"
                  >
                    {roleLabel(r)}
                  </span>
                ))}
              </div>
            )}

            {user?.tenant?.name && (
              <p className="mt-2.5 flex items-start gap-2 text-xs text-ink-muted">
                <Building2 className="mt-px h-3.5 w-3.5 shrink-0 text-ink-subtle" aria-hidden />
                {/* Wraps rather than truncates: the tail of a league's name is the part that says
                    which league it is. */}
                <span className="min-w-0 break-words leading-snug">{user.tenant.name}</span>
              </p>
            )}
          </div>

          <div className="py-1">
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

            {/* The organisation's own league site, <code>.dxscores.app, in a new tab. Without one
                (a system administrator) it falls back to the product's landing — never `/`, which
                sends a signed-in reader straight back to their dashboard. */}
            <a
              href={publicSiteHref}
              target="_blank"
              rel="noopener noreferrer"
              onClick={close}
              className={itemClass}
              role="menuitem"
            >
              <ArrowUpRight className="h-4 w-4 shrink-0" />
              Site public
            </a>
            {/* The product's own landing. `/` sends a signed-in reader to their dashboard, so the
                landing lives at /home for when they want it (PHASE5A_PRODUCT_SITE §5). */}
            <Link href="/home" onClick={close} className={itemClass} role="menuitem">
              <Home className="h-4 w-4 shrink-0" />
              Page d&apos;accueil
            </Link>

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
        </div>
      )}

      {/* Docked, the avatar is a single letter with no label beside it — the same problem the nav
          icons have, so it gets the same fast tooltip rather than the ~1s native one. */}
      <Tooltip label={label} disabled={isSidebarOpen || open}>
        <button
          type="button"
          aria-haspopup="menu"
          aria-expanded={open}
          aria-label={isSidebarOpen ? undefined : 'Mon compte'}
          onClick={() => setOpen((o) => !o)}
          className={cn(
            'flex w-full items-center gap-2 rounded-md px-2 py-2 text-left transition-colors hover:bg-surface-sunk',
            'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent',
            !isSidebarOpen && 'justify-center',
          )}
        >
          <span className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-sunk text-xs font-semibold text-ink-muted">
            {avatarFace(28)}
          </span>
          {isSidebarOpen && (
            <>
              <span className="min-w-0 flex-1 truncate text-sm text-ink">{label}</span>
              <MoreHorizontal className="h-4 w-4 shrink-0 text-ink-subtle" />
            </>
          )}
        </button>
      </Tooltip>
    </div>
  );
}
