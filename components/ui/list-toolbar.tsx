'use client';

import { Search } from 'lucide-react';
import { Input } from './input';
import { cn } from '@/utils';

/**
 * The row under a list's title: search on the left, whatever narrows the list on the right.
 *
 * Every list had invented its own. The roster put a bare `Input` with a hand-positioned icon in
 * `ListPage`'s filters slot; the clubs list opened a 453-line dialog with a country dropdown in it;
 * publications had a third shape. So the same act — *find the row I want* — looked different on
 * three consecutive screens, and only one of them was styled.
 *
 * **Deliberately not a filter framework.** It is a search box and a slot. What a particular list
 * wants to filter by is that list's business; what it should not do is reinvent where the search
 * box goes, or how wide it is, or whether it has an icon.
 *
 * Filters live here rather than beside the primary action, which stays up on the title line. The
 * calendar established that split — what you are *looking at* is not the same kind of control as
 * what you can *do* — and this is it applied to every list.
 */
export function ListToolbar({
  search,
  onSearchChange,
  placeholder = 'Rechercher…',
  children,
  className,
}: {
  /** Omit both search props on a list that has nothing worth searching — a handful of leagues. */
  search?: string;
  onSearchChange?: (value: string) => void;
  placeholder?: string;
  /** Filters, toggles, counts. Right-aligned, wraps under the search box on a phone. */
  children?: React.ReactNode;
  className?: string;
}) {
  const hasSearch = typeof search === 'string' && !!onSearchChange;
  if (!hasSearch && !children) return null;

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      {hasSearch && (
        <div className="relative w-full max-w-sm sm:w-auto sm:min-w-[18rem]">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-subtle"
            aria-hidden
          />
          <Input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={placeholder}
            className="pl-9"
            // Chrome offers to fill any unnamed text input it takes for a username, and paints it
            // its autofill yellow when it does. A search box over a list is never that.
            autoComplete="off"
          />
        </div>
      )}
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}
