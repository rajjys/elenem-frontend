import type { Metadata } from 'next';
import type { PublicSite } from './api';
import { buildTenantUrl } from '@/utils/tenant-url';

/**
 * A league page's metadata, whole (PHASE5B_LEAGUE_SITES §9): title, description, canonical
 * address, and the share card WhatsApp draws — og:title, og:description, og:url and an image by
 * absolute URL on the league's own host.
 *
 * Whole because a page that sets `openGraph` replaces the layout's, image included (the trap met in
 * 5A.3): a page given only a title would share the league's generic title with no picture. Every
 * league page goes through here.
 */
export function leagueMeta({
  slug,
  site,
  title,
  description,
  path,
  image = '/og/league',
  absoluteTitle = false,
  type = 'website',
}: {
  slug: string;
  site: PublicSite;
  title: string;
  description?: string;
  /** The page's address on the league's host, e.g. '/standings?c=messieurs'. */
  path: string;
  /** The card's path on the league's host; the league's own card by default. */
  image?: string;
  absoluteTitle?: boolean;
  type?: 'website' | 'article';
}): Metadata {
  const shareTitle = absoluteTitle ? title : `${title} · ${site.name}`;
  const img = { url: buildTenantUrl(slug, image), width: 1200, height: 630, alt: shareTitle };
  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: { canonical: path },
    openGraph: { type, siteName: site.name, locale: 'fr_FR', title: shareTitle, description, url: path, images: [img] },
    twitter: { card: 'summary_large_image', title: shareTitle, description, images: [img.url] },
  };
}
