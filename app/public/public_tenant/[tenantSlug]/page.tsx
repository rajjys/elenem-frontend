import { mediaSrc } from '@/lib/media';
import { notFound } from 'next/navigation';
import {
  siteGet,
  type PublicGames,
  type PublicPostSummary,
  type PublicScorers,
  type PublicStandings,
} from '@/lib/public-site/api';
import { getSite } from '@/lib/public-site/site';
import { param, withParams } from '@/lib/public-site/query';
import { shortCompetitionNames } from '@/lib/public-site/nav';
import { addDays, todayIn } from '@/lib/public-site/format';
import { HomeSection } from '@/components/league-site/home-section';
import { GameDayList } from '@/components/league-site/game-day-list';
import { MiniStandings } from '@/components/league-site/mini-standings';
import { ScorersList } from '@/components/league-site/scorers-list';
import { PostCard } from '@/components/league-site/post-card';
import { Chips } from '@/components/league-site/chips';
import { SiteMark } from '@/components/league-site/site-mark';
import { JsonLd } from '@/components/league-site/json-ld';
import { buildTenantUrl } from '@/utils/tenant-url';

/**
 * Accueil (PHASE5B_LEAGUE_SITES §6): what a supporter opens a league's site for, in the order they
 * want it — what is next, what just happened, where everyone stands, who is scoring, what the
 * league has announced. Each section appears only when it has something in it.
 *
 * The next six games and the last six results, grouped by day, rather than « the next date » and
 * « the last date »: a league that plays one game a day would otherwise show a single game in
 * each, and one that plays eight on a Saturday still sees its Saturday.
 */

const SHOWN = 6;

type Props = {
  params: Promise<{ tenantSlug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function LeagueHome({ params, searchParams }: Props) {
  const { tenantSlug } = await params;
  const sp = await searchParams;
  const site = await getSite(tenantSlug);
  if (!site) notFound();

  const today = todayIn(site.timezone);
  const chosen = site.competitions.find((x) => x.slug === param(sp.c)) ?? site.competitions[0];
  const withScorers = chosen && chosen.hasBoxScores && chosen.showsPlayers;

  const [upcoming, recent, table, scorers, posts] = await Promise.all([
    siteGet<PublicGames>(tenantSlug, '/games', { from: today, to: addDays(today, 41) }),
    siteGet<PublicGames>(tenantSlug, '/games', { from: addDays(today, -41), to: today }),
    chosen ? siteGet<PublicStandings>(tenantSlug, '/standings', { c: chosen.slug }) : null,
    withScorers ? siteGet<PublicScorers>(tenantSlug, '/scorers', { c: chosen.slug }) : null,
    site.hasPosts ? siteGet<PublicPostSummary[]>(tenantSlug, '/posts') : null,
  ]);

  const next = (upcoming?.games ?? []).filter((g) => g.status === 'SCHEDULED').slice(0, SHOWN);
  // The six most recent, newest day first and in kickoff order within a day — a results page.
  const played = (recent?.games ?? [])
    .filter((g) => g.status === 'COMPLETED' || g.status === 'FORFEIT')
    .slice(-SHOWN)
    .sort((a, b) => b.localDate.localeCompare(a.localDate) || a.localTime.localeCompare(b.localTime));

  const short = shortCompetitionNames(site.competitions.map((x) => x.name));
  const labelOf = site.competitions.length > 1 ? new Map(site.competitions.map((x, i) => [x.slug, short[i]])) : undefined;
  const seasons = [...new Set(site.competitions.map((x) => x.season?.name).filter(Boolean))];

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-10">
      {/* The league, for search engines (§9): the realistic target is a search for its own name. */}
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'SportsOrganization',
          name: site.name,
          url: buildTenantUrl(tenantSlug, '/'),
          ...(site.logoUrl ? { logo: mediaSrc(site.logoUrl, 'md', 'png') } : {}),
          ...(site.city ? { location: { '@type': 'Place', address: { '@type': 'PostalAddress', addressLocality: site.city } } } : {}),
          ...(site.contact.email ? { email: site.contact.email } : {}),
          ...(Object.values(site.socialLinks).length ? { sameAs: Object.values(site.socialLinks) } : {}),
        }}
      />
      <div className="flex items-center gap-4">
        <SiteMark name={site.name} logoUrl={site.logoUrl} size="lg" />
        <div className="min-w-0">
          <h1 className="text-balance text-2xl font-bold tracking-tight text-ink sm:text-3xl">{site.name}</h1>
          <p className="mt-1 text-sm text-ink-muted">
            {[site.city, seasons.length === 1 ? `Saison ${seasons[0]!.replace(/^Saison\s+/i, '')}` : null]
              .filter(Boolean)
              .join(' · ') || 'Calendrier, résultats et classement'}
          </p>
        </div>
      </div>

      {/* grid-cols-1 is minmax(0, 1fr): without it the one column grows to its widest content — a
          row of long competition chips — instead of letting that row scroll. */}
      <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:gap-12">
        <div className="space-y-10">
          <HomeSection title="Prochains matchs" href="/games" linkLabel="Tout le calendrier">
            {next.length > 0 ? (
              <GameDayList games={next} today={today} labelOf={labelOf} />
            ) : (
              <p className="rounded-xl border border-line bg-surface px-5 py-8 text-center text-sm text-ink-muted">
                Aucun match programmé pour le moment.
              </p>
            )}
          </HomeSection>

          {played.length > 0 && (
            <HomeSection title="Derniers résultats" href={withParams('/games', {}, { week: played[0].localDate })} linkLabel="Tous les résultats">
              <GameDayList games={played} today={today} labelOf={labelOf} />
            </HomeSection>
          )}
        </div>

        <div className="space-y-10">
          {table && (
            <HomeSection title="Classement" href={withParams('/standings', {}, { c: table.competition.slug })} linkLabel="Classement complet">
              <div className="space-y-3">
                <Chips
                  label="Compétitions"
                  items={site.competitions.map((x, i) => ({
                    label: short[i],
                    href: withParams('/', {}, { c: x.slug }),
                    active: x.slug === table.competition.slug,
                  }))}
                />
                <MiniStandings table={table} />
              </div>
            </HomeSection>
          )}

          {scorers && scorers.rows.length > 0 && (
            <HomeSection title="Meilleurs marqueurs" href={withParams('/stats', {}, { c: chosen.slug })} linkLabel="Tous les marqueurs">
              <ScorersList board={scorers} />
            </HomeSection>
          )}
        </div>
      </div>

      {posts && posts.length > 0 && (
        <div className="mt-12">
          <HomeSection title="Actualités" href="/news" linkLabel="Toutes les actualités">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {posts.slice(0, 3).map((p) => (
                <PostCard key={p.slug} post={p} zone={site.timezone} />
              ))}
            </div>
          </HomeSection>
        </div>
      )}
    </div>
  );
}
