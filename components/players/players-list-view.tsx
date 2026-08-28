'use client';

import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Plus, Search, Trash2, Pencil, Users } from 'lucide-react';
import { Button, Input, LoadingSpinner, Pagination, ConfirmDialog, ErrorState } from '@/components/ui';
import { usePlayers, useDeletePlayer } from '@/services/players';
import { useDebounce } from 'use-debounce';
import { toastApiError } from '@/utils';
import type { Player, PlayerFilterParams } from '@/schemas/player-schemas';
import { PlayerFormDialog } from './player-form-dialog';
import { BulkRosterDialog } from './bulk-roster-dialog';

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
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch] = useDebounce(search, 400);
  const [editing, setEditing] = useState<Player | null>(null);
  const [creating, setCreating] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [toDelete, setToDelete] = useState<Player | null>(null);

  const pageSize = 20;
  const filters: PlayerFilterParams = useMemo(
    () => ({ q: debouncedSearch || undefined, leagueId, teamId, tenantId, page, pageSize }),
    [debouncedSearch, leagueId, teamId, tenantId, page],
  );

  const { data, isLoading, isError, refetch } = usePlayers(filters);
  const del = useDeletePlayer();

  const players = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const confirmDelete = () => {
    if (!toDelete) return;
    del.mutate(toDelete.id, {
      onSuccess: () => toast.success(`${toDelete.firstName} ${toDelete.lastName} retiré de l'effectif.`),
      onError: (e) => toastApiError(e),
    });
    setToDelete(null);
  };

  if (isError) {
    return <ErrorState title="Impossible de charger les joueurs." reset={() => refetch()} />;
  }

  return (
    <div className="p-6">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
          <p className="text-sm text-gray-500">
            {total} {total === 1 ? 'joueur enregistré' : 'joueurs enregistrés'}
          </p>
        </div>
        {canManage && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setBulkOpen(true)}>
              <Users className="mr-2 h-4 w-4" />
              Ajouter une liste
            </Button>
            <Button variant="primary" onClick={() => setCreating(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Nouveau joueur
            </Button>
          </div>
        )}
      </header>

      <div className="mb-4 max-w-sm">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Rechercher un joueur…"
            className="pl-9"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="py-16">
          <LoadingSpinner />
        </div>
      ) : players.length === 0 ? (
        <EmptyRoster canManage={canManage} searching={!!debouncedSearch} onAdd={() => setBulkOpen(true)} />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="w-16 px-4 py-3">N°</th>
                <th className="px-4 py-3">Joueur</th>
                <th className="px-4 py-3">Poste</th>
                <th className="px-4 py-3">Équipe</th>
                <th className="px-4 py-3">Compte</th>
                {canManage && <th className="w-24 px-4 py-3 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {players.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono tabular-nums text-gray-500">
                    {p.jerseyNumber ?? '—'}
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {p.firstName} {p.lastName}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{p.position ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{p.currentTeam?.name ?? '—'}</td>
                  <td className="px-4 py-3">
                    {p.email ? (
                      <span className="text-gray-600">{p.email}</span>
                    ) : (
                      // Deliberately not framed as missing data: most players have no email and
                      // never will. A roster entry without an account is the normal case.
                      <span className="text-xs text-gray-400">Fiche d&apos;effectif</span>
                    )}
                  </td>
                  {canManage && (
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => setEditing(p)}
                          className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                          aria-label={`Modifier ${p.firstName} ${p.lastName}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setToDelete(p)}
                          className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                          aria-label={`Retirer ${p.firstName} ${p.lastName}`}
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
      )}

      {totalPages > 1 && (
        <div className="mt-4">
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      )}

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

      {bulkOpen && (
        <BulkRosterDialog
          open
          leagueId={leagueId}
          teamId={teamId}
          tenantId={tenantId}
          onOpenChange={setBulkOpen}
        />
      )}

      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
        title="Retirer ce joueur ?"
        description={
          toDelete
            ? `${toDelete.firstName} ${toDelete.lastName} sera retiré de l'effectif. Ses statistiques déjà enregistrées sont conservées.`
            : undefined
        }
        confirmLabel="Retirer"
        onConfirm={confirmDelete}
      />
    </div>
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
      <div className="rounded-lg border border-dashed border-gray-300 bg-white py-16 text-center">
        <p className="text-gray-500">Aucun joueur ne correspond à cette recherche.</p>
      </div>
    );
  }
  return (
    <div className="rounded-lg border border-dashed border-gray-300 bg-white py-16 text-center">
      <Users className="mx-auto mb-3 h-8 w-8 text-gray-300" />
      <p className="font-medium text-gray-900">Aucun joueur pour le moment</p>
      <p className="mx-auto mt-1 max-w-sm text-sm text-gray-500">
        Collez la feuille d&apos;équipe pour enregistrer tout l&apos;effectif d&apos;un coup. Aucune
        adresse e-mail n&apos;est nécessaire.
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
