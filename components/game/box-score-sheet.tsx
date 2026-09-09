'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { AlertTriangle, ArrowRightLeft, Check, Info, Loader2, Lock, Plus, X } from 'lucide-react';
import { Button, Label } from '@/components/ui';
import { PlayerQuickView } from '@/components/players/player-quick-view';
import { toastApiError, cn } from '@/utils';
import {
  existingPlayersFrom,
  totalOf,
  useAddBoxScorePlayer,
  useBoxScore,
  useSaveBoxScore,
  useTransferPlayer,
  type BoxScoreLine,
  type ExistingPlayerMatch,
  type StatColumn,
} from '@/services/box-score';
import { useReportScore } from '@/services/games';

/**
 * The scoresheet, typed up.
 *
 * This is the second act of entering a result, never the first. The fast path is two numbers in
 * the score dialog, because most of what the community manager receives is "87-70" in a WhatsApp
 * message and he enters a weekend of them in a sitting. This screen is for the evenings when he
 * has the officials' sheet — or a photograph of it — in front of him.
 *
 * So it is laid out like that sheet rather than like a form: every eligible player on one line, in
 * shirt-number order, a column per thing the paper records, and the total computed. He works down
 * the paper and across the screen, and never has to search for a name.
 *
 * Four things it is careful about:
 *
 * **The columns are the sport's, not basketball's.** They arrive with the rosters. This file does
 * not contain the string "three-pointer", which is what lets a volleyball league use the same
 * screen without a second implementation growing beside this one.
 *
 * **It opens after the final whistle.** Typing up a scoresheet is administrative work done days
 * later; a sheet offered on a fixture nobody has played invites a number that means nothing.
 *
 * **Who played is a fact in its own right.** A squad of twenty turns up eight strong, and a player
 * who took the floor and neither scored nor fouled used to be indistinguishable from one who
 * stayed at home. The tick is that distinction.
 *
 * **The work in progress is never thrown away.** Adding a player refetches the sheet, and the
 * first version of this file reseeded its draft from every response — so the act of adding a name
 * silently erased everything typed so far. The draft is now seeded once and *reconciled* against
 * later responses: new players appear, nothing already on screen is touched.
 */

interface Line {
  played: boolean;
  stats: Record<string, number>;
}
type Draft = Record<string, Line>;

/** A new name being typed in. Only the family name is required — it is what the paper carries. */
interface NewPlayer {
  lastName: string;
  firstName: string;
  jerseyNumber: string;
  position: string;
}

const EMPTY_NEW: NewPlayer = { lastName: '', firstName: '', jerseyNumber: '', position: '' };
const EMPTY_LINE: Line = { played: false, stats: {} };

export function BoxScoreSheet({
  gameId,
  active = true,
  onSaved,
  /** Rendered beside the save button. The dialog puts its Fermer button here. */
  footerSlot,
  /** Lets a dialog pin the action row instead of letting it scroll away. */
  renderFooter,
}: {
  gameId: string;
  /** False while the containing dialog is closed, so the roster is not re-read behind it. */
  active?: boolean;
  onSaved?: () => void;
  footerSlot?: React.ReactNode;
  renderFooter?: (footer: React.ReactNode) => void;
}) {
  const [side, setSide] = useState<'home' | 'away'>('home');
  const [draft, setDraft] = useState<Draft>({});
  const [reason, setReason] = useState('');
  const [adding, setAdding] = useState(false);
  const [newPlayer, setNewPlayer] = useState<NewPlayer>(EMPTY_NEW);
  const [duplicates, setDuplicates] = useState<ExistingPlayerMatch[] | null>(null);
  /** Whose figures are open over the sheet. Never navigation — see the name button below. */
  const [viewing, setViewing] = useState<string | null>(null);

  const box = useBoxScore(gameId, active);
  const saveMut = useSaveBoxScore();
  const scoreMut = useReportScore();
  const addMut = useAddBoxScorePlayer();
  const transferMut = useTransferPlayer();

  const data = box.data;
  const columns: StatColumn[] = useMemo(() => data?.columns ?? [], [data]);

  /**
   * What the sheet looked like when it was opened. Everything "has anything changed" is measured
   * against this rather than against the server, so a sheet opened and closed is not a change —
   * which is what stops *Enregistrer* firing a write and a success toast for nothing.
   */
  const baseline = useRef<Draft>({});
  /** The load the draft was seeded from. A later response reconciles; it does not replace. */
  const seededFor = useRef<string | null>(null);

  useEffect(() => {
    if (!active || !data) return;

    const fromServer: Draft = {};
    for (const s of [data.home, data.away]) {
      for (const p of s.players) fromServer[p.playerId] = { played: p.played, stats: { ...p.stats } };
    }

    // First load of this game: seed, and remember it as the baseline.
    if (seededFor.current !== gameId) {
      seededFor.current = gameId;
      // A sheet nobody has filled in starts with the whole roster ticked. The list *is* the squad
      // that was submitted, so "everyone played" is the right first guess and the operator
      // unticks the absentees — which is fewer touches than ticking eight of twelve. It is the
      // baseline too, so opening the sheet and closing it still counts as no change.
      const seeded: Draft = data.recorded
        ? fromServer
        : Object.fromEntries(
            Object.entries(fromServer).map(([id, l]) => [id, { ...l, played: true }]),
          );
      setDraft(seeded);
      baseline.current = seeded;
      setReason('');
      return;
    }

    // A later response — almost always a player having just been added. Take the names that are
    // new and leave every line already on screen exactly as the operator left it.
    setDraft((prev) => {
      const next = { ...prev };
      let changed = false;
      for (const [id, line] of Object.entries(fromServer)) {
        if (!(id in next)) {
          next[id] = data.recorded ? line : { ...line, played: true };
          baseline.current = { ...baseline.current, [id]: next[id] };
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [active, data, gameId]);

  /** Totals from the draft, not from the server: the reconciliation has to move as you type. */
  const totals = useMemo(() => {
    const sum = (players: { playerId: string }[]) =>
      players.reduce((t, p) => t + totalOf(columns, draft[p.playerId]?.stats ?? {}), 0);
    return {
      home: data ? sum(data.home.players) : 0,
      away: data ? sum(data.away.players) : 0,
    };
  }, [draft, data, columns]);

  const appearances = useMemo(
    () => Object.values(draft).filter((l) => l.played).length,
    [draft],
  );

  /** Whether anything on the sheet differs from the state it was opened in. */
  const dirty = useMemo(() => {
    const keys = new Set([...Object.keys(baseline.current), ...Object.keys(draft)]);
    for (const k of keys) {
      const a = baseline.current[k] ?? EMPTY_LINE;
      const b = draft[k] ?? EMPTY_LINE;
      if (a.played !== b.played) return true;
      for (const c of columns) {
        if ((a.stats[c.code] || 0) !== (b.stats[c.code] || 0)) return true;
      }
    }
    return false;
  }, [draft, columns]);

  const linesToSave = useCallback(
    (): BoxScoreLine[] =>
      Object.entries(draft).map(([playerId, l]) => ({
        playerId,
        played: l.played,
        stats: Object.fromEntries(Object.entries(l.stats).filter(([, v]) => v > 0)),
      })),
    [draft],
  );

  const save = useCallback(() => {
    const lines = linesToSave();
    saveMut.mutate(
      { gameId, lines, ...(data?.recorded && reason.trim() ? { reason: reason.trim() } : {}) },
      {
        onSuccess: (fresh) => {
          toast.success(
            lines.some((l) => l.played)
              ? 'Feuille de match enregistrée.'
              : 'Feuille de match vidée.',
          );
          // What was just written becomes the new baseline, so the button goes quiet again
          // instead of staying lit over a sheet that now matches the server.
          const next: Draft = {};
          for (const s of [fresh.home, fresh.away]) {
            for (const p of s.players) next[p.playerId] = { played: p.played, stats: { ...p.stats } };
          }
          baseline.current = next;
          setDraft(next);
          setReason('');
          onSaved?.();
        },
        onError: (e) => toastApiError(e),
      },
    );
  }, [linesToSave, saveMut, gameId, data?.recorded, reason, onSaved]);

  const busy = saveMut.isPending || scoreMut.isPending || addMut.isPending || transferMut.isPending;
  const readOnly = !data?.editable;

  /**
   * The action row, hoisted so a dialog can pin it.
   *
   * On a twelve-player roster the buttons sat below the fold and the operator had to scroll past
   * the whole sheet to find them, which on a screen whose entire job is data entry is the one
   * control that must never move.
   */
  const footer = (
    <div className="flex items-center justify-end gap-2">
      {footerSlot}
      {!readOnly && (
        <Button
          variant="primary"
          onClick={save}
          isLoading={saveMut.isPending}
          disabled={busy || !dirty}
          // A disabled button with no explanation reads as broken. This is the same rule the
          // fixture editor already applies.
          title={dirty ? undefined : 'Rien n’a été modifié'}
        >
          Enregistrer
        </Button>
      )}
    </div>
  );

  useEffect(() => {
    renderFooter?.(footer);
    // The footer closes over `dirty` and `busy`, so it has to be re-sent when they move.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dirty, busy, saveMut.isPending, readOnly, footerSlot]);

  if (box.isPending) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="h-5 w-5 animate-spin text-ink-subtle" aria-hidden />
      </div>
    );
  }

  if (!data) {
    return (
      <p className="py-8 text-center text-sm text-ink-muted">
        La feuille n&apos;a pas pu être chargée.
      </p>
    );
  }

  // A sport we have no sheet for is a different answer from a match played too early, and the
  // server distinguishes them. Neither is worth rendering an empty grid for.
  if (columns.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-line px-4 py-8 text-center text-sm text-ink-muted">
        {data.notEditableReason ?? 'La feuille de match n’est pas définie pour ce sport.'}
      </p>
    );
  }

  const current = data[side];
  const finalHome = data.home.finalScore;
  const finalAway = data.away.finalScore;
  const hasFinal = finalHome !== null && finalAway !== null;
  const anyRecorded = totals.home > 0 || totals.away > 0;
  const reconciles = data.reconcilesWithFinalScore;
  const matches = hasFinal && totals.home === finalHome && totals.away === finalAway;

  function set(playerId: string, column: StatColumn, raw: string) {
    // Digits only, capped by the column's own ceiling: five fouls, not ninety-nine, and a slipped
    // keystroke should never become a four-thousand-point game.
    const value = Math.max(0, Math.min(column.max, Number(raw.replace(/\D/g, '')) || 0));
    setDraft((prev) => {
      const line = prev[playerId] ?? EMPTY_LINE;
      // A number is a statement that they were on the floor, so it ticks the box. The reverse
      // does not hold, which is why unticking clears the numbers.
      return {
        ...prev,
        [playerId]: {
          played: value > 0 ? true : line.played,
          stats: { ...line.stats, [column.code]: value },
        },
      };
    });
  }

  function togglePlayed(playerId: string) {
    setDraft((prev) => {
      const line = prev[playerId] ?? EMPTY_LINE;
      const played = !line.played;
      // Unticking throws the numbers away, because keeping them would leave the sheet holding
      // figures for a player it also says was not there.
      return { ...prev, [playerId]: { played, stats: played ? line.stats : {} } };
    });
  }

  function submitNewPlayer(force = false) {
    const lastName = newPlayer.lastName.trim();
    if (!lastName) return;
    addMut.mutate(
      {
        gameId,
        teamId: current.teamId,
        lastName,
        firstName: newPlayer.firstName.trim() || undefined,
        jerseyNumber: newPlayer.jerseyNumber ? Number(newPlayer.jerseyNumber) : undefined,
        position: newPlayer.position.trim() || undefined,
        ...(force ? { force: true } : {}),
      },
      {
        onSuccess: (p) => {
          toast.success(`${p.lastName} ${p.firstName}`.trim() + ' ajouté à l’effectif.');
          // Stays open and clears: a squad handed over on the morning of the game arrives as a
          // list, not as one name.
          setNewPlayer(EMPTY_NEW);
          setDuplicates(null);
        },
        onError: (e) => {
          const existing = existingPlayersFrom(e);
          if (existing) {
            setDuplicates(existing);
            return;
          }
          toastApiError(e);
        },
      },
    );
  }

  function transferHere(playerId: string) {
    transferMut.mutate(
      { gameId, playerId, teamId: current.teamId },
      {
        onSuccess: () => {
          toast.success(`Joueur transféré à ${current.name}.`);
          setNewPlayer(EMPTY_NEW);
          setDuplicates(null);
        },
        onError: (e) => toastApiError(e),
      },
    );
  }

  /** Offered only when there is no result yet — it records one, it never overwrites one. */
  function adoptAsFinalScore() {
    scoreMut.mutate(
      { gameId, homeScore: totals.home, awayScore: totals.away },
      {
        onSuccess: () => toast.success('Score final enregistré depuis la feuille.'),
        onError: (e) => toastApiError(e),
      },
    );
  }

  const field =
    'h-9 w-9 sm:w-11 rounded-md border border-line bg-surface text-center text-sm tabular-nums text-ink ' +
    'transition-colors focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent ' +
    'disabled:cursor-default disabled:border-transparent disabled:bg-transparent disabled:text-ink-subtle ' +
    '[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none';

  const newField =
    'h-8 rounded-md border border-line bg-surface px-2 text-sm text-ink transition-colors ' +
    'focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent';

  return (
    <div className="space-y-4">
      {/* Why the fields are locked, when they are. Stated once at the top rather than as a
          disabled cursor the reader has to discover by trying. */}
      {readOnly && data.notEditableReason && (
        <p className="flex items-start gap-2 rounded-lg border border-line bg-surface-sunk px-3.5 py-2.5 text-sm text-ink-muted">
          <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-subtle" aria-hidden />
          {data.notEditableReason}
        </p>
      )}

      {/* One team at a time. Two rosters side by side is the paper's layout and the wrong one for
          a phone, where it would give each column about forty pixels. */}
      <div className="flex rounded-lg border border-line bg-surface p-0.5">
        {(['home', 'away'] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => {
              setSide(s);
              setAdding(false);
              setDuplicates(null);
            }}
            aria-pressed={side === s}
            className={cn(
              'flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
              side === s ? 'bg-accent text-accent-ink' : 'text-ink-muted hover:text-ink',
            )}
          >
            <span className="truncate">{data[s].name}</span>
            <span className="shrink-0 tabular-nums opacity-80">{totals[s]}</span>
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-lg border border-line">
        <div className="overflow-x-auto">
          <div className="min-w-[21rem]">
            <div className="flex items-center gap-1 border-b border-line bg-surface-sunk px-2 py-1.5 text-[0.6875rem] font-medium uppercase tracking-wide text-ink-subtle sm:gap-2">
              <span className="w-6 shrink-0 text-center" title="A joué">
                Joué
              </span>
              <span className="w-7 shrink-0 text-center">N°</span>
              <span className="min-w-0 flex-1">Joueur</span>
              {columns.map((c) => (
                <span
                  key={c.code}
                  title={c.label}
                  className={cn(
                    'w-9 shrink-0 text-center sm:w-11',
                    // A column that scores nothing should not read as one that does. Fouls sit
                    // beside the baskets on the paper too, and are not part of the total.
                    c.weight === 0 && 'text-ink-subtle/70',
                  )}
                >
                  {c.abbr}
                </span>
              ))}
              <span className="w-9 shrink-0 text-center">{data.totalAbbr}</span>
            </div>

            <ul className="divide-y divide-line">
              {current.players.length === 0 && (
                <li className="px-4 py-6 text-center text-sm text-ink-muted">
                  Cette équipe n&apos;a pas encore de joueurs.
                </li>
              )}
              {current.players.map((p) => {
                const line = draft[p.playerId] ?? EMPTY_LINE;
                const total = totalOf(columns, line.stats);
                return (
                  <li
                    key={p.playerId}
                    className={cn(
                      'flex items-center gap-1 px-2 py-1.5 transition-colors sm:gap-2',
                      line.played ? 'bg-surface' : 'bg-surface-sunk/40',
                    )}
                  >
                    <span className="flex w-6 shrink-0 justify-center">
                      <input
                        type="checkbox"
                        checked={line.played}
                        disabled={readOnly}
                        onChange={() => togglePlayed(p.playerId)}
                        aria-label={`${p.lastName} a joué`}
                        className="h-4 w-4 accent-accent"
                      />
                    </span>
                    <span
                      className={cn(
                        'w-7 shrink-0 text-center text-xs tabular-nums',
                        line.played ? 'text-ink-subtle' : 'text-ink-subtle/60',
                      )}
                    >
                      {p.jerseyNumber ?? '—'}
                    </span>
                    {/* The name opens the player, and does it in a dialog rather than by
                        navigating.
                        
                        This sheet is an entry form: somebody is typing up twenty lines off a piece
                        of paper, and a link that leaves the page would throw the evening away —
                        the same failure §6.1 of GAME_AND_STANDINGS was written about when a
                        refetch used to wipe the draft. The quick view carries the season line and
                        the last five games without going anywhere, and its own button goes to the
                        full page for anyone who wants it. */}
                    <button
                      type="button"
                      onClick={() => setViewing(p.playerId)}
                      className={cn(
                        'min-w-0 flex-1 truncate text-left text-sm transition-colors hover:text-accent-text hover:underline hover:underline-offset-2',
                        line.played ? 'text-ink' : 'text-ink-subtle',
                      )}
                      title={`Voir les statistiques de ${p.lastName} ${p.firstName}`.trim()}
                    >
                      {p.lastName} <span className="text-ink-muted">{p.firstName}</span>
                    </button>
                    {columns.map((c) => (
                      <input
                        key={c.code}
                        type="text"
                        inputMode="numeric"
                        value={line.stats[c.code] || ''}
                        placeholder={readOnly || !line.played ? '' : '0'}
                        disabled={readOnly || !line.played}
                        onChange={(e) => set(p.playerId, c, e.target.value)}
                        onFocus={(e) => e.target.select()}
                        aria-label={`${c.label} — ${p.lastName}`}
                        className={field}
                      />
                    ))}
                    <span
                      className={cn(
                        'w-9 shrink-0 text-center text-sm font-semibold tabular-nums',
                        total ? 'text-ink' : 'text-ink-subtle',
                      )}
                    >
                      {total || '—'}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        {/* The name that is not on the list yet.
            Clubs here are still recruiting when the season starts, and a youth squad is known on
            the morning of the game — so "this player does not exist in the system" is the normal
            case, not the exception, and it has to be answerable without leaving the sheet. */}
        {!readOnly && (
          <div className="border-t border-line bg-surface-sunk p-2">
            {adding ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  submitNewPlayer();
                }}
                className="space-y-2"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={newPlayer.jerseyNumber}
                    onChange={(e) =>
                      setNewPlayer((n) => ({
                        ...n,
                        jerseyNumber: e.target.value.replace(/\D/g, '').slice(0, 2),
                      }))
                    }
                    placeholder="N°"
                    aria-label="Numéro de maillot"
                    className={cn(newField, 'w-12 text-center tabular-nums')}
                  />
                  <input
                    type="text"
                    autoFocus
                    value={newPlayer.lastName}
                    onChange={(e) => {
                      setNewPlayer((n) => ({ ...n, lastName: e.target.value }));
                      setDuplicates(null);
                    }}
                    placeholder="Nom"
                    aria-label="Nom du joueur"
                    className={cn(newField, 'min-w-0 flex-1')}
                  />
                  <input
                    type="text"
                    value={newPlayer.firstName}
                    onChange={(e) => {
                      setNewPlayer((n) => ({ ...n, firstName: e.target.value }));
                      setDuplicates(null);
                    }}
                    placeholder="Prénom"
                    aria-label="Prénom du joueur"
                    className={cn(newField, 'min-w-0 flex-1')}
                  />
                  <input
                    type="text"
                    value={newPlayer.position}
                    onChange={(e) => setNewPlayer((n) => ({ ...n, position: e.target.value }))}
                    placeholder="Poste"
                    aria-label="Poste du joueur"
                    className={cn(newField, 'w-20')}
                  />
                </div>

                {/* Somebody of this name is already here. The two cases that actually happen —
                    already on this team, or transferred from another one — both have a better
                    answer than a second record, so both are offered before "create anyway". */}
                {duplicates && (
                  <div className="rounded-md border border-caution/40 bg-caution-soft p-2.5">
                    <p className="flex items-start gap-1.5 text-xs text-ink">
                      <AlertTriangle className="mt-px h-3.5 w-3.5 shrink-0 text-caution" aria-hidden />
                      Ce nom existe déjà dans l&apos;organisation.
                    </p>
                    <ul className="mt-2 space-y-1.5">
                      {duplicates.map((d) => (
                        <li
                          key={d.playerId}
                          className="flex flex-wrap items-center gap-2 rounded bg-surface px-2 py-1.5 text-sm"
                        >
                          <span className="min-w-0 flex-1 truncate text-ink">
                            {d.jerseyNumber != null && (
                              <span className="mr-1.5 tabular-nums text-ink-subtle">
                                {d.jerseyNumber}
                              </span>
                            )}
                            {d.lastName} <span className="text-ink-muted">{d.firstName}</span>
                            <span className="ml-1.5 text-xs text-ink-subtle">
                              {d.sameTeam
                                ? '· déjà dans cette équipe'
                                : d.teamName
                                  ? `· ${d.teamName}`
                                  : '· sans équipe'}
                            </span>
                          </span>
                          {!d.sameTeam && (
                            <button
                              type="button"
                              onClick={() => transferHere(d.playerId)}
                              disabled={busy}
                              className="flex shrink-0 items-center gap-1 rounded-md border border-line px-2 py-1 text-xs text-ink-muted transition-colors hover:border-accent hover:text-accent-text disabled:opacity-50"
                            >
                              <ArrowRightLeft className="h-3 w-3" aria-hidden />
                              Transférer ici
                            </button>
                          )}
                        </li>
                      ))}
                    </ul>
                    <button
                      type="button"
                      onClick={() => submitNewPlayer(true)}
                      disabled={busy}
                      className="mt-2 text-xs text-ink-subtle underline underline-offset-2 transition-colors hover:text-ink disabled:opacity-50"
                    >
                      Ce n&apos;est pas la même personne — créer quand même
                    </button>
                  </div>
                )}

                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs text-ink-subtle">
                    Ajouté à l&apos;effectif de {current.name}. Seul le nom est obligatoire.
                  </p>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setAdding(false);
                        setNewPlayer(EMPTY_NEW);
                        setDuplicates(null);
                      }}
                      className="flex h-8 items-center gap-1 rounded-md px-2 text-sm text-ink-muted transition-colors hover:bg-surface hover:text-ink"
                    >
                      <X className="h-3.5 w-3.5" aria-hidden />
                      Terminer
                    </button>
                    <Button
                      type="submit"
                      variant="primary"
                      className="h-8 px-3 text-sm"
                      disabled={!newPlayer.lastName.trim() || busy || !!duplicates}
                      isLoading={addMut.isPending}
                    >
                      Ajouter
                    </Button>
                  </div>
                </div>
              </form>
            ) : (
              <button
                type="button"
                onClick={() => setAdding(true)}
                className="flex w-full items-center justify-center gap-1.5 rounded-md border border-dashed border-line px-3 py-2 text-sm text-ink-muted transition-colors hover:border-accent hover:bg-accent-soft hover:text-accent-text"
              >
                <Plus className="h-4 w-4" aria-hidden />
                Ajouter un joueur à {current.name}
              </button>
            )}
          </div>
        )}
      </div>

      {/* The check the officials do last, in the same words: does the sheet add up to the result
          on record. Skipped entirely where the sport records its result in a different unit from
          the one players accumulate — a check that cries wolf is worse than no check. */}
      {reconciles ? (
        <div
          className={cn(
            'rounded-lg border px-3.5 py-3',
            !hasFinal
              ? 'border-line bg-surface-sunk'
              : matches && anyRecorded
                ? 'border-positive/30 bg-positive-soft'
                : anyRecorded
                  ? 'border-caution/40 bg-caution-soft'
                  : 'border-line bg-surface-sunk',
          )}
        >
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
            <span className="text-ink">
              Total de la feuille{' '}
              <span className="font-semibold tabular-nums">
                {totals.home} – {totals.away}
              </span>
            </span>
            {hasFinal && (
              <span className="text-ink-muted">
                Score final{' '}
                <span className="font-semibold tabular-nums text-ink">
                  {finalHome} – {finalAway}
                </span>
              </span>
            )}
            {hasFinal && matches && anyRecorded && (
              <span className="flex items-center gap-1 text-positive">
                <Check className="h-4 w-4" aria-hidden />
                concordant
              </span>
            )}
            <span className="text-xs text-ink-subtle">
              {appearances} joueur{appearances > 1 ? 's' : ''} sur la feuille
            </span>
          </div>

          {hasFinal && !matches && anyRecorded && (
            <p className="mt-1.5 flex items-start gap-1.5 text-xs text-ink">
              <AlertTriangle className="mt-px h-3.5 w-3.5 shrink-0 text-caution" aria-hidden />
              Écart de {Math.abs(totals.home - (finalHome ?? 0))} et{' '}
              {Math.abs(totals.away - (finalAway ?? 0))} points. La feuille est enregistrée telle
              quelle — c&apos;est au classement de rester fidèle au score final, et à vous de dire
              lequel des deux est faux.
            </p>
          )}

          {!hasFinal && anyRecorded && !readOnly && (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <p className="text-xs text-ink-muted">Aucun score final n&apos;est enregistré.</p>
              <button
                type="button"
                onClick={adoptAsFinalScore}
                disabled={busy}
                className="rounded-md bg-accent px-2.5 py-1 text-xs font-medium text-accent-ink transition-colors hover:bg-accent/90 disabled:opacity-50"
              >
                Utiliser {totals.home} – {totals.away} comme score final
              </button>
            </div>
          )}
        </div>
      ) : (
        anyRecorded && (
          <p className="rounded-lg border border-line bg-surface-sunk px-3.5 py-3 text-sm text-ink">
            Total de la feuille{' '}
            <span className="font-semibold tabular-nums">
              {totals.home} – {totals.away}
            </span>
            <span className="ml-2 text-xs text-ink-subtle">
              Le résultat de ce sport ne se compte pas dans la même unité, il n&apos;y a donc rien
              à rapprocher.
            </span>
          </p>
        )
      )}

      {data.recorded && !readOnly && (
        <div>
          <Label htmlFor="bs-reason">Raison de la correction</Label>
          <input
            id="bs-reason"
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            maxLength={300}
            placeholder="Feuille corrigée par les officiels…"
            className="mt-1 h-9 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink transition-colors hover:border-line-strong focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>
      )}

      {!readOnly && (
        <p className="flex items-start gap-1.5 text-xs text-ink-subtle">
          <Info className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden />
          {describeTotal(columns, data.totalLabel)} Décochez un joueur qui n&apos;a pas pris part au
          match ; ceux qui restent cochés figurent sur la feuille même sans statistique.
        </p>
      )}

      {/* Pinned by the containing dialog when it can; rendered here otherwise, which is the case
          on the match page where the sheet is simply part of the page. */}
      {!renderFooter && <div className="border-t border-line pt-4">{footer}</div>}

      {/* Over the sheet, not instead of it. Nothing typed is lost. */}
      {viewing && (
        <PlayerQuickView playerId={viewing} onOpenChange={(o) => !o && setViewing(null)} />
      )}
    </div>
  );
}

/**
 * The scoring rule, in words, built from the same columns the table is.
 *
 * It used to be the sentence "les points sont calculés : 3 × trois points + 2 × deux points +
 * lancers francs", typed out by hand — which stops being true the moment a sport with different
 * weights opens this screen, and a stale explanation of an arithmetic rule is worse than none.
 */
function describeTotal(columns: StatColumn[], totalLabel: string): string {
  const scoring = columns.filter((c) => c.weight !== 0);
  if (scoring.length === 0) return '';
  const parts = scoring.map((c) => (c.weight === 1 ? c.abbr : `${c.weight} × ${c.abbr}`));
  return `${totalLabel} = ${parts.join(' + ')}.`;
}
