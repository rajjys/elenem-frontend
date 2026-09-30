import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { siteGet, type PublicKnockout } from '@/lib/public-site/api';
import { getSite } from '@/lib/public-site/site';
import { param, withParams } from '@/lib/public-site/query';
import { leagueMeta } from '@/lib/public-site/meta';
import { shortCompetitionNames } from '@/lib/public-site/nav';
import { PageTitle } from '@/components/league-site/page-title';
import { Chips } from '@/components/league-site/chips';
import { KnockoutRounds } from '@/components/league-site/knockout-rounds';

/**
 * Phase finale (PHASE5B_LEAGUE_SITES §6): the knockout phases of a competition that has one, each
 * round by round. Offered only for such competitions; the page does not exist for a league without.
 */

type Props = {
  params: Promise<{ tenantSlug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

async function load({ params, searchParams }: Props) {
  const { tenantSlug } = await params;
  const site = await getSite(tenantSlug);
  if (!site) return null;
  const asked = param((await searchParams).c);
  const eligible = site.competitions.filter((c) => c.hasKnockout);
  const chosen = eligible.find((c) => c.slug === asked) ?? eligible[0];
  if (!chosen) return null;
  const bracket = await siteGet<PublicKnockout>(tenantSlug, '/knockout', { c: chosen.slug });
  return bracket ? { site, eligible, chosen, bracket } : null;
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const loaded = await load(props);
  if (!loaded) return {};
  const { tenantSlug } = await props.params;
  return leagueMeta({
    slug: tenantSlug,
    site: loaded.site,
    title: `Phase finale ${loaded.bracket.competition.name}`,
    path: `/playoffs?c=${loaded.chosen.slug}`,
  });
}

export default async function PlayoffsPage(props: Props) {
  const loaded = await load(props);
  if (!loaded) notFound();
  const { site, eligible, chosen, bracket } = loaded;

  const shortAll = shortCompetitionNames(site.competitions.map((c) => c.name));
  const shortOf = new Map(site.competitions.map((c, i) => [c.slug, shortAll[i]]));

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-6 sm:px-6 sm:py-10">
      <PageTitle aside={<span className="text-sm text-ink-muted">{bracket.season.name}</span>}>Phase finale</PageTitle>
      <Chips
        label="Compétitions"
        items={eligible.map((c) => ({
          label: shortOf.get(c.slug) ?? c.name,
          href: withParams('/playoffs', {}, { c: c.slug }),
          active: c.slug === chosen.slug,
        }))}
      />
      <p className="text-sm font-semibold text-ink">{bracket.competition.name}</p>
      {bracket.stages.map((stage) => (
        <section key={stage.id} aria-labelledby={`stage-${stage.id}`}>
          <h2 id={`stage-${stage.id}`} className="mb-3 text-lg font-bold text-ink">
            {stage.name}
            <span aria-hidden className="mt-1.5 block h-0.5 w-8 rounded-full bg-[var(--site-accent)]" />
          </h2>
          <KnockoutRounds stage={stage} />
        </section>
      ))}
    </div>
  );
}
