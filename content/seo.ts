import type { Metadata } from 'next';

/**
 * Search and share metadata for the product site's pages (PHASE5A_PRODUCT_SITE §8.4).
 *
 * One helper, because Next.js does not derive `og:title` from a page's title, and a page that sets
 * `openGraph` replaces the layout's whole object rather than merging into it — so a page that
 * forgot `siteName` or `locale` would quietly share without them. WhatsApp needs og:title,
 * og:description and og:url to draw a preview at all; the image comes from app/opengraph-image.tsx
 * on every page.
 */
export const SITE_NAME = 'DXScores';

/**
 * The share card drawn by app/opengraph-image.tsx. Named here too because a page's `openGraph`
 * replaces the root's, and with it the image the file convention attached there — without this,
 * every page that sets its own share title would share with no picture.
 */
export const OG_IMAGE = {
  url: '/opengraph-image',
  width: 1200,
  height: 630,
  alt: 'DXScores — Organisez votre saison. Le classement se calcule tout seul.',
};

export function pageMeta({
  title,
  description,
  path,
  absoluteTitle = false,
}: {
  title: string;
  description: string;
  /** The page's canonical path on dxscores.com, e.g. '/contact'. */
  path: string;
  /** For the landing, whose title is the whole promise rather than "<page> · DXScores". */
  absoluteTitle?: boolean;
}): Metadata {
  const fullTitle = absoluteTitle ? title : `${title} · ${SITE_NAME}`;
  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: 'website',
      siteName: SITE_NAME,
      locale: 'fr_FR',
      title: fullTitle,
      description,
      url: path,
      images: [OG_IMAGE],
    },
    twitter: { card: 'summary_large_image', title: fullTitle, description, images: [OG_IMAGE] },
  };
}
