'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowRight, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/brand';
import { useAuthStore } from '@/store/auth.store';
import { homeForRoles } from '@/utils';
import { cn } from '@/utils/cn';

/**
 * The product site's header (PHASE5A_PRODUCT_SITE §7).
 *
 * One job: get a visitor to *Créer ma ligue*, and a returning one to their dashboard. Three links,
 * one secondary action, one primary — nothing else competes with the button.
 *
 * Anchor links are resolved against where the reader is. On the landing (`/` or `/home`) they
 * scroll the page. Elsewhere they go to the landing's section — at `/home` for a signed-in reader,
 * because `/` sends them to their dashboard.
 *
 * The signed-in state comes from the persisted auth store, which only exists in the browser, so
 * the server renders the signed-out header and the switch happens after mount. The reverse would
 * flash a "Tableau de bord" button at every anonymous visitor.
 */
export function SiteHeader() {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => setMounted(true), []);
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  const signedIn = mounted && !!user;
  const onLanding = pathname === '/' || pathname === '/home';
  const section = (id: string) => (onLanding ? `#${id}` : `${signedIn ? '/home' : '/'}#${id}`);

  const links = [
    { label: 'Fonctionnalités', href: section('fonctionnalites') },
    { label: 'Comment ça marche', href: section('comment-ca-marche') },
    { label: 'Contact', href: '/contact' },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-canvas/85 backdrop-blur supports-[backdrop-filter]:bg-canvas/70">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          href="/"
          aria-label="DXScores — accueil"
          className="rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
        >
          <Logo />
        </Link>

        <nav aria-label="Principale" className="hidden items-center gap-8 text-sm lg:flex">
          {links.map((l) => (
            <Link key={l.label} href={l.href} className="link-grow text-ink-muted transition-colors hover:text-ink">
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          {signedIn ? (
            <Button asChild variant="primary" size="md">
              <Link href={homeForRoles(user?.roles)}>Tableau de bord</Link>
            </Button>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden rounded-md px-3 py-2 text-sm font-medium text-ink-muted transition-colors hover:text-ink sm:inline-flex"
              >
                Se connecter
              </Link>
              <Button
                asChild
                variant="primary"
                size="md"
                className="group motion-safe:transition-transform motion-safe:hover:-translate-y-px"
              >
                <Link href="/register">
                  Créer ma ligue
                  <ArrowRight
                    className="hidden h-4 w-4 motion-safe:transition-transform motion-safe:group-hover:translate-x-0.5 sm:block"
                    aria-hidden
                  />
                </Link>
              </Button>
            </>
          )}

          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-controls="site-menu"
            aria-label={open ? 'Fermer le menu' : 'Ouvrir le menu'}
            className="-mr-2 flex h-10 w-10 items-center justify-center rounded-md text-ink transition-colors hover:bg-surface-sunk lg:hidden"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Phone menu: the same three links, and sign-in, which the bar has no room for. */}
      <div
        id="site-menu"
        className={cn('border-t border-line bg-canvas lg:hidden', open ? 'block' : 'hidden')}
      >
        <nav aria-label="Menu" className="mx-auto flex max-w-6xl flex-col px-4 py-3 sm:px-6">
          {links.map((l) => (
            <Link
              key={l.label}
              href={l.href}
              onClick={() => setOpen(false)}
              className="rounded-md px-2 py-3 text-base text-ink transition-colors hover:bg-surface-sunk"
            >
              {l.label}
            </Link>
          ))}
          {!signedIn && (
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="mt-2 rounded-md border-t border-line px-2 pb-1 pt-4 text-base text-ink-muted"
            >
              Se connecter
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
