'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useDebounce } from 'use-debounce';
import { toast } from 'sonner';
import { Pencil, Shield, Trash2 } from 'lucide-react';
import { Button, ConfirmDialog, ListPage, ListToolbar, SelectField } from '@/components/ui';
import { useScopeContext } from '@/hooks/useScopeContext';
import { useAuthStore } from '@/store/auth.store';
import { Roles, type TeamFilterParams } from '@/schemas';
import { useTeams, useDeleteTeam, type TeamListItem } from '@/services/teams';
import { useStandingsLeagues } from '@/services/standings';
import { toastApiError } from '@/utils';

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
    }),
    [page, debounced, pinnedTenantId, pinnedLeagueId],
  );

  const ready = scope === 'platform' || !!pinnedTenantId || !!pinnedLeagueId;
  const { data, isLoading, isError, refetch } = useTeams(filters, ready);
  const del = useDeleteTeam();

  const teams = data?.data ?? [];
  const totalItems = data?.totalItems ?? 0;

  // Narrowing to one competition shortens the list; staying on page 4 of it strands the reader.
  useEffect(() => setPage(1), [debounced, leagueId]);

  const confirmDelete = () => {
    if (!toDelete) return;
    del.mutate(toDelete.id, {
      onSuccess: () => toast.success(`${toDelete.name} supprimé.`),
      onError: (e) => toastApiError(e),
    });
    setToDelete(null);
  };

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
      action={canManage ? { label: 'Nouveau club', href: '/team/create' } : undefined}
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
        </ListToolbar>
      }
      isLoading={isLoading}
      isError={isError}
      onRetry={() => refetch()}
      isEmpty={teams.length === 0}
      empty={<EmptyTeams canManage={canManage} searching={!!debounced} />}
      page={page}
      totalPages={data?.totalPages ?? 1}
      onPageChange={setPage}
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
                {canManage && <th className="w-24 px-4 py-3 text-right">Actions</th>}
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
                        Inactif
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
                      <div className="flex justify-end gap-1">
                        <Link
                          href={`/team/edit?ctxTeamId=${team.id}`}
                          className="rounded p-1.5 text-ink-subtle hover:bg-surface-sunk hover:text-ink"
                          aria-label={`Modifier ${team.name}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => setToDelete(team)}
                          className="rounded p-1.5 text-ink-subtle hover:bg-negative-soft hover:text-negative"
                          aria-label={`Supprimer ${team.name}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* `window.confirm` is the browser's dialog, not the product's, and it cannot name what is
          about to be lost in the product's own words. */}
      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
        title="Supprimer ce club ?"
        description={
          toDelete
            ? `${toDelete.name} sera retiré de la compétition. Ses matchs déjà joués restent au classement.`
            : undefined
        }
        confirmLabel="Supprimer"
        onConfirm={confirmDelete}
      />
    </ListPage>
  );
}

function EmptyTeams({ canManage, searching }: { canManage: boolean; searching: boolean }) {
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
      {canManage && (
        <Button variant="primary" className="mt-4" asChild>
          <Link href="/team/create">Ajouter un club</Link>
        </Button>
      )}
    </div>
  );
}
