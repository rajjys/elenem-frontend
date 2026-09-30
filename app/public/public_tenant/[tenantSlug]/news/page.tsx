import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { siteGet, type PublicPostSummary } from '@/lib/public-site/api';
import { getSite } from '@/lib/public-site/site';
import { PageTitle } from '@/components/league-site/page-title';
import { PostCard } from '@/components/league-site/post-card';

/**
 * Actualités (PHASE5B_LEAGUE_SITES §6): the league's published articles and communiqués, newest
 * first. A league with none has no such page — the nav does not offer it, and the address says so.
 */

type Props = { params: Promise<{ tenantSlug: string }> };

export const metadata: Metadata = { title: 'Actualités' };

export default async function NewsPage({ params }: Props) {
  const { tenantSlug } = await params;
  const [site, posts] = await Promise.all([getSite(tenantSlug), siteGet<PublicPostSummary[]>(tenantSlug, '/posts')]);
  if (!site || !posts || posts.length === 0) notFound();

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-6 sm:px-6 sm:py-10">
      <PageTitle>Actualités</PageTitle>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((p) => (
          <PostCard key={p.slug} post={p} zone={site.timezone} />
        ))}
      </div>
    </div>
  );
}
