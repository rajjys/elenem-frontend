'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useDebounce } from 'use-debounce';
import { toast } from 'sonner';
import { MailWarning, Trash2, UserPlus, Users as UsersIcon } from 'lucide-react';
import {
  Button,
  ConfirmDialog,
  ListPage,
  ListToolbar,
  SelectField,
} from '@/components/ui';
import { useUsers, useDeleteUser } from '@/services/users';
import { Roles } from '@/schemas/enums';
import type { UserFilterParams } from '@/schemas/user-schemas';
import { meaningfulRoles, roleLabel, ROLE_LABELS } from '@/utils/role-labels';
import { formatDateFr, toastApiError } from '@/utils';
import { UserQuickView } from './user-quick-view';

const PAGE_SIZE = 20;

/**
 * The people who can sign in, and what each of them may do.
 *
 * This was the last pre-Phase-2 list on an organiser surface, and it read like one: **no heading at
 * all**, so you arrived at a table and worked out what it was from the sidebar; English column
 * heads — First Name, Last Name, Username, ROLES — in a French-only product; « Search by name,
 * email, or username » over a « More Filters » dialog of 303 lines; roles printed straight out of
 * the enum as `GENERAL USER, LEAGUE AD…`, clipped mid-word by a column too narrow for them; and
 * `window.confirm` for deletion.
 *
 * It is the roster's shape now, because it is the roster's job: a title, the action on its line, a
 * search box under it, a table you scan. What is different is **what the table is *about***. A
 * user's name is administrative; what they can *do* is the reason anybody opens this screen, so the
 * role is a column of its own in words, and the filter is by role rather than by the six fields the
 * old dialog offered.
 *
 * See `UI_CONVENTIONS` §2 for the header, and `utils/role-labels.ts` for why a role is a job rather
 * than an enum.
 */
export function UsersListView({
  basePath,
  createHref,
  scope,
}: {
  /** Where a user's full record lives on this surface. */
  basePath: string;
  createHref?: string;
  /**
   * Pinned by the host page from the current context. Without it every surface showed the same
   * list: a club's `/team/users` returned every account in the organisation, because the only
   * scoping was the backend's role check and nothing narrowed by what you had opened.
   */
  scope?: { tenantId?: string; managingLeagueId?: string; managingTeamId?: string };
}) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debounced] = useDebounce(search, 400);
  const [role, setRole] = useState('');
  const [viewing, setViewing] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<{ id: string; name: string } | null>(null);

  const filters: UserFilterParams = useMemo(
    () => ({
      page,
      pageSize: PAGE_SIZE,
      search: debounced || undefined,
      ...(role ? { role } : {}),
      sortBy: 'createdAt',
      sortOrder: 'desc',
    }),
    [page, debounced, role],
  ) as UserFilterParams;

  // Scope is not user-editable: someone looking at a club's users should not be able to filter
  // their way out of that club.
  const { data, isLoading, isError, refetch } = useUsers({ ...filters, ...scope });
  const del = useDeleteUser();

  const users = data?.data ?? [];
  const totalItems = data?.totalItems ?? users.length;

  useEffect(() => setPage(1), [debounced, role]);

  /**
   * Which roles are worth offering as a filter.
   *
   * Only the ones that mean something today. `COACH`, `REFEREE` and `PLAYER` exist in the enum and
   * grant nothing yet — offering them would be a filter that always returns nothing, which reads
   * as a broken screen rather than an empty category.
   */
  const roleOptions = [
    Roles.TENANT_ADMIN,
    Roles.LEAGUE_ADMIN,
    Roles.TEAM_ADMIN,
    Roles.GENERAL_USER,
  ].map((r) => ({ value: r, label: ROLE_LABELS[r] }));

  return (
    <ListPage
      title="Utilisateurs"
      description={`${totalItems} ${totalItems === 1 ? 'compte' : 'comptes'}`}
      action={createHref ? { label: 'Nouvel utilisateur', href: createHref, icon: UserPlus } : undefined}
      filters={
        <ListToolbar
          search={search}
          onSearchChange={setSearch}
          placeholder="Rechercher un nom, un e-mail…"
        >
          <SelectField
            label="Rôle"
            placeholder="Tous les rôles"
            value={role}
            onChange={setRole}
            className="w-60"
            options={roleOptions}
          />
        </ListToolbar>
      }
      isLoading={isLoading}
      isError={isError}
      onRetry={() => refetch()}
      isEmpty={users.length === 0}
      empty={
        <div className="rounded-lg border border-dashed border-line bg-surface py-16 text-center">
          <UsersIcon className="mx-auto mb-3 h-8 w-8 text-ink-subtle" aria-hidden />
          <p className="font-medium text-ink">
            {debounced || role ? 'Aucun compte ne correspond' : 'Aucun utilisateur pour le moment'}
          </p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-ink-muted">
            {debounced || role
              ? 'Essayez un autre nom, ou retirez le filtre par rôle.'
              : 'Invitez les personnes qui vous aident à tenir la compétition : saisie des scores, publication des résultats.'}
          </p>
          {createHref && !debounced && !role && (
            <Button variant="primary" className="mt-4" asChild>
              <Link href={createHref}>Inviter quelqu’un</Link>
            </Button>
          )}
        </div>
      }
      page={page}
      totalPages={data?.totalPages ?? 1}
      onPageChange={setPage}
      overlays={
        <>
          {viewing && (
            <UserQuickView
              userId={viewing}
              detailHref={`${basePath}/${viewing}`}
              onOpenChange={(o) => !o && setViewing(null)}
            />
          )}
          <ConfirmDialog
            open={!!toDelete}
            onOpenChange={(o) => !o && setToDelete(null)}
            title="Supprimer ce compte ?"
            description={
              toDelete
                ? `${toDelete.name} perdra l’accès à Elenem. Ce qu’il a saisi — scores, feuilles de match — reste enregistré.`
                : undefined
            }
            confirmLabel="Supprimer"
            onConfirm={() => {
              if (!toDelete) return;
              del.mutate(toDelete.id, {
                onSuccess: () => toast.success(`${toDelete.name} supprimé.`),
                onError: (e) => toastApiError(e),
              });
              setToDelete(null);
            }}
          />
        </>
      }
    >
      <div className="overflow-hidden rounded-xl border border-line bg-surface">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[42rem] text-sm">
            <thead className="border-b border-line bg-surface-sunk text-left text-xs uppercase tracking-wide text-ink-subtle">
              <tr>
                <th className="px-4 py-3">Personne</th>
                <th className="px-4 py-3">Rôle</th>
                <th className="hidden px-4 py-3 lg:table-cell">Dernière connexion</th>
                <th className="w-16 px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {users.map((u) => {
                const name = `${u.firstName} ${u.lastName}`.trim() || u.username;
                return (
                  <tr key={u.id} className="hover:bg-surface-sunk">
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => setViewing(u.id)}
                        className="text-left font-medium text-ink transition-colors hover:text-accent-text hover:underline hover:underline-offset-2"
                      >
                        {name}
                      </button>
                      <p className="flex items-center gap-1.5 text-xs text-ink-subtle">
                        {u.email}
                        {/* The commonest reason somebody cannot get in, said on the row rather
                            than only inside the record. */}
                        {!u.isEmailVerified && (
                          <span
                            className="inline-flex items-center gap-1 text-caution"
                            title="Adresse non vérifiée — cette personne ne peut pas se connecter."
                          >
                            <MailWarning className="h-3 w-3 shrink-0" aria-hidden />
                            non vérifiée
                          </span>
                        )}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {meaningfulRoles(u.roles).map((r) => (
                          <span
                            key={r}
                            className="rounded-full bg-surface-sunk px-2 py-0.5 text-xs text-ink-muted"
                          >
                            {roleLabel(r)}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="hidden px-4 py-3 text-ink-muted lg:table-cell">
                      {u.lastLoginAt ? (
                        formatDateFr(u.lastLoginAt)
                      ) : (
                        <span className="text-ink-subtle">Jamais</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end">
                        <button
                          onClick={() => setToDelete({ id: u.id, name })}
                          className="rounded p-1.5 text-ink-subtle hover:bg-negative-soft hover:text-negative"
                          aria-label={`Supprimer ${name}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </ListPage>
  );
}
