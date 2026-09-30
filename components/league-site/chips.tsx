import Link from 'next/link';
import { cn } from '@/utils/cn';

export interface Chip {
  label: string;
  href: string;
  active: boolean;
}

/**
 * A row of choices that are links — competition, phase, pool — so the page stays a server page
 * and each choice has its own address to share. On a phone the row scrolls sideways rather than
 * wrapping into a wall of buttons.
 */
export function Chips({ items, label }: { items: Chip[]; label: string }) {
  if (items.length < 2) return null;
  return (
    <nav aria-label={label} className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <ul className="flex w-max gap-2">
        {items.map((c) => (
          <li key={c.href}>
            <Link
              href={c.href}
              aria-current={c.active ? 'page' : undefined}
              className={cn(
                'block whitespace-nowrap rounded-full border px-3.5 py-1.5 text-sm transition-colors',
                c.active
                  ? 'border-[var(--site-accent)] bg-surface font-semibold text-[var(--site-accent)]'
                  : 'border-line bg-surface text-ink-muted hover:border-line-strong hover:text-ink',
              )}
            >
              {c.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
