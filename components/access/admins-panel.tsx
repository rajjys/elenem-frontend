'use client';

import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { UserMinus, UserPlus } from 'lucide-react';
import { Button, ConfirmDialog, SelectField } from '@/components/ui';
import { InviteDialog } from '@/components/users/invite-dialog';
import { useGrantAccess, useRevokeAccess, type Admin } from '@/services/access';
import { useUsers } from '@/services/users';
import { formatDateFr, toastApiError } from '@/utils';
import { roleLabel } from '@/utils/role-labels';
import { de } from '@/utils/french';

const nameOf = (p: { firstName?: string | null; lastName?: string | null; username?: string | null; email?: string | null }) =>
  [p.firstName, p.lastName].filter(Boolean).join(' ') || p.username || p.email || 'Sans nom';

/**
 * Who runs a competition or a club, and the three things to do about it: remove someone, give it
 * to someone already in the organisation, or invite someone new (ROADMAP_V2 §15, U3).
 *
 * The API decides every rule (`src/access`): who may, one competition and one club per person,
 * a competition's owner. This panel offers what the reader may do and reports what the API says.
 *
 * `canPickExisting` is for those who can list the organisation's people — its administrators. A
 * competition's administrator naming a club's cannot, and invites instead: an address that
 * already has an account in the organisation is simply given the role.
 */
export function AdminsPanel({
  role,
  scopeId,
  scopeName,
  tenantId,
  admins,
  isLoading,
  canManage,
  canPickExisting,
}: {
  role: 'LEAGUE_ADMIN' | 'TEAM_ADMIN';
  scopeId: string;
  scopeName: string;
  tenantId?: string;
  admins: Admin[] | undefined;
  isLoading: boolean;
  canManage: boolean;
  canPickExisting: boolean;
}) {
  const grant = useGrantAccess();
  const revoke = useRevokeAccess();
  const [picked, setPicked] = useState('');
  const [inviting, setInviting] = useState(false);
  const [removing, setRemoving] = useState<Admin | null>(null);

  const isLeague = role === 'LEAGUE_ADMIN';
  const scopeIds = isLeague ? { leagueId: scopeId } : { teamId: scopeId };

  // The organisation's people who may take this on: active, and not already running something
  // that excludes it — another competition (one per person), or more than a club.
  const { data: people } = useUsers({ tenantId, pageSize: 100 } as never, canManage && canPickExisting);
  const candidates = useMemo(() => {
    if (!canPickExisting) return [];
    const already = new Set((admins ?? []).map((a) => a.id));
    return (people?.data ?? [])
      .filter((u) => u.isActive && !already.has(u.id))
      .filter((u) => {
        const roles = u.roles as string[];
        return isLeague
          ? !roles.includes('LEAGUE_ADMIN')
          : !roles.some((r) => ['SYSTEM_ADMIN', 'TENANT_ADMIN', 'LEAGUE_ADMIN', 'TEAM_ADMIN'].includes(r));
      })
      .map((u) => ({ value: u.id, label: `${nameOf(u)} · ${u.email}` }))
      .sort((a, b) => a.label.localeCompare(b.label, 'fr'));
  }, [people, admins, canPickExisting, isLeague]);

  const give = () => {
    if (!picked) return;
    grant.mutate(
      { userId: picked, role, ...scopeIds },
      {
        onSuccess: (p) => {
          toast.success(
            isLeague
              ? `${nameOf(p)} administre désormais ${scopeName}.`
              : `${nameOf(p)} est désormais responsable ${de(scopeName)}.`,
          );
          setPicked('');
        },
        onError: (e) => toastApiError(e),
      },
    );
  };

  return (
    <div className="space-y-4">
      {isLoading ? (
        <p className="text-sm text-ink-muted">Chargement…</p>
      ) : (admins ?? []).length === 0 ? (
        <p className="rounded-lg border border-dashed border-line px-4 py-6 text-center text-sm text-ink-muted">
          {isLeague ? 'Personne n’administre encore cette compétition.' : 'Ce club n’a pas encore de responsable.'}
        </p>
      ) : (
        <ul className="divide-y divide-line rounded-lg border border-line">
          {(admins ?? []).map((a) => (
            <li key={a.id} className="flex flex-wrap items-center justify-between gap-3 px-3.5 py-2.5">
              <div className="min-w-0">
                <p className="text-sm font-medium text-ink">{nameOf(a)}</p>
                <p className="truncate text-xs text-ink-subtle">
                  {a.email}
                  {a.lastLoginAt !== undefined && (
                    <> · {a.lastLoginAt ? `dernière connexion : ${formatDateFr(a.lastLoginAt).toLowerCase()}` : 'aucune connexion'}</>
                  )}
                </p>
              </div>
              {canManage && (
                <Button size="sm" variant="ghost" onClick={() => setRemoving(a)}>
                  <UserMinus className="mr-1.5 h-3.5 w-3.5" aria-hidden />
                  Retirer
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}

      {canManage && (
        <div className="space-y-3">
          {canPickExisting && (
            <div className="flex flex-wrap items-end gap-2">
              <div className="min-w-0 flex-1">
                <SelectField
                  label="Une personne de l’organisation"
                  placeholder={candidates.length ? 'Choisir une personne de l’organisation' : 'Personne de disponible'}
                  value={picked}
                  onChange={setPicked}
                  options={candidates}
                  className="w-full"
                  disabled={!candidates.length}
                />
              </div>
              <Button variant="primary" onClick={give} disabled={!picked || grant.isPending}>
                {isLeague ? 'Confier la compétition' : 'Confier le club'}
              </Button>
            </div>
          )}
          <Button variant="outline" onClick={() => setInviting(true)}>
            <UserPlus className="mr-1.5 h-4 w-4" aria-hidden />
            Inviter quelqu’un
          </Button>
          {!canPickExisting && (
            <p className="text-xs text-ink-subtle">
              Une adresse qui a déjà un compte dans l’organisation reçoit simplement le rôle.
            </p>
          )}
        </div>
      )}

      <InviteDialog
        open={inviting}
        onOpenChange={setInviting}
        tenantId={tenantId}
        preset={{ role, ...scopeIds, scopeLabel: `${roleLabel(role)} · ${scopeName}` }}
      />
      <ConfirmDialog
        open={!!removing}
        onOpenChange={(o) => !o && setRemoving(null)}
        title={`Retirer ${removing ? nameOf(removing) : ''} ?`}
        description={`Cette personne ne pourra plus gérer ${scopeName}. Son compte reste actif ; vous pourrez lui confier à nouveau ce rôle.`}
        confirmLabel="Retirer"
        onConfirm={() => {
          if (!removing) return;
          const who = nameOf(removing);
          revoke.mutate(
            { userId: removing.id, role },
            {
              onSuccess: () => toast.success(`${who} ne gère plus ${scopeName}.`),
              onError: (e) => toastApiError(e),
            },
          );
          setRemoving(null);
        }}
      />
    </div>
  );
}
