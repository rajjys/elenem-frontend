import Link from 'next/link';
import { cn } from '@/utils/cn';
import { initials } from '@/lib/media';
import type { PublicScorers } from '@/lib/public-site/api';
import { ClubMark } from './club-mark';
import { PlayerPhoto } from './player-photo';

type Row = PublicScorers['rows'][number];

/**
 * The top three of the Marqueurs, where an image stands out (owner, 2026-10-07): the player's photo,
 * or their club's crest when they have none. Shown only when one of the three has either; a league
 * with no images keeps the plain table rather than three cards of initials.
 *
 * On a phone each card is a row — face, name and club, the total — the name on up to two lines rather
 * than cut, and on a wider screen the three
 * stand side by side. The leader's card carries the one accent: it means something.
 */
export function ScorersPodium({ board }: { board: PublicScorers }) {
  const top = board.rows.filter((r) => r.rank <= 3).slice(0, 3);
  if (top.length === 0 || !top.some((r) => r.photoUrl || r.club?.logoUrl)) return null;
  return (
    <ol aria-label="En tête" className="grid gap-3 sm:grid-cols-3">
      {top.map((r) => (
        <li key={`${r.rank}-${r.jerseyNumber}-${r.club?.name}`}>
          <Card row={r} totalAbbr={board.totalAbbr} />
        </li>
      ))}
    </ol>
  );
}

function Card({ row, totalAbbr }: { row: Row; totalAbbr: string }) {
  const lead = row.rank === 1;
  const name = row.name ?? `n° ${row.jerseyNumber ?? '–'}`;
  return (
    <div
      className={cn(
        'flex h-full items-center gap-4 rounded-2xl border bg-surface p-4 sm:flex-col sm:gap-3 sm:p-5 sm:text-center',
        lead ? 'border-accent-line shadow-e1' : 'border-line',
      )}
    >
      <div className="relative shrink-0">
        {row.photoUrl ? (
          <PlayerPhoto url={row.photoUrl} size={lead ? 88 : 72} />
        ) : row.club?.logoUrl ? (
          <ClubMark club={row.club} size="lg" />
        ) : (
          <span
            aria-hidden
            className="flex h-14 w-14 items-center justify-center rounded-full bg-surface-sunk text-base font-bold text-ink-muted sm:h-16 sm:w-16"
          >
            {initials(row.name ?? row.club?.name)}
          </span>
        )}
        <span
          className={cn(
            'absolute -left-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold tabular-nums ring-2 ring-surface',
            lead ? 'bg-accent text-accent-ink' : 'bg-ink text-canvas',
          )}
        >
          {row.rank}
        </span>
      </div>
      <div className="min-w-0 flex-1 sm:w-full">
        {row.slug ? (
          <Link href={`/players/${row.slug}`} className="line-clamp-2 break-words font-semibold leading-snug text-ink hover:underline">
            {name}
          </Link>
        ) : (
          <span className="line-clamp-2 break-words font-semibold leading-snug text-ink">{name}</span>
        )}
        {row.club && (
          <span className="mt-0.5 flex items-center gap-1.5 text-xs text-ink-muted sm:justify-center">
            {row.photoUrl && <ClubMark club={row.club} size="xs" />}
            <span className="truncate">{row.club.name}</span>
          </span>
        )}
      </div>
      <div className="shrink-0 text-right sm:text-center">
        <p className="text-2xl font-bold leading-none tabular-nums text-ink">{row.total}</p>
        <p className="mt-1 text-xs text-ink-muted">
          {totalAbbr} · {row.average.toLocaleString('fr-FR')} / match
        </p>
      </div>
    </div>
  );
}
