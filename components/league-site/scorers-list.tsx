import type { PublicScorers } from '@/lib/public-site/api';
import { ClubMark } from './club-mark';

/** The leading scorers, for the home page: rank, player, club, points and per-game average. */
export function ScorersList({ board, limit = 5 }: { board: PublicScorers; limit?: number }) {
  const rows = board.rows.slice(0, limit);
  if (rows.length === 0) return null;
  return (
    <ol className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">
      {rows.map((r) => (
        <li key={`${r.rank}-${r.jerseyNumber}-${r.club?.name}`} className="flex items-center gap-3 px-4 py-2.5">
          <span className="w-5 text-center text-sm tabular-nums text-ink-muted">{r.rank}</span>
          {r.club && <ClubMark club={r.club} size="sm" />}
          <span className="min-w-0 flex-1">
            <span className="block truncate font-medium text-ink">{r.name ?? `n° ${r.jerseyNumber ?? '–'}`}</span>
            <span className="block truncate text-xs text-ink-muted">
              {r.club?.name ?? ''} · {r.gamesPlayed} match{r.gamesPlayed > 1 ? 's' : ''}
            </span>
          </span>
          <span className="text-right">
            <span className="block font-bold tabular-nums text-ink">{r.total}</span>
            <span className="block text-xs tabular-nums text-ink-subtle">{r.average.toLocaleString('fr-FR')} / m</span>
          </span>
        </li>
      ))}
    </ol>
  );
}
