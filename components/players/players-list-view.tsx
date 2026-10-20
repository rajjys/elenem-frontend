'use client';

import { useMemo, useState } from 'react';
import { Archive, ArchiveRestore, Trash2, Pencil, Users } from 'lucide-react';
import { Button, ListPage, ListToolbar, RowMenu } from '@/components/ui';
import { ArchiveDialog, DeleteDialog, useReactivate } from '@/components/deletion';
import { toastApiError } from '@/utils';
import { usePlayers } from '@/services/players';
import { useCurrentUser } from '@/hooks/useAuth';
import { Roles } from '@/schemas/enums';
import { useDebounce } from 'use-debounce';
import type { Player, PlayerFilterParams } from '@/schemas/player-schemas';
import { PlayerFormDialog } from './player-form-dialog';
import { BulkRosterDialog } from './bulk-roster-dialog';
import { PlayerQuickView } from './player-quick-view';

/**
 * Scope-agnostic roster list. `GET /players` is already scoped by the caller's role, so the
 * tenant, league and team surfaces all mount this and only differ by the filters they pin.
 *
 * Pinned filters (`leagueId`, `teamId`) are passed by the host page and are not user-editable —
 * a team admin looking at their roster should not be able to filter their way out of it.
 */
export function PlayersListView({
  title = 'Joueurs',
  leagueId,
  teamId,
  tenantId,
  canManage = true,
}: {
  title?: string;
  leagueId?: string;
  teamId?: string;
  tenantId?: string;
  canManage?: boolean;
}) {
  /**
   * Who owns the register.
   *
   * `POST /players` and `DELETE /players/:id` are SYSTEM / TENANT / LEAGUE only — registering and
   * removing a player is the organiser's, which matches how this market works: one person enters
   * everything (`ROADMAP_V2` §6, A3). `PUT /players/:id` *does* admit a club administrator, so a
   * club can correct its own shirt number or position.
   *
   * The screen used to offer a club all three. « Nouveau joueur », « Ajouter une liste » and the
   * bin each produced a 403 — three buttons whose only outcome was a refusal, on the one screen a
   * club opens most.
   */
  const user = useCurrentUser();
  const isOrganiser = (user?.roles ?? []).some(
    (r) => r === Roles.SYSTEM_ADMIN || r === Roles.TENANT_ADMIN || r === Roles.LEAGUE_ADMIN,
  );
  const canRegister = canManage && isOrganiser;
  const canEdit = canManage;

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch] = useDebounce(search, 400);
  const [editing, setEditing] = useState<Player | null>(null);
  const [creating, setCreating] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [toDelete, setToDelete] = useState<Player | null>(null);
  // Archived players leave the roster and stay on every sheet they played (RESOURCE_DELETION.md R3).
  const [showArchived, setShowArchived] = useState(false);
  const [archiving, setArchiving] = useState<Player | null>(null);
  const { reactivate, isPending: reactivating } = useReactivate('player');
  /**
   * Whose figures are open.
   *
   * The name is the control, not a row-wide click: the row already carries two buttons that mean
   * something else, and a row that both edits and opens depending on where you land on it is a row
   * that eventually does the wrong one. Clicking a person's name to see that person is also what
   * every list in the product already trains the reader to expect.
   */
  const [viewing, setViewing] = useState<Player | null>(null);

  const pageSize = 20;
  const filters: PlayerFilterParams = useMemo(
    () => ({
      q: debouncedSearch || undefined, leagueId, teamId, tenantId, page, pageSize,
      ...(showArchived ? { isActive: false } : {}),
    }),
    [debouncedSearch, leagueId, teamId, tenantId, page, showArchived],
  );

  const { data, isLoading, isError, refetch } = usePlayers(filters);

  const players = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <ListPage
      title={title}
      description={`${total} ${total === 1 ? 'joueur enregistré' : 'joueurs enregistrés'}`}
      action={canRegister ? { label: 'Nouveau joueur', onClick: () => setCreating(true) } : undefined}
      secondaryAction={
        canRegister ? { label: 'Ajouter une liste', onClick: () => setBulkOpen(true), icon: Users } : undefined
      }
      // The same toolbar the clubs list uses, so *find the row I want* looks identical two links
      // apart. It carried a hand-positioned icon over a bare Input before, which is where the
      // divergence started.
      filters={
        <ListToolbar
          search={search}
          onSearchChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
          placeholder="Rechercher un joueur…"
        >
          {canRegister && (
            <label className="inline-flex h-9 cursor-pointer select-none items-center gap-2 rounded-md border border-line bg-surface px-3 text-sm text-ink-muted hover:text-ink">
              <input
                type="checkbox"
                className="h-4 w-4 accent-accent"
                checked={showArchived}
                onChange={(e) => {
                  setShowArchived(e.target.checked);
                  setPage(1);
                }}
              />
              Archivés
            </label>
          )}
        </ListToolbar>
      }
      isLoading={isLoading}
      isError={isError}
      onRetry={() => refetch()}
      isEmpty={players.length === 0}
      empty={
        showArchived ? (
          <div className="rounded-lg border border-dashed border-line bg-surface py-12 text-center text-sm text-ink-muted">
            {debouncedSearch ? 'Aucune fiche archivée ne correspond à cette recherche.' : 'Aucune fiche archivée.'}
          </div>
        ) : (
          <EmptyRoster canManage={canRegister} searching={!!debouncedSearch} onAdd={() => setBulkOpen(true)} />
        )
      }
      page={page}
      totalPages={totalPages}
      onPageChange={setPage}
      overlays={
        <>
        {(creating || editing) && (
          <PlayerFormDialog
            open
            player={editing}
            leagueId={leagueId}
            teamId={teamId}
            tenantId={tenantId}
            onOpenChange={(o) => {
              if (!o) {
                setCreating(false);
                setEditing(null);
              }
            }}
          />
        )}

        {/* Modal-first: photo, club, number, position, the season line and the last five games, with
            a way out to the full page. Most of what anyone wants to know about a player is answered
            without leaving the roster (`docs/PLAYERS_AND_STATS.md` §2.1). */}
        {viewing && (
          <PlayerQuickView
            playerId={viewing.id}
            onOpenChange={(o) => !o && setViewing(null)}
          />
        )}

        {bulkOpen && (
          <BulkRosterDialog
            open
            leagueId={leagueId}
            teamId={teamId}
            tenantId={tenantId}
            onOpenChange={setBulkOpen}
          />
        )}

        {/* A player on a match sheet is archived, not deleted (RESOURCE_DELETION.md §1). The copy
            here used to say « statistiques conservées » about the very thing that blocked it. */}
        <DeleteDialog
          resource="player"
          id={toDelete?.id}
          open={!!toDelete}
          onOpenChange={(o) => !o && setToDelete(null)}
          alternatives={{
            archive: { label: 'Archiver la fiche', onSelect: () => setArchiving(toDelete) },
          }}
        />
        <ArchiveDialog
          kind="player"
          target={archiving ? { id: archiving.id, name: `${archiving.firstName} ${archiving.lastName}` } : null}
          onOpenChange={(o) => !o && setArchiving(null)}
        />
        </>
      }
    >
      <>
        <div className="overflow-x-auto rounded-lg border border-line bg-surface">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="border-b border-line bg-surface-sunk text-left text-xs uppercase tracking-wide text-ink-muted">
              <tr>
                <th className="w-16 px-4 py-3">N°</th>
                <th className="px-4 py-3">Joueur</th>
                <th className="px-4 py-3">Poste</th>
                <th className="px-4 py-3">Équipe</th>
                <th className="px-4 py-3">Compte</th>
                {canEdit && <th className="w-16 px-4 py-3 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {players.map((p) => (
                <tr key={p.id} className="hover:bg-surface-sunk">
                  <td className="px-4 py-3 font-mono tabular-nums text-ink-muted">
                    {p.jerseyNumber ?? '—'}
                  </td>
                  <td className="px-4 py-3 font-medium text-ink">
                    <button
                      type="button"
                      onClick={() => setViewing(p)}
                      className="rounded text-left transition-colors hover:text-accent-text hover:underline hover:underline-offset-2"
                    >
                      {p.firstName} {p.lastName}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-ink-muted">{p.position ?? '—'}</td>
                  <td className="px-4 py-3 text-ink-muted">{p.currentTeam?.name ?? '—'}</td>
                  <td className="px-4 py-3">
                    {p.email ? (
                      <span className="text-ink-muted">{p.email}</span>
                    ) : (
                      // Deliberately not framed as missing data: most players have no email and
                      // never will. A roster entry without an account is the normal case.
                      <span className="text-xs text-ink-subtle">Fiche d&apos;effectif</span>
                    )}
                  </td>
                  {canEdit && (
                    <td className="px-4 py-3">
                      <div className="flex justify-end">
                        {/* One « ⋮ », as on the clubs table. Archiving and removing somebody from
                            the register are the organiser's, so a club only gets « Modifier ». */}
                        <RowMenu
                          label={`Actions pour ${p.firstName} ${p.lastName}`}
                          items={[
                            { label: 'Modifier', icon: Pencil, onSelect: () => setEditing(p) },
                            canRegister &&
                              (p.isActive === false
                                ? {
                                    label: 'Réactiver',
                                    icon: ArchiveRestore,
                                    disabled: reactivating,
                                    onSelect: () =>
                                      reactivate({ id: p.id, name: `${p.firstName} ${p.lastName}` }).catch(toastApiError),
                                  }
                                : { label: 'Archiver', icon: Archive, onSelect: () => setArchiving(p) }),
                            canRegister && { label: 'Supprimer', icon: Trash2, danger: true, onSelect: () => setToDelete(p) },
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

      </>
    </ListPage>
  );
}

function EmptyRoster({
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
        <p className="text-ink-muted">Aucun joueur ne correspond à cette recherche.</p>
      </div>
    );
  }
  return (
    <div className="rounded-lg border border-dashed border-line bg-surface py-16 text-center">
      <Users className="mx-auto mb-3 h-8 w-8 text-ink-subtle" />
      <p className="font-medium text-ink">Aucun joueur pour le moment</p>
      <p className="mx-auto mt-1 max-w-sm text-sm text-ink-muted">
        {canManage
          ? 'Collez la feuille d’équipe pour enregistrer tout l’effectif d’un coup. Aucune adresse e-mail n’est nécessaire.'
          : 'Les joueurs sont enregistrés par la compétition. Contactez-la pour compléter votre effectif.'}
      </p>
      {canManage && (
        <Button variant="primary" className="mt-4" onClick={onAdd}>
          <Users className="mr-2 h-4 w-4" />
          Ajouter une liste de joueurs
        </Button>
      )}
    </div>
  );
}
