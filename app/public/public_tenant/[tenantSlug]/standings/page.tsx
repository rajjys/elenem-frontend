import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { siteGet, type PublicStandings } from '@/lib/public-site/api';
import { getSite } from '@/lib/public-site/site';
import { param, withParams } from '@/lib/public-site/query';
import { leagueMeta } from '@/lib/public-site/meta';
import { shortCompetitionNames } from '@/lib/public-site/nav';
import { PageTitle } from '@/components/league-site/page-title';
import { Chips } from '@/components/league-site/chips';
import { StandingsTable } from '@/components/league-site/standings-table';
import { TrustLine } from '@/components/league-site/trust-line';

/**
 * Classement (PHASE5B_LEAGUE_SITES §6): the competition's table — the same one the federation
 * signs, from `buildStandingsView` — with competition, phase, pool and season as links, each shown
 * only when there is more than one to choose from.
 */

type Props = {
  params: Promise<{ tenantSlug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

async function load({ params, searchParams }: Props) {
  const { tenantSlug } = await params;
  const sp = await searchParams;
  const query = { c: param(sp.c), season: param(sp.season), stage: param(sp.stage), group: param(sp.group) };
  const [site, table] = await Promise.all([
    getSite(tenantSlug),
    siteGet<PublicStandings>(tenantSlug, '/standings', query),
  ]);
  return { site, table, query };
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { site, table } = await load(props);
  if (!site || !table) return {};
  const { tenantSlug } = await props.params;
  const leader = table.rows[0];
  const c = table.competition.slug;
  return leagueMeta({
    slug: tenantSlug,
    site,
    title: `Classement ${table.competition.name} ${table.season.name}`,
    description: leader
      ? `${leader.club.name} en tête avec ${leader.points} points après ${table.gamesCounted} matchs. ${table.rules.formula}.`.slice(0, 155)
      : `Le classement ${table.competition.name}, mis à jour à chaque résultat.`,
    path: `/standings?c=${c}`,
    // The card's address changes with the table, so a shared link never shows yesterday's order.
    image: `/og/standings?c=${c}&v=${table.updatedAt ? Date.parse(table.updatedAt) : 0}`,
  });
}

export default async function StandingsPage(props: Props) {
  const { site, table, query } = await load(props);
  if (!site || !table) notFound();

  const here = { c: table.competition.slug, season: query.season, stage: query.stage, group: query.group };
  const short = shortCompetitionNames(site.competitions.map((c) => c.name));
  const competitions = site.competitions.map((c, i) => ({
    label: short[i],
    href: withParams('/standings', {}, { c: c.slug }),
    active: c.slug === table.competition.slug,
  }));
  const stages = table.tableStages.map((s) => ({
    label: s.name,
    href: withParams('/standings', here, { stage: s.id, group: undefined }),
    active: s.id === table.stage.id,
  }));
  const groups = table.groups.map((g) => ({
    label: g.name,
    href: withParams('/standings', here, { group: g.id }),
    active: g.id === table.group?.id,
  }));

  return (
    <div className="mx-auto max-w-5xl space-y-5 px-4 py-6 sm:px-6 sm:py-10">
      <PageTitle
        aside={
          table.seasons.length > 1 ? (
            <SeasonPicker seasons={table.seasons} current={table.season.slug} here={here} />
          ) : (
            <span className="text-sm text-ink-muted">{table.season.name}</span>
          )
        }
      >
        Classement
      </PageTitle>

      <div className="space-y-3">
        <Chips label="Compétitions" items={competitions} />
        <Chips label="Phases" items={stages} />
        <Chips label="Poules" items={groups} />
      </div>

      <div>
        <h2 className="mb-2 text-sm font-semibold text-ink">
          {table.competition.name}
          {table.tableStages.length > 1 && <span className="font-normal text-ink-muted"> · {table.stage.name}</span>}
          {table.group && <span className="font-normal text-ink-muted"> · {table.group.name}</span>}
        </h2>
        <StandingsTable table={table} competition={table.competition.slug} />
      </div>

      <TrustLine table={table} zone={site.timezone} />
    </div>
  );
}

/** More than one season: a native disclosure, so choosing one needs no JavaScript. */
function SeasonPicker({
  seasons,
  current,
  here,
}: {
  seasons: PublicStandings['seasons'];
  current: string;
  here: Record<string, string | undefined>;
}) {
  const name = seasons.find((s) => s.slug === current)?.name ?? seasons[0].name;
  return (
    <details className="relative">
      <summary className="flex cursor-pointer list-none items-center gap-1.5 rounded-full border border-line bg-surface px-3.5 py-1.5 text-sm text-ink [&::-webkit-details-marker]:hidden">
        {name}
        <span aria-hidden className="text-ink-subtle">▾</span>
      </summary>
      <ul className="absolute right-0 z-20 mt-2 w-48 rounded-lg border border-line bg-elevated p-1 text-sm shadow-e2">
        {seasons.map((s) => (
          <li key={s.slug}>
            <a
              href={withParams('/standings', here, { season: s.slug, stage: undefined, group: undefined })}
              className="block rounded-md px-3 py-2 text-ink hover:bg-surface-sunk"
            >
              {s.name}
            </a>
          </li>
        ))}
      </ul>
    </details>
  );
}
