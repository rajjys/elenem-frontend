import { PlayerPhoto } from '@/components/league-site/player-photo';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { cn } from '@/utils/cn';
import { siteGet, type PublicPlayer } from '@/lib/public-site/api';
import { getSite } from '@/lib/public-site/site';
import { formatShortDate } from '@/lib/public-site/format';
import { leagueMeta } from '@/lib/public-site/meta';
import { withParams } from '@/lib/public-site/query';
import { ClubMark } from '@/components/league-site/club-mark';
import { HomeSection } from '@/components/league-site/home-section';

/**
 * A player (the owner's request, 2026-09-30, reopening §4.8): who they are and every game of the
 * season they have a scoresheet line in, one by one. Only for a player the site may name — their
 * competition publishes identities and they are PUBLIC (§4.9); anyone else is not found.
 */

type Props = { params: Promise<{ tenantSlug: string; playerSlug: string }> };

const load = async ({ params }: Props) => {
  const { tenantSlug, playerSlug } = await params;
  const [site, player] = await Promise.all([
    getSite(tenantSlug),
    siteGet<PublicPlayer>(tenantSlug, `/players/${encodeURIComponent(playerSlug)}`),
  ]);
  return site && player ? { site, player } : null;
};

export async function generateMetadata(props: Props): Promise<Metadata> {
  const loaded = await load(props);
  if (!loaded) return {};
  const { site, player } = loaded;
  const { tenantSlug } = await props.params;
  const t = player.totals;
  return leagueMeta({
    slug: tenantSlug,
    site,
    title: `${player.name} — statistiques`,
    description: [
      player.club ? `${player.club.name}, ${player.competition.name}.` : `${player.competition.name}.`,
      t.gamesPlayed ? `${t.total} points en ${t.gamesPlayed} match${t.gamesPlayed > 1 ? 's' : ''} (${t.average.toLocaleString('fr-FR')} par match).` : null,
    ]
      .filter(Boolean)
      .join(' '),
    path: `/players/${player.slug}`,
  });
}

export default async function PlayerPage(props: Props) {
  const loaded = await load(props);
  if (!loaded) notFound();
  const { player } = loaded;
  const t = player.totals;
  const strip: [string, string, string | number][] = [
    ['MJ', 'Matchs joués', t.gamesPlayed],
    [player.totalAbbr, 'Points', t.total],
    ['Moy.', 'Moyenne par match', t.average.toLocaleString('fr-FR')],
    ...player.columns.map((c) => [c.abbr, c.label, t.stats[c.code] ?? 0] as [string, string, number]),
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-6 sm:px-6 sm:py-10">
      {player.club?.slug ? (
        <Link
          href={`/teams/${player.competition.slug}/${player.club.slug}`}
          className="inline-flex items-center gap-1 text-sm font-medium text-ink-muted hover:text-ink"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden />
          {player.club.name}
        </Link>
      ) : (
        <Link href={withParams('/stats', {}, { c: player.competition.slug })} className="inline-flex items-center gap-1 text-sm font-medium text-ink-muted hover:text-ink">
          <ChevronLeft className="h-4 w-4" aria-hidden />
          Marqueurs
        </Link>
      )}

      <section className="overflow-hidden rounded-2xl border border-line bg-surface shadow-e1">
        <div className="flex items-center gap-4 px-5 py-6 sm:px-8">
          {player.photoUrl ? (
            // The photo, round as it was framed, with the shirt number pinned to it.
            <span className="relative shrink-0">
              <PlayerPhoto url={player.photoUrl} size={80} />
              {player.jerseyNumber !== null && (
                <span className="absolute -bottom-1 -right-1 rounded-lg bg-ink px-1.5 py-0.5 text-xs font-bold tabular-nums text-canvas ring-2 ring-surface">
                  {player.jerseyNumber}
                </span>
              )}
            </span>
          ) : (
            <span
              aria-hidden
              className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-ink text-2xl font-bold tabular-nums text-canvas sm:h-20 sm:w-20 sm:text-3xl"
            >
              {player.jerseyNumber ?? '–'}
            </span>
          )}
          <div className="min-w-0">
            <h1 className="text-balance text-2xl font-bold tracking-tight text-ink sm:text-3xl">{player.name}</h1>
            <p className="mt-1 flex flex-wrap items-center gap-x-2 text-sm text-ink-muted">
              {player.position && <span>{player.position}</span>}
              {player.position && player.club && <span aria-hidden>·</span>}
              {player.club && <ClubMark club={player.club} size="xs" />}
              {player.club &&
                (player.club.slug ? (
                  <Link href={`/teams/${player.competition.slug}/${player.club.slug}`} className="font-medium text-ink hover:underline">
                    {player.club.name}
                  </Link>
                ) : (
                  <span>{player.club.name}</span>
                ))}
            </p>
            <p className="text-xs text-ink-subtle">
              {player.competition.name}
              {player.season && ` · ${player.season.name}`}
            </p>
          </div>
        </div>
        <dl className="grid grid-cols-4 border-t border-line bg-surface-sunk text-center sm:grid-cols-7">
          {strip.map(([abbr, label, value]) => (
            <div key={abbr} className="border-b border-r border-line px-1 py-3 last:border-r-0 sm:border-b-0">
              <dt title={label} className="text-[0.65rem] font-semibold uppercase tracking-wide text-ink-subtle">{abbr}</dt>
              <dd className="mt-0.5 text-lg font-bold tabular-nums text-ink">{value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <HomeSection title="Match par match">
        {player.games.length === 0 ? (
          <p className="rounded-xl border border-line bg-surface px-5 py-8 text-center text-sm text-ink-muted">
            Aucune feuille de marque ne compte encore ce joueur cette saison.
          </p>
        ) : (
          <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">
            {player.games.map(({ game, atHome, stats, total }) => {
              const opponent = atHome ? game.away : game.home;
              const own = (atHome ? game.homeScore : game.awayScore) ?? 0;
              const other = (atHome ? game.awayScore : game.homeScore) ?? 0;
              const won = own > other;
              return (
                <li key={`${game.competition.slug}/${game.slug}`}>
                  <Link href={`/games/${game.competition.slug}/${game.slug}`} className="block px-4 py-3 transition-colors hover:bg-surface-sunk sm:px-5">
                    <div className="flex items-center gap-3">
                      <span className="w-16 shrink-0 text-sm">
                        <span className="block font-medium text-ink">{formatShortDate(game.localDate)}</span>
                        <span className="block text-xs text-ink-subtle">{atHome ? 'Domicile' : 'Extérieur'}</span>
                      </span>
                      <span className="flex min-w-0 flex-1 items-center gap-2">
                        <ClubMark club={opponent} size="sm" />
                        <span className="truncate text-ink">{opponent.name}</span>
                      </span>
                      <span className="text-sm font-semibold tabular-nums text-ink">
                        {own}–{other}
                      </span>
                      <span
                        aria-label={won ? 'Victoire' : 'Défaite'}
                        className={cn(
                          'flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs font-bold',
                          won ? 'bg-positive-soft text-positive' : 'bg-negative-soft text-negative',
                        )}
                      >
                        {won ? 'V' : 'D'}
                      </span>
                    </div>
                    {/* The player's own line: each column with its figure, the total last. */}
                    <div className="mt-2 flex flex-wrap items-baseline gap-x-4 gap-y-1 pl-[4.75rem] text-sm">
                      {player.columns.map((c) => (
                        <span key={c.code} className="tabular-nums">
                          <span className="text-xs text-ink-subtle">{c.abbr}</span>{' '}
                          <span className="font-medium text-ink">{stats[c.code] ?? 0}</span>
                        </span>
                      ))}
                      <span className="ml-auto font-bold tabular-nums text-ink">
                        {total} <span className="text-xs font-semibold text-ink-subtle">{player.totalAbbr.toLowerCase()}</span>
                      </span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </HomeSection>
    </div>
  );
}
