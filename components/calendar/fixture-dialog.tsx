'use client';

import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  AlertTriangle,
  ArrowLeftRight,
  Check,
  History,
  Loader2,
  Trash2,
} from 'lucide-react';
import { Button, DatePicker, Label, Modal, SelectField } from '@/components/ui';
import { toastApiError } from '@/utils';
import { useScopeContext } from '@/hooks';
import type { CalendarCompetition, CalendarEntry, CalendarVenue } from '@/services/calendar';
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
 * exists yet. What it deliberately does not cover is the score — that is its own dialog, because
 * entering thirty results in a sitting is a different job from placing one match.
 */

const WEEKDAYS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
const MONTHS = [
  'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
];

function longDate(day: string): string {
  const d = new Date(`${day}T12:00:00`);
  return `${WEEKDAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
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
  /** Present when changing an existing fixture; absent when adding one. */
  entry?: CalendarEntry | null;
  competitions: CalendarCompetition[];
  venues: CalendarVenue[];
  /** Fixtures already on that day, used to suggest the next free hour. */
  entriesThatDay: CalendarEntry[];
  /** Slot length for the organisation's sport — how long a game holds the hall. */
  durationMinutes: number;
}

export function FixtureDialog({
  open,
  onClose,
  day,
  entry,
  competitions,
  venues,
  entriesThatDay,
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
   * The next free hour on that day, so the common case needs no typing.
   *
   * A day with games already on it suggests one slot after the last of them; an empty day
   * suggests the hour the organisation actually starts at. Guessing "now" — which is what a bare
   * `<input type="time">` does — is never right for a fixture.
   */
  const suggestedTime = useMemo(() => {
    if (entriesThatDay.length === 0) return '13:30';
    const last = entriesThatDay.reduce((a, b) => (a.dateTime > b.dateTime ? a : b));
    const next = new Date(new Date(last.dateTime).getTime() + durationMinutes * 60_000);
    return `${String(next.getHours()).padStart(2, '0')}:${String(next.getMinutes()).padStart(2, '0')}`;
  }, [entriesThatDay, durationMinutes]);

  // Reset whenever the dialog is pointed at something new, so it never opens holding the last
  // fixture's answers.
  useEffect(() => {
    if (!open) return;
    if (entry) {
      setLeagueId(entry.leagueId);
      setHomeTeamId(entry.home.id);
      setAwayTeamId(entry.away.id);
      setDate(isoDay(new Date(entry.dateTime)));
      setTime(timeOf(entry.dateTime));
      setVenueId(entry.venueId ?? '');
    } else {
      setLeagueId(scope.leagueId ?? (competitions.length === 1 ? competitions[0].id : ''));
      setHomeTeamId('');
      setAwayTeamId('');
      setDate(day ?? '');
      setTime(suggestedTime);
      setVenueId('');
    }
    setReason('');
    setShowHistory(false);
    setShowAllThatDay(false);
    setConfirmingDelete(false);
  }, [open, entry, day, scope.leagueId, competitions, suggestedTime]);

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
    if (!entry || head.some((e) => e.id === entry.id)) return head;
    // Drop the last of the head to make room for the fixture in hand, keeping time order.
    return [...head.slice(0, DAY_PREVIEW - 1), sortedThatDay.find((e) => e.id === entry.id)!].sort(
      (a, b) => a.dateTime.localeCompare(b.dateTime),
    );
  }, [sortedThatDay, showAllThatDay, entry]);

  const hiddenThatDay = sortedThatDay.length - shownThatDay.length;

  const teamOptions = (teams.data?.data ?? []).map((t) => ({
    value: t.id,
    label: t.shortCode ? `${t.name} (${t.shortCode})` : t.name,
  }));

  const at = instantFrom(date, time);

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
    : !!leagueId && !!homeTeamId && !!awayTeamId && homeTeamId !== awayTeamId && !!at;

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
      },
      {
        onSuccess: () => {
          toast.success('Match ajouté au calendrier.');
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
      title={editing ? 'Modifier le match' : 'Ajouter un match'}
      className="max-w-lg"
    >
      <div className="space-y-4">
        {day && !editing && (
          <p className="-mt-2 text-sm text-ink-muted first-letter:uppercase">{longDate(day)}</p>
        )}

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
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="fx-date" required>
              Jour
            </Label>
            {/* The same picker the season step uses. `<input type="date">` renders whatever the
                browser feels like — its own chrome, the OS locale rather than the product's, no
                tokens — which on a French calendar is worse than the code it saves. */}
            <div className="mt-1">
              <DatePicker id="fx-date" value={date} onChange={setDate} size="sm" />
            </div>
          </div>
          <div>
            <Label htmlFor="fx-time" required>
              Heure
            </Label>
            <input
              id="fx-time"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="mt-1 h-9 w-full rounded-lg border border-line bg-surface px-3 text-sm tabular-nums text-ink transition-colors hover:border-line-strong focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>
        </div>

        {venues.length > 0 && (
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
        )}

        {/* The day the organiser is placing into, so they are not choosing an hour blind. */}
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
                        <span className="font-medium text-ink">{ACTION_LABELS[e.action] ?? e.action}</span>
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
              {editing ? 'Déplacer' : 'Ajouter'}
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

const ACTION_LABELS: Record<string, string> = {
  MOVED: 'Déplacé',
  UPDATED: 'Modifié',
  INVERTED: 'Domicile inversé',
  DELETED: 'Supprimé',
  SCORE_REPORTED: 'Score saisi',
  SCORE_CORRECTED: 'Score corrigé',
  TRANSITION_SCHEDULED: 'Reprogrammé',
  TRANSITION_CONFIRMED: 'Confirmé',
  TRANSITION_POSTPONED: 'Reporté',
  TRANSITION_CANCELLED: 'Annulé',
  TRANSITION_COMPLETED: 'Terminé',
  TRANSITION_LIVE: 'Coup d’envoi',
};
