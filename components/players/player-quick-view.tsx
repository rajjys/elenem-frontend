'use client';

import Link from 'next/link';
import { ArrowRight, ChevronRight, Loader2, Shirt } from 'lucide-react';
import { Button, Modal } from '@/components/ui';
import { usePlayerStats, type PlayerGameLine } from '@/services/player-stats';
import { cn } from '@/utils';

/**
 * A player, in a dialog, with real content — and a way out to the page.
 *
 * The instinct behind item 15 was *modal-first: most work never leaves the list*, and it is the
 * same instinct that made the calendar's day panel right. Opening a roster of two hundred names one
 * full page at a time, and going back each time, is how the answer to "how many has he scored"
 * stops being worth looking up.
 *
 * So this holds the whole answer for the common case — the season line, and the last five games —
 * and the page holds the rest. Nothing here is a summary of the page: it is the same numbers,
 * derived by the same endpoint, with fewer rows.
 */
export function PlayerQuickView({
  playerId,
  seasonId,
  stageId,
  onOpenChange,
}: {
  playerId: string;
  seasonId?: string;
  stageId?: string;
  onOpenChange: (open: boolean) => void;
}) {
  const { data, isPending, isError } = usePlayerStats(playerId, seasonId, stageId);

  const title = data ? `${data.firstName} ${data.lastName}` : 'Joueur';

  return (
    <Modal
      open
      onOpenChange={onOpenChange}
      title={title}
      className="max-w-xl"
      footer={
        <div className="flex justify-end">
          <Button variant="primary" asChild>
            <Link href={`/player/${playerId}`}>
              Ouvrir la fiche du joueur
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
      ) : isError || !data ? (
        <p className="py-12 text-center text-sm text-ink-muted">
          Impossible de charger les statistiques de ce joueur.
        </p>
      ) : (
        <div className="space-y-5 pb-2">
          <div className="flex items-start gap-4">
            <PlayerAvatar url={data.profileImageUrl} name={`${data.firstName} ${data.lastName}`} />
            <div className="min-w-0 text-sm">
              <p className="font-medium text-ink">{data.teamName ?? 'Sans club'}</p>
              <p className="text-ink-muted">
                {[data.position, data.jerseyNumber !== null ? `#${data.jerseyNumber}` : null]
                  .filter(Boolean)
                  .join(' · ') || '—'}
              </p>
              <p className="mt-1 text-xs text-ink-subtle">
                {data.leagueName} · {data.seasonName}
                {stageId && data.stages.find((s) => s.id === stageId)
                  ? ` · ${data.stages.find((s) => s.id === stageId)!.name}`
                  : ''}
              </p>
            </div>
          </div>

          {/* The season line, in the sport's own columns. `MJ` first because an average means
              nothing without the count behind it. */}
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            <Figure label="Matchs joués" value={data.gamesPlayed} />
            {data.columns.map((c) => (
              <Figure
                key={c.code}
                label={c.label}
                abbr={c.abbr}
                value={data.stats[c.code] ?? 0}
                quiet={c.weight === 0}
              />
            ))}
            <Figure label={data.totalLabel} abbr={data.totalAbbr} value={data.total} strong />
            <Figure
              label={`${data.totalLabel} par match`}
              abbr="Moy."
              value={data.average.toFixed(1)}
            />
          </div>

          <div>
            <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-ink-subtle">
              Derniers matchs
            </h3>
            {data.games.length === 0 ? (
              <p className="rounded-lg border border-dashed border-line px-3 py-6 text-center text-sm text-ink-muted">
                Aucune feuille de match saisie pour ce joueur cette saison.
              </p>
            ) : (
              <ul className="divide-y divide-line rounded-lg border border-line">
                {data.games.slice(0, 5).map((g) => (
                  <GameRow key={g.gameId} game={g} totalAbbr={data.totalAbbr} />
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}

/**
 * One line of the game log, and the whole row is the link.
 *
 * A dialog holds nothing unsaved, so leaving it costs nothing — unlike the scoresheet, where the
 * same click had to become a nested dialog instead. « Combien il a marqué contre Katindo » leads
 * straight to « et comment s'est passé ce match », and the answer is a page away.
 */
function GameRow({ game, totalAbbr }: { game: PlayerGameLine; totalAbbr: string }) {
  return (
    <li>
      <Link
        href={`/game/${game.gameId}`}
        className="flex items-center justify-between gap-3 px-3 py-2 text-sm transition-colors hover:bg-surface-sunk"
      >
      <div className="min-w-0">
        <p className="truncate text-ink">
          <span className="text-ink-subtle">{game.isHome ? 'vs' : 'à'}</span> {game.opponentName}
        </p>
        <p className="text-xs text-ink-subtle">
          {new Date(game.dateTime).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'short',
          })}
          {' · '}
          {game.stageName}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        {game.teamScore !== null && (
          <span
            className={cn(
              'tabular-nums',
              game.outcome === 'WIN' ? 'text-positive' : game.outcome === 'LOSS' ? 'text-negative' : 'text-ink-muted',
            )}
          >
            {game.teamScore}–{game.opponentScore}
          </span>
        )}
        <span className="w-14 text-right font-medium tabular-nums text-ink">
          {game.total} {totalAbbr}
        </span>
        <ChevronRight className="h-4 w-4 shrink-0 text-ink-subtle" aria-hidden />
      </div>
      </Link>
    </li>
  );
}

function Figure({
  label,
  abbr,
  value,
  strong,
  quiet,
}: {
  label: string;
  abbr?: string;
  value: number | string;
  strong?: boolean;
  quiet?: boolean;
}) {
  return (
    <div
      className={cn(
        'rounded-lg border border-line px-2.5 py-2 text-center',
        strong ? 'bg-surface-sunk' : 'bg-surface',
      )}
      title={label}
    >
      <p
        className={cn(
          'tabular-nums',
          strong ? 'text-lg font-semibold text-ink' : 'text-base font-medium',
          quiet ? 'text-ink-subtle' : 'text-ink',
        )}
      >
        {value}
      </p>
      <p className="mt-0.5 truncate text-[0.6875rem] uppercase tracking-wide text-ink-subtle">
        {abbr ?? label}
      </p>
    </div>
  );
}

/**
 * A crest-less avatar.
 *
 * Photos are item 17 and S3 is not wired, so most players have none and will for a while. Initials
 * over a tinted square is the honest placeholder; a broken image icon on two hundred rows is not.
 */
function PlayerAvatar({ url, name }: { url: string | null; name: string }) {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');

  if (url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={url} alt="" className="h-16 w-16 shrink-0 rounded-lg object-cover" />;
  }
  return (
    <div
      className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-surface-sunk text-lg font-semibold text-ink-subtle"
      aria-hidden
    >
      {initials || <Shirt className="h-6 w-6" />}
    </div>
  );
}
