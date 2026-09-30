import Link from 'next/link';
import type { ReactNode } from 'react';
import { ArrowRight } from 'lucide-react';

/** A section of a league page: its title with the accent rule, and where to see all of it. */
export function HomeSection({
  title,
  href,
  linkLabel,
  children,
}: {
  title: string;
  href?: string;
  linkLabel?: string;
  children: ReactNode;
}) {
  return (
    <section>
      <div className="mb-3 flex items-end justify-between gap-3">
        <h2 className="text-lg font-bold text-ink">
          {title}
          <span aria-hidden className="mt-1.5 block h-0.5 w-8 rounded-full bg-[var(--site-accent)]" />
        </h2>
        {href && linkLabel && (
          <Link href={href} className="group inline-flex items-center gap-1 text-sm font-medium text-[var(--site-accent)]">
            {linkLabel}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}
