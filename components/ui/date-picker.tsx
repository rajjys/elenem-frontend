'use client';

import { useMemo, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { cn } from '@/utils';

/**
 * A date field that belongs to this design system.
 *
 * `<input type="date">` renders whatever the browser feels like — native chrome, a locale from
 * the OS rather than the product, no token colours, and a different shape on every platform. For
 * a French product where a season's dates are among the few things an organiser must get right,
 * that inconsistency is worse than the code it saves.
 *
 * The value is always `yyyy-mm-dd`, so it drops into the same forms the native input fed.
 */

const MONTHS = [
  'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
];

// Monday first: the week a Congolese league's calendar is written against.
const WEEKDAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

function toIso(d: Date): string {
  // Local calendar day, not UTC — toISOString() reports yesterday for anyone east of Greenwich
  // late in the evening.
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function fromIso(value?: string): Date | null {
  if (!value) return null;
  const [y, m, d] = value.split('-').map(Number);
  if (!y || !m || !d) return null;
  const parsed = new Date(y, m - 1, d);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatFr(d: Date): string {
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

/** Days of the shown month, padded so the first lands under its weekday. Monday = 0. */
function monthGrid(cursor: Date): (Date | null)[] {
  const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const daysInMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
  const lead = (first.getDay() + 6) % 7;

  return [
    ...Array.from({ length: lead }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(cursor.getFullYear(), cursor.getMonth(), i + 1)),
  ];
}

export function DatePicker({
  value,
  onChange,
  id,
  invalid = false,
  placeholder = 'Choisissez une date',
}: {
  /** yyyy-mm-dd */
  value?: string;
  onChange: (iso: string) => void;
  id?: string;
  invalid?: boolean;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = useMemo(() => fromIso(value), [value]);
  const [cursor, setCursor] = useState<Date>(() => selected ?? new Date());

  const grid = useMemo(() => monthGrid(cursor), [cursor]);
  const todayIso = toIso(new Date());

  function shiftMonth(delta: number) {
    setCursor((c) => new Date(c.getFullYear(), c.getMonth() + delta, 1));
  }

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        // Reopening lands on the chosen date's month, not wherever browsing left off.
        if (next) setCursor(selected ?? new Date());
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          id={id}
          aria-haspopup="dialog"
          className={cn(
            'flex h-11 w-full items-center justify-between gap-2 rounded-lg border bg-surface px-3 text-sm text-ink transition-colors',
            'hover:border-line-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:border-accent',
            invalid ? 'border-negative' : 'border-line',
          )}
        >
          <span className={cn('truncate', !selected && 'text-ink-subtle')}>
            {selected ? formatFr(selected) : placeholder}
          </span>
          <CalendarDays className="h-4 w-4 shrink-0 text-ink-subtle" aria-hidden />
        </button>
      </PopoverTrigger>

      <PopoverContent className="w-[19rem] p-3 border-line" align="start">
        <div className="flex items-center justify-between mb-2">
          <button
            type="button"
            onClick={() => shiftMonth(-1)}
            aria-label="Mois précédent"
            className="flex h-8 w-8 items-center justify-center rounded-md text-ink-muted hover:bg-surface-sunk hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden />
          </button>
          <span className="text-sm font-medium text-ink capitalize">
            {MONTHS[cursor.getMonth()]} {cursor.getFullYear()}
          </span>
          <button
            type="button"
            onClick={() => shiftMonth(1)}
            aria-label="Mois suivant"
            className="flex h-8 w-8 items-center justify-center rounded-md text-ink-muted hover:bg-surface-sunk hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <ChevronRight className="h-4 w-4" aria-hidden />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-0.5 mb-1">
          {WEEKDAYS.map((d, i) => (
            <span
              key={`${d}-${i}`}
              className="flex h-7 items-center justify-center text-[0.6875rem] font-medium text-ink-subtle"
            >
              {d}
            </span>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-0.5">
          {grid.map((day, i) => {
            if (!day) return <span key={`pad-${i}`} />;
            const iso = toIso(day);
            const isSelected = iso === value;
            const isToday = iso === todayIso;
            return (
              <button
                key={iso}
                type="button"
                onClick={() => {
                  onChange(iso);
                  setOpen(false);
                }}
                className={cn(
                  'flex h-8 items-center justify-center rounded-md text-sm tabular-nums transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
                  isSelected
                    ? 'bg-accent text-accent-ink font-semibold'
                    : 'text-ink hover:bg-surface-sunk',
                  !isSelected && isToday && 'ring-1 ring-accent-line font-medium',
                )}
              >
                {day.getDate()}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => {
            onChange(todayIso);
            setOpen(false);
          }}
          className="mt-2 w-full rounded-md py-1.5 text-xs font-medium text-accent-text hover:bg-surface-sunk"
        >
          Aujourd&apos;hui
        </button>
      </PopoverContent>
    </Popover>
  );
}
