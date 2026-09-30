import Link from 'next/link';
import type { PublicPostSummary } from '@/lib/public-site/api';
import { formatDay } from '@/lib/public-site/format';

/** A communiqué or an article, as a card: its label, date, title and first lines. */
export function PostCard({ post, zone }: { post: PublicPostSummary; zone: string }) {
  return (
    <Link
      href={`/news/${post.slug}`}
      className="group flex h-full flex-col rounded-xl border border-line bg-surface p-5 transition-colors hover:border-line-strong"
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-subtle">
        {post.communique && <span className="text-[var(--site-accent)]">Communiqué · </span>}
        {formatDay(post.publishedAt, zone)}
      </p>
      <h3 className="mt-2 font-semibold leading-snug text-ink group-hover:underline">{post.title}</h3>
      {post.excerpt && <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-ink-muted">{post.excerpt}</p>}
    </Link>
  );
}
