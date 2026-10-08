'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { KeyRound, Lock, LockOpen, UserCheck, UserX } from 'lucide-react';
import { Button, ConfirmDialog } from '@/components/ui';
import {
  useSendPasswordResetCode,
  useSetUserActive,
  useUnblockUserSignIn,
  type UserResponse,
} from '@/services/users';
import { useCurrentUser, useHasRole } from '@/hooks';
import { Roles } from '@/schemas';
import { toastApiError } from '@/utils';

type SignInLock = { reason: 'FAILED_ATTEMPTS' | 'ADMIN'; until: string | null };

/** The lock as it stands now: the one fetched may have run out while the screen sat open. */
export function currentSignInLock(
  lock: SignInLock | null | undefined,
  now: Date = new Date(),
): SignInLock | null {
  if (!lock) return null;
  return !lock.until || new Date(lock.until) > now ? lock : null;
}

/** « jusqu’à 13:41 » today, « jusqu’au 8 octobre à 00:10 » another day. */
export function lockUntilLabel(until: string | null): string {
  if (!until) return 'sans date de fin';
  const d = new Date(until);
  const time = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  if (d.toDateString() === new Date().toDateString()) return `jusqu’à ${time}`;
  return `jusqu’au ${d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })} à ${time}`;
}

/**
 * Whether this person can get in, and the two things an administrator can do when they cannot.
 *
 * Added after an organiser was locked out on 2026-10-07 and nothing on the users screens could
 * tell why, let alone fix it: the screen blamed his unverified address (which stops nobody from
 * signing in) while the real cause, six wrong passwords, was visible only in the database.
 *
 * - **Débloquer** lifts the lock and forgets the wrong passwords. The API allows it to a system
 *   administrator, and to an organisation's administrator for their own people, so the button
 *   appears for exactly those.
 * - **Envoyer un code de réinitialisation** is « Mot de passe oublié » sent on the person's
 *   behalf: they get a code and a link, and choose the new password themselves. Nobody else ever
 *   knows it, which is why it is offered ahead of typing one in « Modifier ». The new password
 *   lifts a cool-down after wrong passwords, never an administrator's lock.
 */
/**
 * May the viewer decide whether this person gets in — unblock, deactivate, reactivate? A system
 * administrator, or an organisation's administrator for their own people: the rule the API applies
 * (`assertCanManageAccess`), so a button never appears only to be refused.
 */
export function useCanManageAccess(user: Pick<UserResponse, 'tenantId'>): boolean {
  const me = useCurrentUser();
  const isSystemAdmin = useHasRole(Roles.SYSTEM_ADMIN);
  const isTenantAdmin = useHasRole(Roles.TENANT_ADMIN);
  return isSystemAdmin || (isTenantAdmin && !!me?.tenantId && me.tenantId === user.tenantId);
}

export function UserSignInAccess({ user }: { user: UserResponse }) {
  const unblock = useUnblockUserSignIn();
  const setActive = useSetUserActive();
  const sendCode = useSendPasswordResetCode();
  const [confirmCode, setConfirmCode] = useState(false);

  const lock = currentSignInLock(user.signInLock);
  const canUnblock = useCanManageAccess(user);
  // The API sends nothing to a deactivated account, so offering it would be a button that lies;
  // and a new password does not open an administrator's lock, so it would be one there too. Who
  // may send one is who may decide access (the API's rule).
  const canSendCode = canUnblock && user.isActive && lock?.reason !== 'ADMIN';

  const onUnblock = () =>
    unblock.mutate(user.id, {
      onSuccess: () => toast.success('Connexion débloquée.'),
      onError: (e) => toastApiError(e),
    });

  const onSendCode = () =>
    sendCode.mutate(user.id, {
      onSuccess: () => toast.success(`Code envoyé à ${user.email}.`),
      onError: (e) => toastApiError(e, 'Impossible d’envoyer le code.'),
    });

  const sendCodeButton = canSendCode && (
    <Button size="sm" variant="outline" onClick={() => setConfirmCode(true)} disabled={sendCode.isPending}>
      <KeyRound className="mr-1.5 h-3.5 w-3.5" aria-hidden />
      Envoyer un code de réinitialisation
    </Button>
  );

  // Deactivated comes first: it is the decision that outranks a lock, and nothing below it applies
  // until it is undone.
  if (!user.isActive) {
    return (
      <section className="rounded-lg border border-line bg-surface-sunk px-3.5 py-3">
        <p className="flex items-center gap-1.5 text-sm font-medium text-ink">
          <UserX className="h-3.5 w-3.5 shrink-0 text-ink-muted" aria-hidden />
          Compte désactivé
        </p>
        <p className="mt-1 text-sm text-ink-muted">
          Cette personne ne peut plus se connecter. Rien n’a été supprimé : son compte et ce qui a
          été saisi avec restent en place.
        </p>
        {canUnblock ? (
          <Button
            size="sm"
            variant="primary"
            className="mt-3"
            disabled={setActive.isPending}
            onClick={() =>
              setActive.mutate(
                { id: user.id, isActive: true },
                {
                  onSuccess: () => toast.success('Compte réactivé.'),
                  onError: (e) => toastApiError(e),
                },
              )
            }
          >
            <UserCheck className="mr-1.5 h-3.5 w-3.5" aria-hidden />
            Réactiver
          </Button>
        ) : (
          <p className="mt-2 text-xs text-ink-subtle">
            Seul un administrateur de l’organisation peut le réactiver.
          </p>
        )}
      </section>
    );
  }

  return (
    <>
      {lock ? (
        <section className="rounded-lg border border-caution/40 bg-caution-soft px-3.5 py-3">
          <p className="flex items-center gap-1.5 text-sm font-medium text-ink">
            <Lock className="h-3.5 w-3.5 shrink-0 text-caution" aria-hidden />
            {lock.reason === 'ADMIN'
              ? `Compte verrouillé par un administrateur, ${lockUntilLabel(lock.until)}`
              : `Connexion bloquée ${lockUntilLabel(lock.until)}`}
          </p>
          <p className="mt-1 text-sm text-ink-muted">
            {lock.reason === 'ADMIN'
              ? 'Cette personne ne peut ni se connecter, ni continuer une session déjà ouverte.'
              : 'Trop de mots de passe erronés. Le blocage se lève tout seul à cette heure-là ; vous pouvez aussi le lever maintenant.'}
          </p>
          {(canUnblock || canSendCode) && (
            <div className="mt-3 flex flex-wrap gap-2">
              {canUnblock && (
                <Button size="sm" variant="primary" onClick={onUnblock} disabled={unblock.isPending}>
                  <LockOpen className="mr-1.5 h-3.5 w-3.5" aria-hidden />
                  {lock.reason === 'ADMIN' ? 'Déverrouiller' : 'Débloquer maintenant'}
                </Button>
              )}
              {sendCodeButton}
            </div>
          )}
          {!canUnblock && (
            <p className="mt-2 text-xs text-ink-subtle">
              Seul un administrateur de l’organisation peut lever le blocage.
            </p>
          )}
        </section>
      ) : (
        canSendCode && (
          <section className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line px-3.5 py-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-ink">Mot de passe oublié ?</p>
              <p className="mt-0.5 text-sm text-ink-muted">
                Cette personne reçoit un code par e-mail et choisit elle-même le nouveau.
              </p>
            </div>
            {sendCodeButton}
          </section>
        )
      )}

      <ConfirmDialog
        open={confirmCode}
        onOpenChange={setConfirmCode}
        title="Envoyer un code de réinitialisation ?"
        description={`Un code à 6 chiffres part à ${user.email}, avec un lien vers la page où choisir un nouveau mot de passe. Le code est valable 10 minutes ; passé ce délai, la page permet d’en redemander un. D’ici là, le mot de passe actuel reste valable.`}
        confirmLabel="Envoyer"
        onConfirm={onSendCode}
      />
    </>
  );
}
