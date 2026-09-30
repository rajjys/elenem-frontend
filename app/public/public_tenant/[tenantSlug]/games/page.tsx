import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { siteGet, type PublicGameRow, type PublicGames } from '@/lib/public-site/api';
import { getSite } from '@/lib/public-site/site';
import { param, withParams } from '@/lib/public-site/query';
import { leagueMeta } from '@/lib/public-site/meta';
import { shortCompetitionNames } from '@/lib/public-site/nav';
import { addDays, dayLabel, formatDate, formatShortDate, mondayOf, todayIn } from '@/lib/public-site/format';
import { PageTitle } from '@/components/league-site/page-title';
import { Chips } from '@/components/league-site/chips';
import { WeekPager } from '@/components/league-site/week-pager';
import { MatchRow } from '@/components/league-site/match-row';

/**
 * Matchs (PHASE5B_LEAGUE_SITES §6): one week at a time on the league's clock, grouped by day. With
 * no week asked for, this week — or, when this week has nothing, the next week that does, so the
 * page never opens on an empty screen mid-season.
 */

type Props = {
  params: Promise<{ tenantSlug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const LOCAL_DATE = /^\d{4}-\d{2}-\d{2}$/;

async function load({ params, searchParams }: Props) {
  const { tenantSlug } = await params;
  const sp = await searchParams;
  const c = param(sp.c);
  const asked = param(sp.week);
  const week = asked && LOCAL_DATE.test(asked) ? mondayOf(asked) : undefined;

  const site = await getSite(tenantSlug);
  if (!site) return null;
  const fetchWeek = (from?: string) =>
    siteGet<PublicGames>(tenantSlug, '/games', { c, from, to: from ? addDays(from, 6) : undefined });

  let data = await fetchWeek(week);
  if (data && !week && data.games.length === 0 && data.nextDate) {
    data = (await fetchWeek(mondayOf(data.nextDate))) ?? data;
  }
  return data ? { site, data, c } : null;
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const loaded = await load(props);
  if (!loaded) return {};
  const { site, data } = loaded;
  const { tenantSlug } = await props.params;
  return leagueMeta({
    slug: tenantSlug,
    site,
    title: 'Matchs',
    description: `Calendrier et résultats du ${formatShortDate(data.from)} au ${formatShortDate(data.to)} : ${data.games.length} match${data.games.length > 1 ? 's' : ''}.`,
    path: '/games',
  });
}

export default async function GamesPage(props: Props) {
  const loaded = await load(props);
  if (!loaded) notFound();
  const { site, data, c } = loaded;

  const today = todayIn(site.timezone);
  const short = shortCompetitionNames(site.competitions.map((x) => x.name));
  const chips = [
    { label: 'Toutes', href: withParams('/games', { week: data.from }), active: !c },
    ...site.competitions.map((x, i) => ({
      label: short[i],
      href: withParams('/games', { week: data.from }, { c: x.slug }),
      active: x.slug === c,
    })),
  ];

  const days = groupByDay(data.games);
  // With every competition on screen, each row says which it belongs to — in the chips' short form.
  const labelOf = new Map(site.competitions.map((x, i) => [x.slug, short[i]]));
  const mixed = !c && site.competitions.length > 1;

  return (
    <div className="mx-auto max-w-3xl space-y-5 px-4 py-6 sm:px-6 sm:py-10">
      <PageTitle>Matchs</PageTitle>

      <Chips label="Compétitions" items={site.competitions.length > 1 ? chips : []} />

      <WeekPager
        from={data.from}
        to={data.to}
        current={data.from === mondayOf(today)}
        prevHref={data.previousDate ? withParams('/games', { c }, { week: mondayOf(data.previousDate) }) : null}
        nextHref={data.nextDate ? withParams('/games', { c }, { week: mondayOf(data.nextDate) }) : null}
        todayHref={withParams('/games', { c }, { week: mondayOf(today) })}
      />

      {days.length === 0 ? (
        <div className="rounded-xl border border-line bg-surface px-6 py-12 text-center">
          <p className="text-ink-muted">Aucun match cette semaine.</p>
          {data.nextDate && (
            <Link
              href={withParams('/games', { c }, { week: mondayOf(data.nextDate) })}
              className="mt-3 inline-block text-sm font-medium text-[var(--site-accent)] hover:underline"
            >
              Prochains matchs : {formatDate(data.nextDate, 'long')}
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {days.map(([date, games]) => {
            const label = dayLabel(date, today);
            const relative = label !== formatDate(date);
            return (
              <section key={date} aria-labelledby={`day-${date}`}>
                {/* Sticky under the site header, so a long Saturday keeps its date in view. */}
                <h2
                  id={`day-${date}`}
                  className="sticky top-[58px] z-10 -mx-4 bg-canvas/95 px-4 py-2 text-sm font-semibold text-ink backdrop-blur sm:mx-0 sm:px-1"
                >
                  {relative ? label : formatDate(date, 'long')}
                  {relative && <span className="font-normal text-ink-muted"> · {formatDate(date, 'long')}</span>}
                </h2>
                <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">
                  {games.map((g) => (
                    <MatchRow
                      key={`${g.competition.slug}/${g.slug}`}
                      game={g}
                      competitionLabel={mixed ? (labelOf.get(g.competition.slug) ?? g.competition.name) : undefined}
                    />
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

function groupByDay(games: PublicGameRow[]): [string, PublicGameRow[]][] {
  const days = new Map<string, PublicGameRow[]>();
  for (const g of games) days.set(g.localDate, [...(days.get(g.localDate) ?? []), g]);
  return [...days.entries()];
}
