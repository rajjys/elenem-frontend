import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { siteGet, type PublicClub } from '@/lib/public-site/api';
import { getSite } from '@/lib/public-site/site';
import { dayLabel, formatDate, todayIn } from '@/lib/public-site/format';
import { withParams } from '@/lib/public-site/query';
import { leagueMeta } from '@/lib/public-site/meta';
import { buildTenantUrl } from '@/utils/tenant-url';
import { JsonLd } from '@/components/league-site/json-ld';
import { ClubMark } from '@/components/league-site/club-mark';
import { HomeSection } from '@/components/league-site/home-section';
import { MatchRow } from '@/components/league-site/match-row';
import { ClubGameRow } from '@/components/league-site/club-game-row';
import { isPlayed } from '@/components/league-site/status-badge';

/**
 * A club (PHASE5B_LEAGUE_SITES §6): where it stands, its next game, its season game by game, and
 * its roster — the roster only when the competition publishes its players' names (§4.9), and a
 * player the league has not made public by number only.
 */

type Props = { params: Promise<{ tenantSlug: string; leagueSlug: string; teamSlug: string }> };

const load = async ({ params }: Props) => {
  const { tenantSlug, leagueSlug, teamSlug } = await params;
  const [site, club] = await Promise.all([
    getSite(tenantSlug),
    siteGet<PublicClub>(tenantSlug, `/teams/${encodeURIComponent(leagueSlug)}/${encodeURIComponent(teamSlug)}`),
  ]);
  return site && club ? { site, club } : null;
};

const ordinal = (n: number) => (n === 1 ? '1er' : `${n}e`);

export async function generateMetadata(props: Props): Promise<Metadata> {
  const loaded = await load(props);
  if (!loaded) return {};
  const { site, club } = loaded;
  const { tenantSlug } = await props.params;
  const s = club.standing;
  const next = club.nextGame;
  const opponent = next ? (next.home.name === club.club.name ? next.away.name : next.home.name) : null;
  return leagueMeta({
    slug: tenantSlug,
    site,
    path: `/teams/${club.competition.slug}/${club.club.slug}`,
    title: `${club.club.name} — calendrier, résultats, effectif`,
    description: [
      s ? `${ordinal(s.rank)} du ${club.competition.name} avec ${s.points} points.` : club.competition.name,
      next && opponent ? `Prochain match : ${formatDate(next.localDate)} contre ${opponent}.` : null,
    ]
      .filter(Boolean)
      .join(' ')
      .slice(0, 155),
  });
}

export default async function ClubPage(props: Props) {
  const loaded = await load(props);
  if (!loaded) notFound();
  const { site, club } = loaded;
  const { tenantSlug } = await props.params;
  const today = todayIn(site.timezone);
  const url = buildTenantUrl(tenantSlug, `/teams/${club.competition.slug}/${club.club.slug}`);
  const s = club.standing;

  const played = club.games.filter((g) => isPlayed(g.status)).reverse();
  const upcoming = club.games.filter((g) => !isPlayed(g.status) && g !== club.nextGame && g.slug !== club.nextGame?.slug);

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-6 sm:px-6 sm:py-10">
      <Link
        href={withParams('/teams', {}, { c: club.competition.slug })}
        className="inline-flex items-center gap-1 text-sm font-medium text-ink-muted hover:text-ink"
      >
        <ChevronLeft className="h-4 w-4" aria-hidden />
        Équipes
      </Link>

      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@graph': [
            { '@type': 'SportsTeam', name: club.club.name, url, memberOf: { '@type': 'SportsOrganization', name: site.name } },
            {
              '@type': 'BreadcrumbList',
              itemListElement: [
                { '@type': 'ListItem', position: 1, name: 'Accueil', item: buildTenantUrl(tenantSlug, '/') },
                { '@type': 'ListItem', position: 2, name: 'Équipes', item: buildTenantUrl(tenantSlug, '/teams') },
                { '@type': 'ListItem', position: 3, name: club.club.name, item: url },
              ],
            },
          ],
        }}
      />
      <section className="overflow-hidden rounded-2xl border border-line bg-surface shadow-e1">
        <div className="flex items-center gap-4 px-5 py-6 sm:px-8">
          <ClubMark club={club.club} size="lg" />
          <div className="min-w-0">
            <h1 className="text-balance text-2xl font-bold tracking-tight text-ink sm:text-3xl">{club.club.name}</h1>
            <p className="mt-1 text-sm text-ink-muted">
              {club.competition.name}
              {club.season && ` · ${club.season.name}`}
            </p>
          </div>
        </div>
        {s && (
          <dl className="grid grid-cols-5 divide-x divide-line border-t border-line bg-surface-sunk text-center">
            {[
              ['Rang', ordinal(s.rank)],
              ['Points', s.points],
              ['Joués', s.gamesPlayed],
              ['Gagnés', s.wins],
              ['Perdus', s.losses],
            ].map(([label, value]) => (
              <div key={label} className="px-1 py-3">
                <dt className="text-[0.65rem] font-semibold uppercase tracking-wide text-ink-subtle">{label}</dt>
                <dd className="mt-0.5 text-lg font-bold tabular-nums text-ink">{value}</dd>
              </div>
            ))}
          </dl>
        )}
      </section>

      {s && (
        <p className="-mt-5 px-1 text-sm">
          <Link href={withParams('/standings', {}, { c: club.competition.slug })} className="font-medium text-[var(--site-accent)] hover:underline">
            Voir le classement complet
          </Link>
        </p>
      )}

      {club.nextGame && (
        <HomeSection title="Prochain match">
          <ul className="overflow-hidden rounded-xl border border-line bg-surface">
            {/* The row's small label carries the day: « Demain », or the date. */}
            <MatchRow game={club.nextGame} competitionLabel={dayLabel(club.nextGame.localDate, today)} />
          </ul>
        </HomeSection>
      )}

      {played.length > 0 && (
        <HomeSection title="Résultats">
          <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">
            {played.map((g) => (
              <ClubGameRow key={g.slug} game={g} club={club.club} />
            ))}
          </ul>
        </HomeSection>
      )}

      {upcoming.length > 0 && (
        <HomeSection title="Calendrier">
          <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">
            {upcoming.map((g) => (
              <ClubGameRow key={g.slug} game={g} club={club.club} />
            ))}
          </ul>
        </HomeSection>
      )}

      {club.rosterShown && club.roster.length > 0 && (
        <HomeSection title="Effectif">
          <div className="overflow-hidden rounded-xl border border-line bg-surface">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[0.7rem] font-semibold uppercase tracking-wide text-ink-subtle">
                  <th scope="col" className="w-14 py-2.5 pl-4 text-left font-semibold">N°</th>
                  <th scope="col" className="py-2.5 text-left font-semibold">Joueur</th>
                  <th scope="col" className="py-2.5 pr-4 text-right font-semibold">Poste</th>
                </tr>
              </thead>
              <tbody>
                {club.roster.map((p, i) => (
                  <tr key={`${p.jerseyNumber ?? 'x'}-${i}`}>
                    <td className="border-t border-line py-2.5 pl-4 tabular-nums text-ink-subtle">{p.jerseyNumber ?? '–'}</td>
                    <td className="border-t border-line py-2.5 font-medium text-ink">
                      {p.name ?? (p.jerseyNumber !== null ? `n° ${p.jerseyNumber}` : 'Joueur')}
                    </td>
                    <td className="border-t border-line py-2.5 pr-4 text-right text-ink-muted">{p.position ?? ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </HomeSection>
      )}

    </div>
  );
}
