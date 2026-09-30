import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { siteGet, type PublicScorers } from '@/lib/public-site/api';
import { getSite } from '@/lib/public-site/site';
import { param, withParams } from '@/lib/public-site/query';
import { leagueMeta } from '@/lib/public-site/meta';
import { shortCompetitionNames } from '@/lib/public-site/nav';
import { PageTitle } from '@/components/league-site/page-title';
import { Chips } from '@/components/league-site/chips';
import { ScorersTable } from '@/components/league-site/scorers-table';

/**
 * Marqueurs (PHASE5B_LEAGUE_SITES §6): the scorers of a competition that has scoresheets and
 * publishes its players' names (§4.9) — the others are not offered, and the page does not exist for
 * a league with none. It says how many games its totals come from, because a scorer whose games
 * have no sheet is not a scorer who did not score.
 */

type Props = {
  params: Promise<{ tenantSlug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

async function load({ params, searchParams }: Props) {
  const { tenantSlug } = await params;
  const sp = await searchParams;
  const site = await getSite(tenantSlug);
  if (!site) return null;
  const eligible = site.competitions.filter((c) => c.hasBoxScores && c.showsPlayers);
  const chosen = eligible.find((c) => c.slug === param(sp.c)) ?? eligible[0];
  if (!chosen) return null;
  const stage = param(sp.stage);
  const board = await siteGet<PublicScorers>(tenantSlug, '/scorers', { c: chosen.slug, stage });
  return board ? { site, eligible, chosen, stage, board } : null;
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const loaded = await load(props);
  if (!loaded) return {};
  const top = loaded.board.rows[0];
  const { tenantSlug } = await props.params;
  return leagueMeta({
    slug: tenantSlug,
    site: loaded.site,
    title: `Marqueurs ${loaded.board.competition.name}`,
    description: top?.name ? `${top.name} en tête avec ${top.total} points en ${top.gamesPlayed} matchs.` : undefined,
    path: `/stats?c=${loaded.chosen.slug}`,
  });
}

export default async function ScorersPage(props: Props) {
  const loaded = await load(props);
  if (!loaded) notFound();
  const { site, eligible, chosen, stage, board } = loaded;

  const shortAll = shortCompetitionNames(site.competitions.map((c) => c.name));
  const shortOf = new Map(site.competitions.map((c, i) => [c.slug, shortAll[i]]));
  const competitions = eligible.map((c) => ({
    label: shortOf.get(c.slug) ?? c.name,
    href: withParams('/stats', {}, { c: c.slug }),
    active: c.slug === chosen.slug,
  }));
  const phases =
    board.stages.length > 1
      ? [
          { label: 'Toute la saison', href: withParams('/stats', { c: chosen.slug }), active: !stage },
          ...board.stages.map((s) => ({ label: s.name, href: withParams('/stats', { c: chosen.slug }, { stage: s.id }), active: s.id === stage })),
        ]
      : [];

  return (
    <div className="mx-auto max-w-5xl space-y-5 px-4 py-6 sm:px-6 sm:py-10">
      <PageTitle aside={<span className="text-sm text-ink-muted">{board.season.name}</span>}>Marqueurs</PageTitle>
      <div className="space-y-3">
        <Chips label="Compétitions" items={competitions} />
        <Chips label="Phases" items={phases} />
      </div>
      <div>
        <h2 className="mb-2 text-sm font-semibold text-ink">{board.competition.name}</h2>
        {board.rows.length > 0 ? (
          <ScorersTable board={board} />
        ) : (
          <p className="rounded-xl border border-line bg-surface px-6 py-12 text-center text-ink-muted">
            Aucune feuille de marque n’a encore été publiée.
          </p>
        )}
      </div>
      <p className="text-sm text-ink-muted">
        {board.gamesWithSheet} des {board.gamesCompleted} matchs joués {board.gamesWithSheet > 1 ? 'ont' : 'a'} une feuille
        de marque : les totaux ne comptent que {board.gamesWithSheet > 1 ? 'ceux-là' : 'celui-là'}.
      </p>
    </div>
  );
}
