import type { PublicSite } from '@/lib/public-site/api';
import { SiteMark } from './site-mark';

/**
 * A league with no competition yet (PHASE5B_LEAGUE_SITES §4.5): its name and one sentence, on one
 * clean screen. Self-serve means a site must look alive from its first minute — so it never shows
 * a section with nothing in it.
 */
export function EmptySite({ site }: { site: PublicSite }) {
  return (
    <section className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center">
      <SiteMark name={site.name} logoUrl={site.logoUrl} size="lg" />
      <h1 className="mt-6 text-balance text-2xl font-bold text-ink">{site.name}</h1>
      {/* Not « Le calendrier de <nom> » — « de Ligue de Football du Kivu » lacks its article, and the
          right one depends on the name. */}
      <p className="mt-3 text-ink-muted">Calendrier, résultats et classement : bientôt en ligne.</p>
    </section>
  );
}
