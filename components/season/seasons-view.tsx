'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { CalendarDays, CheckCircle2, Layers, ListOrdered, Trash2 } from 'lucide-react';
import {
  Button,
  LoadingSpinner,
  PageHeader,
  PageShell,
  SeasonStatusBadge,
  Pagination,
} from '@/components/ui';
import { SeasonStatus, Roles } from '@/schemas';
import { useScopeContext, useContextualLink } from '@/hooks';
import { useCurrentUser } from '@/hooks/useAuth';
import {
  useSeasons,
  useDeleteSeason,
  type SeasonRow,
} from '@/services/seasons';
import { describeShape, useStages } from '@/services/stages';
import { toastApiError } from '@/utils';
import { toast } from 'sonner';
import { SeasonFormDialog } from './season-form-dialog';
import { SeasonMoveDialog, type SeasonMove } from './season-move-dialog';

/**
 * A competition's seasons, and everything you may do to one.
 *
 * This screen exists because the alternative did not survive being argued for.
 * `/season/[seasonId]/dashboard` was a stub, and when we asked what it would hold, every answer
 * already had a better home: fixtures on the calendar, which is tenant-level because one hall on
 * one Saturday is one resource; the table on the standings screen, which already has a season
 * picker; the points rule in the competition's settings. What was left over is four verbs and a
 * date range — and verbs belong beside the thing they act on, which is the only list that shows
 * more than one season at a time. See docs/SEASON_AND_DASHBOARDS.md §4.
 *
 * *Editions* is the customer's word, not ours: their published calendar is headed
 * « CALENDRIER DU CHAMPIONNAT LOCAL EUBAGO 2026 · 31ème ÉDITION ».
 */
export function SeasonsView({ scope }: { scope: 'league' | 'admin' }) {
  const ctx = useScopeContext();
  const user = useCurrentUser();
  const { buildLink } = useContextualLink();

  const isSystemAdmin = (user?.roles ?? []).includes(Roles.SYSTEM_ADMIN);
  const leagueId = scope === 'league' ? ctx.leagueId ?? undefined : undefined;

  const [page, setPage] = useState(1);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<SeasonRow | null>(null);
  const [moving, setMoving] = useState<{ season: SeasonRow; move: SeasonMove } | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  // A competition's own screen waits for its context rather than listing the whole organisation:
  // `/league/seasons` with no `ctxLeagueId` yet resolved would flash every season the reader can
  // see and then narrow, which reads as data changing under them.
  const enabled = scope === 'admin' || !!leagueId;
  const seasons = useSeasons({ leagueId, page }, enabled);
  const remove = useDeleteSeason();

  const rows = useMemo(() => seasons.data?.data ?? [], [seasons.data]);

  async function onDelete(season: SeasonRow) {
    setDeleting(season.id);
    try {
      await remove.mutateAsync(season.id);
      toast.success(`« ${season.name} » supprimée.`);
    } catch (err) {
      // The server refuses in French and says what to do instead — a season with fixtures should
      // be cancelled, not deleted, because cancelling keeps the record of what was arranged.
      toastApiError(err, 'Cette saison n’a pas pu être supprimée.');
    } finally {
      setDeleting(null);
    }
  }

  if (!enabled) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10 text-center text-sm text-ink-muted sm:px-6">
        Choisissez une compétition pour voir ses saisons.
      </div>
    );
  }

  return (
    <PageShell>
      <PageHeader
        title="Saisons"
        description={
          scope === 'league'
            ? 'Les éditions de cette compétition. Une seule se joue à la fois ; les autres se préparent.'
            : 'Toutes les saisons de la plateforme.'
        }
        // A season belongs to a competition, and the platform-wide list is not standing in one.
        // Offering creation here would have to ask which — that question is the competitions list,
        // and each competition already carries this screen.
        action={
          scope === 'league' ? { label: 'Nouvelle saison', onClick: () => setCreating(true) } : undefined
        }
      />

      {seasons.isLoading && <LoadingSpinner />}

      {seasons.isError && (
        <p className="rounded-md border border-line bg-surface p-6 text-center text-sm text-negative">
          Les saisons n’ont pas pu être chargées.
        </p>
      )}

      {seasons.isSuccess && rows.length === 0 && (
        <div className="rounded-lg border border-dashed border-line bg-surface p-8 text-center">
          <p className="text-sm font-medium text-ink">Aucune saison pour l’instant.</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-ink-muted">
            Une compétition sans saison ne peut recevoir aucun match : c’est la saison qui porte le
            calendrier et le classement.
          </p>
          {scope === 'league' && (
            <Button variant="primary" className="mt-4" onClick={() => setCreating(true)}>
              Créer la première saison
            </Button>
          )}
        </div>
      )}

      <div className="space-y-3">
        {rows.map((season) => (
          <SeasonCard
            key={season.id}
            season={season}
            scope={scope}
            calendarHref={buildLink('/league/calendar', { ctxLeagueId: season.leagueId })}
            standingsHref={buildLink('/league/standings', { ctxLeagueId: season.leagueId })}
            formatHref={buildLink(`/league/seasons/${season.id}/format`, { ctxLeagueId: season.leagueId })}
            onEdit={() => setEditing(season)}
            onMove={(move) => setMoving({ season, move })}
            onDelete={() => onDelete(season)}
            deleting={deleting === season.id}
            canDelete={isSystemAdmin || season.fixtureCount === 0}
          />
        ))}
      </div>

      {(seasons.data?.totalPages ?? 1) > 1 && (
        <div className="mt-6">
          <Pagination
            currentPage={seasons.data?.currentPage ?? 1}
            totalPages={seasons.data?.totalPages ?? 1}
            onPageChange={setPage}
          />
        </div>
      )}

      <SeasonFormDialog
        open={creating}
        onClose={() => setCreating(false)}
        leagueId={leagueId ?? ctx.leagueId ?? ''}
        existing={null}
      />
      <SeasonFormDialog
        open={!!editing}
        onClose={() => setEditing(null)}
        leagueId={editing?.leagueId ?? ''}
        existing={editing}
      />
      <SeasonMoveDialog
        open={!!moving}
        onClose={() => setMoving(null)}
        season={moving?.season ?? null}
        move={moving?.move ?? null}
      />
    </PageShell>
  );
}

/* ---------------------------------------------------------------------------------------------
 * One season
 * ------------------------------------------------------------------------------------------- */

/**
 * The moves legal from each state, with the consequence of each in a few words.
 *
 * The client offers verbs and the server is the authority: `SeasonStateService` holds the real
 * transition map and refuses anything else in French, naming both states. That is the same split
 * the calendar's fixture dialog uses — a screen offers what it has room to offer, and cannot make
 * an illegal move stick by being out of date.
 */
const MOVES: Record<SeasonStatus, SeasonMove[]> = {
  [SeasonStatus.PLANNING]: [
    {
      to: SeasonStatus.ACTIVE,
      label: 'Ouvrir la saison',
      consequence: 'Les résultats comptent à partir de maintenant.',
      done: 'est ouverte',
      needsReason: false,
      tone: 'primary',
    },
    {
      to: SeasonStatus.CANCELED,
      label: 'Annuler la saison',
      consequence: 'Plus aucun match ni résultat. Le calendrier reste au dossier.',
      done: 'est annulée',
      needsReason: true,
      tone: 'danger',
    },
  ],
  [SeasonStatus.ACTIVE]: [
    {
      to: SeasonStatus.COMPLETED,
      label: 'Terminer la saison',
      consequence: 'Le classement devient définitif. La saison suivante peut s’ouvrir.',
      done: 'est terminée',
      needsReason: true,
      tone: 'primary',
    },
    {
      to: SeasonStatus.CANCELED,
      label: 'Annuler la saison',
      consequence: 'Plus aucun match ni résultat, et le classement ne veut plus rien dire.',
      done: 'est annulée',
      needsReason: true,
      tone: 'danger',
    },
  ],
  [SeasonStatus.COMPLETED]: [
    {
      to: SeasonStatus.ACTIVE,
      label: 'Rouvrir la saison',
      consequence: 'Pour corriger un résultat homologué en retard. Le classement peut changer.',
      done: 'est rouverte',
      needsReason: true,
      tone: 'default',
    },
  ],
  [SeasonStatus.CANCELED]: [
    {
      to: SeasonStatus.PLANNING,
      label: 'Remettre en préparation',
      consequence: 'La saison redevient modifiable.',
      done: 'est de nouveau en préparation',
      needsReason: true,
      tone: 'default',
    },
  ],
};

function SeasonCard({
  season,
  scope,
  calendarHref,
  standingsHref,
  formatHref,
  onEdit,
  onMove,
  onDelete,
  deleting,
  canDelete,
}: {
  season: SeasonRow;
  scope: 'league' | 'admin';
  calendarHref: string;
  standingsHref: string;
  formatHref: string;
  onEdit: () => void;
  onMove: (move: SeasonMove) => void;
  onDelete: () => void;
  deleting: boolean;
  canDelete: boolean;
}) {
  const moves = MOVES[season.status] ?? [];
  // The season's shape, when it has one. A single phase has no shape to describe, and printing
  // « Saison régulière » beside a season would be saying the same thing twice.
  const stages = useStages(season.id);
  const shape = describeShape(stages.data ?? []);
  const closed =
    season.status === SeasonStatus.COMPLETED || season.status === SeasonStatus.CANCELED;

  // Every fixture on record has a result. This is when the product *offers* the close — it never
  // performs it, because at LIPROBAKIN the playoff format is decided after the regular phase ends
  // (ROADMAP_V2 §6, A4), so a season that closed itself here would refuse the fixtures the
  // committee agrees a week later.
  const allPlayed =
    season.status === SeasonStatus.ACTIVE &&
    season.fixtureCount > 0 &&
    season.playedCount === season.fixtureCount;

  return (
    <article className="rounded-lg border border-line bg-surface p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-semibold text-ink">{season.name}</h2>
            <SeasonStatusBadge status={season.status} />
          </div>
          {scope === 'admin' && (
            <p className="mt-0.5 truncate text-xs text-ink-muted">
              {season.tenant?.name} · {season.league?.name}
            </p>
          )}
          <p className="mt-1 text-sm text-ink-muted">
            {formatRange(season.startDate, season.endDate)}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {!closed && (
            <Button variant="ghost" size="sm" onClick={onEdit}>
              Modifier
            </Button>
          )}
          {canDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onDelete}
              disabled={deleting}
              aria-label={`Supprimer ${season.name}`}
            >
              <Trash2 className="h-4 w-4 text-negative" />
            </Button>
          )}
        </div>
      </div>

      {/* What the season holds. Two numbers, and the gap between them is the honest answer to
          "why is the table incomplete" — the same gap the standings screen reports. */}
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-muted">
        <Link href={calendarHref} className="inline-flex items-center gap-1.5 nav-hover">
          <CalendarDays className="h-4 w-4" />
          {season.fixtureCount} {season.fixtureCount === 1 ? 'rencontre' : 'rencontres'}
        </Link>
        <Link href={standingsHref} className="inline-flex items-center gap-1.5 nav-hover">
          <ListOrdered className="h-4 w-4" />
          {season.playedCount} avec un résultat
        </Link>
        {/* A season's shape is the biggest thing about it, and it is the one thing this card
            could not say. Reads « Saison régulière → Play-offs », or « Format » when there is
            only one phase and there is therefore no shape to describe. */}
        <Link href={formatHref} className="inline-flex items-center gap-1.5 nav-hover">
          <Layers className="h-4 w-4" />
          {shape ?? 'Format'}
        </Link>
      </div>

      {allPlayed && (
        <p className="mt-3 flex items-start gap-2 rounded-md bg-positive-soft px-3 py-2 text-sm text-positive">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Toutes les rencontres ont un résultat. Vous pouvez terminer la saison — ou ajouter les
            matchs de la phase suivante avant de la fermer.
          </span>
        </p>
      )}

      {moves.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2 border-t border-line pt-3">
          {moves.map((move) => (
            <Button
              key={move.to}
              size="sm"
              variant={
                move.tone === 'danger'
                  ? 'ghost'
                  : move.tone === 'primary' && (allPlayed || season.status === SeasonStatus.PLANNING)
                    ? 'primary'
                    : 'outline'
              }
              className={move.tone === 'danger' ? 'text-negative' : undefined}
              onClick={() => onMove(move)}
            >
              {move.label}
            </Button>
          ))}
        </div>
      )}
    </article>
  );
}

/** "13 août 2026 → 10 mai 2027", and the year said once when both dates share it. */
function formatRange(startIso: string, endIso: string): string {
  const start = new Date(startIso);
  const end = new Date(endIso);
  const sameYear = start.getFullYear() === end.getFullYear();
  const startFmt = format(start, sameYear ? 'd MMMM' : 'd MMMM yyyy', { locale: fr });
  const endFmt = format(end, 'd MMMM yyyy', { locale: fr });
  return `${startFmt} → ${endFmt}`;
}
