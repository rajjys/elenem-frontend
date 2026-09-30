import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { siteGet, type PublicClubListItem } from '@/lib/public-site/api';
import { getSite } from '@/lib/public-site/site';
import { param, withParams } from '@/lib/public-site/query';
import { leagueMeta } from '@/lib/public-site/meta';
import { shortCompetitionNames } from '@/lib/public-site/nav';
import { PageTitle } from '@/components/league-site/page-title';
import { Chips } from '@/components/league-site/chips';
import { ClubMark } from '@/components/league-site/club-mark';

/** Équipes (PHASE5B_LEAGUE_SITES §6): the league's clubs, by competition, each opening its page. */

type Props = {
  params: Promise<{ tenantSlug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tenantSlug } = await params;
  const site = await getSite(tenantSlug);
  if (!site) return {};
  return leagueMeta({ slug: tenantSlug, site, title: 'Équipes', description: `Les clubs de ${site.name}, par compétition.`, path: '/teams' });
}

export default async function TeamsPage({ params, searchParams }: Props) {
  const { tenantSlug } = await params;
  const c = param((await searchParams).c);
  const [site, clubs] = await Promise.all([getSite(tenantSlug), siteGet<PublicClubListItem[]>(tenantSlug, '/teams')]);
  if (!site || !clubs) notFound();

  const short = shortCompetitionNames(site.competitions.map((x) => x.name));
  const shown = site.competitions.filter((x) => !c || x.slug === c);
  const chips = [
    { label: 'Toutes', href: '/teams', active: !c },
    ...site.competitions.map((x, i) => ({ label: short[i], href: withParams('/teams', {}, { c: x.slug }), active: x.slug === c })),
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-6 sm:px-6 sm:py-10">
      <PageTitle>Équipes</PageTitle>
      <Chips label="Compétitions" items={site.competitions.length > 1 ? chips : []} />

      {shown.map((competition) => {
        const list = clubs.filter((x) => x.competition.slug === competition.slug);
        if (list.length === 0) return null;
        return (
          <section key={competition.slug} aria-labelledby={`c-${competition.slug}`}>
            <h2 id={`c-${competition.slug}`} className="mb-3 text-sm font-semibold text-ink">
              {competition.name} <span className="font-normal text-ink-muted">· {list.length} clubs</span>
            </h2>
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {list.map((club) => (
                <li key={club.slug}>
                  <Link
                    href={`/teams/${competition.slug}/${club.slug}`}
                    className="flex h-full flex-col items-center gap-2.5 rounded-xl border border-line bg-surface px-3 py-5 text-center transition-colors hover:border-line-strong"
                  >
                    <ClubMark club={club} size="md" />
                    <span className="text-sm font-semibold leading-snug text-ink">{club.name}</span>
                    {club.shortCode && <span className="text-xs text-ink-subtle">{club.shortCode}</span>}
                    {/* Where it stands, from the current table: rank, points, won and lost. */}
                    {club.record && (
                      <span className="mt-1 flex flex-wrap items-center justify-center gap-1.5 text-xs tabular-nums">
                        <span className="rounded-full bg-surface-sunk px-2 py-0.5 font-semibold text-ink">
                          {club.record.rank === 1 ? '1er' : `${club.record.rank}e`}
                        </span>
                        <span className="text-ink-muted">{club.record.points} pts</span>
                        <span className="text-ink-subtle">
                          <span className="text-positive">{club.record.wins}V</span> <span className="text-negative">{club.record.losses}D</span>
                        </span>
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
