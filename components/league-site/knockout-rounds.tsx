import type { PublicKnockout } from '@/lib/public-site/api';
import { formatDate, formatTime } from '@/lib/public-site/format';
import { MatchRow } from './match-row';

type Stage = PublicKnockout['stages'][number];
type Planned = Stage['rounds'][number]['planned'][number];

/** Rounds named from the end, as a bracket is read: the last is the final. */
const FROM_THE_END = ['Finale', 'Demi-finales', 'Quarts de finale', 'Huitièmes de finale'];

/**
 * A knockout phase round by round (PHASE5B_LEAGUE_SITES §6, Phase finale): the games played, and
 * the fixtures still to be decided with the labels the organiser wrote — « Vainqueur demi 1 » —
 * marked « si nécessaire » when a game is only played if needed. A list per round rather than a
 * drawn bracket: it says the same thing, and it reads on a phone (§4.8).
 */
export function KnockoutRounds({ stage }: { stage: Stage }) {
  const rounds = stage.rounds;
  if (rounds.length === 0) {
    return (
      <p className="rounded-xl border border-line bg-surface px-5 py-8 text-center text-sm text-ink-muted">
        Le tableau de cette phase sera publié ici.
      </p>
    );
  }
  return (
    <div className="space-y-5">
      {rounds.map((round, i) => {
        // A phase that *is* the round (« Demi-finales ») needs no second label.
        const label = rounds.length > 1 ? (FROM_THE_END[rounds.length - 1 - i] ?? `Tour ${round.round ?? i + 1}`) : null;
        return (
          <div key={`${round.round ?? 'x'}-${i}`}>
            {label && <h3 className="mb-1.5 px-1 text-xs font-semibold uppercase tracking-wide text-ink-subtle">{label}</h3>}
            <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">
              {round.games.map((g) => (
                <MatchRow key={g.slug} game={g} competitionLabel={formatDate(g.localDate)} />
              ))}
              {round.planned.map((p, j) => (
                <PlannedRow key={`p-${j}`} fixture={p} />
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

function PlannedRow({ fixture }: { fixture: Planned }) {
  return (
    <li className="grid grid-cols-[4.75rem_minmax(0,1fr)] items-center gap-x-3 px-4 py-3 sm:grid-cols-[5.5rem_minmax(0,1fr)] sm:px-5">
      <div className="flex flex-col items-start gap-1">
        <span className="text-sm font-semibold tabular-nums text-ink">{formatTime(fixture.localTime)}</span>
        {fixture.conditional && (
          <span className="rounded-md bg-surface-sunk px-1.5 py-0.5 text-center text-[0.7rem] font-semibold leading-tight text-ink-muted">
            si nécessaire
          </span>
        )}
      </div>
      <div className="min-w-0 space-y-1.5">
        <p className="truncate text-[0.7rem] font-semibold uppercase tracking-wide text-ink-subtle">
          {formatDate(fixture.localDate)}
          {fixture.hall ? ` · ${fixture.hall}` : ''}
        </p>
        <p className="truncate italic text-ink-muted">{fixture.homeLabel}</p>
        <p className="truncate italic text-ink-muted">{fixture.awayLabel}</p>
      </div>
    </li>
  );
}
