import { site } from '@/content/site';

/**
 * Testimonials and the leagues already on DXScores (PHASE5A_PRODUCT_SITE §3.3, §6.7).
 *
 * Built now, shown only once there is something real in `content/site.ts`. There are no users,
 * testimonials or ratings yet, and a product whose promise is numbers nobody disputes cannot open
 * with invented ones. Each block returns nothing while its list is empty.
 */
export function Testimonials() {
  if (site.testimonials.length === 0) return null;
  return (
    <section aria-labelledby="temoignages" className="reveal mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
      <h2 id="temoignages" className="text-title font-bold text-ink">Ils en parlent</h2>
      <div className="mt-10 grid gap-6 md:grid-cols-2">
        {site.testimonials.map((t) => (
          <figure key={t.name} className="rounded-xl border border-line bg-surface p-6 shadow-e1">
            <blockquote className="text-base leading-relaxed text-ink">« {t.quote} »</blockquote>
            <figcaption className="mt-4 text-sm">
              <span className="font-semibold text-ink">{t.name}</span>
              <span className="text-ink-muted"> · {t.role}</span>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

export function ShowcaseLeagues() {
  if (site.showcaseLeagues.length === 0) return null;
  return (
    <section aria-labelledby="ils-utilisent" className="reveal border-y border-line bg-surface">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <p id="ils-utilisent" className="text-center text-xs font-semibold uppercase tracking-wider text-ink-subtle">
          Ils publient leur saison avec DXScores
        </p>
        <ul className="mt-5 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm font-medium">
          {site.showcaseLeagues.map((l) => (
            <li key={l.url}>
              <a href={l.url} target="_blank" rel="noopener noreferrer" className="link-grow text-ink-muted hover:text-ink">
                {l.name}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
