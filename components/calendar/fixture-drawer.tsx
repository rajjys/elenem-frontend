'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, CalendarDays, MapPin, X } from 'lucide-react';
import { Button } from '@/components/ui';
import type { CalendarCompetition, CalendarEntry, CalendarVenue } from '@/services/calendar';
import { cn } from '@/utils';

/**
 * The panel that opens when a fixture — or a whole day — is clicked.
 *
 * Where it sits is a compromise between two things that both matter. A calendar is read
 * spatially — you find Saturday the 22nd by where it is — so reflowing the month on every click
 * would move the grid out from under the reader. But Sunday is the rightmost column, so a panel
 * that simply overlays would hide the very day it describes, highlight and all.
 *
 * So: it overlays below lg, where there is no room for anything else and the backdrop dims what
 * it covers; from lg up the page reserves its width, the grid shifts once, and nothing the reader
 * clicked disappears underneath. On phones that becomes a bottom sheet, the same decision
 * expressed in the only direction there is room for.
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

/** Only three states earn a colour: in progress, played, and needing attention. */
function statusTone(status: string): string {
  if (status === 'LIVE') return 'bg-negative-soft text-negative ring-negative/30';
  if (status === 'COMPLETED') return 'bg-positive-soft text-positive ring-positive/30';
  if (status === 'POSTPONED' || status === 'CANCELLED') {
    return 'bg-caution-soft text-caution ring-caution/30';
  }
  return 'bg-surface-sunk text-ink-muted ring-line';
}

const MONTHS = [
  'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
];
const WEEKDAYS = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];

function longDate(d: Date): string {
  return `${WEEKDAYS[(d.getDay() + 6) % 7]} ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

function timeOf(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function FixtureRow({
  entry,
  competitions,
  venues,
  tone,
  onOpen,
}: {
  entry: CalendarEntry;
  competitions: CalendarCompetition[];
  venues: CalendarVenue[];
  tone: { dot: string; chip: string };
  onOpen?: () => void;
}) {
  const competition = competitions.find((c) => c.id === entry.leagueId);
  const venue = venues.find((v) => v.id === entry.venueId);
  const played = entry.status === 'COMPLETED' && entry.homeScore != null;

  const body = (
    <>
      <span className={cn('mt-1.5 h-2 w-2 shrink-0 rounded-full', tone.dot)} aria-hidden />
      <span className="w-11 shrink-0 pt-0.5 text-xs tabular-nums text-ink-muted">
        {timeOf(entry.dateTime)}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm text-ink">
          {entry.home.name} <span className="text-ink-subtle">—</span> {entry.away.name}
        </span>
        <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-ink-subtle">
          {competition && <span>{competition.shortLabel}</span>}
          {venue && (
            <span className="flex items-center gap-1 truncate">
              <MapPin className="h-3 w-3 shrink-0" aria-hidden />
              {venue.name}
            </span>
          )}
        </span>
      </span>
      {played && (
        <span className="shrink-0 pt-0.5 text-sm font-semibold tabular-nums text-ink">
          {entry.homeScore}–{entry.awayScore}
        </span>
      )}
    </>
  );

  if (!onOpen) return <div className="flex gap-2.5 px-4 py-3">{body}</div>;

  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full gap-2.5 px-4 py-3 text-left transition-colors hover:bg-surface-sunk focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent"
    >
      {body}
    </button>
  );
}

export function FixtureDrawer({
  open,
  onClose,
  day,
  entries,
  focused,
  onFocus,
  competitions,
  venues,
  toneFor,
  closedReasons,
}: {
  open: boolean;
  onClose: () => void;
  /** The day the panel is about, as yyyy-mm-dd. */
  day: string | null;
  /** Every fixture that day, in time order. */
  entries: CalendarEntry[];
  /** The one fixture being looked at, if the reader picked one rather than the whole day. */
  focused: CalendarEntry | null;
  onFocus: (entry: CalendarEntry | null) => void;
  competitions: CalendarCompetition[];
  venues: CalendarVenue[];
  toneFor: (leagueId: string) => { dot: string; chip: string };
  closedReasons?: string[];
}) {
  // Escape closes, because a panel that overlays content must be dismissible without aiming.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open || !day) return null;

  const date = new Date(`${day}T12:00:00`);
  const competition = focused ? competitions.find((c) => c.id === focused.leagueId) : undefined;
  const venue = focused ? venues.find((v) => v.id === focused.venueId) : undefined;

  return (
    <>
      {/* Dimming only below lg, where the panel genuinely covers the grid. From lg up the page
          reserves space for it instead, so there is nothing to dim and the calendar stays
          readable beside the panel. */}
      <div className="fixed inset-0 z-40 bg-ink/30 lg:hidden" onClick={onClose} aria-hidden />

      <aside
        role="dialog"
        aria-modal="false"
        aria-label={focused ? 'Détail du match' : `Matchs du ${longDate(date)}`}
        className={cn(
          'fixed z-50 flex flex-col bg-surface shadow-e2',
          // Bottom sheet on phones, side panel from sm up.
          'inset-x-0 bottom-0 max-h-[80dvh] rounded-t-xl',
          'sm:inset-y-0 sm:right-0 sm:left-auto sm:w-[22rem] sm:max-h-none sm:rounded-none sm:border-l sm:border-line',
        )}
      >
        <header className="flex items-start gap-3 border-b border-line px-4 py-3">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-ink first-letter:uppercase">
              {longDate(date)}
            </p>
            <p className="text-xs text-ink-subtle">
              {entries.length} match{entries.length > 1 ? 's' : ''}
              {closedReasons?.length ? ` · ${closedReasons[0]}` : ''}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="-mr-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-ink-subtle transition-colors hover:bg-surface-sunk hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {focused ? (
            <div className="p-4 space-y-4">
              <button
                type="button"
                onClick={() => onFocus(null)}
                className="text-xs text-accent-text hover:underline"
              >
                ← Tous les matchs du jour
              </button>

              <div className="space-y-1">
                <p className="text-lg font-semibold leading-snug text-ink">{focused.home.name}</p>
                <p className="text-xs uppercase tracking-wider text-ink-subtle">contre</p>
                <p className="text-lg font-semibold leading-snug text-ink">{focused.away.name}</p>
              </div>

              {focused.status === 'COMPLETED' && focused.homeScore != null && (
                <p className="text-3xl font-bold tabular-nums text-ink">
                  {focused.homeScore} <span className="text-ink-subtle">–</span> {focused.awayScore}
                </p>
              )}

              <dl className="space-y-2 text-sm">
                <div className="flex items-baseline gap-3">
                  <dt className="w-24 shrink-0 text-xs uppercase tracking-wider text-ink-subtle">
                    État
                  </dt>
                  <dd>
                    <span
                      className={cn(
                        'rounded-full px-2 py-0.5 text-xs font-medium ring-1',
                        statusTone(focused.status),
                      )}
                    >
                      {STATUS_LABELS[focused.status] ?? focused.status}
                    </span>
                  </dd>
                </div>
                <div className="flex items-baseline gap-3">
                  <dt className="w-24 shrink-0 text-xs uppercase tracking-wider text-ink-subtle">
                    Heure
                  </dt>
                  <dd className="tabular-nums text-ink">
                    {timeOf(focused.dateTime)}
                    <span className="text-ink-subtle"> · {focused.durationMinutes} min</span>
                  </dd>
                </div>
                {competition && (
                  <div className="flex items-baseline gap-3">
                    <dt className="w-24 shrink-0 text-xs uppercase tracking-wider text-ink-subtle">
                      Compétition
                    </dt>
                    <dd className="min-w-0 text-ink">{competition.name}</dd>
                  </div>
                )}
                <div className="flex items-baseline gap-3">
                  <dt className="w-24 shrink-0 text-xs uppercase tracking-wider text-ink-subtle">
                    Salle
                  </dt>
                  <dd className="min-w-0 text-ink">
                    {venue ? (
                      venue.name
                    ) : (
                      <span className="text-ink-subtle">Pas encore attribuée</span>
                    )}
                  </dd>
                </div>
              </dl>

              <div className="space-y-2 pt-1">
                <Button
                  variant="primary"
                  className="w-full"
                  onClick={() => {
                    window.location.href = `/game/${focused.id}`;
                  }}
                >
                  Ouvrir le match
                  <ArrowRight size={16} className="ml-2" />
                </Button>
                <Link
                  href={`/game/manage?ctxGameId=${focused.id}`}
                  className="block w-full rounded-lg border border-line px-3 py-2 text-center text-sm text-ink-muted transition-colors hover:border-line-strong hover:text-ink"
                >
                  Saisir le score
                </Link>
              </div>
            </div>
          ) : (
            <ul className="divide-y divide-line">
              {entries.map((e) => (
                <li key={e.id}>
                  <FixtureRow
                    entry={e}
                    competitions={competitions}
                    venues={venues}
                    tone={toneFor(e.leagueId)}
                    onOpen={() => onFocus(e)}
                  />
                </li>
              ))}
              {entries.length === 0 && (
                <li className="px-4 py-8 text-center text-sm text-ink-muted">
                  Aucun match ce jour-là.
                </li>
              )}
            </ul>
          )}
        </div>

        {closedReasons?.length ? (
          <p className="flex items-center gap-2 border-t border-line bg-caution-soft px-4 py-2.5 text-xs text-ink">
            <CalendarDays className="h-3.5 w-3.5 shrink-0 text-caution" aria-hidden />
            {closedReasons[0]}
          </p>
        ) : null}
      </aside>
    </>
  );
}
