'use client';

import { useMemo, useState } from 'react';
import {
  DragDropContext,
  Draggable,
  Droppable,
  type DraggableProvidedDragHandleProps,
  type DropResult,
} from '@hello-pangea/dnd';
import { GripVertical, Lock, MapPin, SquarePen } from 'lucide-react';
import type { CalendarCompetition, CalendarEntry, CalendarVenue } from '@/services/calendar';
import { cn } from '@/utils';

/**
 * A day's fixtures, grouped into stacks, reorderable by dragging.
 *
 * **A stack is a hall, not a day.** Two fixtures in different rooms do not compete for the same
 * hours, so they are not in the same sequence and reordering one must never touch the other. That
 * is the whole model, and it is why the list is grouped rather than flat: without the grouping the
 * boundary is invisible, and the first cross-hall drag would surprise someone.
 *
 * Fixtures with no hall named form one stack together. That is not a shortcut — it is the same
 * reasoning `checkVenueConflict` already applies: when either game leaves the room unspecified we
 * cannot prove they are in different ones, so we treat them as sharing a space. Both launch
 * customers run a single hall, so they see one group and never meet the model at all.
 *
 * **Stack, not swap.** Dropping the third fixture above the first over `14:00, 16:00, 18:00`
 * yields the third at 14:00 and the other two shifted down. The day's existing set of start times
 * is preserved exactly — deliberate gaps included — and only *which fixture holds which* changes.
 * A swap would move two fixtures and leave the order nobody asked for.
 *
 * **A played fixture is history, not a plan.** Dragging is how a calendar is planned; it is not a
 * way to rearrange what already happened. Completed games are pinned: they keep their hour, they
 * cannot be picked up, and the times reassigned are only those held by the fixtures that can move.
 */

function timeOf(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/** Fixtures a drag may touch. Anything played is a fixed point in its stack. */
const isMovable = (e: CalendarEntry) => e.status !== 'COMPLETED' && e.status !== 'DRAFT';

/**
 * The stack holding fixtures with no hall named.
 *
 * A sentinel rather than the empty string, because `droppableId` is an identity and an empty one
 * is not — the library refuses it outright, which is the right instinct.
 */
export const NO_VENUE_STACK = 'sans-salle';

export interface Stack {
  /** `venueId`, or `NO_VENUE_STACK` for the fixtures with no hall named. */
  key: string;
  label: string | null;
  entries: CalendarEntry[];
}

export function groupIntoStacks(entries: CalendarEntry[], venues: CalendarVenue[]): Stack[] {
  const byVenue = new Map<string, CalendarEntry[]>();
  for (const e of [...entries].sort((a, b) => a.dateTime.localeCompare(b.dateTime))) {
    const key = e.venueId ?? NO_VENUE_STACK;
    byVenue.set(key, [...(byVenue.get(key) ?? []), e]);
  }
  return [...byVenue.entries()]
    .map(([key, list]) => ({
      key,
      label: key === NO_VENUE_STACK ? null : (venues.find((v) => v.id === key)?.name ?? 'Salle'),
      entries: list,
    }))
    // The unplaced group last: it is the residue, not a room.
    .sort((a, b) =>
      a.key === NO_VENUE_STACK ? 1 : b.key === NO_VENUE_STACK ? -1 : a.label!.localeCompare(b.label!, 'fr'),
    );
}

export function DayStacks({
  entries,
  competitions,
  venues,
  toneFor,
  onOpen,
  onScore,
  onReorder,
  /**
   * Reordering reassigns times among the fixtures on screen. With a competition hidden or a
   * search active, the ones off screen keep theirs and the collision is invisible to the person
   * causing it — so the handles come off entirely rather than being subtly wrong.
   */
  reorderBlockedReason,
}: {
  entries: CalendarEntry[];
  competitions: CalendarCompetition[];
  venues: CalendarVenue[];
  toneFor: (leagueId: string) => { dot: string; chip: string };
  onOpen: (entry: CalendarEntry) => void;
  onScore?: (entry: CalendarEntry) => void;
  /** Absent where the calendar is read-only. */
  onReorder?: (assignments: { gameId: string; dateTime: string }[]) => void;
  reorderBlockedReason?: string;
}) {
  const stacks = useMemo(() => groupIntoStacks(entries, venues), [entries, venues]);
  const [dragging, setDragging] = useState(false);

  const canReorder = !!onReorder && !reorderBlockedReason;

  function handleDragEnd(result: DropResult) {
    setDragging(false);
    if (!result.destination || !onReorder) return;
    const stack = stacks.find((s) => s.key === result.source.droppableId);
    if (!stack) return;

    const movable = stack.entries.filter(isMovable);
    const from = result.source.index;
    const to = result.destination.index;
    if (from === to) return;

    // The times the movable fixtures hold, in order. Pinned games keep theirs and never enter it.
    const slots = movable.map((e) => e.dateTime);
    const reordered = [...movable];
    const [lifted] = reordered.splice(from, 1);
    reordered.splice(to, 0, lifted);

    // Every movable fixture is sent, not only the ones whose hour changed: the server checks that
    // the set of times is a permutation of what the stack already holds, and a partial list is not
    // one. The server then writes only the rows that actually differ.
    onReorder(reordered.map((e, i) => ({ gameId: e.id, dateTime: slots[i] })));
  }

  if (entries.length === 0) return null;

  return (
    <DragDropContext onDragStart={() => setDragging(true)} onDragEnd={handleDragEnd}>
      <div className="divide-y divide-line">
        {stacks.map((stack) => {
          const movable = stack.entries.filter(isMovable);
          const draggable = canReorder && movable.length > 1;

          return (
            <section key={stack.key}>
              {/* The hall is named only when there is more than one stack. With a single room —
                  which is both launch customers — a heading on every list would be noise
                  restating what the whole screen already assumes. */}
              {stacks.length > 1 && (
                <p className="flex items-center gap-1.5 bg-surface-sunk px-4 py-1.5 text-xs font-medium text-ink-muted">
                  {stack.label ? (
                    <>
                      <MapPin className="h-3 w-3 shrink-0" aria-hidden />
                      {stack.label}
                    </>
                  ) : (
                    'Sans salle'
                  )}
                  <span className="ml-auto tabular-nums text-ink-subtle">
                    {stack.entries.length}
                  </span>
                </p>
              )}

              <Droppable droppableId={stack.key} isDropDisabled={!draggable}>
                {(dropProvided, dropSnapshot) => (
                  <ul
                    ref={dropProvided.innerRef}
                    {...dropProvided.droppableProps}
                    className={cn(
                      'divide-y divide-line transition-colors',
                      dropSnapshot.isDraggingOver && 'bg-accent-soft/40',
                    )}
                  >
                    {/* Rendered in time order, with the pinned fixtures in their place rather
                        than swept to the bottom. Reading the day in order is what this panel is
                        for, and a played 14:30 listed after a scheduled 21:30 is simply wrong.
                        Only the movable rows are draggable, and their indices stay contiguous —
                        the pinned ones sit between them as fixed points, which is exactly what
                        they are. */}
                    {stack.entries.map((entry) => {
                      if (!isMovable(entry)) {
                        return (
                          <li key={entry.id} className="bg-surface">
                            <Row
                              entry={entry}
                              competitions={competitions}
                              venues={venues}
                              tone={toneFor(entry.leagueId)}
                              onOpen={() => onOpen(entry)}
                              onScore={onScore}
                              handleProps={null}
                              pinned={draggable}
                              quiet={dragging}
                            />
                          </li>
                        );
                      }
                      const index = movable.findIndex((m) => m.id === entry.id);
                      return (
                        <Draggable
                          key={entry.id}
                          draggableId={entry.id}
                          index={index}
                          isDragDisabled={!draggable}
                        >
                          {(dragProvided, dragSnapshot) => (
                            <li
                              ref={dragProvided.innerRef}
                              {...dragProvided.draggableProps}
                              className={cn(
                                'bg-surface',
                                dragSnapshot.isDragging && 'rounded-lg shadow-e2 ring-1 ring-accent',
                              )}
                            >
                              <Row
                                entry={entry}
                                competitions={competitions}
                                venues={venues}
                                tone={toneFor(entry.leagueId)}
                                onOpen={() => onOpen(entry)}
                                onScore={onScore}
                                handleProps={draggable ? dragProvided.dragHandleProps : null}
                                quiet={dragging}
                              />
                            </li>
                          )}
                        </Draggable>
                      );
                    })}
                    {dropProvided.placeholder}
                  </ul>
                )}
              </Droppable>
            </section>
          );
        })}
      </div>

      {reorderBlockedReason && (
        <p className="border-t border-line bg-surface-sunk px-4 py-2 text-xs text-ink-subtle">
          {reorderBlockedReason}
        </p>
      )}
    </DragDropContext>
  );
}

function Row({
  entry,
  competitions,
  venues,
  tone,
  onOpen,
  onScore,
  handleProps,
  pinned = false,
  quiet = false,
}: {
  entry: CalendarEntry;
  competitions: CalendarCompetition[];
  venues: CalendarVenue[];
  tone: { dot: string; chip: string };
  onOpen: () => void;
  onScore?: (entry: CalendarEntry) => void;
  handleProps: DraggableProvidedDragHandleProps | null | undefined;
  pinned?: boolean;
  /** While something is being dragged, the hover affordances stay out of the way. */
  quiet?: boolean;
}) {
  const competition = competitions.find((c) => c.id === entry.leagueId);
  const venue = venues.find((v) => v.id === entry.venueId);
  const played = entry.status === 'COMPLETED' && entry.homeScore != null;

  return (
    <div className="group/row flex items-stretch">
      {handleProps ? (
        <span
          {...handleProps}
          aria-label={`Déplacer ${entry.home.name} contre ${entry.away.name} dans l’ordre de la journée`}
          className="flex w-7 shrink-0 cursor-grab items-center justify-center text-ink-subtle transition-colors hover:text-ink active:cursor-grabbing focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent"
        >
          <GripVertical className="h-4 w-4" aria-hidden />
        </span>
      ) : (
        <span className="flex w-7 shrink-0 items-center justify-center" aria-hidden>
          {pinned && <Lock className="h-3 w-3 text-ink-subtle/60" />}
        </span>
      )}

      <button
        type="button"
        onClick={onOpen}
        className="flex min-w-0 flex-1 gap-2.5 py-3 pr-2 text-left transition-colors hover:bg-surface-sunk focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent"
      >
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
            {pinned && <span className="text-ink-subtle">joué — horaire figé</span>}
          </span>
        </span>
        {played && (
          <span className="shrink-0 pt-0.5 text-sm font-semibold tabular-nums text-ink">
            {entry.homeScore}–{entry.awayScore}
          </span>
        )}
      </button>

      {onScore && entry.status !== 'DRAFT' && (
        <button
          type="button"
          onClick={() => onScore(entry)}
          aria-label={`Saisir le score de ${entry.home.name} contre ${entry.away.name}`}
          title="Saisir le score"
          className={cn(
            'flex w-10 shrink-0 items-center justify-center text-ink-subtle transition-opacity',
            'hover:bg-accent-soft hover:text-accent-text focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent',
            quiet ? 'opacity-0' : 'opacity-0 group-hover/row:opacity-100',
          )}
        >
          <SquarePen className="h-4 w-4" aria-hidden />
        </button>
      )}
    </div>
  );
}
