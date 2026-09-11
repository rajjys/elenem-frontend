'use client';

import Link from 'next/link';
import { ArrowRight, Loader2, MailCheck, MailWarning, ShieldCheck } from 'lucide-react';
import { Button, Modal } from '@/components/ui';
import { useUser } from '@/services/users';
import { ROLE_HINTS, meaningfulRoles, roleLabel } from '@/utils/role-labels';
import { formatDateFr } from '@/utils';

/**
 * A person, in a dialog: what they may do, and whether the account works.
 *
 * The second half of item 15 — the players' half shipped in 8eaa91d and this is the same argument
 * for users. A list of accounts is scanned, not read: the questions are « qui est cet
 * administrateur », « pourquoi ne peut-il pas se connecter », « ce compte sert-il encore ». All
 * three are answered here without leaving the list, and the page is one click away for the rest.
 *
 * **Roles come first because roles are the point.** Everything else about a user record — name,
 * e-mail, when it was made — is administrative; what the person can *do* is the reason the screen
 * exists, and it was previously printed as `GENERAL_USER, LEAGUE_ADMIN` in a column too narrow to
 * finish the word.
 *
 * **An unverified e-mail is stated, not hidden.** It is the single commonest reason somebody
 * cannot get in, and « je n'arrive pas à me connecter » is the message the organiser actually
 * receives.
 */
export function UserQuickView({
  userId,
  detailHref,
  onOpenChange,
}: {
  userId: string;
  /** Where the full record lives on this surface. */
  detailHref: string;
  onOpenChange: (open: boolean) => void;
}) {
  const { data: user, isPending, isError } = useUser(userId);

  const name = user ? `${user.firstName} ${user.lastName}`.trim() || user.username : 'Utilisateur';

  return (
    <Modal
      open
      onOpenChange={onOpenChange}
      title={name}
      className="max-w-lg"
      footer={
        <div className="flex justify-end">
          <Button variant="primary" asChild>
            <Link href={detailHref}>
              Ouvrir la fiche
              <ArrowRight className="ml-1.5 h-4 w-4" aria-hidden />
            </Link>
          </Button>
        </div>
      }
    >
      {isPending ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-ink-subtle" aria-hidden />
        </div>
      ) : isError || !user ? (
        <p className="py-12 text-center text-sm text-ink-muted">
          Impossible de charger ce compte.
        </p>
      ) : (
        <div className="space-y-5 pb-2">
          <div className="text-sm">
            <p className="text-ink-muted">{user.email}</p>
            <p className="mt-0.5 text-xs text-ink-subtle">
              @{user.username}
              {user.tenant && <> · {user.tenant.tenantCode || user.tenant.name}</>}
            </p>
          </div>

          {/* The reason this screen exists. */}
          <section>
            <h3 className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-ink-subtle">
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
              Rôles
            </h3>
            <ul className="space-y-1.5">
              {meaningfulRoles(user.roles).map((r) => (
                <li key={r} className="rounded-lg border border-line px-3 py-2">
                  <p className="text-sm font-medium text-ink">{roleLabel(r)}</p>
                  {ROLE_HINTS[r] && (
                    <p className="mt-0.5 text-xs text-ink-muted">{ROLE_HINTS[r]}</p>
                  )}
                </li>
              ))}
            </ul>
          </section>

          <section className="grid gap-2 sm:grid-cols-2">
            <Fact
              label="Compte"
              value={user.isActive ? 'Actif' : 'Désactivé'}
              tone={user.isActive ? 'default' : 'caution'}
            />
            <Fact
              label="Adresse e-mail"
              value={user.isEmailVerified ? 'Vérifiée' : 'Non vérifiée'}
              tone={user.isEmailVerified ? 'default' : 'caution'}
              icon={user.isEmailVerified ? MailCheck : MailWarning}
            />
            <Fact
              label="Dernière connexion"
              value={user.lastLoginAt ? formatDateFr(user.lastLoginAt) : 'Jamais'}
              tone={user.lastLoginAt ? 'default' : 'quiet'}
            />
            <Fact
              label="Compte créé le"
              value={user.createdAt ? formatDateFr(user.createdAt) : '—'}
            />
          </section>

          {!user.isEmailVerified && (
            <p className="rounded-lg border border-caution/40 bg-caution-soft px-3.5 py-2.5 text-sm text-ink">
              Tant que l&apos;adresse n&apos;est pas vérifiée, cette personne ne peut pas se
              connecter.
            </p>
          )}
        </div>
      )}
    </Modal>
  );
}

function Fact({
  label,
  value,
  tone = 'default',
  icon: Icon,
}: {
  label: string;
  value: string;
  tone?: 'default' | 'caution' | 'quiet';
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-lg border border-line px-3 py-2">
      <p className="text-[0.6875rem] uppercase tracking-wide text-ink-subtle">{label}</p>
      <p
        className={
          tone === 'caution'
            ? 'mt-0.5 flex items-center gap-1.5 text-sm font-medium text-caution'
            : tone === 'quiet'
              ? 'mt-0.5 flex items-center gap-1.5 text-sm text-ink-subtle'
              : 'mt-0.5 flex items-center gap-1.5 text-sm text-ink'
        }
      >
        {Icon && <Icon className="h-3.5 w-3.5 shrink-0" />}
        {value}
      </p>
    </div>
  );
}
