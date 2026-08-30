'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Building2, Camera, LogOut, Mail, SquarePen } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';

const ROLE_LABELS: Record<string, string> = {
  SYSTEM_ADMIN: 'Administrateur plateforme',
  TENANT_ADMIN: "Administrateur de l'organisation",
  LEAGUE_ADMIN: 'Administrateur de ligue',
  TEAM_ADMIN: "Administrateur d'équipe",
  COACH: 'Entraîneur',
  REFEREE: 'Arbitre',
  PLAYER: 'Joueur',
  GENERAL_USER: 'Utilisateur',
};

/**
 * The navbar's identity control: an avatar that opens a profile card.
 *
 * Deliberately not a second copy of the sidebar menu. The sidebar already shows *who you are* and
 * carries the actions (profile, security, appearance, sign out); duplicating that here made the
 * navbar look like an older version of the same thing. So this card shows what the sidebar has no
 * room for — the photo, the full email, every role you hold, and which organisation you are
 * working inside — and offers exactly one action: change your picture.
 */
export function NavbarProfile({ onEditAvatar }: { onEditAvatar?: () => void }) {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (!user) return null;

  const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
  const display = fullName || user.username || user.email || 'Mon compte';
  const initial = display.charAt(0).toUpperCase();
  const avatar = user.profileImageUrl;
  const roles = (user.roles ?? []).filter((r) => r !== 'GENERAL_USER');

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label="Mon compte"
        onClick={() => setOpen((o) => !o)}
        className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-line bg-surface-sunk text-sm font-semibold text-ink-muted transition-colors hover:border-line-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        {avatar ? (
          <Image src={avatar} alt="" width={36} height={36} className="h-full w-full object-cover" />
        ) : (
          initial
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-72 overflow-hidden rounded-lg border border-line bg-elevated shadow-e2">
          <div className="flex flex-col items-center gap-3 border-b border-line px-4 py-5 text-center">
            <div className="relative">
              <span className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-surface-sunk text-xl font-semibold text-ink-muted">
                {avatar ? (
                  <Image src={avatar} alt="" width={64} height={64} className="h-full w-full object-cover" />
                ) : (
                  initial
                )}
              </span>
              <button
                type="button"
                onClick={onEditAvatar}
                aria-label="Changer la photo de profil"
                title="Changer la photo de profil"
                className="absolute -bottom-0.5 -right-0.5 flex h-7 w-7 items-center justify-center rounded-full border border-line bg-surface text-ink-muted shadow-e1 transition-colors hover:bg-surface-sunk hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                {avatar ? <SquarePen className="h-3.5 w-3.5" /> : <Camera className="h-3.5 w-3.5" />}
              </button>
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-ink">{display}</p>
              <p className="mt-0.5 flex items-center justify-center gap-1.5 text-xs text-ink-muted">
                <Mail className="h-3 w-3 shrink-0" />
                <span className="truncate">{user.email}</span>
              </p>
            </div>
          </div>

          <dl className="px-4 py-3 text-sm">
            {roles.length > 0 && (
              <div className="mb-3">
                <dt className="mb-1.5 text-[11px] font-medium uppercase tracking-wider text-ink-subtle">
                  {roles.length > 1 ? 'Rôles' : 'Rôle'}
                </dt>
                <dd className="flex flex-wrap gap-1.5">
                  {roles.map((r) => (
                    <span
                      key={r}
                      className="rounded-full bg-accent-soft px-2 py-0.5 text-xs font-medium text-accent-text"
                    >
                      {ROLE_LABELS[r] ?? r}
                    </span>
                  ))}
                </dd>
              </div>
            )}

            {user.tenant?.name && (
              <div>
                <dt className="mb-1 text-[11px] font-medium uppercase tracking-wider text-ink-subtle">
                  Organisation
                </dt>
                <dd className="flex items-start gap-2 text-ink">
                  <Building2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-subtle" />
                  {/* Wraps rather than truncates: the tail of a league's name is the part that
                      says which league it is. */}
                  <span className="min-w-0 break-words leading-snug">{user.tenant.name}</span>
                </dd>
              </div>
            )}
          </dl>

          <div className="flex flex-col items-start gap-0.5 border-t border-line px-2 py-2">
            <Link
              href="/account/profile"
              onClick={() => setOpen(false)}
              className="w-full rounded-md px-2 py-1.5 text-sm text-accent-text transition-colors hover:bg-surface-sunk"
            >
              Voir mon profil complet
            </Link>
            {/* Signing out is also in the sidebar account menu, but this card is what the navbar
                avatar opens — and an identity popover that cannot end the session sends you
                hunting for the one that can. */}
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                logout();
              }}
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-ink-muted transition-colors hover:bg-surface-sunk hover:text-negative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <LogOut className="h-3.5 w-3.5" aria-hidden />
              Déconnexion
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
