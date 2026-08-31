'use client';

import { useState } from 'react';
import { MapPin } from 'lucide-react';
import type { CalendarCompetition, CalendarEntry, CalendarVenue } from '@/services/calendar';
import { cn } from '@/utils';

/**
 * One fixture in a month cell, with a tooltip that belongs to this design system.
 *
 * The native `title` attribute it replaces looked like the operating system rather than the
 * product, took a second to appear, and could only carry one line of plain text — so it showed
 * the matchup and the time and left out the score and the state, which are the two things a
 * reader scanning last weekend actually wants.
 */

const STATUS_LABELS: Record<string, string> = {
  SCHEDULED: 'Programmé',
  CONFIRMED: 'Confirmé',
  LIVE: 'En direct',
  COMPLETED: 'Terminé',
  POSTPONED: 'Reporté',
  CANCELLED: 'Annulé',
  DRAFT: 'Brouillon',
};

function timeOf(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function FixtureChip({
  entry,
  competitions,
  venues,
  tone,
  onOpen,
  dimmed = false,
}: {
  entry: CalendarEntry;
  competitions: CalendarCompetition[];
  venues: CalendarVenue[];
  tone: { dot: string; chip: string };
  onOpen: () => void;
  dimmed?: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const competition = competitions.find((c) => c.id === entry.leagueId);
  const venue = venues.find((v) => v.id === entry.venueId);
  const played = entry.status === 'COMPLETED' && entry.homeScore != null;
  const live = entry.status === 'LIVE';

  return (
    <div className="relative">
      <button
        type="button"
        onClick={onOpen}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onFocus={() => setHovered(true)}
        onBlur={() => setHovered(false)}
        className={cn(
          'flex w-full items-center gap-1.5 rounded px-1.5 py-1 text-[0.6875rem] leading-tight ring-1',
          'transition-[transform,box-shadow] hover:z-10 hover:shadow-e1 hover:-translate-y-px',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
          tone.chip,
          dimmed && 'opacity-70',
        )}
      >
        <span className="tabular-nums opacity-70">{timeOf(entry.dateTime)}</span>
        <span className="truncate font-medium">
          {entry.home.shortCode} <span className="opacity-50">·</span> {entry.away.shortCode}
        </span>
        {live && (
          <span className="ml-auto h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-negative" />
        )}
        {played && (
          <span className="ml-auto shrink-0 font-semibold tabular-nums">
            {entry.homeScore}–{entry.awayScore}
          </span>
        )}
      </button>

      {hovered && (
        <div
          role="tooltip"
          className="pointer-events-none absolute bottom-full left-0 z-30 mb-1 w-56 rounded-lg border border-line bg-elevated p-2.5 shadow-e2"
        >
          <p className="text-xs font-medium leading-snug text-ink">
            {entry.home.name} <span className="text-ink-subtle">—</span> {entry.away.name}
          </p>

          {(played || live) && (
            <p className="mt-1 text-base font-bold tabular-nums text-ink">
              {played ? `${entry.homeScore} – ${entry.awayScore}` : 'En direct'}
            </p>
          )}

          <dl className="mt-1.5 space-y-0.5 text-[0.6875rem] text-ink-muted">
            <div className="flex gap-1.5">
              <dt className="text-ink-subtle">Heure</dt>
              <dd className="tabular-nums">{timeOf(entry.dateTime)}</dd>
              <dd className="text-ink-subtle">· {entry.durationMinutes} min</dd>
            </div>
            {competition && (
              <div className="flex gap-1.5">
                <dt className="text-ink-subtle">Compétition</dt>
                <dd className="truncate">{competition.shortLabel}</dd>
              </div>
            )}
            <div className="flex gap-1.5">
              <dt className="text-ink-subtle">État</dt>
              <dd>{STATUS_LABELS[entry.status] ?? entry.status}</dd>
            </div>
            <div className="flex items-center gap-1.5">
              <MapPin className="h-3 w-3 shrink-0 text-ink-subtle" aria-hidden />
              <dd className={cn('truncate', !venue && 'text-ink-subtle')}>
                {venue ? venue.name : 'Salle non attribuée'}
              </dd>
            </div>
          </dl>
        </div>
      )}
    </div>
  );
}
