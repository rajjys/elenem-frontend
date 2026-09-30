import Link from 'next/link';
import { MoreHorizontal } from 'lucide-react';
import { cn } from '@/utils/cn';
import type { PublicSite } from '@/lib/public-site/api';
import type { SiteNavItem } from '@/lib/public-site/nav';
import { hasBand } from '@/lib/public-site/palette';
import { SiteMark } from './site-mark';
import { SiteNavLinks } from './site-nav';
import { ShareButton } from './share-button';

/**
 * A league site's header (PHASE5B_LEAGUE_SITES §6, the frame): its mark and name, the navigation on
 * a wide screen, « Partager », and a thin rule in the league's accent. With a primary colour chosen
 * the header is a band of it; without one, a neutral surface.
 *
 * On a phone the main sections are the bottom tab bar, and the rest (Phase finale, Actualités) sit
 * in a menu here — a native <details>, so it opens without any JavaScript.
 */
export function SiteHeader({
  site,
  nav,
}: {
  site: PublicSite;
  nav: { primary: SiteNavItem[]; secondary: SiteNavItem[] };
}) {
  const banded = hasBand(site.primaryColor);
  return (
    <header
      className={cn(
        'sticky top-0 z-30',
        banded ? 'bg-[var(--site-band)] text-[var(--site-band-ink)]' : 'border-b border-line bg-surface text-ink',
      )}
    >
      <div className="mx-auto flex h-14 max-w-5xl items-center gap-3 px-4 sm:px-6">
        <Link href="/" className="flex min-w-0 items-center gap-2.5">
          <SiteMark name={site.name} logoUrl={site.logoUrl} />
          <span className="truncate font-bold">{site.name}</span>
        </Link>

        <nav aria-label="Principale" className="ml-auto hidden md:block">
          <SiteNavLinks items={[...nav.primary, ...nav.secondary]} banded={banded} />
        </nav>

        <div className="ml-auto flex shrink-0 items-center md:ml-1">
          <ShareButton banded={banded} />
          {nav.secondary.length > 0 && (
            <details className="relative md:hidden">
              <summary
                aria-label="Plus de rubriques"
                className={cn(
                  'flex cursor-pointer list-none items-center rounded-md p-2 [&::-webkit-details-marker]:hidden',
                  banded ? 'site-band-hover' : 'text-ink-muted hover:bg-surface-sunk',
                )}
              >
                <MoreHorizontal className="h-5 w-5" aria-hidden />
              </summary>
              <ul className="absolute right-0 mt-2 w-48 rounded-lg border border-line bg-elevated p-1 text-sm text-ink shadow-e2">
                {nav.secondary.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} className="block rounded-md px-3 py-2 hover:bg-surface-sunk">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>
      </div>
      <div aria-hidden className="h-0.5 bg-[var(--site-accent)]" />
    </header>
  );
}
