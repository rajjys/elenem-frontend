import Link from 'next/link';
import type { ReactNode } from 'react';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { BrandMark } from './brand-mark';
import { AuthAside } from './auth-aside';

/**
 * The frame every signed-out page sits in.
 *
 * Three things it fixes. There was no way out except an unlabelled arrow in a corner, which
 * tells you nothing about where it goes. There was no way to switch theme, because the app's
 * only control lives in the account menu — behind the very sign-in you are trying to complete,
 * so a signed-out visitor was stuck in whatever their OS said. And the page had no brand beyond
 * a 180px logo sitting where the heading should be.
 *
 * So: a real bar with a named home link and a theme control, a small mark, and — from `lg` up —
 * a panel showing what the product actually produces. A league president deciding whether this
 * is real should be able to see the answer before signing up.
 */
export function AuthShell({
  title,
  subtitle,
  crossLink,
  children,
  footer,
  align = 'start',
}: {
  title: string;
  subtitle?: ReactNode;
  /** "Already have an account? Log in" — the other door, named, next to the heading. */
  crossLink?: { prompt: string; label: string; href: string };
  children: ReactNode;
  /** Legal text or equivalent, in the quiet zone under the form. */
  footer?: ReactNode;
  /**
   * Centred for outcome screens, where the heading announces something rather than labelling a
   * form. A left-aligned heading over centred buttons reads as two layouts sharing a page.
   */
  align?: 'start' | 'center';
}) {
  const centered = align === 'center';
  return (
    <div className="min-h-dvh bg-canvas text-ink flex flex-col lg:flex-row">
      {/* --- form column --- */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="flex items-center justify-between px-5 sm:px-8 py-4">
          <Link
            href="/"
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

      {/* --- brand column, desktop only --- */}
      <AuthAside />
    </div>
  );
}
