'use client';

import { Fragment, useMemo, useState } from 'react';
import { CalendarPlus, MapPin, Plus, Search, X } from 'lucide-react';
import { Input } from '@/components/ui';
import type { CalendarCompetition, CalendarEntry, CalendarVenue } from '@/services/calendar';
import { cn } from '@/utils';

/**
 * The same fixtures as a searchable list.
 *
 * A calendar answers "what is on Saturday"; a list answers "when do we play Chaux Sport", which
 * a grid is bad at — you have to scan every cell. Both are views of one set of fixtures, so they
 * live on one page rather than in two places that filter differently and drift apart.
 *
 * It is also what a phone shows anyway: the month grid collapses to an agenda below sm, and an
 * agenda is a list with the days as headings.
 */

const MONTHS = [
  'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
];
const WEEKDAYS = ['lun', 'mar', 'mer', 'jeu', 'ven', 'sam', 'dim'];

function timeOf(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function CalendarList({
  entries,
  competitions,
  venues,
  toneFor,
  onOpen,
  onAdd,
  periodLabel,
}: {
  entries: CalendarEntry[];
  competitions: CalendarCompetition[];
  venues: CalendarVenue[];
  toneFor: (leagueId: string) => { dot: string; chip: string };
  onOpen: (entry: CalendarEntry) => void;
  /** Adds a fixture in this period. Absent where the calendar is read-only. */
  onAdd?: () => void;
  /** What "this period" is, so the empty state can name it rather than gesture at it. */
  periodLabel?: string;
}) {
  const [query, setQuery] = useState('');

  const matched = useMemo(() => {
    const q = query.trim().toLocaleLowerCase('fr');
    if (!q) return entries;
    return entries.filter(
      (e) =>
        e.home.name.toLocaleLowerCase('fr').includes(q) ||
        e.away.name.toLocaleLowerCase('fr').includes(q) ||
        e.home.shortCode.toLocaleLowerCase('fr').includes(q) ||
        e.away.shortCode.toLocaleLowerCase('fr').includes(q),
    );
  }, [entries, query]);

  // Day headings, so a run of fixtures still reads as a matchday rather than a wall of rows.
  const grouped = useMemo(() => {
    const map = new Map<string, CalendarEntry[]>();
    for (const e of matched) {
      const key = e.dateTime.slice(0, 10);
      map.set(key, [...(map.get(key) ?? []), e]);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [matched]);

  return (
    <div className="space-y-3">
      {/* The icon sits inside the field rather than beside it, and the field is the same height
          as the filters it sits under — it was a bare Input with a floating magnifier. */}
      <div className="relative max-w-sm">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-ink-subtle"
          aria-hidden
        />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher une équipe…"
          aria-label="Rechercher une équipe"
          className="h-9 rounded-lg border-line bg-surface pl-9 transition-colors hover:border-line-strong focus:border-accent focus:ring-1 focus:ring-accent"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            aria-label="Effacer la recherche"
            className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md text-ink-subtle transition-colors hover:bg-surface-sunk hover:text-ink"
          >
            <X className="h-3.5 w-3.5" aria-hidden />
          </button>
        )}
      </div>

      <div className="overflow-hidden rounded-lg border border-line bg-surface">
        {grouped.length === 0 ? (
          /* An empty period is the moment an organiser most needs a way forward, and it used to
             be the moment the screen said least — one grey sentence and no way to act on it.
             A failed *search* is different: the answer there is to search for something else,
             not to invent a fixture, so it keeps the plain sentence and offers to clear. */
          <div className="px-4 py-12 text-center">
            {query ? (
              <>
                <p className="text-sm text-ink-muted">
                  Aucun match ne correspond à « {query} ».
                </p>
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="mt-2 text-sm text-accent-text hover:underline"
                >
                  Effacer la recherche
                </button>
              </>
            ) : (
              <>
                <CalendarPlus className="mx-auto h-8 w-8 text-ink-subtle" aria-hidden />
                <p className="mt-3 text-sm font-medium text-ink">
                  Aucun match {periodLabel ? `entre ${periodLabel}` : 'sur cette période'}.
                </p>
                <p className="mx-auto mt-1 max-w-xs text-sm text-ink-muted">
                  Ajoutez-les un par un, ou générez toute la saison d’un coup depuis le
                  calendrier.
                </p>
                {onAdd && (
                  <button
                    type="button"
                    onClick={onAdd}
                    className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-accent px-3.5 py-2 text-sm font-medium text-accent-ink transition-colors hover:bg-accent/90"
                  >
                    <Plus className="h-4 w-4" aria-hidden />
                    Ajouter un match
                  </button>
                )}
              </>
            )}
          </div>
        ) : (
          grouped.map(([day, rows]) => {
            const date = new Date(`${day}T12:00:00`);
            return (
              <Fragment key={day}>
                <div className="sticky top-0 z-10 flex items-center gap-2 border-y border-line bg-surface-sunk px-3 py-1.5 first:border-t-0">
                  <span className="text-xs font-semibold capitalize text-ink">
                    {WEEKDAYS[(date.getDay() + 6) % 7]} {date.getDate()} {MONTHS[date.getMonth()]}
                  </span>
                  <span className="ml-auto text-xs tabular-nums text-ink-subtle">{rows.length}</span>
                </div>
                <ul className="divide-y divide-line">
                  {rows.map((e) => {
                    const tone = toneFor(e.leagueId);
                    const competition = competitions.find((c) => c.id === e.leagueId);
                    const venue = venues.find((v) => v.id === e.venueId);
                    return (
                      <li key={e.id}>
                        <button
                          type="button"
                          onClick={() => onOpen(e)}
                          className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-surface-sunk focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent"
                        >
                          <span className={cn('h-2 w-2 shrink-0 rounded-full', tone.dot)} />
                          <span className="w-11 shrink-0 text-xs tabular-nums text-ink-muted">
                            {timeOf(e.dateTime)}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm text-ink">
                              {e.home.name} <span className="text-ink-subtle">—</span> {e.away.name}
                            </span>
                            <span className="flex flex-wrap items-center gap-x-2 text-xs text-ink-subtle">
                              {competition && <span>{competition.shortLabel}</span>}
                              {venue && (
                                <span className="flex items-center gap-1 truncate">
                                  <MapPin className="h-3 w-3 shrink-0" aria-hidden />
                                  {venue.name}
                                </span>
                              )}
                            </span>
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
              </Fragment>
            );
          })
        )}
      </div>
    </div>
  );
}
