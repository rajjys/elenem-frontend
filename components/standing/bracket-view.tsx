'use client';

import React from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { usePlannedFixtures, useStageTies } from '@/services/planned-fixtures';
import { LoadingSpinner } from '@/components/ui';
import { useSurfaceLink } from '@/hooks/useSurfaceLink';

/**
 * A knockout phase, which has a bracket rather than a table.
 *
 * `StageFormat` declares what a phase produces and the standings screen obeys it: `LEAGUE` and
 * `GROUPS` give a table, `KNOCKOUT` gives this. Nothing had to ask "is this a play-off" — the
 * format is data (docs/STAGES_AND_PLAYOFFS.md §2.1).
 *
 * Rounds are read from the fixtures themselves rather than from a bracket structure, because that
 * is how this competition's play-off actually arrives: agreed by a committee, entered as fixtures,
 * with some of them not yet having teams. A drawn tie and a reserved slot sit in the same round,
 * which is what the federation's own calendar prints.
 */
export function BracketView({ stageId, stageName }: { stageId: string; stageName: string }) {
  const surfaceLink = useSurfaceLink();
  const planned = usePlannedFixtures(stageId);
  // A phase's ties, asked for as a phase. Not read from the calendar: the calendar caps its range
  // at 400 days because it answers "what is on this month", and a play-off spans what it spans.
  const drawn = useStageTies(stageId);

  if (planned.isLoading || drawn.isLoading) return <LoadingSpinner />;

  const ties = drawn.data ?? [];
  const toDraw = planned.data ?? [];

  if (ties.length === 0 && toDraw.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-line bg-surface p-8 text-center">
        <p className="text-sm font-medium text-ink">« {stageName} » n’a pas encore de rencontres.</p>
        <p className="mx-auto mt-2 max-w-md text-sm text-ink-muted">
          Une phase à élimination directe ne produit pas de classement : elle se lit comme un
          tableau. Ajoutez ses rencontres depuis le calendrier — y compris celles dont les équipes
          ne sont pas encore connues.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-ink-muted">
        « {stageName} » est une phase à élimination directe : elle ne produit pas de classement.
      </p>

      <ul className="divide-y divide-line overflow-hidden rounded-lg border border-line bg-surface">
        {ties.map((e) => (
          <li key={e.id}>
            <Link
              href={surfaceLink(`/game/${e.id}`)}
              className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-surface-sunk"
            >
              <span className="w-32 shrink-0 text-xs text-ink-muted">
                {format(new Date(e.dateTime), 'EEE d MMM HH:mm', { locale: fr })}
              </span>
              <span className="min-w-0 flex-1 truncate text-sm text-ink">
                {e.homeTeam.name} <span className="text-ink-subtle">—</span> {e.awayTeam.name}
              </span>
              {e.homeScore !== null && e.awayScore !== null && (
                <span className="shrink-0 text-sm font-semibold tabular-nums text-ink">
                  {e.homeScore}–{e.awayScore}
                </span>
              )}
            </Link>
          </li>
        ))}

        {/* The ties that have a hall and an hour but not yet two teams. EUBAGO print exactly this:
            `FINALE 2026 · GAME 1` on a booked date, and `BARRAGE` rows marked « SI NECESSITE ». */}
        {toDraw.map((p) => (
          <li key={p.id} className="flex items-center gap-3 bg-caution-soft/40 px-4 py-2.5">
            <span className="w-32 shrink-0 text-xs text-caution">
              {format(new Date(p.dateTime), 'EEE d MMM HH:mm', { locale: fr })}
            </span>
            <span className="min-w-0 flex-1 truncate text-sm text-ink">
              {p.homeLabel} <span className="text-ink-subtle">—</span> {p.awayLabel}
            </span>
            <span className="shrink-0 text-xs text-ink-muted">
              {p.conditional ? 'si nécessaire' : 'à définir'}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
