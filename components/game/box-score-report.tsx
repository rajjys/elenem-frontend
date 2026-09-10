'use client';

import { useMemo, useState } from 'react';
import { AlertTriangle, ClipboardList, Loader2, Pencil } from 'lucide-react';
import { Button } from '@/components/ui';
import {
  useBoxScore,
  type BoxScore,
  type BoxScorePlayer,
  type BoxScoreSide,
  type StatColumn,
} from '@/services/box-score';
import { PlayerQuickView } from '@/components/players/player-quick-view';
import { BoxScoreDialog } from './box-score-dialog';
import { cn } from '@/utils';

/**
 * The scoresheet as something to **read**.
 *
 * The match page used to render the entry grid inline: twelve rows per side, an input in every
 * cell, a tick column, an « Ajouter un joueur » form. That is the right shape for *typing up* a
 * sheet from paper and the wrong one for looking at one, and it was visibly wrong for a club
 * administrator — they cannot write a sheet, so they got the whole grid with every field greyed
 * out and no explanation.
 *
 * A box score answers one question — **who scored, and how** — so it is a list, best first, with
 * the breakdown said out loud rather than spread across eight columns a reader has to decode
 * against a header row: « Bahati · 18 — 2 × 3 pts · 6 × 2 pts · 5 Ftes ».
 *
 * **Editing happens in one place**, the dialog, reached from the pencil here or from the calendar's
 * day panel. That is `UI_CONVENTIONS` §1: a page reads a resource, a modal commits an act.
 *
 * As everywhere in this module, no statistic is named in this file. The multiplication sign appears
 * only where a unit is worth more than a point — « 2 × 3 pts » is how a scorer says it, « 5 LF » is
 * how they say that — and both come off the sport's own column list.
 */
export function BoxScoreReport({
  gameId,
  homeName,
  awayName,
}: {
  gameId: string;
  homeName?: string;
  awayName?: string;
}) {
  const { data, isPending, isError, refetch } = useBoxScore(gameId);
  const [editing, setEditing] = useState(false);
  const [viewing, setViewing] = useState<string | null>(null);

  if (isPending) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-5 w-5 animate-spin text-ink-subtle" aria-hidden />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <p className="rounded-xl border border-dashed border-line px-4 py-12 text-center text-sm text-ink-muted">
        La feuille de match n&apos;a pas pu être chargée.
      </p>
    );
  }

  const edit = (
    <BoxScoreDialog
      open={editing}
      onClose={() => setEditing(false)}
      gameId={gameId}
      homeName={homeName}
      awayName={awayName}
      onSaved={() => refetch()}
    />
  );

  // Nothing typed yet. The commonest state at this customer, and not a failure: the community
  // manager enters a final score from the stands and types a sheet up only when somebody sends
  // him a photo of one.
  if (!data.recorded) {
    return (
      <>
        <div className="rounded-xl border border-dashed border-line bg-surface px-4 py-14 text-center">
          <ClipboardList className="mx-auto mb-3 h-8 w-8 text-ink-subtle" aria-hidden />
          <p className="font-medium text-ink">Aucune feuille de match saisie</p>
          <p className="mx-auto mt-1.5 max-w-md text-sm text-ink-muted">
            {data.editable
              ? 'Le score final est enregistré, mais personne n’a encore relevé qui a marqué. Saisissez-la à partir de la feuille des officiels.'
              : data.notEditableReason ??
                'Ce match garde son score final : il n’attribue simplement aucune statistique individuelle.'}
          </p>
          {data.editable && (
            <Button variant="primary" className="mt-4" onClick={() => setEditing(true)}>
              <ClipboardList className="mr-1.5 h-4 w-4" aria-hidden />
              Saisir la feuille de match
            </Button>
          )}
        </div>
        {edit}
      </>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-ink-muted">
            {data.appearances} joueur{data.appearances > 1 ? 's' : ''} sur la feuille.
          </p>
          {/* The only way back into the grid. Quiet, because reading is what this screen is for. */}
          {data.editable && (
            <Button variant="outline" onClick={() => setEditing(true)}>
              <Pencil className="mr-1.5 h-4 w-4" aria-hidden />
              Modifier la feuille
            </Button>
          )}
        </div>

        {/* Side by side once there is room.
            
            A box score is read by *comparing* — who outscored whom, which bench turned up — and two
            columns is how the paper it comes from is laid out. Stacked, the second club begins
            below the fold and the comparison becomes a scroll. Below `lg` they stack, because
            eight names and a breakdown do not fit twice across a phone. */}
        <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
          <SideReport side={data.home} sheet={data} onOpenPlayer={setViewing} />
          <SideReport side={data.away} sheet={data} onOpenPlayer={setViewing} />
        </div>
      </div>

      {edit}
      {viewing && (
        <PlayerQuickView playerId={viewing} onOpenChange={(o) => !o && setViewing(null)} />
      )}
    </>
  );
}

function SideReport({
  side,
  sheet,
  onOpenPlayer,
}: {
  side: BoxScoreSide;
  sheet: BoxScore;
  onOpenPlayer: (playerId: string) => void;
}) {
  const { scorers, silent } = useMemo(() => {
    const played = side.players.filter((p) => p.played);
    // Someone who took the floor and neither scored nor fouled has a row on the paper and nothing
    // in it. Giving them a full line each would bury the people the reader came for, so they are
    // named together at the foot — present, which is the fact that matters about them.
    const hasAnything = (p: BoxScorePlayer) => Object.values(p.stats).some((v) => v > 0);
    return {
      scorers: played
        .filter(hasAnything)
        .sort((a, b) => b.total - a.total || a.lastName.localeCompare(b.lastName, 'fr')),
      silent: played.filter((p) => !hasAnything(p)),
    };
  }, [side.players]);

  /**
   * The discrepancy the officials check for on paper.
   *
   * Never resolved silently — a sheet that disagrees with the recorded result is the only signal
   * that something was mistyped, and `reconcilesWithFinalScore` is false for sports where the two
   * can never match anyway (volleyball's result is sets).
   */
  const mismatch =
    sheet.reconcilesWithFinalScore &&
    side.finalScore !== null &&
    side.total !== side.finalScore;

  return (
    <section className="overflow-hidden rounded-xl border border-line bg-surface">
      <header className="flex items-baseline justify-between gap-3 border-b border-line bg-surface-sunk px-4 py-2.5">
        <h3 className="truncate text-sm font-semibold text-ink">{side.name}</h3>
        <p className="shrink-0 text-sm tabular-nums text-ink">
          <span className="text-base font-semibold">{side.total}</span>
          <span className="ml-1 text-xs font-normal text-ink-subtle">{sheet.totalAbbr}</span>
        </p>
      </header>

      {mismatch && (
        <p className="flex items-start gap-2 border-b border-caution/40 bg-caution-soft px-4 py-2.5 text-sm text-ink">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-caution" aria-hidden />
          <span>
            La feuille totalise {side.total}, le score final en indique {side.finalScore}. L&apos;un
            des deux a été mal recopié.
          </span>
        </p>
      )}

      {scorers.length === 0 && silent.length === 0 ? (
        <p className="px-4 py-6 text-center text-sm text-ink-muted">
          Aucun joueur relevé pour ce club.
        </p>
      ) : (
        <ul className="divide-y divide-line">
          {scorers.map((p) => (
            <li key={p.playerId} className="flex items-start justify-between gap-3 px-4 py-2.5">
              <div className="min-w-0">
                <button
                  type="button"
                  onClick={() => onOpenPlayer(p.playerId)}
                  className="text-left text-sm font-medium text-ink transition-colors hover:text-accent-text hover:underline hover:underline-offset-2"
                >
                  {p.lastName} <span className="font-normal text-ink-muted">{p.firstName}</span>
                </button>
                {p.jerseyNumber !== null && p.jerseyNumber !== undefined && (
                  <span className="ml-1.5 text-xs tabular-nums text-ink-subtle">
                    #{p.jerseyNumber}
                  </span>
                )}
                <p className="mt-0.5 text-xs">
                  <Breakdown columns={sheet.columns} stats={p.stats} />
                </p>
              </div>
              <p
                className={cn(
                  'shrink-0 text-sm tabular-nums',
                  p.total > 0 ? 'font-semibold text-ink' : 'text-ink-subtle',
                )}
              >
                {p.total}
              </p>
            </li>
          ))}
        </ul>
      )}

      {silent.length > 0 && (
        <p className="border-t border-line px-4 py-2.5 text-xs text-ink-subtle">
          Également sur le terrain :{' '}
          {silent.map((p) => `${p.lastName} ${p.firstName}`.trim()).join(', ')}
        </p>
      )}
    </section>
  );
}

/**
 * A line, said the way a scorer says it.
 *
 * The multiplication sign earns its place only where one unit is worth more than one point —
 * « 2 × 3 pts » means *two threes*, and the reader multiplies. « 5 LF » is five free throws and
 * five points; « 5 × LF » would invite the same multiplication and get sixty.
 *
 * What is worth nothing is **set apart, not mixed in**. Read as one run, « 2 × 3 pts · 6 × 2 pts ·
 * 5 Ftes » invites the reader to add the last term to the total and come up short by five every
 * time. A dash and a quieter colour say: this happened, it is not part of the number on the right.
 *
 * Both rules are on the weight, never on a code, so a football sheet reads « 2 Buts — 1 CJ » with
 * nothing in this file changed.
 */
function Breakdown({
  columns,
  stats,
}: {
  columns: StatColumn[];
  stats: Record<string, number>;
}) {
  const said = (c: StatColumn) => (c.weight > 1 ? `${stats[c.code]} × ${c.abbr}` : `${stats[c.code]} ${c.abbr}`);
  const present = columns.filter((c) => (stats[c.code] ?? 0) > 0);
  const scoring = present.filter((c) => c.weight > 0).map(said);
  const rest = present.filter((c) => c.weight === 0).map(said);

  if (!scoring.length && !rest.length) return <span className="text-ink-subtle">—</span>;

  return (
    <>
      {scoring.length > 0 && <span className="text-ink-muted">{scoring.join(' · ')}</span>}
      {rest.length > 0 && (
        <span className="text-ink-subtle">
          {scoring.length > 0 ? ' — ' : ''}
          {rest.join(' · ')}
        </span>
      )}
    </>
  );
}
