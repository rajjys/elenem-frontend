'use client';

import Link from 'next/link';
import { useSelectedLayoutSegment } from 'next/navigation';
import { BarChart3, CalendarDays, Home, ListOrdered, Newspaper, Trophy, Users } from 'lucide-react';
import { cn } from '@/utils/cn';
import type { SiteNavIcon, SiteNavItem } from '@/lib/public-site/nav';

/**
 * The league site's navigation, the only part of the frame that needs the browser: it marks the
 * page being read. It reads the active *route segment*, not the URL — the address a supporter sees
 * (`/games`) and the route that renders it (`/public/public_tenant/<slug>/games`) differ, and the
 * segment is the same on both sides of that rewrite.
 */

const ICONS: Record<SiteNavIcon, typeof Home> = {
  home: Home,
  games: CalendarDays,
  standings: ListOrdered,
  teams: Users,
  stats: BarChart3,
  playoffs: Trophy,
  news: Newspaper,
};

/** A wide screen: the whole navigation in the header. */
export function SiteNavLinks({ items, banded }: { items: SiteNavItem[]; banded: boolean }) {
  const segment = useSelectedLayoutSegment();
  return (
    <ul className="flex items-center gap-1 text-sm font-medium">
      {items.map((item) => {
        const active = item.segment === segment;
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'rounded-md px-3 py-2 transition-colors',
                banded
                  ? cn('site-band-hover', active ? 'underline decoration-2 underline-offset-8' : 'opacity-85 hover:opacity-100')
                  : active
                    ? 'text-[var(--site-accent)]'
                    : 'text-ink-muted hover:text-ink',
              )}
            >
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

/** A phone: a tab bar at the bottom, within reach of the thumb (§6, the frame). */
export function BottomNav({ items }: { items: SiteNavItem[] }) {
  const segment = useSelectedLayoutSegment();
  if (items.length === 0) return null;
  return (
    <nav
      aria-label="Principale"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <ul className="grid" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>
        {items.map((item) => {
          const Icon = ICONS[item.icon];
          const active = item.segment === segment;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex flex-col items-center gap-0.5 py-2 text-[0.7rem] font-medium',
                  active ? 'text-[var(--site-accent)]' : 'text-ink-muted',
                )}
              >
                <Icon className="h-5 w-5" aria-hidden />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
