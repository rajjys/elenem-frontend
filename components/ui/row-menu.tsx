'use client';

import { Fragment } from 'react';
import { MoreVertical, type LucideIcon } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './dropdown-menu';
import { cn } from '@/utils';

export type RowMenuItem = {
  label: string;
  icon: LucideIcon;
  onSelect: () => void;
  /** The destructive one: red, and set apart below a rule. */
  danger?: boolean;
  disabled?: boolean;
};

/**
 * A row's actions behind one « ⋮ », the way the competition cards already do it.
 *
 * The clubs and players tables carried three or four icons per row — responsables, modifier,
 * archiver, supprimer — which ate the width the names need and asked the reader to decode
 * pictograms (the owner, 2026-10-20). Here every action has its word. The destructive ones go
 * last, below a rule, in red, so the one that cannot be taken back is never the first under the
 * finger. `false` and `null` items are skipped, so callers can write their conditions inline.
 */
export function RowMenu({ label, items }: { label: string; items: (RowMenuItem | false | null | undefined)[] }) {
  const shown = items.filter((i): i is RowMenuItem => !!i);
  const safe = shown.filter((i) => !i.danger);
  const danger = shown.filter((i) => i.danger);
  if (!shown.length) return null;

  const item = (i: RowMenuItem) => (
    <DropdownMenuItem
      key={i.label}
      onSelect={i.onSelect}
      disabled={i.disabled}
      className={cn(i.danger && 'text-negative focus:bg-negative-soft focus:text-negative')}
    >
      <i.icon className="mr-2 h-4 w-4" aria-hidden />
      {i.label}
    </DropdownMenuItem>
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={label}
          className="rounded-md p-1.5 text-ink-subtle transition-colors hover:bg-surface-sunk hover:text-ink"
        >
          <MoreVertical className="h-4 w-4" aria-hidden />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {safe.map(item)}
        {safe.length > 0 && danger.length > 0 && <DropdownMenuSeparator />}
        {danger.map((i) => (
          <Fragment key={i.label}>{item(i)}</Fragment>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
