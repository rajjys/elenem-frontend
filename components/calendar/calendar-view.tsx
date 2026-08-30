'use client';

import { useMemo, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, MapPin, Ban } from 'lucide-react';
import { Button, LoadingSpinner } from '@/components/ui';
import { ErrorState } from '@/components/ui/error-state';
import {
  blackoutDays,
  isoDay,
  useCalendar,
  type CalendarCompetition,
  type CalendarEntry,
} from '@/services/calendar';
import { cn } from '@/utils';

/**
 * The organisation's calendar, read-only.
 *
 * Tenant-wide on purpose: a `Season` belongs to one `League`, so a season-scoped calendar could
 * only answer "when does this competition play", while the question an organiser actually has is
 * "is that hall free on Saturday". One hall on one Saturday is a single resource however many
 * competitions want it, and LIPROBAKIN run men's, women's and a second division out of the same
 * rooms.
 *
 * Nothing here writes. That is not a limitation of a first slice — it is the shape the first
 * operator needs, because at LIPROBAKIN the person entering data is a community manager who
 * receives the fixture list rather than deciding it.
 */

/**
 * A colour per competition, assigned by position rather than stored.
 *
 * These are the CATEGORY tokens, not the semantic ones. Borrowing positive/negative would have
 * put a green chip on a fixture nobody had played and a red one on a competition that had done
 * nothing wrong; on a screen full of scores, green reads as "won". The category ramp says which,
 * never how it went.
 *
 * The class strings live here rather than in the service because Tailwind finds utilities by
 * scanning source, and presentation does not belong in a data module anyway.
 */
const COMPETITION_TONES = [
  { dot: 'bg-cat-1', chip: 'bg-cat-1-soft text-cat-1 ring-cat-1/25' },
  { dot: 'bg-cat-2', chip: 'bg-cat-2-soft text-cat-2 ring-cat-2/25' },
  { dot: 'bg-cat-3', chip: 'bg-cat-3-soft text-cat-3 ring-cat-3/25' },
  { dot: 'bg-cat-4', chip: 'bg-cat-4-soft text-cat-4 ring-cat-4/25' },
] as const;

function toneFor(competitionId: string, competitions: CalendarCompetition[]) {
  const index = competitions.findIndex((c) => c.id === competitionId);
  return COMPETITION_TONES[(index < 0 ? 0 : index) % COMPETITION_TONES.length];
}

const MONTHS = [
  'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
];
const WEEKDAYS = ['lun', 'mar', 'mer', 'jeu', 'ven', 'sam', 'dim'];

function monthBounds(cursor: Date) {
  const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const last = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0);
  return { first, last };
}

/** The six-week grid a month is drawn on, Monday first. */
function monthGrid(cursor: Date): Date[] {
  const { first, last } = monthBounds(cursor);
  const lead = (first.getDay() + 6) % 7;
  const start = new Date(first);
  start.setDate(first.getDate() - lead);

  const cells: Date[] = [];
  const cell = new Date(start);
  while (cell <= last || cells.length % 7 !== 0) {
    cells.push(new Date(cell));
    cell.setDate(cell.getDate() + 1);
    if (cells.length > 42) break;
  }
  return cells;
}

function timeOf(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function EntryChip({
  entry,
  competitions,
  compact = false,
}: {
  entry: CalendarEntry;
  competitions: CalendarCompetition[];
  compact?: boolean;
}) {
  const tone = toneFor(entry.leagueId, competitions);
  const played = entry.status === 'COMPLETED';

  return (
    <div
      className={cn(
        'flex items-center gap-1.5 rounded px-1.5 py-1 text-[0.6875rem] leading-tight',
        'ring-1',
        tone.chip,
        played && 'opacity-70',
      )}
      title={`${timeOf(entry.dateTime)} · ${entry.home.name} — ${entry.away.name}`}
    >
      {!compact && <span className="tabular-nums opacity-70">{timeOf(entry.dateTime)}</span>}
      <span className="truncate font-medium">
        {entry.home.shortCode} <span className="opacity-50">·</span> {entry.away.shortCode}
      </span>
      {played && entry.homeScore != null && (
        <span className="ml-auto shrink-0 tabular-nums font-semibold">
          {entry.homeScore}–{entry.awayScore}
        </span>
      )}
    </div>
  );
}

export function CalendarView() {
  const [cursor, setCursor] = useState(() => new Date());
  const [hidden, setHidden] = useState<Set<string>>(new Set());

  const { first, last } = useMemo(() => monthBounds(cursor), [cursor]);
  const cells = useMemo(() => monthGrid(cursor), [cursor]);

  // The grid shows a few days either side of the month, so the query covers them too.
  const range = useMemo(
    () => ({ from: isoDay(cells[0] ?? first), to: isoDay(cells[cells.length - 1] ?? last) }),
    [cells, first, last],
  );

  const { data, isPending, isError, refetch } = useCalendar(range);

  const visible = useMemo(
    () => (data?.entries ?? []).filter((e) => !hidden.has(e.leagueId)),
    [data, hidden],
  );

  const byDay = useMemo(() => {
    const map = new Map<string, CalendarEntry[]>();
    for (const e of visible) {
      const key = isoDay(new Date(e.dateTime));
      map.set(key, [...(map.get(key) ?? []), e]);
    }
    for (const list of map.values()) list.sort((a, b) => a.dateTime.localeCompare(b.dateTime));
    return map;
  }, [visible]);

  const closed = useMemo(() => blackoutDays(data?.blackouts ?? []), [data]);
  const todayKey = isoDay(new Date());
  const venueName = (id?: string | null) => data?.venues.find((v) => v.id === id)?.name;

  function toggle(leagueId: string) {
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(leagueId)) next.delete(leagueId);
      else next.add(leagueId);
      return next;
    });
  }

  function shiftMonth(delta: number) {
    setCursor((c) => new Date(c.getFullYear(), c.getMonth() + delta, 1));
  }

  if (isError) {
    return (
      <ErrorState
        title="Le calendrier n'a pas pu être chargé."
        reset={() => void refetch()}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* ---- month control + competition legend ---- */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => shiftMonth(-1)}
            aria-label="Mois précédent"
            className="flex h-9 w-9 items-center justify-center rounded-md text-ink-muted hover:bg-surface-sunk hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden />
          </button>
          <h2 className="min-w-[9.5rem] text-center text-base font-semibold text-ink capitalize">
            {MONTHS[cursor.getMonth()]} {cursor.getFullYear()}
          </h2>
          <button
            type="button"
            onClick={() => shiftMonth(1)}
            aria-label="Mois suivant"
            className="flex h-9 w-9 items-center justify-center rounded-md text-ink-muted hover:bg-surface-sunk hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <ChevronRight className="h-4 w-4" aria-hidden />
          </button>
          <Button variant="ghost" onClick={() => setCursor(new Date())} className="ml-1">
            Aujourd&apos;hui
          </Button>
        </div>

        {/* Filtering by competition is the one interaction a read-only calendar needs: with three
            competitions on one grid, isolating D2 is how you see whether it fits. */}
        <div className="flex flex-wrap items-center gap-1.5">
          {(data?.competitions ?? []).map((c) => {
            const tone = toneFor(c.id, data?.competitions ?? []);
            const off = hidden.has(c.id);
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => toggle(c.id)}
                aria-pressed={!off}
                title={c.name}
                className={cn(
                  'flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-colors ring-1',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
                  off ? 'bg-surface text-ink-subtle ring-line' : tone.chip,
                )}
              >
                <span className={cn('h-2 w-2 rounded-full', off ? 'bg-line-strong' : tone.dot)} />
                {c.shortLabel}
              </button>
            );
          })}
        </div>

        <span className="ml-auto text-xs text-ink-subtle tabular-nums">
          {visible.length} match{visible.length > 1 ? 's' : ''}
        </span>
      </div>

      {isPending ? (
        <LoadingSpinner message="Chargement du calendrier…" />
      ) : (
        <>
          {/* ---- month grid: sm and up ---- */}
          <div className="hidden sm:block overflow-hidden rounded-lg border border-line bg-surface">
            <div className="grid grid-cols-7 border-b border-line">
              {WEEKDAYS.map((d) => (
                <div
                  key={d}
                  className="px-2 py-2 text-center text-[0.6875rem] font-medium uppercase tracking-wider text-ink-subtle"
                >
                  {d}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7">
              {cells.map((day) => {
                const key = isoDay(day);
                const entries = byDay.get(key) ?? [];
                const outside = day.getMonth() !== cursor.getMonth();
                const reasons = closed.get(key);

                return (
                  <div
                    key={key}
                    className={cn(
                      'min-h-[6.5rem] border-b border-r border-line p-1.5 last:border-r-0',
                      '[&:nth-child(7n)]:border-r-0',
                      outside && 'bg-surface-sunk/40',
                      reasons && 'bg-caution-soft/40',
                    )}
                  >
                    <div className="flex items-center justify-between gap-1 px-0.5 pb-1">
                      <span
                        className={cn(
                          'inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-xs tabular-nums',
                          key === todayKey
                            ? 'bg-accent font-semibold text-accent-ink'
                            : outside
                              ? 'text-ink-subtle'
                              : 'text-ink-muted',
                        )}
                      >
                        {day.getDate()}
                      </span>
                      {reasons && (
                        <Ban
                          className="h-3 w-3 shrink-0 text-caution"
                          aria-label={reasons[0]}
                        />
                      )}
                    </div>

                    <div className="space-y-1">
                      {entries.slice(0, 3).map((e) => (
                        <EntryChip key={e.id} entry={e} competitions={data?.competitions ?? []} />
                      ))}
                      {entries.length > 3 && (
                        <p className="px-1 text-[0.6875rem] text-ink-subtle">
                          +{entries.length - 3} autre{entries.length - 3 > 1 ? 's' : ''}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ---- agenda: below sm ---- */}
          <div className="sm:hidden space-y-3">
            {[...byDay.entries()]
              .filter(([key]) => new Date(key).getMonth() === cursor.getMonth())
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([key, entries]) => {
                const day = new Date(key);
                const reasons = closed.get(key);
                return (
                  <div key={key} className="rounded-lg border border-line bg-surface">
                    <div className="flex items-center gap-2 border-b border-line px-3 py-2">
                      <span
                        className={cn(
                          'text-sm font-semibold',
                          key === todayKey ? 'text-accent-text' : 'text-ink',
                        )}
                      >
                        {WEEKDAYS[(day.getDay() + 6) % 7]} {day.getDate()} {MONTHS[day.getMonth()]}
                      </span>
                      {reasons && (
                        <span className="flex items-center gap-1 text-xs text-caution">
                          <Ban className="h-3 w-3" aria-hidden />
                          {reasons[0]}
                        </span>
                      )}
                      <span className="ml-auto text-xs tabular-nums text-ink-subtle">
                        {entries.length}
                      </span>
                    </div>
                    <ul className="divide-y divide-line">
                      {entries.map((e) => {
                        const tone = toneFor(e.leagueId, data?.competitions ?? []);
                        const venue = venueName(e.venueId);
                        return (
                          <li key={e.id} className="flex items-center gap-2.5 px-3 py-2.5">
                            <span className={cn('h-2 w-2 shrink-0 rounded-full', tone.dot)} />
                            <span className="w-11 shrink-0 text-xs tabular-nums text-ink-muted">
                              {timeOf(e.dateTime)}
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm text-ink">
                                {e.home.name} <span className="text-ink-subtle">—</span> {e.away.name}
                              </p>
                              {venue && (
                                <p className="flex items-center gap-1 truncate text-xs text-ink-subtle">
                                  <MapPin className="h-3 w-3 shrink-0" aria-hidden />
                                  {venue}
                                </p>
                              )}
                            </div>
                            {e.status === 'COMPLETED' && e.homeScore != null && (
                              <span className="shrink-0 text-sm font-semibold tabular-nums text-ink">
                                {e.homeScore}–{e.awayScore}
                              </span>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                );
              })}

            {byDay.size === 0 && (
              <p className="rounded-lg border border-line bg-surface px-4 py-8 text-center text-sm text-ink-muted">
                Aucun match ce mois-ci.
              </p>
            )}
          </div>

          {/* ---- what the calendar cannot yet tell you ---- */}
          {data && data.venues.length > 0 && (
            <p className="flex items-center gap-1.5 text-xs text-ink-subtle">
              <CalendarDays className="h-3.5 w-3.5 shrink-0" aria-hidden />
              {visible.filter((e) => e.venueId).length} match
              {visible.filter((e) => e.venueId).length > 1 ? 's' : ''} sur {visible.length} ont une
              salle attribuée. Les autres ont une date mais pas encore de lieu.
            </p>
          )}
        </>
      )}
    </div>
  );
}
