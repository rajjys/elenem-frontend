import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { siteGet, type PublicPost } from '@/lib/public-site/api';
import { getSite } from '@/lib/public-site/site';
import { formatDay } from '@/lib/public-site/format';
import { leagueMeta } from '@/lib/public-site/meta';
import { PostBody } from '@/components/league-site/post-body';

/**
 * One article or communiqué (PHASE5B_LEAGUE_SITES §6): its label and date, its title, its lead,
 * and its body rendered on the server. No hero image until media storage exists (§6).
 */

type Props = { params: Promise<{ tenantSlug: string; postSlug: string }> };

const load = async ({ params }: Props) => {
  const { tenantSlug, postSlug } = await params;
  const [site, post] = await Promise.all([
    getSite(tenantSlug),
    siteGet<PublicPost>(tenantSlug, `/posts/${encodeURIComponent(postSlug)}`),
  ]);
  return site && post ? { site, post } : null;
};

export async function generateMetadata(props: Props): Promise<Metadata> {
  const loaded = await load(props);
  if (!loaded) return {};
  const { site, post } = loaded;
  const { tenantSlug } = await props.params;
  return leagueMeta({
    slug: tenantSlug,
    site,
    title: post.title,
    description: (post.excerpt ?? '').slice(0, 155) || undefined,
    path: `/news/${post.slug}`,
    type: 'article',
  });
}

export default async function PostPage(props: Props) {
  const loaded = await load(props);
  if (!loaded) notFound();
  const { site, post } = loaded;

  return (
    <article className="mx-auto max-w-2xl px-4 py-6 sm:px-6 sm:py-10">
      <Link href="/news" className="inline-flex items-center gap-1 text-sm font-medium text-ink-muted hover:text-ink">
        <ChevronLeft className="h-4 w-4" aria-hidden />
        Actualités
      </Link>
      <header className="mt-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-subtle">
          {post.communique && <span className="text-[var(--site-accent)]">Communiqué · </span>}
          <time dateTime={post.publishedAt}>{formatDay(post.publishedAt, site.timezone)}</time>
        </p>
        <h1 className="mt-3 text-balance text-2xl font-bold leading-tight tracking-tight text-ink sm:text-3xl">{post.title}</h1>
        {post.excerpt && <p className="mt-4 text-lg leading-relaxed text-ink-muted">{post.excerpt}</p>}
        <span aria-hidden className="mt-6 block h-1 w-10 rounded-full bg-[var(--site-accent)]" />
      </header>
      <div className="mt-8">
        <PostBody rich={post.richContent} markdown={post.content} />
      </div>
      <p className="mt-10 border-t border-line pt-4 text-sm text-ink-muted">Publié par {site.name}</p>
    </article>
  );
}
