'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useDebounce } from 'use-debounce';
import { Archive, ArchiveRestore, ListPlus, Pencil, Shield, Trash2, UserCog } from 'lucide-react';
import { Button, ListPage, ListToolbar, RowMenu, SelectField } from '@/components/ui';
import { ArchiveDialog, DeleteDialog, useReactivate } from '@/components/deletion';
import { useScopeContext } from '@/hooks/useScopeContext';
import { useAuthStore } from '@/store/auth.store';
import { Roles, type TeamFilterParams } from '@/schemas';
import { useTeams, type TeamListItem } from '@/services/teams';
import { useStandingsLeagues } from '@/services/standings';
import { toastApiError } from '@/utils';
import { TeamFormDialog } from './team-form-dialog';
import { BulkTeamsDialog } from './bulk-teams-dialog';
import { TeamAdminsDialog } from './team-admins-dialog';

const PAGE_SIZE = 20;

/**
 * The clubs of an organisation, or of one competition.
 *
 * Two pages of ~190 lines each, written before the templates existed, became one. They had no
 * heading at all — you arrived at a table and had to work out what it was of — an English-headed
 * table with `↑`/`↓` text sort indicators, a `window.confirm` for deletion, and a 453-line filter
 * dialog with a country dropdown in it, on a screen listing ten clubs in one town.
 *
 * It now reads like the roster two links away, because it is the same act: a title, a primary
 * action on the title's line, a search box under it, a table. What a club's row *offers* still
 * differs by role; what the screen *looks like* no longer does.
 */
export function TeamsListView({
  scope,
}: {
  scope: 'tenant' | 'league' | 'platform';
}) {
  const ctx = useScopeContext();
  const user = useAuthStore((s) => s.user);
  const roles = useMemo(() => user?.roles ?? [], [user?.roles]);

  const isSystemAdmin = roles.includes(Roles.SYSTEM_ADMIN);
  const canManage = roles.some(
    (r) => r === Roles.SYSTEM_ADMIN || r === Roles.TENANT_ADMIN || r === Roles.LEAGUE_ADMIN,
  );

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debounced] = useDebounce(search, 400);
  const [leagueId, setLeagueId] = useState('');
  const [toDelete, setToDelete] = useState<TeamListItem | null>(null);
  // Archived clubs keep their history and leave the present (RESOURCE_DELETION.md R3); they are
  // found again here, and only here.
  const [showArchived, setShowArchived] = useState(false);
  const [archiving, setArchiving] = useState<TeamListItem | null>(null);
  const { reactivate, isPending: reactivating } = useReactivate('team');
  /**
   * Both ways in, on the header, with equal weight.
   *
   * A competition's clubs arrive as a *list* at least as often as one at a time — a WhatsApp
   * message, a photographed page — so neither path is the exception. Same shape as the roster's
   * « Nouveau joueur » / « Ajouter une liste ».
   */
  const [creating, setCreating] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [editing, setEditing] = useState<TeamListItem | null>(null);
  const [staffing, setStaffing] = useState<TeamListItem | null>(null);

  // The organisation's list may narrow to one competition; a competition's list is already one and
  // offers no picker. A club belongs to exactly one, so this is the only filter either page needs —
  // the country, city, state, established-year, visibility and sport filters the old dialog carried
  // were filters on a list of ten clubs in one town.
  const leagues = useStandingsLeagues(scope === 'tenant');
  const leagueOptions = useMemo(() => leagues.data?.data ?? [], [leagues.data]);

  const pinnedTenantId = scope === 'platform' ? undefined : (ctx.tenantId ?? user?.tenantId ?? undefined);
  const pinnedLeagueId = scope === 'league' ? ctx.leagueId : leagueId || undefined;

  const filters: TeamFilterParams = useMemo(
    () => ({
      page,
      pageSize: PAGE_SIZE,
      search: debounced || undefined,
      sortBy: 'name',
      sortOrder: 'asc',
      ...(pinnedTenantId ? { tenantId: pinnedTenantId } : {}),
      ...(pinnedLeagueId ? { leagueId: pinnedLeagueId } : {}),
      ...(showArchived ? { isActive: false } : {}),
    }),
    [page, debounced, pinnedTenantId, pinnedLeagueId, showArchived],
  );

  const ready = scope === 'platform' || !!pinnedTenantId || !!pinnedLeagueId;
  const { data, isLoading, isError, refetch } = useTeams(filters, ready);

  const teams = data?.data ?? [];
  const totalItems = data?.totalItems ?? 0;

  // Narrowing to one competition shortens the list; staying on page 4 of it strands the reader.
  useEffect(() => setPage(1), [debounced, leagueId, showArchived]);

  /** Where a club's own surface is, with whatever context the reader needs to get in. */
  const dashboardHref = (team: TeamListItem) => {
    const params = new URLSearchParams();
    if (isSystemAdmin) params.append('ctxTenantId', team.tenantId);
    if (isSystemAdmin || roles.includes(Roles.TENANT_ADMIN)) {
      params.append('ctxLeagueId', team.leagueId);
    }
    params.append('ctxTeamId', team.id);
    return `/team/dashboard?${params.toString()}`;
  };

  return (
    <ListPage
      title="Équipes"
      description={`${totalItems} ${totalItems === 1 ? 'club enregistré' : 'clubs enregistrés'}`}
      action={canManage ? { label: 'Nouveau club', onClick: () => setCreating(true) } : undefined}
      secondaryAction={
        canManage
          ? { label: 'Ajouter une liste', onClick: () => setBulkOpen(true), icon: ListPlus }
          : undefined
      }
      filters={
        <ListToolbar
          search={search}
          onSearchChange={setSearch}
          placeholder="Rechercher un club…"
        >
          {scope === 'tenant' && leagueOptions.length > 1 && (
            <SelectField
              label="Compétition"
              placeholder="Toutes les compétitions"
              value={leagueId}
              onChange={setLeagueId}
              className="w-64"
              // No « toutes » row here: `SelectField` renders `placeholder` as that row and maps
              // it to the empty string. Passing one as well is what made this screen throw.
              options={leagueOptions.map((l) => ({ value: l.id, label: l.name }))}
            />
          )}
          {canManage && (
            <label className="inline-flex h-9 cursor-pointer select-none items-center gap-2 rounded-md border border-line bg-surface px-3 text-sm text-ink-muted hover:text-ink">
              <input
                type="checkbox"
                className="h-4 w-4 accent-accent"
                checked={showArchived}
                onChange={(e) => setShowArchived(e.target.checked)}
              />
              Archivés
            </label>
          )}
        </ListToolbar>
      }
      isLoading={isLoading}
      isError={isError}
      onRetry={() => refetch()}
      isEmpty={teams.length === 0}
      empty={
        showArchived ? (
          <div className="rounded-lg border border-dashed border-line bg-surface py-12 text-center text-sm text-ink-muted">
            {debounced ? 'Aucun club archivé ne correspond à cette recherche.' : 'Aucun club archivé.'}
          </div>
        ) : (
        <EmptyTeams
          canManage={canManage}
          searching={!!debounced}
          onAdd={() => setBulkOpen(true)}
        />
        )
      }
      page={page}
      totalPages={data?.totalPages ?? 1}
      onPageChange={setPage}
      overlays={
        <>
          <TeamAdminsDialog
            team={staffing}
            onOpenChange={(o) => !o && setStaffing(null)}
            canManage={canManage}
            // Listing the organisation's people is its administrators' (a competition's lists only
            // its own); they pick, the others invite.
            canPickExisting={isSystemAdmin || roles.includes(Roles.TENANT_ADMIN)}
          />
        <TeamFormDialog
          open={creating}
          onOpenChange={setCreating}
          leagueId={scope === 'league' ? (ctx.leagueId ?? undefined) : undefined}
        />
        <TeamFormDialog
          open={!!editing}
          onOpenChange={(o) => !o && setEditing(null)}
          team={editing}
        />
        <BulkTeamsDialog
          open={bulkOpen}
          onOpenChange={setBulkOpen}
          leagueId={scope === 'league' ? (ctx.leagueId ?? undefined) : undefined}
        />
        {/* A club that has played is archived, not deleted; one that never played goes with its
            unplayed games. The dialog says which, from the API (RESOURCE_DELETION.md §1). */}
        <DeleteDialog
          resource="team"
          id={toDelete?.id}
          open={!!toDelete}
          onOpenChange={(o) => !o && setToDelete(null)}
          alternatives={{
            archive: { label: 'Archiver le club', onSelect: () => setArchiving(toDelete) },
          }}
        />
        <ArchiveDialog
          kind="team"
          target={archiving ? { id: archiving.id, name: archiving.name } : null}
          onOpenChange={(o) => !o && setArchiving(null)}
        />
        </>
      }
    >
      <div className="overflow-hidden rounded-xl border border-line bg-surface">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[36rem] text-sm">
            <thead className="border-b border-line bg-surface-sunk text-left text-xs uppercase tracking-wide text-ink-subtle">
              <tr>
                <th className="px-4 py-3">Club</th>
                <th className="w-20 px-4 py-3">Code</th>
                <th className="px-4 py-3">Compétition</th>
                <th className="hidden px-4 py-3 sm:table-cell">Ville</th>
                {canManage && <th className="w-16 px-4 py-3 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {teams.map((team) => (
                <tr key={team.id} className="hover:bg-surface-sunk">
                  <td className="px-4 py-3">
                    <Link
                      href={dashboardHref(team)}
                      className="font-medium text-ink transition-colors hover:text-accent-text hover:underline hover:underline-offset-2"
                    >
                      {team.name}
                    </Link>
                    {team.isActive === false && (
                      <span className="ml-2 rounded bg-surface-sunk px-1.5 py-0.5 text-xs text-ink-subtle">
                        Archivé
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs uppercase text-ink-muted">
                    {team.shortCode || '—'}
                  </td>
                  <td className="px-4 py-3 text-ink-muted">{team.league?.name ?? '—'}</td>
                  <td className="hidden px-4 py-3 text-ink-muted sm:table-cell">
                    {team.businessProfile?.city || '—'}
                  </td>
                  {canManage && (
                    <td className="px-4 py-3">
                      {/* One « ⋮ » rather than four icons: the names need the width, and each
                          action reads as its word (the owner, 2026-10-20). */}
                      <div className="flex justify-end">
                        <RowMenu
                          label={`Actions pour ${team.name}`}
                          items={[
                            { label: 'Responsables', icon: UserCog, onSelect: () => setStaffing(team) },
                            { label: 'Modifier', icon: Pencil, onSelect: () => setEditing(team) },
                            team.isActive === false
                              ? {
                                  label: 'Réactiver',
                                  icon: ArchiveRestore,
                                  disabled: reactivating,
                                  onSelect: () => reactivate({ id: team.id, name: team.name }).catch(toastApiError),
                                }
                              : { label: 'Archiver', icon: Archive, onSelect: () => setArchiving(team) },
                            { label: 'Supprimer', icon: Trash2, danger: true, onSelect: () => setToDelete(team) },
                          ]}
                        />
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </ListPage>
  );
}

function EmptyTeams({
  canManage,
  searching,
  onAdd,
}: {
  canManage: boolean;
  searching: boolean;
  onAdd: () => void;
}) {
  if (searching) {
    return (
      <div className="rounded-lg border border-dashed border-line bg-surface py-16 text-center">
        <p className="text-ink-muted">Aucun club ne correspond à cette recherche.</p>
      </div>
    );
  }
  return (
    <div className="rounded-lg border border-dashed border-line bg-surface py-16 text-center">
      <Shield className="mx-auto mb-3 h-8 w-8 text-ink-subtle" aria-hidden />
      <p className="font-medium text-ink">Aucun club pour le moment</p>
      <p className="mx-auto mt-1 max-w-sm text-sm text-ink-muted">
        Une compétition sans clubs ne peut recevoir aucun calendrier : ce sont eux qui se
        rencontrent.
      </p>
      {/* The list, not the single form: an empty competition is one whose entry list has not been
          entered yet, and that is a list. */}
      {canManage && (
        <Button variant="primary" className="mt-4" onClick={onAdd}>
          Ajouter la liste des clubs
        </Button>
      )}
    </div>
  );
}
