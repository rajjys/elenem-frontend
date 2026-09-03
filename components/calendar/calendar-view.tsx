'use client';

import { useCallback, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Ban,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Plus,
  Search,
  Wand2,
  X,
} from 'lucide-react';
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  LoadingSpinner,
  SelectField,
  Tooltip,
} from '@/components/ui';
import { ErrorState } from '@/components/ui/error-state';
import {
  blackoutDays,
  isoDay,
  useCalendar,
  type CalendarCompetition,
  type CalendarEntry,
  type CalendarVenue,
} from '@/services/calendar';
import { useScopeContext } from '@/hooks';
import { toastApiError } from '@/utils';
import { useAnnotate, useMoveGame, useReorderStack } from '@/services/games';
import { cn } from '@/utils';
import { DragDropContext, Draggable, Droppable, type DropResult } from '@hello-pangea/dnd';
import { FixtureChip } from './fixture-chip';
import { FixtureDrawer } from './fixture-drawer';
import { CalendarList } from './calendar-list';
import { ResultsSheetButton } from './results-sheet-button';
import { YearGrid } from './year-grid';
import { FixtureDialog } from './fixture-dialog';
import { ScoreDialog } from './score-dialog';
import { ReasonBar } from './reason-bar';

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

/** Accent- and case-insensitive, because nobody types "Nyiragongo" with the right diacritics. */
function fold(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('fr');
}

/**
 * Separators that mean "this club against that one".
 *
 * A secretary looking for a specific fixture types it the way they say it — "virunga contre
 * vita", "VIR vs VIT", "virunga - vita" — and a search that only matched one team at a time
 * answered a different question: every game Virunga plays, when what was wanted was the one
 * against Vita.
 */
const MATCHUP_SPLIT = /\s+(?:vs?\.?|contre|c\/|[-–—])\s+/i;

function matchesQuery(entry: CalendarEntry, raw: string, venues: CalendarVenue[]): boolean {
  const query = raw.trim();
  if (!query) return true;

  const home = fold(`${entry.home.name} ${entry.home.shortCode}`);
  const away = fold(`${entry.away.name} ${entry.away.shortCode}`);

  const parts = query.split(MATCHUP_SPLIT).filter((p) => p.trim());
  if (parts.length === 2) {
    const [a, b] = parts.map(fold);
    // Either way round: you are looking for the fixture, not for who happens to be at home.
    return (
      (home.includes(a) && away.includes(b)) || (home.includes(b) && away.includes(a))
    );
  }

  const q = fold(query);
  if (home.includes(q) || away.includes(q)) return true;
  const venue = venues.find((v) => v.id === entry.venueId);
  return !!venue && fold(venue.name).includes(q);
}

/**
 * Fixtures a drag may touch.
 *
 * Dragging is how a calendar gets planned; it is not a way to rearrange what already happened. A
 * played fixture keeps its hour and its day — the date can still be corrected deliberately from
 * the editor, where the correction is an act rather than a slip of the wrist.
 */
const isPlannable = (e: CalendarEntry) => e.status !== 'COMPLETED' && e.status !== 'DRAFT';

/** The local wall-clock minutes of an instant. */
function minutesOf(iso: string): number {
  const d = new Date(iso);
  return d.getHours() * 60 + d.getMinutes();
}

/** A local day plus local minutes, as an instant. */
function instantOn(day: string, minutes: number): string {
  const [y, m, d] = day.split('-').map(Number);
  return new Date(y, m - 1, d, Math.floor(minutes / 60), minutes % 60, 0, 0).toISOString();
}

/**
 * Where a dragged fixture lands on its new day.
 *
 * It keeps its hour, which is what the organiser meant: they were answering "this fixture, that
 * day", not re-choosing a time. When that hour is already taken in the destination — the hall is
 * busy, or one of the clubs is already committed — the fixture goes to **the back of that day's
 * stack**, one slot after its last game.
 *
 * Refusing instead would tell the organiser their gesture failed and leave them to work out where
 * else it could go. Appending answers the question they asked and leaves the ordering to a second,
 * cheaper gesture — the drag handles in the day panel, which is exactly what they are for.
 */
function landingSlot(
  entry: CalendarEntry,
  targetDay: string,
  dayEntries: CalendarEntry[],
  durationMinutes: number,
): { dateTime: string; appended: boolean } {
  const wanted = minutesOf(entry.dateTime);
  const others = dayEntries.filter((e) => e.id !== entry.id);

  const overlaps = (a: number, b: number) => Math.abs(a - b) < durationMinutes;
  const taken = others.some((o) => {
    if (!overlaps(minutesOf(o.dateTime), wanted)) return false;
    // Same hall is a clash; so is a club being in two places. Two fixtures in different rooms
    // with no club in common are simply two fixtures at the same hour, which is normal.
    const sameHall = (o.venueId ?? null) === (entry.venueId ?? null);
    const sharedClub =
      o.home.id === entry.home.id ||
      o.home.id === entry.away.id ||
      o.away.id === entry.home.id ||
      o.away.id === entry.away.id;
    return sameHall || sharedClub;
  });

  if (!taken) return { dateTime: instantOn(targetDay, wanted), appended: false };

  const last = others.reduce((max, e) => Math.max(max, minutesOf(e.dateTime)), 0);
  // Capped inside the day: a stack that has run to midnight takes the fixture at the last slot
  // rather than tipping it into tomorrow, which would silently move it two days.
  const appended = Math.min(last + durationMinutes, 23 * 60 + 30);
  return { dateTime: instantOn(targetDay, appended), appended: true };
}

type Scale = 'month' | 'year' | 'list';

const SCALES: { key: Scale; label: string }[] = [
  { key: 'month', label: 'Mois' },
  { key: 'year', label: 'Année' },
  { key: 'list', label: 'Liste' },
];

export interface CalendarViewProps {
  /**
   * Fixtures that do not exist yet, laid over the ones that do.
   *
   * The draft is studied on the calendar rather than in a list beside it, because the questions
   * it has to answer are spatial — is that hall taken, does this land in the exam fortnight, does
   * the women's fixture sit on top of the men's. A list of matchdays cannot answer any of them.
   * They arrive shaped as ordinary entries with `status: 'DRAFT'`, so every existing behaviour —
   * filters, the day panel, the year map — works on them without knowing what they are.
   */
  draftEntries?: CalendarEntry[];
  /** Where to open. A draft's first month, rather than the month the reader happens to be in. */
  initialMonth?: Date;
  /**
   * The page's own heading, rendered here rather than by `PageHeader`.
   *
   * It belongs to the toolbar: on its own row it left the entire right-hand side empty while the
   * controls beneath it fought for width. Sharing the row costs nothing and buys the space back.
   */
  title?: string;
  description?: string;
}

export function CalendarView({
  draftEntries,
  initialMonth,
  title,
  description,
}: CalendarViewProps = {}) {
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
  const [cursor, setCursor] = useState(() => initialMonth ?? new Date());
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [openDay, setOpenDay] = useState<string | null>(null);
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [venueFilter, setVenueFilter] = useState<string>('');

  /**
   * The write surface.
   *
   * `editing` distinguishes adding from changing by whether it carries a fixture, so one dialog
   * serves both — they differ in exactly that. `scoring` is separate because entering a weekend
   * of results is a different job from placing one match, and it deserves a screen that opens
   * onto two number fields rather than a form.
   */
  const [editing, setEditing] = useState<{ day: string; entry: CalendarEntry | null } | null>(null);
  const [scoring, setScoring] = useState<CalendarEntry | null>(null);

  const moveMut = useMoveGame();
  const reorderMut = useReorderStack();
  const annotateMut = useAnnotate();

  /** Read-only surfaces stay read-only: a draft workspace is not where you edit real fixtures. */
  const writable = !draftEntries;

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

  /** How long a fixture holds its hall — the gap between one slot and the next. */
  const durationMinutes = data?.entries[0]?.durationMinutes ?? 100;

  const toneFor = useCallback(
    (leagueId: string) => {
      const index = (data?.competitions ?? []).findIndex((c) => c.id === leagueId);
      return COMPETITION_TONES[(index < 0 ? 0 : index) % COMPETITION_TONES.length];
    },
    [data],
  );

  const filtersActive = !!query.trim() || !!venueFilter || hidden.size > 0;

  const visible = useMemo(
    () =>
      [...(data?.entries ?? []), ...(draftEntries ?? [])].filter((e) => {
        if (hidden.has(e.leagueId)) return false;
        // Applied here rather than server-side: the period's fixtures are already loaded, and a
        // round trip per keystroke would cost more than the filtering saves.
        if (venueFilter && e.venueId !== venueFilter) return false;
        if (!matchesQuery(e, query, data?.venues ?? [])) return false;
        return true;
      }),
    [data, draftEntries, hidden, query, venueFilter],
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

  /** The span the current view actually queried, so an empty state can name it honestly. */
  const periodLabel = useMemo(() => {
    const from = new Date(`${range.from}T12:00:00`);
    const to = new Date(`${range.to}T12:00:00`);
    const one = (d: Date) => `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
    return one(from) === one(to) ? one(from) : `${one(from)} – ${one(to)}`;
  }, [range]);

  /**
   * Whether this month holds anything at all.
   *
   * It decides how loudly each day offers to be filled. A month with fixtures in it only needs a
   * quiet `+` on hover — the content is the point and 25 repetitions of the word "Ajouter" down
   * the weekday columns of a league that plays weekends is noise. A month with nothing in it is
   * the opposite case: thirty-five silent boxes whose only way in was guessing that the date
   * number opened a panel with a link inside it. That is the moment to say so plainly.
   */
  /**
   * Genuinely empty, as opposed to filtered empty.
   *
   * These must not be the same question. A month with thirty fixtures and a search for a club
   * that does not play in it has nothing on the grid, but offering to "add a match" there answers
   * a question nobody asked — the fix is to clear the search, not to invent a fixture.
   */
  const monthIsEmpty = (data?.entries.length ?? 0) === 0 && (draftEntries?.length ?? 0) === 0;
  const nothingMatches = byDay.size === 0 && !monthIsEmpty;

  const closed = useMemo(() => blackoutDays(data?.blackouts ?? []), [data]);
  const todayKey = isoDay(new Date());
  const placed = visible.filter((e) => e.venueId).length;
  const drafted = visible.filter((e) => e.status === 'DRAFT').length;

  /**
   * The focused fixture, re-read from the freshly fetched calendar rather than remembered.
   *
   * `focused` holds an id, not a copy. It used to hold the entry object, so after saving a score
   * or a new time the panel went on showing the values it had captured when it opened — the
   * calendar behind it updated, the panel did not, and the only way to see the change was to
   * close and reopen it. State that duplicates server data goes stale; state that points at it
   * cannot.
   */
  const focused = useMemo(
    () => (focusedId ? (visible.find((e) => e.id === focusedId) ?? null) : null),
    [focusedId, visible],
  );

  /**
   * A drop in the month grid, and a reorder in the day panel, both land here.
   *
   * They commit immediately — a drag that opens a dialog before it takes effect is a drag nobody
   * uses — and then `pendingReason` puts a bar under the panel asking why. The change is already
   * written by then, so the bar annotates the audit rows the change produced rather than creating
   * new ones: one decision, one line in the history.
   */
  const [pendingReason, setPendingReason] = useState<{
    gameIds: string[];
    summary: string;
    undo?: () => void;
  } | null>(null);

  function handleMonthDrop(result: DropResult) {
    if (!result.destination || !writable) return;
    const targetDay = result.destination.droppableId;
    const sourceDay = result.source.droppableId;
    if (targetDay === sourceDay) return;

    const entry = visible.find((e) => e.id === result.draggableId);
    if (!entry || !isPlannable(entry)) return;

    const from = entry.dateTime;
    const { dateTime, appended } = landingSlot(
      entry,
      targetDay,
      byDay.get(targetDay) ?? [],
      durationMinutes,
    );

    moveMut.mutate(
      { gameId: entry.id, dateTime },
      {
        onSuccess: () => {
          const when = new Date(dateTime);
          const label = `${entry.home.shortCode} — ${entry.away.shortCode} déplacé au ${when.getDate()} ${MONTHS[when.getMonth()]}, ${String(when.getHours()).padStart(2, '0')}:${String(when.getMinutes()).padStart(2, '0')}`;
          setPendingReason({
            gameIds: [entry.id],
            summary: appended
              ? `${label} — l’heure d’origine était prise, il passe en fin de journée.`
              : `${label}.`,
            undo: () => {
              moveMut.mutate(
                { gameId: entry.id, dateTime: from, reason: 'Déplacement annulé' },
                { onError: (e) => toastApiError(e) },
              );
              setPendingReason(null);
            },
          });
          if (!openDay) openDrawer(targetDay);
        },
        onError: (e) => toastApiError(e),
      },
    );
  }

  function handleReorder(assignments: { gameId: string; dateTime: string }[]) {
    reorderMut.mutate(
      { assignments },
      {
        onSuccess: (report) => {
          if (report.movedCount === 0) return;
          setPendingReason({
            gameIds: report.gameIds,
            summary: `${report.movedCount} match${report.movedCount > 1 ? 's' : ''} réordonné${report.movedCount > 1 ? 's' : ''}.`,
          });
        },
        onError: (e) => toastApiError(e),
      },
    );
  }

  function openDrawer(day: string, entry: CalendarEntry | null = null) {
    setOpenDay(day);
    setFocusedId(entry?.id ?? null);
  }
  function closeDrawer() {
    setOpenDay(null);
    setFocusedId(null);
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
      {/* Identity and controls on one line, then one line to navigate and find.

          The page title used to own a full row by itself with the whole right-hand side empty,
          and the controls fought for space underneath it — three view segments, two labelled
          tool buttons, a search box and the competition chips, all boxes of similar weight
          competing at every width. The result got messier the narrower the screen.

          So: the title shares its row with the actions that were homeless, the view scale becomes
          one dropdown instead of three segments, and the two occasional tools become icons with
          tooltips. Fewer boxes, one obvious primary action, and a toolbar that wraps in a
          predictable order rather than reflowing into a different arrangement at every width.

          The title lives here rather than in `PageHeader` for exactly that reason — it is part of
          the toolbar. The typography is the template's, so it reads as the same header. */}
      <header className="mb-4 flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
        {/* Absent when the calendar is embedded — the draft workspace has its own heading, and a
            second "Calendrier" inside it would name the wrong thing. */}
        {title ? (
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight text-ink">{title}</h1>
            {description && <p className="mt-1 text-sm text-ink-muted">{description}</p>}
          </div>
        ) : (
          <span />
        )}

        <div className="flex shrink-0 items-center gap-1.5">
          {/* Occasional, so icons: a label on each was two more boxes competing with the ones
              that matter, and neither is reached often enough to earn the width. */}
          {writable && <ResultsSheetButton leagueId={scope.leagueId} compact />}

          {writable && (
            <Tooltip label="Générer le calendrier (bêta)" side="top">
              <Link
                href={scope.leagueId ? '/league/calendar/generate' : '/tenant/calendar/generate'}
                aria-label="Générer le calendrier (bêta)"
                className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-surface-sunk hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <Wand2 className="h-4 w-4" aria-hidden />
              </Link>
            </Tooltip>
          )}

          {writable && <span className="mx-0.5 h-5 w-px bg-line" aria-hidden />}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                // Named explicitly: "Mois" alone is the same string the previous-month and
                // next-month arrows carry, so on its own it identifies three different controls.
                aria-label={`Affichage : ${SCALES.find((sc) => sc.key === scale)?.label}`}
                className="flex h-9 items-center gap-1.5 rounded-lg border border-line bg-surface px-3 text-sm font-medium text-ink transition-colors hover:border-line-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                {SCALES.find((sc) => sc.key === scale)?.label}
                <ChevronDown className="h-3.5 w-3.5 text-ink-subtle" aria-hidden />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="border-line bg-elevated">
              {SCALES.map((sc) => (
                <DropdownMenuItem
                  key={sc.key}
                  onSelect={() => setScale(sc.key)}
                  className={cn('gap-2', scale === sc.key && 'font-medium text-accent-text')}
                >
                  <Check
                    className={cn('h-3.5 w-3.5', scale === sc.key ? 'opacity-100' : 'opacity-0')}
                    aria-hidden
                  />
                  {sc.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {writable && (
            <Button
              variant="primary"
              onClick={() => setEditing({ day: isoDay(cursor), entry: null })}
            >
              <Plus className="h-4 w-4" aria-hidden />
              <span className="hidden sm:inline">Nouveau match</span>
            </Button>
          )}
        </div>
      </header>

      {/* Sticky, because the list and year views are several screens tall and the controls that
          change what you are looking at should not be somewhere above them. */}
      <div className="sticky -top-6 z-20 -mx-6 flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-line bg-canvas px-6 pb-3 pt-6">
        {/* Arrows around the month rather than beside each other: it is the shape of "step back
            from here, step forward from here", and it is what the label is for. */}
        <div className="flex shrink-0 items-center gap-0.5">
          <button
            type="button"
            onClick={() => shift(-1)}
            aria-label={scale === 'year' ? 'Année précédente' : 'Mois précédent'}
            className="flex h-8 w-8 items-center justify-center rounded-md text-ink-muted transition-colors hover:bg-surface-sunk hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden />
          </button>
          <h2 className="min-w-[8.5rem] text-center text-sm font-semibold capitalize text-ink sm:text-base">
            {scale === 'year'
              ? cursor.getFullYear()
              : `${MONTHS[cursor.getMonth()]} ${cursor.getFullYear()}`}
          </h2>
          <button
            type="button"
            onClick={() => shift(1)}
            aria-label={scale === 'year' ? 'Année suivante' : 'Mois suivant'}
            className="flex h-8 w-8 items-center justify-center rounded-md text-ink-muted transition-colors hover:bg-surface-sunk hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <ChevronRight className="h-4 w-4" aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => setCursor(new Date())}
            className="ml-1 h-8 rounded-md px-2.5 text-sm text-ink-muted transition-colors hover:bg-surface-sunk hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            Aujourd&apos;hui
          </button>
        </div>

        {/* One box for every view, and it understands a matchup: "virunga contre vita" narrows to
            that pairing rather than to every game either of them plays. */}
        <div className="relative min-w-[11rem] flex-1">
          <Search
            className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-subtle"
            aria-hidden
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Équipe, salle, ou « A contre B »…"
            aria-label="Rechercher un match"
            className="h-8 w-full rounded-lg border border-line bg-surface pl-8 pr-8 text-sm text-ink transition-colors placeholder:text-ink-subtle hover:border-line-strong focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label="Effacer la recherche"
              className="absolute right-1.5 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded text-ink-subtle transition-colors hover:bg-surface-sunk hover:text-ink"
            >
              <X className="h-3.5 w-3.5" aria-hidden />
            </button>
          )}
        </div>

        {/* Chips rather than a dropdown: they are the grid's colour key as well as its filter, and
            a menu would hide the legend the fixtures are read against. */}
        {(data?.competitions.length ?? 0) > 1 && (
          <div className="flex shrink-0 flex-wrap items-center gap-1">
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
                    'flex h-8 items-center gap-1.5 rounded-lg px-2 text-xs font-medium ring-1 transition-colors',
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
        )}

        {(data?.venues.length ?? 0) > 1 && (
          <SelectField
            label="Filtrer par salle"
            placeholder="Toutes les salles"
            value={venueFilter}
            onChange={setVenueFilter}
            options={(data?.venues ?? []).map((v) => ({ value: v.id, label: v.name }))}
            className="w-40 shrink-0"
          />
        )}

        {filtersActive && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setVenueFilter('');
              setHidden(new Set());
            }}
            className="h-8 shrink-0 whitespace-nowrap rounded-md px-2 text-xs font-medium text-accent-text transition-colors hover:bg-accent-soft"
          >
            Tout afficher
          </button>
        )}

        {/* The count closes the row instead of owning a line of its own. */}
        <p className="ml-auto shrink-0 text-xs text-ink-subtle">
          <span className="tabular-nums">{visible.length - drafted}</span> match
          {visible.length - drafted > 1 ? 's' : ''}
          {drafted > 0 && (
            <>
              {' · '}
              <span className="font-medium text-accent-text">
                <span className="tabular-nums">{drafted}</span> en projet
              </span>
            </>
          )}
          {data && data.venues.length > 0 && (
            <>
              {' · '}
              <span className="tabular-nums">{placed}</span> avec salle
            </>
          )}
          {scope.league && <span className="hidden md:inline"> · {scope.league.name}</span>}
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
          onAdd={writable ? () => setEditing({ day: isoDay(cursor), entry: null }) : undefined}
          // The list deliberately spans the season either side of the cursor, so naming the
          // cursor's month here would claim an emptiness the query never checked.
          periodLabel={periodLabel}
          query={query}
          onClearQuery={() => setQuery('')}
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
          {/* A month with nothing in it is the first thing a new organisation sees, and it used
              to be the screen that said least. Two doors, because a calendar arrives one of two
              ways: generated whole, or decided in a committee and typed in day by day. */}
          {nothingMatches && (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-line bg-surface px-4 py-3">
              <p className="text-sm text-ink-muted">
                Aucun match ne correspond
                {query.trim() ? (
                  <>
                    {' à '}
                    <span className="text-ink">« {query.trim()} »</span>
                  </>
                ) : (
                  ' aux filtres actifs'
                )}
                .
              </p>
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  setVenueFilter('');
                  setHidden(new Set());
                }}
                className="text-sm font-medium text-accent-text hover:underline"
              >
                Tout afficher
              </button>
            </div>
          )}

          {monthIsEmpty && writable && (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border border-dashed border-line bg-surface px-4 py-3">
              <p className="text-sm text-ink-muted">
                Aucun match en{' '}
                <span className="text-ink">
                  {MONTHS[cursor.getMonth()]} {cursor.getFullYear()}
                </span>
                . Cliquez un jour pour en ajouter un,
              </p>
              <Link
                href={scope.leagueId ? '/league/calendar/generate' : '/tenant/calendar/generate'}
                className="text-sm font-medium text-accent-text hover:underline"
              >
                ou générez toute la saison d&apos;un coup
              </Link>
            </div>
          )}

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

            <DragDropContext onDragEnd={handleMonthDrop}>
            <div className="grid grid-cols-7">
              {cells.map((day) => {
                const key = isoDay(day);
                const entries = byDay.get(key) ?? [];
                const outside = day.getMonth() !== cursor.getMonth();
                const reasons = closed.get(key);
                const isOpen = openDay === key;
                const overflow = entries.length - CHIPS_PER_CELL;

                return (
                  <Droppable key={key} droppableId={key} isDropDisabled={!writable}>
                  {(cellProvided, cellSnapshot) => (
                  <div
                    ref={cellProvided.innerRef}
                    {...cellProvided.droppableProps}
                    className={cn(
                      'group/day relative min-h-[7rem] border-b border-r border-line p-1.5 transition-colors [&:nth-child(7n)]:border-r-0',
                      outside && 'bg-surface-sunk/40',
                      reasons && 'bg-caution-soft/40',
                      // The day the panel is about is lit, so the reader can find it again after
                      // their eye has moved to the panel.
                      isOpen && 'bg-accent-soft ring-2 ring-inset ring-accent',
                      // The day under the pointer, so a drop is never a guess about which cell
                      // the fixture is about to land in.
                      cellSnapshot.isDraggingOver && 'bg-accent-soft ring-2 ring-inset ring-accent',
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
                      {entries.slice(0, CHIPS_PER_CELL).map((e, index) => (
                        <Draggable
                          key={e.id}
                          draggableId={e.id}
                          index={index}
                          // Dragging is how a calendar is planned, not how history is rearranged.
                          isDragDisabled={!writable || !isPlannable(e)}
                          // The chip is a button, and the library refuses by default to start a
                          // drag on an interactive element — sensibly, since it cannot know
                          // whether you meant to press it. Here it can: the chip is the fixture,
                          // pressing opens it and dragging moves it, and the library still only
                          // suppresses the click when a drag actually happened.
                          disableInteractiveElementBlocking
                        >
                          {(chipProvided, chipSnapshot) => (
                            <div
                              ref={chipProvided.innerRef}
                              {...chipProvided.draggableProps}
                              {...chipProvided.dragHandleProps}
                              className={chipSnapshot.isDragging ? 'shadow-e2' : undefined}
                            >
                              <FixtureChip
                                entry={e}
                                competitions={data?.competitions ?? []}
                                venues={data?.venues ?? []}
                                tone={toneFor(e.leagueId)}
                                onOpen={() => openDrawer(key, e)}
                                dimmed={e.status === 'COMPLETED'}
                                draft={e.status === 'DRAFT'}
                              />
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {cellProvided.placeholder}
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

                      {/* Adding a match, from the day you noticed it was missing.
                          
                          The whole free area of the cell is the target, with a `+` that is always
                          drawn and only strengthens on hover — the date number keeps its place,
                          because it is how the eye navigates the month, and a hover-only
                          affordance would not exist at all on a phone. An empty month used to be
                          thirty-five silent boxes whose only way in was guessing that the date
                          number opened a panel with a link on it. */}
                      {writable && (
                        <button
                          type="button"
                          onClick={() => setEditing({ day: key, entry: null })}
                          title={`Ajouter un match — ${day.getDate()} ${MONTHS[day.getMonth()]}`}
                          aria-label={`Ajouter un match le ${day.getDate()} ${MONTHS[day.getMonth()]}`}
                          className={cn(
                            'flex w-full items-center justify-center gap-1 rounded py-1',
                            'text-[0.6875rem] font-medium transition-colors',
                            'text-ink-subtle/45 hover:bg-accent-soft hover:text-accent-text',
                            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
                            // Named only where naming it is the difference between finding the
                            // feature and not; everywhere else it waits for the pointer.
                            !monthIsEmpty && 'opacity-0 group-hover/day:opacity-100',
                          )}
                        >
                          <Plus className="h-3 w-3" aria-hidden />
                          {monthIsEmpty && 'Ajouter'}
                        </button>
                      )}
                    </div>
                  </div>
                  )}
                  </Droppable>
                );
              })}
            </div>
            </DragDropContext>
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
              <div className="rounded-lg border border-dashed border-line bg-surface px-4 py-8 text-center">
                <p className="text-sm text-ink-muted">
                  {nothingMatches ? 'Aucun match ne correspond.' : 'Aucun match ce mois-ci.'}
                </p>
                {writable && !nothingMatches && (
                  <button
                    type="button"
                    onClick={() => setEditing({ day: isoDay(cursor), entry: null })}
                    className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-accent px-3 py-2 text-sm font-medium text-accent-ink transition-colors hover:bg-accent/90"
                  >
                    <Plus className="h-4 w-4" aria-hidden />
                    Ajouter un match
                  </button>
                )}
              </div>
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
        onFocus={(entry) => setFocusedId(entry?.id ?? null)}
        competitions={data?.competitions ?? []}
        venues={data?.venues ?? []}
        toneFor={toneFor}
        closedReasons={openDay ? closed.get(openDay) : undefined}
        // The panel used to offer two links that left the calendar — one to a page-sized wizard,
        // one to a route that renders the words "Game Management page". They open here now.
        onAdd={writable && openDay ? () => setEditing({ day: openDay, entry: null }) : undefined}
        onEdit={
          writable ? (entry) => setEditing({ day: isoDay(new Date(entry.dateTime)), entry }) : undefined
        }
        onScore={writable ? (entry) => setScoring(entry) : undefined}
        onReorder={writable ? handleReorder : undefined}
        /* A reorder reassigns times among the fixtures on screen. With a competition hidden or a
           search active, the ones off screen keep theirs — and the collision is invisible to the
           person causing it. So the handles come off rather than being subtly wrong. */
        reorderBlockedReason={
          writable && filtersActive
            ? 'Réordonner est désactivé tant qu’un filtre est actif : les matchs masqués gardent leur horaire.'
            : undefined
        }
        reasonBar={
          pendingReason ? (
            <ReasonBar
              summary={pendingReason.summary}
              saving={annotateMut.isPending}
              onUndo={pendingReason.undo}
              onSkip={() => setPendingReason(null)}
              onSave={(reason) =>
                annotateMut.mutate(
                  { gameIds: pendingReason.gameIds, reason },
                  {
                    onSuccess: () => setPendingReason(null),
                    onError: (e) => toastApiError(e),
                  },
                )
              }
            />
          ) : null
        }
      />

      {writable && (
        <>
          <FixtureDialog
            open={editing !== null}
            onClose={() => setEditing(null)}
            day={editing?.day ?? null}
            entry={editing?.entry ?? null}
            competitions={data?.competitions ?? []}
            venues={data?.venues ?? []}
            entriesThatDay={editing ? (byDay.get(editing.day) ?? []) : []}
            durationMinutes={data?.entries[0]?.durationMinutes ?? 100}
          />
          <ScoreDialog open={scoring !== null} onClose={() => setScoring(null)} entry={scoring} />
        </>
      )}
    </div>
  );
}
