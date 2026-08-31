'use client';

import { isoDay, type CalendarEntry } from '@/services/calendar';
import { cn } from '@/utils';

/**
 * Twelve months at a glance, each day carrying how busy it is.
 *
 * The month grid answers "what is on Saturday". This answers a different question the month grid
 * cannot: where the season actually sits. A league secretary looking at a year sees the block of
 * matchdays, the empty stretch over the holidays, and the week the hall is closed — which is the
 * shape they are deciding about when they plan a calendar, and the shape they currently hold in
 * their head or on paper.
 *
 * Density rather than detail: a day is a square, its tint is how many fixtures it holds. Clicking
 * a month opens it, because reading the detail is the month grid's job.
 */

const MONTHS_SHORT = [
  'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin',
  'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc',
];

/** Four steps. More than that and a wall of squares stops being readable at this size. */
function densityClass(count: number, closed: boolean): string {
  if (closed && count === 0) return 'bg-caution-soft';
  if (count === 0) return 'bg-surface-sunk';
  if (count <= 2) return 'bg-cat-1-soft';
  if (count <= 5) return 'bg-cat-1/40';
  return 'bg-cat-1';
}

export function YearGrid({
  year,
  entries,
  closedDays,
  onPickMonth,
  onPickDay,
}: {
  year: number;
  entries: CalendarEntry[];
  closedDays: Map<string, string[]>;
  onPickMonth: (month: number) => void;
  onPickDay: (day: string) => void;
}) {
  const counts = new Map<string, number>();
  for (const e of entries) {
    const key = isoDay(new Date(e.dateTime));
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const todayKey = isoDay(new Date());

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {MONTHS_SHORT.map((label, month) => {
        const first = new Date(year, month, 1);
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const lead = (first.getDay() + 6) % 7;
        const monthTotal = Array.from({ length: daysInMonth }, (_, i) =>
          counts.get(isoDay(new Date(year, month, i + 1))) ?? 0,
        ).reduce((a, b) => a + b, 0);

        return (
          <div key={label} className="rounded-lg border border-line bg-surface p-3">
            <button
              type="button"
              onClick={() => onPickMonth(month)}
              className="mb-2 flex w-full items-baseline justify-between gap-2 rounded text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <span className="text-sm font-semibold text-ink">{label}</span>
              <span className="text-xs tabular-nums text-ink-subtle">
                {monthTotal || '—'}
              </span>
            </button>

            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: lead }, (_, i) => (
                <span key={`pad-${i}`} />
              ))}
              {Array.from({ length: daysInMonth }, (_, i) => {
                const date = new Date(year, month, i + 1);
                const key = isoDay(date);
                const count = counts.get(key) ?? 0;
                const closed = closedDays.has(key);
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => onPickDay(key)}
                    disabled={count === 0 && !closed}
                    // An accessible name rather than an sr-only child. `sr-only` is
                    // position:absolute, and with no positioned ancestor its containing block is
                    // <html> — so 360 of them escaped the scrolling main, stretched the document
                    // past the viewport, and the whole page (sidebar included) started scrolling.
                    aria-label={
                      closed
                        ? `${i + 1} ${label} — ${closedDays.get(key)?.[0]}`
                        : `${i + 1} ${label} — ${count} match${count > 1 ? 's' : ''}`
                    }
                    title={
                      closed
                        ? `${i + 1} ${label} — ${closedDays.get(key)?.[0]}`
                        : `${i + 1} ${label} — ${count} match${count > 1 ? 's' : ''}`
                    }
                    className={cn(
                      'aspect-square rounded-[3px] text-[0.5rem] transition-transform',
                      densityClass(count, closed),
                      count > 0 && 'hover:scale-125 hover:ring-1 hover:ring-accent cursor-pointer',
                      count > 5 && 'text-accent-ink',
                      key === todayKey && 'ring-1 ring-accent',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
                    )}
                  />
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
