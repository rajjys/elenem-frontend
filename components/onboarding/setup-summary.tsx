'use client';

import { Check } from 'lucide-react';

/**
 * What the organiser has built so far, beside the form they are filling in.
 *
 * Sign-up's panel argues the product is worth using; by this point that is settled and they are
 * three forms deep, so this one answers a different question — where am I, and what have I
 * already done. Each line fills in as its step completes, which also makes the wizard's shape
 * visible without adding another progress widget to the form column.
 *
 * Hidden below `lg`, so it must never carry anything the form itself does not also say.
 */
export function SetupSummary({
  organisation,
  league,
  season,
  teamCount,
  teamsSaved,
  current,
}: {
  organisation?: string;
  league?: string;
  season?: string;
  teamCount: number;
  /** Teams typed but not yet submitted are shown, not ticked — a tick means it exists. */
  teamsSaved?: boolean;
  current: 'league' | 'season' | 'teams' | 'done';
}) {
  const lines: { label: string; value?: string; active: boolean; done: boolean }[] = [
    { label: 'Organisation', value: organisation, active: false, done: !!organisation },
    { label: 'Compétition', value: league, active: current === 'league', done: !!league },
    { label: 'Saison', value: season, active: current === 'season', done: !!season },
    {
      label: 'Équipes',
      value: teamCount > 0 ? `${teamCount} équipe${teamCount > 1 ? 's' : ''}` : undefined,
      active: current === 'teams',
      done: !!teamsSaved && teamCount > 0,
    },
  ];

  return (
    <>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent-ink/60">
        Configuration
      </p>
      <h2 className="mt-4 text-3xl xl:text-[2.5rem] leading-[1.15] font-bold tracking-tight text-balance">
        {current === 'done' ? 'Tout est en place.' : 'Presque prêt à publier.'}
      </h2>
      <p className="mt-4 text-[0.9375rem] leading-relaxed text-accent-ink/75 max-w-sm">
        {current === 'done'
          ? 'Il ne reste qu’à générer le calendrier, puis à saisir les scores.'
          : 'Trois informations et votre championnat pourra recevoir ses matchs, son calendrier et son classement.'}
      </p>

      <dl className="mt-10 max-w-md rounded-xl bg-accent-ink/[0.07] ring-1 ring-accent-ink/15 backdrop-blur-sm divide-y divide-accent-ink/10">
        {lines.map((line) => (
          <div key={line.label} className="flex items-baseline gap-3 px-4 py-3.5">
            <span
              className={[
                'flex h-5 w-5 shrink-0 translate-y-0.5 items-center justify-center rounded-full text-[0.625rem]',
                line.done
                  ? 'bg-accent-ink/90 text-accent'
                  : line.active
                    ? 'ring-1 ring-accent-ink/50'
                    : 'ring-1 ring-accent-ink/20',
              ].join(' ')}
              aria-hidden
            >
              {line.done ? <Check size={12} strokeWidth={3} /> : null}
            </span>
            <dt className="w-28 shrink-0 text-xs uppercase tracking-wider text-accent-ink/50">
              {line.label}
            </dt>
            <dd
              className={[
                'min-w-0 flex-1 text-sm leading-snug break-words',
                line.value ? 'font-medium' : 'text-accent-ink/35',
              ].join(' ')}
            >
              {line.value ?? '—'}
            </dd>
          </div>
        ))}
      </dl>
    </>
  );
}
