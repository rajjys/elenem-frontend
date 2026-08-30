import Link from 'next/link';
import type { ReactNode } from 'react';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { BrandMark } from './brand-mark';

/**
 * The frame both halves of onboarding sit in.
 *
 * Sign-up and the setup wizard are one journey, so they should not look like two products. This
 * is the layout they share: a bar carrying the brand and a theme control, a column of content
 * capped at a readable width, and — from `lg` up — a panel that says something worth knowing
 * while you fill the form in.
 */
export function SplitShell({
  title,
  subtitle,
  crossLink,
  children,
  footer,
  aside,
  align = 'start',
  homeHref = '/',
}: {
  title: string;
  subtitle?: ReactNode;
  /** "Already have an account? Log in" — the other door, named, next to the heading. */
  crossLink?: { prompt: string; label: string; href: string };
  children: ReactNode;
  /** Legal text or equivalent, in the quiet zone under the form. */
  footer?: ReactNode;
  /** The panel beside the form. Hidden below `lg`, so it must never carry required content. */
  aside?: ReactNode;
  /**
   * Centred for outcome screens, where the heading announces something rather than labelling a
   * form. A left-aligned heading over centred buttons reads as two layouts sharing a page.
   */
  align?: 'start' | 'center';
  homeHref?: string;
}) {
  const centered = align === 'center';

  return (
    <div className="min-h-dvh bg-canvas text-ink flex flex-col lg:flex-row lg:items-stretch">
      <div className="flex-1 flex flex-col min-w-0">
        <header className="flex items-center justify-between px-5 sm:px-8 py-4">
          <Link
            href={homeHref}
            className="flex items-center gap-2.5 rounded-md -ml-1 px-1 py-1 text-sm font-medium text-ink-muted hover:text-ink transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <BrandMark className="h-7 w-7" />
            <span>Elenem</span>
          </Link>
          <ThemeToggle />
        </header>

        <main className="flex-1 flex items-start sm:items-center justify-center px-5 sm:px-8 pb-10">
          <div className={`w-full max-w-[27rem] py-6 sm:py-10 ${centered ? 'text-center' : ''}`}>
            <h1 className="text-[1.75rem] sm:text-4xl font-bold tracking-tight text-ink text-balance">
              {title}
            </h1>
            {subtitle && <p className="mt-2 text-[0.9375rem] text-ink-muted">{subtitle}</p>}
            {crossLink && (
              <p className="mt-2 text-[0.9375rem] text-ink-muted">
                {crossLink.prompt}{' '}
                <Link
                  href={crossLink.href}
                  className="font-semibold text-ink underline decoration-accent-line underline-offset-4 hover:decoration-accent transition-colors"
                >
                  {crossLink.label}
                </Link>
              </p>
            )}

            <div className="mt-8">{children}</div>

            {footer && (
              <div className="mt-8 pt-6 border-t border-line text-xs leading-relaxed text-ink-subtle">
                {footer}
              </div>
            )}
          </div>
        </main>
      </div>

      {aside && (
        // Sticky and full-height, so it stays put while the form column grows. It was scrolling
        // away with the page — opening the paste box pushed the summary panel down with it,
        // which made a fixed reference point behave like content.
        <aside className="hidden lg:flex lg:w-[46%] xl:w-[42%] shrink-0 relative overflow-hidden bg-accent text-accent-ink lg:sticky lg:top-0 lg:h-dvh">
          {/* Two soft sweeps, so the block does not read as a solid rectangle without competing
              with the form. */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.14]"
            style={{
              background:
                'radial-gradient(120% 80% at 85% 0%, #fff 0%, transparent 55%), radial-gradient(90% 70% at 10% 100%, #fff 0%, transparent 60%)',
            }}
            aria-hidden
          />
          {/* Scrolls within itself if the panel ever outgrows the viewport, rather than
              stretching the page. */}
          <div className="relative flex flex-col justify-center px-12 xl:px-16 py-16 w-full overflow-y-auto">
            {aside}
          </div>
        </aside>
      )}
    </div>
  );
}
