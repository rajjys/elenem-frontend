import type { ReactNode } from 'react';

/**
 * A league page's title, with the short rule in the league's accent that marks every section title
 * on its site (PHASE5B_LEAGUE_SITES §4.6).
 */
export function PageTitle({ children, aside }: { children: ReactNode; aside?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">{children}</h1>
        <span aria-hidden className="mt-2 block h-1 w-10 rounded-full bg-[var(--site-accent)]" />
      </div>
      {aside}
    </div>
  );
}
