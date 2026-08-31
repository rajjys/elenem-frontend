'use client';

import { useCallback, useMemo, useState } from 'react';
import { Ban, ChevronLeft, ChevronRight, MapPin } from 'lucide-react';
import { Button, LoadingSpinner } from '@/components/ui';
import { ErrorState } from '@/components/ui/error-state';
import {
  blackoutDays,
  isoDay,
  useCalendar,
  type CalendarCompetition,
  type CalendarEntry,
} from '@/services/calendar';
import { useScopeContext } from '@/hooks';
import { cn } from '@/utils';
import { FixtureChip } from './fixture-chip';
import { FixtureDrawer } from './fixture-drawer';
import { CalendarList } from './calendar-list';
import { ResultsSheetButton } from './results-sheet-button';
import { YearGrid } from './year-grid';

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

const MONTHS = [
  'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
];
const WEEKDAYS = ['lun', 'mar', 'mer', 'jeu', 'ven', 'sam', 'dim'];

/** How many chips fit a month cell before the rest become a "+N" the reader can open. */
const CHIPS_PER_CELL = 3;

function monthGrid(cursor: Date): Date[] {
  const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const last = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0);
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

type Scale = 'month' | 'year' | 'list';

const SCALES: { key: Scale; label: string }[] = [
  { key: 'month', label: 'Mois' },
  { key: 'year', label: 'Année' },
  { key: 'list', label: 'Liste' },
];

export function CalendarView() {
  /**
   * Scope, resolved the way every other surface resolves it: the URL wins, the JWT is the floor.
   *
   * This is what the flat route buys. `/calendar` is one screen serving every role — a tenant
   * admin sees the whole organisation, a league admin sees their competition, and drilling into
   * a league narrows it — rather than /tenant/calendar and /league/calendar being two pages that
   * drift apart. Without this wiring the page ignored context entirely and showed a league admin
   * every competition in the organisation, which is the exact failure the convention exists to
   * prevent.
   */
  const scope = useScopeContext();

  const [scale, setScale] = useState<Scale>('month');
  const [cursor, setCursor] = useState(() => new Date());
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [openDay, setOpenDay] = useState<string | null>(null);
  const [focused, setFocused] = useState<CalendarEntry | null>(null);
  const [teamFilter, setTeamFilter] = useState<string>('');
  const [venueFilter, setVenueFilter] = useState<string>('');

  const cells = useMemo(() => monthGrid(cursor), [cursor]);

  // A year needs the whole year; a month needs the grid's overhang either side of it.
  const range = useMemo(() => {
    if (scale === 'year') {
      return { from: `${cursor.getFullYear()}-01-01`, to: `${cursor.getFullYear()}-12-31` };
    }
    if (scale === 'list') {
      // A list is for finding a fixture, not for reading a month, so it spans the season either
      // side of where the reader is standing.
      const from = new Date(cursor.getFullYear(), cursor.getMonth() - 3, 1);
      const to = new Date(cursor.getFullYear(), cursor.getMonth() + 4, 0);
      return { from: isoDay(from), to: isoDay(to) };
    }
    return { from: isoDay(cells[0]), to: isoDay(cells[cells.length - 1]) };
  }, [scale, cursor, cells]);

  const { data, isPending, isError, refetch } = useCalendar({
    ...range,
    // A league admin, or anyone who drilled into a league, sees that league only.
    leagueIds: scope.leagueId ? [scope.leagueId] : undefined,
  });

  const toneFor = useCallback(
    (leagueId: string) => {
      const index = (data?.competitions ?? []).findIndex((c) => c.id === leagueId);
      return COMPETITION_TONES[(index < 0 ? 0 : index) % COMPETITION_TONES.length];
    },
    [data],
  );

  /** Every club appearing this period, so the filter offers only what is actually there. */
  const teamsInRange = useMemo(() => {
    const map = new Map<string, string>();
    for (const e of data?.entries ?? []) {
      map.set(e.home.id, e.home.name);
      map.set(e.away.id, e.away.name);
    }
    return [...map.entries()]
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name, 'fr'));
  }, [data]);

  const visible = useMemo(
    () =>
      (data?.entries ?? []).filter((e) => {
        if (hidden.has(e.leagueId)) return false;
        // A team filter answers "when do we play"; a venue filter answers "what is in that hall".
        // Both are applied here rather than server-side: the period's fixtures are already loaded,
        // and a round trip per keystroke would cost more than the filtering saves.
        if (teamFilter && e.home.id !== teamFilter && e.away.id !== teamFilter) return false;
        if (venueFilter && e.venueId !== venueFilter) return false;
        return true;
      }),
    [data, hidden, teamFilter, venueFilter],
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
  const placed = visible.filter((e) => e.venueId).length;

  function openDrawer(day: string, entry: CalendarEntry | null = null) {
    setOpenDay(day);
    setFocused(entry);
  }
  function closeDrawer() {
    setOpenDay(null);
    setFocused(null);
  }

  function shift(delta: number) {
    setCursor((c) =>
      scale === 'year'
        ? new Date(c.getFullYear() + delta, c.getMonth(), 1)
        : new Date(c.getFullYear(), c.getMonth() + delta, 1),
    );
  }

  if (isError) {
    return <ErrorState title="Le calendrier n'a pas pu être chargé." reset={() => void refetch()} />;
  }

  return (
    <div
      className={cn(
        'space-y-4 transition-[padding] duration-200',
        // Space is reserved on wide screens rather than the panel simply covering the grid.
        // Overlaying keeps the month from reflowing, which is why it does so on phones — but
        // Sunday is the rightmost column, so on a desktop the panel would hide the very day it
        // describes, highlight and all. Reserving is the honest resolution: the grid shifts once,
        // predictably, and nothing you clicked disappears underneath.
        openDay !== null && 'lg:pr-[23rem]',
      )}
    >
      {/* Two rows, and they stack rather than wrap on a phone: period and view on one line,
          everything that narrows the grid on the next. It was one long line that wrapped into
          four ragged ones at 390px. */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-1">
          <button
            type="button"
            onClick={() => shift(-1)}
            aria-label={scale === 'year' ? 'Année précédente' : 'Mois précédent'}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-ink-muted transition-colors hover:bg-surface-sunk hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden />
          </button>
          <h2 className="min-w-[8.5rem] text-center text-base font-semibold capitalize text-ink">
            {scale === 'year'
              ? cursor.getFullYear()
              : `${MONTHS[cursor.getMonth()]} ${cursor.getFullYear()}`}
          </h2>
          <button
            type="button"
            onClick={() => shift(1)}
            aria-label={scale === 'year' ? 'Année suivante' : 'Mois suivant'}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-ink-muted transition-colors hover:bg-surface-sunk hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <ChevronRight className="h-4 w-4" aria-hidden />
          </button>

          <Button variant="ghost" onClick={() => setCursor(new Date())} className="ml-1 shrink-0">
            Aujourd&apos;hui
          </Button>

          {/* Three ways of reading the same fixtures: what is on Saturday, where the season
              sits, and the plain list a phone wants anyway. */}
          {/* Wraps to its own line on a phone rather than being pushed off the right edge, which
              is where it went when this row could not fit. */}
          <div className="ml-auto mt-1 flex shrink-0 rounded-lg border border-line bg-surface p-0.5 sm:mt-0">
            {SCALES.map((sc) => (
              <button
                key={sc.key}
                type="button"
                onClick={() => setScale(sc.key)}
                aria-pressed={scale === sc.key}
                className={cn(
                  'rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
                  scale === sc.key ? 'bg-accent text-accent-ink' : 'text-ink-muted hover:text-ink',
                )}
              >
                {sc.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            {(data?.competitions ?? []).map((c: CalendarCompetition) => {
              const tone = toneFor(c.id);
              const off = hidden.has(c.id);
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() =>
                    setHidden((prev) => {
                      const next = new Set(prev);
                      if (next.has(c.id)) next.delete(c.id);
                      else next.add(c.id);
                      return next;
                    })
                  }
                  aria-pressed={!off}
                  title={c.name}
                  className={cn(
                    'flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 transition-colors',
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

          <div className="ml-auto flex flex-wrap items-center gap-2">
            <select
              value={teamFilter}
              onChange={(e) => setTeamFilter(e.target.value)}
              aria-label="Filtrer par équipe"
              className="h-8 max-w-[10rem] rounded-lg border border-line bg-surface px-2 text-xs text-ink focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            >
              <option value="">Toutes les équipes</option>
              {teamsInRange.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>

            {(data?.venues.length ?? 0) > 0 && (
              <select
                value={venueFilter}
                onChange={(e) => setVenueFilter(e.target.value)}
                aria-label="Filtrer par salle"
                className="h-8 max-w-[10rem] rounded-lg border border-line bg-surface px-2 text-xs text-ink focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              >
                <option value="">Toutes les salles</option>
                {(data?.venues ?? []).map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>
            )}

            <ResultsSheetButton leagueId={scope.leagueId} />

            {(teamFilter || venueFilter) && (
              <button
                type="button"
                onClick={() => {
                  setTeamFilter('');
                  setVenueFilter('');
                }}
                className="text-xs text-accent-text hover:underline"
              >
                Effacer
              </button>
            )}
          </div>
        </div>

        <p className="text-xs text-ink-subtle">
          <span className="tabular-nums">{visible.length}</span> match
          {visible.length > 1 ? 's' : ''}
          {data && data.venues.length > 0 && (
            <>
              {' · '}
              <span className="tabular-nums">{placed}</span> avec salle
            </>
          )}
          {scope.league && (
            <>
              {' · '}
              <span className="text-ink-muted">{scope.league.name}</span>
            </>
          )}
        </p>
      </div>

      {isPending ? (
        <LoadingSpinner message="Chargement du calendrier…" />
      ) : scale === 'list' ? (
        <CalendarList
          entries={visible}
          competitions={data?.competitions ?? []}
          venues={data?.venues ?? []}
          toneFor={toneFor}
          onOpen={(entry) => openDrawer(isoDay(new Date(entry.dateTime)), entry)}
        />
      ) : scale === 'year' ? (
        <YearGrid
          year={cursor.getFullYear()}
          entries={visible}
          closedDays={closed}
          onPickMonth={(month) => {
            setCursor(new Date(cursor.getFullYear(), month, 1));
            setScale('month');
          }}
          onPickDay={(day) => {
            setCursor(new Date(day));
            setScale('month');
            openDrawer(day);
          }}
        />
      ) : (
        <>
          {/* ---------- month grid, sm and up ---------- */}
          <div className="hidden overflow-hidden rounded-lg border border-line bg-surface sm:block">
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
                const isOpen = openDay === key;
                const overflow = entries.length - CHIPS_PER_CELL;

                return (
                  <div
                    key={key}
                    className={cn(
                      'min-h-[7rem] border-b border-r border-line p-1.5 transition-colors [&:nth-child(7n)]:border-r-0',
                      outside && 'bg-surface-sunk/40',
                      reasons && 'bg-caution-soft/40',
                      // The day the panel is about is lit, so the reader can find it again after
                      // their eye has moved to the panel.
                      isOpen && 'bg-accent-soft ring-2 ring-inset ring-accent',
                    )}
                  >
                    <div className="flex items-center justify-between gap-1 px-0.5 pb-1">
                      <button
                        type="button"
                        onClick={() => openDrawer(key)}
                        className={cn(
                          'inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-xs tabular-nums transition-colors',
                          'hover:bg-accent-soft hover:text-accent-text',
                          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
                          key === todayKey
                            ? 'bg-accent font-semibold text-accent-ink hover:bg-accent hover:text-accent-ink'
                            : outside
                              ? 'text-ink-subtle'
                              : 'text-ink-muted',
                        )}
                      >
                        {day.getDate()}
                      </button>
                      {reasons && (
                        <Ban className="h-3 w-3 shrink-0 text-caution" aria-label={reasons[0]} />
                      )}
                    </div>

                    <div className="space-y-1">
                      {entries.slice(0, CHIPS_PER_CELL).map((e) => (
                        <FixtureChip
                          key={e.id}
                          entry={e}
                          competitions={data?.competitions ?? []}
                          venues={data?.venues ?? []}
                          tone={toneFor(e.leagueId)}
                          onOpen={() => openDrawer(key, e)}
                          dimmed={e.status === 'COMPLETED'}
                        />
                      ))}
                      {overflow > 0 && (
                        // Previously this was plain text, which named something the reader could
                        // not reach. It opens the day.
                        <button
                          type="button"
                          onClick={() => openDrawer(key)}
                          className="w-full rounded px-1 py-0.5 text-left text-[0.6875rem] text-ink-muted transition-colors hover:bg-surface-sunk hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                        >
                          +{overflow} autre{overflow > 1 ? 's' : ''}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ---------- agenda, below sm ---------- */}
          <div className="space-y-3 sm:hidden">
            {[...byDay.entries()]
              .filter(([key]) => new Date(key).getMonth() === cursor.getMonth())
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([key, entries]) => {
                const day = new Date(key);
                const reasons = closed.get(key);
                return (
                  <div key={key} className="overflow-hidden rounded-lg border border-line bg-surface">
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
                        const tone = toneFor(e.leagueId);
                        const venue = data?.venues.find((v) => v.id === e.venueId);
                        return (
                          <li key={e.id}>
                            <button
                              type="button"
                              onClick={() => openDrawer(key, e)}
                              className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left transition-colors hover:bg-surface-sunk focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent"
                            >
                              <span className={cn('h-2 w-2 shrink-0 rounded-full', tone.dot)} />
                              <span className="w-11 shrink-0 text-xs tabular-nums text-ink-muted">
                                {timeOf(e.dateTime)}
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="block truncate text-sm text-ink">
                                  {e.home.name} <span className="text-ink-subtle">—</span>{' '}
                                  {e.away.name}
                                </span>
                                {venue && (
                                  <span className="flex items-center gap-1 truncate text-xs text-ink-subtle">
                                    <MapPin className="h-3 w-3 shrink-0" aria-hidden />
                                    {venue.name}
                                  </span>
                                )}
                              </span>
                              {e.status === 'COMPLETED' && e.homeScore != null && (
                                <span className="shrink-0 text-sm font-semibold tabular-nums text-ink">
                                  {e.homeScore}–{e.awayScore}
                                </span>
                              )}
                            </button>
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
        </>
      )}

      <FixtureDrawer
        open={openDay !== null}
        onClose={closeDrawer}
        day={openDay}
        entries={openDay ? (byDay.get(openDay) ?? []) : []}
        focused={focused}
        onFocus={setFocused}
        competitions={data?.competitions ?? []}
        venues={data?.venues ?? []}
        toneFor={toneFor}
        closedReasons={openDay ? closed.get(openDay) : undefined}
      />
    </div>
  );
}
