'use client';

import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { AlertTriangle, Check, Info, Loader2 } from 'lucide-react';
import { Button, Label, Modal } from '@/components/ui';
import { toastApiError } from '@/utils';
import type { CalendarEntry } from '@/services/calendar';
import { pointsOf, useBoxScore, useSaveBoxScore, type BoxScoreLine } from '@/services/box-score';
import { useReportScore } from '@/services/games';
import { cn } from '@/utils';

/**
 * The scoresheet, typed up.
 *
 * This is the second act of entering a result, never the first. The fast path is two numbers in
 * the score dialog, because most of what the community manager receives is "87-70" in a WhatsApp
 * message and he enters a weekend of them in a sitting. This screen is for the evenings when he
 * has the officials' sheet — or a photograph of it — in front of him.
 *
 * So it is laid out like that sheet rather than like a form: every eligible player on one line,
 * in shirt-number order, three columns of baskets, and the points column computed. He works down
 * the paper and across the screen, and never has to search for a name.
 *
 * **The reconciliation is the point.** The paper has a running score down its side and a final
 * score at the bottom, and the officials' last act is checking the two agree. That check is what
 * this reproduces: the sum of the lines against the score on record, stated plainly, with the
 * difference named when there is one. Saving never silently rewrites the final score — a box
 * score that disagrees is the signal that something was mistyped, and quietly reconciling it
 * would destroy the only evidence.
 */

type Draft = Record<string, { threePointers: number; twoPointers: number; freeThrows: number }>;

const COLUMNS = [
  { key: 'threePointers' as const, label: '3 pts', hint: 'Paniers à trois points' },
  { key: 'twoPointers' as const, label: '2 pts', hint: 'Paniers à deux points' },
  { key: 'freeThrows' as const, label: 'LF', hint: 'Lancers francs' },
];

export function BoxScoreDialog({
  open,
  onClose,
  entry,
}: {
  open: boolean;
  onClose: () => void;
  entry: CalendarEntry | null;
}) {
  const [side, setSide] = useState<'home' | 'away'>('home');
  const [draft, setDraft] = useState<Draft>({});
  const [reason, setReason] = useState('');

  const box = useBoxScore(entry?.id, open);
  const saveMut = useSaveBoxScore();
  const scoreMut = useReportScore();

  // Seeded from the server each time it opens, so a sheet corrected elsewhere is not overwritten
  // by whatever this dialog was last holding.
  useEffect(() => {
    if (!open || !box.data) return;
    const next: Draft = {};
    for (const s of [box.data.home, box.data.away]) {
      for (const p of s.players) {
        next[p.playerId] = {
          threePointers: p.threePointers,
          twoPointers: p.twoPointers,
          freeThrows: p.freeThrows,
        };
      }
    }
    setDraft(next);
    setSide('home');
    setReason('');
  }, [open, box.data]);

  const current = box.data ? box.data[side] : null;

  /** Totals from the draft, not from the server: the reconciliation has to move as you type. */
  const totals = useMemo(() => {
    const sum = (players: { playerId: string }[]) =>
      players.reduce((t, p) => t + pointsOf(draft[p.playerId] ?? { threePointers: 0, twoPointers: 0, freeThrows: 0 }), 0);
    return {
      home: box.data ? sum(box.data.home.players) : 0,
      away: box.data ? sum(box.data.away.players) : 0,
    };
  }, [draft, box.data]);

  if (!entry) return null;

  const finalHome = box.data?.home.finalScore ?? null;
  const finalAway = box.data?.away.finalScore ?? null;
  const hasFinal = finalHome !== null && finalAway !== null;
  const anyRecorded = totals.home > 0 || totals.away > 0;
  const matches = hasFinal && totals.home === finalHome && totals.away === finalAway;

  function set(playerId: string, key: keyof Draft[string], raw: string) {
    // Digits only, capped: the field is copied from paper, and a stray letter or a slipped zero
    // should not become a 4000-point game.
    const value = Math.max(0, Math.min(99, Number(raw.replace(/\D/g, '')) || 0));
    setDraft((prev) => {
      const line = prev[playerId] ?? { threePointers: 0, twoPointers: 0, freeThrows: 0 };
      return { ...prev, [playerId]: { ...line, [key]: value } };
    });
  }

  function save() {
    if (!entry) return;
    const lines: BoxScoreLine[] = Object.entries(draft)
      .filter(([, s]) => s.threePointers || s.twoPointers || s.freeThrows)
      .map(([playerId, s]) => ({ playerId, ...s }));

    saveMut.mutate(
      { gameId: entry.id, lines, ...(box.data?.recorded && reason.trim() ? { reason: reason.trim() } : {}) },
      {
        onSuccess: () => {
          toast.success(lines.length ? 'Feuille de match enregistrée.' : 'Feuille de match vidée.');
          onClose();
        },
        onError: (e) => toastApiError(e),
      },
    );
  }

  /** Offered only when there is no result yet — it records one, it never overwrites one. */
  function adoptAsFinalScore() {
    if (!entry) return;
    scoreMut.mutate(
      { gameId: entry.id, homeScore: totals.home, awayScore: totals.away },
      {
        onSuccess: () => toast.success('Score final enregistré depuis la feuille.'),
        onError: (e) => toastApiError(e),
      },
    );
  }

  const busy = saveMut.isPending || scoreMut.isPending;
  const field =
    // Narrower on a phone, where every pixel taken from the field is a pixel of the player's
    // name — and a name truncated to "Kaserek…" is one the operator has to decode.
    'h-9 w-10 sm:w-11 rounded-md border border-line bg-surface text-center text-sm tabular-nums text-ink ' +
    'transition-colors focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent ' +
    '[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none';

  return (
    <Modal
      open={open}
      onOpenChange={(next) => !next && onClose()}
      title="Feuille de match"
      className="max-w-3xl"
    >
      <div className="space-y-4">
        <p className="-mt-2 text-sm text-ink-muted">
          {entry.home.name} <span className="text-ink-subtle">—</span> {entry.away.name}
        </p>

        {box.isPending ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-5 w-5 animate-spin text-ink-subtle" aria-hidden />
          </div>
        ) : !box.data ? (
          <p className="py-8 text-center text-sm text-ink-muted">
            La feuille n&apos;a pas pu être chargée.
          </p>
        ) : (
          <>
            {/* One team at a time. Two rosters side by side is the paper's layout and the wrong
                one for a phone, where it would give each column about forty pixels. */}
            <div className="flex rounded-lg border border-line bg-surface p-0.5">
              {(['home', 'away'] as const).map((s) => {
                const team = box.data![s];
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSide(s)}
                    aria-pressed={side === s}
                    className={cn(
                      'flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                      side === s ? 'bg-accent text-accent-ink' : 'text-ink-muted hover:text-ink',
                    )}
                  >
                    <span className="truncate">{team.name}</span>
                    <span className="shrink-0 tabular-nums opacity-80">{totals[s]}</span>
                  </button>
                );
              })}
            </div>

            {current && current.players.length === 0 ? (
              <p className="rounded-lg border border-dashed border-line px-4 py-8 text-center text-sm text-ink-muted">
                Cette équipe n&apos;a pas encore de joueurs. Ajoutez son effectif pour saisir une
                feuille de match.
              </p>
            ) : (
              <div className="overflow-hidden rounded-lg border border-line">
                <div className="flex items-center gap-2 border-b border-line bg-surface-sunk px-2 py-1.5 text-[0.6875rem] font-medium uppercase tracking-wide text-ink-subtle">
                  <span className="w-7 shrink-0 text-center">N°</span>
                  <span className="min-w-0 flex-1">Joueur</span>
                  {COLUMNS.map((c) => (
                    <span key={c.key} className="w-10 shrink-0 text-center sm:w-11" title={c.hint}>
                      {c.label}
                    </span>
                  ))}
                  <span className="w-8 shrink-0 text-center sm:w-9">Pts</span>
                </div>

                <ul className="divide-y divide-line">
                  {current?.players.map((p) => {
                    const line = draft[p.playerId] ?? {
                      threePointers: 0,
                      twoPointers: 0,
                      freeThrows: 0,
                    };
                    const pts = pointsOf(line);
                    return (
                      <li key={p.playerId} className="flex items-center gap-2 bg-surface px-2 py-1.5">
                        <span className="w-7 shrink-0 text-center text-xs tabular-nums text-ink-subtle">
                          {p.jerseyNumber ?? '—'}
                        </span>
                        <span className="min-w-0 flex-1 truncate text-sm text-ink">
                          {p.lastName}{' '}
                          <span className="text-ink-muted">{p.firstName}</span>
                        </span>
                        {COLUMNS.map((c) => (
                          <input
                            key={c.key}
                            type="text"
                            inputMode="numeric"
                            value={line[c.key] || ''}
                            placeholder="0"
                            onChange={(e) => set(p.playerId, c.key, e.target.value)}
                            onFocus={(e) => e.target.select()}
                            aria-label={`${c.hint} — ${p.lastName}`}
                            className={field}
                          />
                        ))}
                        <span
                          className={cn(
                            'w-8 shrink-0 text-center text-sm font-semibold tabular-nums sm:w-9',
                            pts ? 'text-ink' : 'text-ink-subtle',
                          )}
                        >
                          {pts || '—'}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            {/* The check the officials do last, in the same words: does the sheet add up to the
                result on record. */}
            <div
              className={cn(
                'rounded-lg border px-3.5 py-3',
                !hasFinal
                  ? 'border-line bg-surface-sunk'
                  : matches
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
                {hasFinal && matches && (
                  <span className="flex items-center gap-1 text-positive">
                    <Check className="h-4 w-4" aria-hidden />
                    concordant
                  </span>
                )}
              </div>

              {hasFinal && !matches && anyRecorded && (
                <p className="mt-1.5 flex items-start gap-1.5 text-xs text-ink">
                  <AlertTriangle className="mt-px h-3.5 w-3.5 shrink-0 text-caution" aria-hidden />
                  Écart de {Math.abs(totals.home - (finalHome ?? 0))} et{' '}
                  {Math.abs(totals.away - (finalAway ?? 0))} points. La feuille est enregistrée
                  telle quelle — c&apos;est au classement de rester fidèle au score final, et à
                  vous de dire lequel des deux est faux.
                </p>
              )}

              {!hasFinal && anyRecorded && (
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

            {box.data.recorded && (
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

            <p className="flex items-start gap-1.5 text-xs text-ink-subtle">
              <Info className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden />
              Les points sont calculés : 3 × trois points + 2 × deux points + lancers francs. Un
              joueur laissé à zéro n&apos;apparaît pas dans la feuille.
            </p>

            <div className="flex justify-end gap-2 border-t border-line pt-4">
              <Button variant="outline" onClick={onClose} disabled={busy}>
                Fermer
              </Button>
              <Button variant="primary" onClick={save} isLoading={saveMut.isPending} disabled={busy}>
                Enregistrer
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
