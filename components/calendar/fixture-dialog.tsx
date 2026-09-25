'use client';

import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  AlertTriangle,
  ArrowLeftRight,
  Check,
  Flag,
  History,
  Loader2,
  Trash2,
} from 'lucide-react';
import { Button, DatePicker, Label, Modal, SelectField } from '@/components/ui';
import { toastApiError } from '@/utils';
import { useScopeContext } from '@/hooks';
import {
  useCalendar,
  type CalendarCompetition,
  type CalendarEntry,
  type CalendarVenue,
} from '@/services/calendar';
import {
  useCreateGame,
  useDeleteGame,
  useGameAudit,
  useGameStateChange,
  useInvertGame,
  useMoveGame,
  useTeamOptions,
  type StateVerb,
} from '@/services/games';
import { cn } from '@/utils';
import { auditTitle } from '@/components/game/game-timeline';

/**
 * Adding and changing a fixture without leaving the calendar.
 *
 * The calendar was readable and nothing else: every write bounced to `/game/create`, which is a
 * 690-line page-sized wizard, and the one action reachable from the day panel pointed at
 * `/game/manage` — a route that renders the words "Game Management page". So the screen that
 * shows you the problem could not fix it.
 *
 * Leaving mattered more than the clicks it cost. What you are deciding when you place a fixture
 * is *this hall, this Saturday, this hour, given everything else already on that day* — and the
 * only surface that holds all of it is the grid you were just looking at. A separate page asks
 * the same questions with the answers removed.
 *
 * One dialog covers creating and changing, because they differ in one thing: whether the fixture
 * exists yet. Scoring an existing fixture is its own dialog, because entering thirty results in a
 * sitting is a different job from placing one match.
 *
 * Adding a match that has *already happened* is this dialog's job, though, and the date decides
 * it rather than a checkbox. A slot in the future has no result to give. A slot in the past opens
 * a result section whose scores are optional: filled, the fixture is recorded as played; left
 * empty, it is recorded as awaiting its result — yesterday's game whose sheet has not arrived, or
 * this afternoon's still being played. A "déjà joué" checkbox would ask a question the date
 * already answers, and let the two contradict each other: ticked with a future date, unticked
 * with a past one. The calendar could only record the future before this.
 */

const WEEKDAYS = ['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.'];
const MONTHS = [
  'janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin',
  'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.',
];

/**
 * « sam. 26 sept. », with the year only when it is not this one.
 *
 * Short because it shares the title's line. The year is dropped rather than shortened: « 26 sept.
 * 26 » puts two 26s side by side and leaves the reader to work out which is the day.
 */
function shortDate(day: string): string {
  const d = new Date(`${day}T12:00:00`);
  const year = d.getFullYear() === new Date().getFullYear() ? '' : ` ${d.getFullYear()}`;
  return `${WEEKDAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}${year}`;
}

/** `HH:mm` of an instant, on the reader's own clock — which is the clock they typed it on. */
function timeOf(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/**
 * A local day plus a local time, as an instant.
 *
 * Built by hand rather than by parsing a string: `new Date('2026-09-05T13:30')` is local in every
 * browser that matters but `new Date('2026-09-05T13:30:00Z')` is not, and the difference is an
 * hour on a fixture list that gets printed.
 */
function instantFrom(day: string, time: string): string | null {
  // Nullable, because the dialog renders once before its reset effect has filled the fields and
  // `new Date(NaN).toISOString()` throws rather than returning something falsy. It surfaced as a
  // RangeError in the console the first time the editor was opened.
  if (!day || !time) return null;
  const [y, m, d] = day.split('-').map(Number);
  const [hh, mm] = time.split(':').map(Number);
  const at = new Date(y, m - 1, d, hh, mm, 0, 0);
  return Number.isNaN(at.getTime()) ? null : at.toISOString();
}

/** How many of the day's fixtures the panel lists before offering the rest. */
const DAY_PREVIEW = 4;

const isoDay = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** The verbs legal from a given state, mirroring the server's transition map. */
function verbsFor(status: string): { verb: StateVerb; label: string; needsReason: boolean }[] {
  switch (status) {
    case 'SCHEDULED':
      return [
        { verb: 'confirm', label: 'Confirmer', needsReason: false },
        { verb: 'postpone', label: 'Reporter', needsReason: true },
        { verb: 'cancel', label: 'Annuler le match', needsReason: true },
      ];
    case 'CONFIRMED':
      return [
        { verb: 'postpone', label: 'Reporter', needsReason: true },
        { verb: 'cancel', label: 'Annuler le match', needsReason: true },
      ];
    case 'POSTPONED':
      return [
        { verb: 'schedule', label: 'Reprogrammer', needsReason: false },
        { verb: 'cancel', label: 'Annuler le match', needsReason: true },
      ];
    default:
      // LIVE, PAUSED and COMPLETED are driven from the game screen, not from a calendar.
      return [];
  }
}

export interface FixtureDialogProps {
  open: boolean;
  onClose: () => void;
  /** The day the organiser clicked, `yyyy-mm-dd`. Required when creating. */
  day: string | null;
  /**
   * Opened from a day on the grid, so the day is already chosen: only the hour is asked.
   *
   * Offering the date again there invites exactly the mistake the click ruled out — a fixture
   * added "on the 26th" that lands on the 24th because the field was brushed. "Nouveau match"
   * starts from no day in particular, so it asks; moving an existing fixture always asks.
   */
  lockDay?: boolean;
  /** Present when changing an existing fixture; absent when adding one. */
  entry?: CalendarEntry | null;
  competitions: CalendarCompetition[];
  venues: CalendarVenue[];
  /** Slot length for the organisation's sport — how long a game holds the hall. */
  durationMinutes: number;
}

export function FixtureDialog({
  open,
  onClose,
  day,
  lockDay = false,
  entry,
  competitions,
  venues,
  durationMinutes,
}: FixtureDialogProps) {
  const scope = useScopeContext();
  const editing = !!entry;

  const [leagueId, setLeagueId] = useState('');
  const [homeTeamId, setHomeTeamId] = useState('');
  const [awayTeamId, setAwayTeamId] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [venueId, setVenueId] = useState('');
  /** Whether the organiser has typed an hour — until then the dialog keeps suggesting one. */
  const [timeTouched, setTimeTouched] = useState(false);
  const [homeScore, setHomeScore] = useState('');
  const [awayScore, setAwayScore] = useState('');
  const [forfeit, setForfeit] = useState(false);
  const [reason, setReason] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [showAllThatDay, setShowAllThatDay] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const createMut = useCreateGame();
  const moveMut = useMoveGame();
  const stateMut = useGameStateChange();
  const invertMut = useInvertGame();
  const deleteMut = useDeleteGame();

  const teams = useTeamOptions(leagueId || undefined);
  const audit = useGameAudit(entry?.id, showHistory && !!entry);

  /**
   * The chosen day's fixtures, read for that day rather than handed in by the grid.
   *
   * They used to arrive as a prop computed from the day that was clicked, so changing the date
   * changed nothing: the list went on showing the 26th's games for a fixture now on the 24th, and
   * the suggested hour went on following them. The grid's own list was the wrong source twice
   * over — it is filtered (a hidden competition, a search, a hall) while a hidden competition's
   * game still holds the hall, and it only covers the loaded month while a date can be typed
   * anywhere. This asks for the day itself, unfiltered, in the scope the grid is in.
   *
   * A day either side, then trimmed to the local day: the endpoint's days are UTC days, and an
   * evening fixture in Goma is already tomorrow in UTC.
   */
  const dayWindow = useMemo(() => {
    if (!date) return null;
    const [y, m, d] = date.split('-').map(Number);
    return { from: isoDay(new Date(y, m - 1, d - 1)), to: isoDay(new Date(y, m - 1, d + 1)) };
  }, [date]);

  const dayQuery = useCalendar({
    from: dayWindow?.from ?? '',
    to: dayWindow?.to ?? '',
    leagueIds: scope.leagueId ? [scope.leagueId] : undefined,
    tenantId: scope.tenantId ?? undefined,
    enabled: open && !!dayWindow,
  });

  const entriesThatDay = useMemo(
    () =>
      open && date
        ? (dayQuery.data?.entries ?? []).filter((e) => isoDay(new Date(e.dateTime)) === date)
        : [],
    [open, date, dayQuery.data],
  );

  /**
   * The next free hour on that day, so the common case needs no typing.
   *
   * A day with games already on it suggests one slot after the last of them; an empty day
   * suggests the hour the organisation actually starts at. Guessing "now" — which is what a bare
   * `<input type="time">` does — is never right for a fixture.
   */
  const suggestedTime = useMemo(() => {
    const others = entriesThatDay.filter((e) => e.id !== entry?.id);
    if (others.length === 0) return '13:30';
    const last = others.reduce((a, b) => (a.dateTime > b.dateTime ? a : b));
    const next = new Date(new Date(last.dateTime).getTime() + durationMinutes * 60_000);
    return `${String(next.getHours()).padStart(2, '0')}:${String(next.getMinutes()).padStart(2, '0')}`;
  }, [entriesThatDay, entry, durationMinutes]);

  // Reset whenever the dialog is pointed at something new, so it never opens holding the last
  // fixture's answers.
  useEffect(() => {
    if (!open) return;
    if (entry) {
      setLeagueId(entry.leagueId);
      // A bracket fixture's sides are labels, not clubs. The dialog only ever opens on a real
      // fixture — `PLANNED` entries open their own editor — so this is a guard rather than a case.
      setHomeTeamId(entry.home.id ?? '');
      setAwayTeamId(entry.away.id ?? '');
      setDate(isoDay(new Date(entry.dateTime)));
      setTime(timeOf(entry.dateTime));
      setTimeTouched(true);
      setVenueId(entry.venueId ?? '');
    } else {
      setLeagueId(scope.leagueId ?? (competitions.length === 1 ? competitions[0].id : ''));
      setHomeTeamId('');
      setAwayTeamId('');
      setDate(day ?? '');
      // Filled by the suggestion below once the day's fixtures are known.
      setTime('');
      setTimeTouched(false);
      setVenueId('');
    }
    setHomeScore('');
    setAwayScore('');
    setForfeit(false);
    setReason('');
    setShowHistory(false);
    setShowAllThatDay(false);
    setConfirmingDelete(false);
  }, [open, entry, day, scope.leagueId, competitions]);

  // The suggestion follows the day until the organiser types an hour of their own. It was part of
  // the reset above, which meant it was computed once, from the day first clicked.
  useEffect(() => {
    if (open && !timeTouched) setTime(suggestedTime);
  }, [open, timeTouched, suggestedTime]);

  /**
   * The day's other fixtures, with the one being edited guaranteed a place.
   *
   * Truncating a nine-game Saturday to the first four used to hide the very fixture the dialog
   * was about — the ninth game simply was not in the list, so the panel meant to show where it
   * sat in the day showed everything except it.
   */
  const sortedThatDay = useMemo(
    () => [...entriesThatDay].sort((a, b) => a.dateTime.localeCompare(b.dateTime)),
    [entriesThatDay],
  );

  const shownThatDay = useMemo(() => {
    if (showAllThatDay || sortedThatDay.length <= DAY_PREVIEW) return sortedThatDay;
    const head = sortedThatDay.slice(0, DAY_PREVIEW);
    const inHand = entry ? sortedThatDay.find((e) => e.id === entry.id) : undefined;
    // Absent when the fixture is being moved to another day: that day's list has no place for it.
    if (!inHand || head.some((e) => e.id === inHand.id)) return head;
    // Drop the last of the head to make room for the fixture in hand, keeping time order.
    return [...head.slice(0, DAY_PREVIEW - 1), inHand].sort((a, b) =>
      a.dateTime.localeCompare(b.dateTime),
    );
  }, [sortedThatDay, showAllThatDay, entry]);

  const hiddenThatDay = sortedThatDay.length - shownThatDay.length;

  const teamOptions = (teams.data?.data ?? []).map((t) => ({
    value: t.id,
    label: t.shortCode ? `${t.name} (${t.shortCode})` : t.name,
  }));

  const at = instantFrom(date, time);

  /**
   * A new fixture whose slot has already begun — which is what decides whether a result can be
   * given. Not offered when editing: an existing fixture is scored from its own dialog.
   */
  const alreadyPlayed = !editing && !!at && new Date(at).getTime() <= Date.now();

  const scoreTyped = homeScore !== '' || awayScore !== '';
  const scoreComplete =
    homeScore !== '' && awayScore !== '' && Number(homeScore) >= 0 && Number(awayScore) >= 0;
  /** Both or neither: one number is a typo waiting to become a result. */
  const scoreValid = !alreadyPlayed || !scoreTyped || scoreComplete;
  const recordsResult = alreadyPlayed && scoreComplete;

  const slotChanged =
    !!entry &&
    !!at &&
    (at !== new Date(entry.dateTime).toISOString() ||
      (venueId || null) !== (entry.venueId ?? null));

  const busy =
    createMut.isPending ||
    moveMut.isPending ||
    stateMut.isPending ||
    invertMut.isPending ||
    deleteMut.isPending;

  const canSubmit = editing
    ? slotChanged
    : !!leagueId &&
      !!homeTeamId &&
      !!awayTeamId &&
      homeTeamId !== awayTeamId &&
      !!at &&
      scoreValid;

  function submit() {
    if (!canSubmit || !at) return;

    if (editing && entry) {
      moveMut.mutate(
        {
          gameId: entry.id,
          dateTime: at,
          homeVenueId: venueId || null,
          reason: reason.trim() || undefined,
        },
        {
          onSuccess: () => {
            toast.success('Match déplacé.');
            onClose();
          },
          onError: (e) => toastApiError(e),
        },
      );
      return;
    }

    if (!scope.tenantId) {
      toast.error("Aucune organisation n'est sélectionnée.");
      return;
    }
    createMut.mutate(
      {
        leagueId,
        tenantId: scope.tenantId,
        homeTeamId,
        awayTeamId,
        dateTime: at,
        ...(venueId ? { homeVenueId: venueId } : {}),
        ...(recordsResult
          ? {
              homeScore: Number(homeScore),
              awayScore: Number(awayScore),
              ...(forfeit ? { isForfeit: true } : {}),
            }
          : {}),
      },
      {
        onSuccess: () => {
          toast.success(
            recordsResult
              ? 'Résultat enregistré.'
              : alreadyPlayed
                ? 'Match ajouté — résultat en attente.'
                : 'Match ajouté au calendrier.',
          );
          onClose();
        },
        onError: (e) => toastApiError(e),
      },
    );
  }

  function runVerb(verb: StateVerb, needsReason: boolean) {
    if (!entry) return;
    if (needsReason && !reason.trim()) {
      toast.error('Indiquez la raison — elle sera enregistrée dans l’historique.');
      return;
    }
    stateMut.mutate(
      { gameId: entry.id, verb, reason: reason.trim() || undefined },
      {
        onSuccess: () => {
          toast.success('État mis à jour.');
          onClose();
        },
        onError: (e) => toastApiError(e),
      },
    );
  }

  const verbs = entry ? verbsFor(entry.status) : [];
  const hasScore = !!entry && entry.homeScore != null;

  return (
    <Modal
      open={open}
      onOpenChange={(next) => !next && onClose()}
      // One line: what, and on which day. The chosen day, not the clicked one — it follows the date
      // field when there is one.
      // The date never breaks inside itself: on a phone it moves to the second line whole.
      title={
        editing ? (
          'Modifier le match'
        ) : (
          <span className="flex flex-wrap items-baseline gap-x-1.5">
            <span className="whitespace-nowrap">Ajouter un match</span>
            {date && (
              <span className="whitespace-nowrap font-normal text-ink-muted">
                {/* The separator only makes sense on one line; on a phone the date sits under. */}
                <span className="hidden sm:inline">· </span>
                {shortDate(date)}
              </span>
            )}
          </span>
        )
      }
      className="max-w-lg"
    >
      <div className="space-y-4">

        {/* ---- who plays ---- */}
        {editing ? (
          <div className="rounded-lg border border-line bg-surface-sunk px-3.5 py-3">
            <div className="flex items-center gap-2">
              <p className="min-w-0 flex-1 truncate text-sm font-semibold text-ink">
                {entry!.home.name}
              </p>
              <span className="shrink-0 text-xs text-ink-subtle">reçoit</span>
              <p className="min-w-0 flex-1 truncate text-right text-sm font-semibold text-ink">
                {entry!.away.name}
              </p>
            </div>
            {/* The pairing is the fixture's identity — the slug is built from it and, once a
                score exists, the two numbers hang off it. Changing who plays is a cancelled
                fixture and a new one. Inverting is the exception: same match, typed backwards. */}
            <div className="mt-2 flex items-center justify-between gap-2">
              <p className="text-xs text-ink-subtle">
                Les équipes d’un match ne changent pas.
              </p>
              <button
                type="button"
                disabled={hasScore || busy}
                onClick={() =>
                  invertMut.mutate(
                    { gameId: entry!.id, reason: reason.trim() || undefined },
                    {
                      onSuccess: () => {
                        toast.success('Domicile et visiteur inversés.');
                        onClose();
                      },
                      onError: (e) => toastApiError(e),
                    },
                  )
                }
                title={
                  hasScore
                    ? 'Impossible : le score indique déjà qui a marqué quoi.'
                    : 'Inverser domicile et visiteur'
                }
                className="flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-accent-text transition-colors hover:bg-accent-soft disabled:cursor-not-allowed disabled:text-ink-subtle disabled:hover:bg-transparent"
              >
                <ArrowLeftRight className="h-3.5 w-3.5" aria-hidden />
                Inverser
              </button>
            </div>
          </div>
        ) : (
          <>
            {competitions.length > 1 && (
              <div>
                <Label htmlFor="fx-league" required>
                  Compétition
                </Label>
                <SelectField
                  id="fx-league"
                  label="Compétition"
                  placeholder="Choisir…"
                  value={leagueId}
                  onChange={(v) => {
                    setLeagueId(v);
                    setHomeTeamId('');
                    setAwayTeamId('');
                  }}
                  options={competitions.map((c) => ({ value: c.id, label: c.name }))}
                  className="w-full"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="fx-home" required>
                  Domicile
                </Label>
                <SelectField
                  id="fx-home"
                  label="Équipe à domicile"
                  placeholder={teams.isPending && leagueId ? 'Chargement…' : 'Choisir…'}
                  value={homeTeamId}
                  onChange={setHomeTeamId}
                  options={teamOptions.filter((t) => t.value !== awayTeamId)}
                  disabled={!leagueId}
                  className="w-full"
                />
              </div>
              <div>
                <Label htmlFor="fx-away" required>
                  Visiteur
                </Label>
                <SelectField
                  id="fx-away"
                  label="Équipe visiteuse"
                  placeholder={teams.isPending && leagueId ? 'Chargement…' : 'Choisir…'}
                  value={awayTeamId}
                  onChange={setAwayTeamId}
                  options={teamOptions.filter((t) => t.value !== homeTeamId)}
                  disabled={!leagueId}
                  className="w-full"
                />
              </div>
            </div>
          </>
        )}

        {/* ---- the slot: day, hour and hall are one decision ---- */}
        {(() => {
          const timeField = (
            <div>
              <Label htmlFor="fx-time" required>
                Heure
              </Label>
              <input
                id="fx-time"
                type="time"
                value={time}
                onChange={(e) => {
                  setTime(e.target.value);
                  setTimeTouched(true);
                }}
                className="h-9 w-full rounded-lg border border-line bg-surface px-3 text-sm tabular-nums text-ink transition-colors hover:border-line-strong focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>
          );
          const venueField = venues.length > 0 && (
            <div>
              <Label htmlFor="fx-venue">Salle</Label>
              <SelectField
                id="fx-venue"
                label="Salle"
                placeholder="Aucune — date seulement"
                value={venueId}
                onChange={setVenueId}
                options={venues.map((v) => ({ value: v.id, label: v.name }))}
                className="w-full"
              />
            </div>
          );
          // From a day on the grid the day is settled and shown in the header, so the hour and
          // the hall share a row. Otherwise the day is asked for beside the hour.
          if (lockDay && !editing) {
            return (
              <div className="grid grid-cols-2 gap-3">
                {timeField}
                {venueField}
              </div>
            );
          }
          return (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="fx-date" required>
                    Jour
                  </Label>
                  {/* The same picker the season step uses. `<input type="date">` renders whatever
                      the browser feels like — its own chrome, the OS locale rather than the
                      product's, no tokens — which on a French calendar is worse than the code it
                      saves. */}
                  <div>
                    <DatePicker id="fx-date" value={date} onChange={setDate} size="sm" />
                  </div>
                </div>
                {timeField}
              </div>
              {venueField}
            </>
          );
        })()}

        {/* ---- the result, when there can be one ---- */}
        {alreadyPlayed && (
          <div className="rounded-lg border border-line px-3.5 py-3">
            <p className="text-xs uppercase tracking-wider text-ink-subtle">
              Résultat · ce match a déjà eu lieu
            </p>
            {/* The two numbers sit under the two clubs they belong to, in the same columns as the
                selects above — the order a result is read in, and the order of the sheet. */}
            <div className="mt-2.5 grid grid-cols-2 gap-3">
              {(
                [
                  ['Domicile', homeTeamId, homeScore, setHomeScore],
                  ['Visiteur', awayTeamId, awayScore, setAwayScore],
                ] as const
              ).map(([side, teamId, value, set]) => {
                const name = teamOptions.find((t) => t.value === teamId)?.label ?? side;
                return (
                  <input
                    key={side}
                    type="number"
                    inputMode="numeric"
                    min={0}
                    value={value}
                    onChange={(e) => set(e.target.value)}
                    placeholder="–"
                    aria-label={`Score — ${name}`}
                    className="h-12 w-full rounded-lg border border-line bg-surface text-center text-2xl font-bold tabular-nums text-ink transition-colors placeholder:font-normal placeholder:text-ink-subtle hover:border-line-strong focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                  />
                );
              })}
            </div>
            {scoreComplete && (
              <label
                className={cn(
                  'mt-2.5 flex cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2 transition-colors',
                  forfeit ? 'border-caution/40 bg-caution-soft' : 'border-line hover:border-line-strong',
                )}
              >
                <input
                  type="checkbox"
                  checked={forfeit}
                  onChange={(e) => setForfeit(e.target.checked)}
                  className="h-4 w-4 accent-caution"
                />
                <Flag className="h-4 w-4 shrink-0 text-caution" aria-hidden />
                <span className="text-sm text-ink">
                  Forfait
                  <span className="ml-1.5 text-xs text-ink-subtle">
                    le perdant ne s’est pas présenté
                  </span>
                </span>
              </label>
            )}
            <p className={cn('mt-2 text-xs', scoreValid ? 'text-ink-subtle' : 'text-negative')}>
              {scoreValid
                ? 'Laissez vide si le score n’est pas encore connu : le match restera en attente de résultat.'
                : 'Saisissez les deux scores, ou aucun.'}
            </p>
          </div>
        )}

        {/* The day the organiser is placing into, so they are not choosing an hour blind. */}
        {dayQuery.isFetching && entriesThatDay.length === 0 && !!date && (
          <p className="flex items-center gap-1.5 text-xs text-ink-subtle">
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
            Matchs de ce jour…
          </p>
        )}
        {entriesThatDay.length > 0 && (
          <div className="rounded-lg border border-line bg-surface-sunk px-3 py-2.5">
            <p className="text-xs font-medium text-ink-muted">
              Déjà ce jour-là ({entriesThatDay.length})
            </p>
            <ul className="mt-1.5 space-y-1">
              {shownThatDay.map((e) => {
                const isThisOne = e.id === entry?.id;
                return (
                  <li
                    key={e.id}
                    className={cn(
                      'flex items-baseline gap-2 text-xs',
                      // The fixture being edited is bolded and always present, so the organiser
                      // can see where in the day's stack it sits — which is the whole reason
                      // this list is on screen.
                      isThisOne ? 'font-semibold text-accent-text' : 'text-ink-muted',
                    )}
                  >
                    <span className="w-10 shrink-0 tabular-nums">{timeOf(e.dateTime)}</span>
                    {/* Full names, not short codes. There is room for them here, and "GQN — HMQ"
                        asks the reader to decode two clubs at the moment they are deciding
                        whether the slot is free. */}
                    <span className="min-w-0 flex-1 truncate">
                      {e.home.name} <span className="opacity-60">—</span> {e.away.name}
                    </span>
                    {isThisOne && <span className="shrink-0 text-[0.6875rem]">ce match</span>}
                  </li>
                );
              })}
            </ul>
            {/* This said "et 5 autres" and named fixtures the reader could not reach — and if the
                one being edited was among them it was invisible at exactly the moment it
                mattered. It opens the rest now. */}
            {hiddenThatDay > 0 && (
              <button
                type="button"
                onClick={() => setShowAllThatDay(true)}
                className="mt-1.5 text-xs font-medium text-accent-text hover:underline"
              >
                Voir les {hiddenThatDay} autre{hiddenThatDay > 1 ? 's' : ''}
              </button>
            )}
            {showAllThatDay && entriesThatDay.length > DAY_PREVIEW && (
              <button
                type="button"
                onClick={() => setShowAllThatDay(false)}
                className="mt-1.5 text-xs font-medium text-ink-subtle hover:underline"
              >
                Réduire
              </button>
            )}
          </div>
        )}

        {/* ---- why ---- */}
        {editing && (
          <div>
            <Label htmlFor="fx-reason">Raison</Label>
            <input
              id="fx-reason"
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={300}
              placeholder="Salle prise, équipe en déplacement…"
              className="mt-1 h-9 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink transition-colors hover:border-line-strong focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            />
            <p className="mt-1 text-xs text-ink-subtle">
              Enregistrée dans l’historique du match. « Déplacé au 22 » n’explique rien sans
              « la salle était prise ».
            </p>
          </div>
        )}

        {/* ---- state verbs ---- */}
        {verbs.length > 0 && (
          <div className="border-t border-line pt-3">
            <p className="text-xs uppercase tracking-wider text-ink-subtle">État</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {verbs.map((v) => (
                <button
                  key={v.verb}
                  type="button"
                  disabled={busy}
                  onClick={() => runVerb(v.verb, v.needsReason)}
                  className={cn(
                    'rounded-md border px-2.5 py-1.5 text-sm transition-colors disabled:opacity-50',
                    v.verb === 'cancel'
                      ? 'border-line text-negative hover:border-negative/40 hover:bg-negative-soft'
                      : 'border-line text-ink-muted hover:border-line-strong hover:text-ink',
                  )}
                >
                  {v.label}
                </button>
              ))}
            </div>
            {verbs.some((v) => v.needsReason) && (
              <p className="mt-1.5 text-xs text-ink-subtle">
                Reporter et annuler demandent une raison — quelqu’un s’est déplacé pour ce match.
              </p>
            )}
          </div>
        )}

        {/* ---- history ---- */}
        {editing && (
          <div className="border-t border-line pt-3">
            <button
              type="button"
              onClick={() => setShowHistory((v) => !v)}
              aria-expanded={showHistory}
              className="flex items-center gap-1.5 text-xs font-medium text-ink-muted transition-colors hover:text-ink"
            >
              <History className="h-3.5 w-3.5" aria-hidden />
              Historique
            </button>
            {showHistory && (
              <div className="mt-2">
                {audit.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin text-ink-subtle" aria-hidden />
                ) : (audit.data?.length ?? 0) === 0 ? (
                  <p className="text-xs text-ink-subtle">Rien depuis sa création.</p>
                ) : (
                  <ul className="space-y-1.5">
                    {audit.data!.map((e) => (
                      <li key={e.id} className="text-xs text-ink-muted">
                        <span className="font-medium text-ink">{auditTitle(e.action)}</span>
                        {e.by && <span className="text-ink-subtle"> · {e.by}</span>}
                        <span className="text-ink-subtle">
                          {' · '}
                          {new Date(e.at).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        {e.reason && <span className="block text-ink-subtle">« {e.reason} »</span>}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        )}

        {/* ---- actions ---- */}
        <div className="flex items-center gap-2 border-t border-line pt-4">
          {editing && (
            <button
              type="button"
              disabled={busy}
              onClick={() => setConfirmingDelete(true)}
              className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm text-negative transition-colors hover:bg-negative-soft disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" aria-hidden />
              Supprimer
            </button>
          )}
          <div className="ml-auto flex gap-2">
            {/* Not "Annuler": this dialog also offers *annuler le match*, and one word meaning
                both "close this" and "call the fixture off" is the kind of ambiguity that gets a
                match cancelled by someone who meant to back out. */}
            <Button variant="outline" onClick={onClose} disabled={busy}>
              Fermer
            </Button>
            <Button variant="primary" onClick={submit} disabled={!canSubmit || busy} isLoading={busy}>
              {/* Says what is about to be recorded, since the same button records three things. */}
              {editing
                ? 'Déplacer'
                : recordsResult
                  ? 'Ajouter avec le score'
                  : alreadyPlayed
                    ? 'Ajouter — résultat en attente'
                    : 'Ajouter'}
            </Button>
          </div>
        </div>

        {editing && !slotChanged && (
          <p className="text-right text-xs text-ink-subtle">
            Changez le jour, l’heure ou la salle pour déplacer ce match.
          </p>
        )}

        {/* Deleting a played fixture takes its points out of the table with it, which is worth
            saying out loud rather than discovering afterwards in the standings. */}
        {confirmingDelete && entry && (
          <div className="rounded-lg border border-negative/40 bg-negative-soft px-3.5 py-3">
            <p className="flex items-start gap-2 text-sm text-ink">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-negative" aria-hidden />
              <span>
                Supprimer {entry.home.shortCode} — {entry.away.shortCode} ?
                {hasScore && ' Son résultat sera retiré du classement.'}
              </span>
            </p>
            <div className="mt-2.5 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setConfirmingDelete(false)} disabled={busy}>
                Non
              </Button>
              <Button
                variant="primary"
                isLoading={deleteMut.isPending}
                onClick={() =>
                  deleteMut.mutate(
                    { gameId: entry.id, reason: reason.trim() || undefined },
                    {
                      onSuccess: () => {
                        toast.success('Match supprimé.');
                        onClose();
                      },
                      onError: (e) => toastApiError(e),
                    },
                  )
                }
                className="bg-negative hover:bg-negative/90"
              >
                <Check className="mr-1.5 h-4 w-4" aria-hidden />
                Supprimer
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

