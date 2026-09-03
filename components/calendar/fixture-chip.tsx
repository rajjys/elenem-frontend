'use client';

import { MapPin } from 'lucide-react';
import { Tooltip } from '@/components/ui';
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
  draft = false,
}: {
  entry: CalendarEntry;
  competitions: CalendarCompetition[];
  venues: CalendarVenue[];
  tone: { dot: string; chip: string };
  onOpen: () => void;
  dimmed?: boolean;
  /** A fixture that does not exist yet. Drawn as an outline, because it is a proposal. */
  draft?: boolean;
}) {
  const competition = competitions.find((c) => c.id === entry.leagueId);
  const venue = venues.find((v) => v.id === entry.venueId);
  const played = entry.status === 'COMPLETED' && entry.homeScore != null;
  const live = entry.status === 'LIVE';

  const card = (
    <div className="w-56 p-2.5">
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
  );

  return (
    /* The card used to be absolutely positioned inside the day cell, always above the chip and
       aligned to its left edge — so against the right-hand column it was cut off by the grid, and
       on the top row it was cut off by the window. It is a real tooltip now: portalled, measured,
       flipped to whichever side has room, and slid along the other axis to stay on screen. */
    <Tooltip label={card} side="top" contentClassName="p-0" delay={90}>
      <button
        type="button"
        onClick={onOpen}
        className={cn(
          'flex w-full items-center gap-1.5 rounded px-1.5 py-1 text-[0.6875rem] leading-tight ring-1',
          'transition-[transform,box-shadow] hover:z-10 hover:shadow-e1 hover:-translate-y-px',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
          tone.chip,
          dimmed && 'opacity-70',
          // A dashed outline over a hollow ground, so a draft never reads as a fixture that
          // exists. The competition's colour is kept — you still need to see whose proposal it
          // is — but the fill is dropped, which is the difference the eye picks up first when
          // scanning a month that holds both.
          draft && 'border border-dashed border-current bg-transparent ring-0',
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
    </Tooltip>
  );
}
