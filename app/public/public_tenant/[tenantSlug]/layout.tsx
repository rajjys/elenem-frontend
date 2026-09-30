import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { notFound } from 'next/navigation';
import { getSite } from '@/lib/public-site/site';
import { siteNav } from '@/lib/public-site/nav';
import { siteColourVars } from '@/lib/public-site/palette';
import { buildTenantUrl } from '@/utils/tenant-url';
import { leagueMeta } from '@/lib/public-site/meta';
import { SiteHeader } from '@/components/league-site/site-header';
import { SiteFooter } from '@/components/league-site/site-footer';
import { BottomNav } from '@/components/league-site/site-nav';
import { EmptySite } from '@/components/league-site/empty-site';

/**
 * `<slug>.dxscores.app` — every league site's frame (PHASE5B_LEAGUE_SITES §6, sprint 5B.2).
 *
 * A server component: the league is resolved once per request (`getSite`, cached for a minute),
 * an organisation that is not served answers 404, and the frame arrives as HTML with the league's
 * name in it. The only JavaScript it adds is the tab bar's active state and « Partager ».
 *
 * No loading.tsx in this segment, on purpose: a loading boundary sends the page as 200 before it
 * can say « not found », so a missing club or game would be indexed as a real page. A league's
 * pages arrive whole, which is also what WhatsApp's preview and a slow connection need.
 */

type Params = { params: Promise<{ tenantSlug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { tenantSlug } = await params;
  const site = await getSite(tenantSlug);
  if (!site) return { title: 'Aucune ligue à cette adresse', robots: { index: false, follow: false } };

  const title = `${site.name} — calendrier, résultats et classement`;
  // Generated from the data and kept short: WhatsApp shows about eighty characters (§9).
  const names = site.competitions.map((c) => c.name).join(', ');
  const description = (
    names ? `Calendrier, résultats et classement : ${names}.` : `${site.name} — calendrier, résultats et classement : bientôt en ligne.`
  ).slice(0, 155);

  return {
    metadataBase: new URL(buildTenantUrl(tenantSlug)),
    // The home page's, and the fallback for any page that sets none: the league's own card.
    ...leagueMeta({ slug: tenantSlug, site, title, description, path: '/', absoluteTitle: true }),
    // `absolute`: the product's own « %s · DXScores » template stops here; below, it is the league's.
    title: { absolute: title, template: `%s · ${site.name}` },
    // PRIVATE organisations and sites with nothing in them yet stay out of search (§9).
    robots: site.indexable && site.competitions.length > 0 ? undefined : { index: false, follow: true },
  };
}

export default async function LeagueSiteLayout({ children, params }: { children: ReactNode } & Params) {
  const { tenantSlug } = await params;
  const site = await getSite(tenantSlug);
  if (!site) notFound();

  const nav = siteNav(site);
  const empty = site.competitions.length === 0;

  return (
    <div
      className="league-site flex min-h-screen flex-col bg-canvas text-ink"
      style={siteColourVars(site.primaryColor, site.accentColor)}
    >
      <SiteHeader site={site} nav={nav} />
      <main className="flex-1">{empty ? <EmptySite site={site} /> : children}</main>
      {/* Room for the phone's tab bar under the last thing on the page, so it never covers it. */}
      <div className={empty ? '' : 'pb-16 md:pb-0'}>
        <SiteFooter site={site} slug={tenantSlug} />
      </div>
      <BottomNav items={nav.primary} />
    </div>
  );
}
