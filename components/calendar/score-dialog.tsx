'use client';

import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Flag, Info } from 'lucide-react';
import { Button, Label, Modal } from '@/components/ui';
import { toastApiError } from '@/utils';
import type { CalendarEntry } from '@/services/calendar';
import { useReportScore } from '@/services/games';
import { cn } from '@/utils';

/**
 * The final score, in as few taps as possible.
 *
 * Its own dialog rather than a section of the fixture editor, because it is a different job.
 * Placing a match is deliberate and occasional; entering results is a batch — at LIPROBAKIN one
 * community manager receives a weekend of scores, either as a photo of the officials' sheet or
 * as a plain final score in a message, and sits down to type all of them. So this opens straight
 * onto two number fields with the first one focused, and closes on Enter.
 *
 * It also *corrects*. Until now the server refused to touch a completed game — a guard around an
 * accumulator that would have counted it twice — which left a mistyped score authoritative for
 * ever. On a product whose entire claim is that the numbers are not disputed, that was the worst
 * possible failure: wrong and unarguable at the same time. Correcting is now the same call, with
 * a reason attached, and the season table is rebuilt from the games rather than nudged.
 */

export function ScoreDialog({
  open,
  onClose,
  entry,
}: {
  open: boolean;
  onClose: () => void;
  entry: CalendarEntry | null;
}) {
  const [home, setHome] = useState('');
  const [away, setAway] = useState('');
  const [forfeit, setForfeit] = useState(false);
  const [reason, setReason] = useState('');
  const homeRef = useRef<HTMLInputElement>(null);

  const scoreMut = useReportScore();
  const correcting = !!entry && entry.homeScore != null;

  useEffect(() => {
    if (!open || !entry) return;
    setHome(entry.homeScore != null ? String(entry.homeScore) : '');
    setAway(entry.awayScore != null ? String(entry.awayScore) : '');
    setForfeit(false);
    setReason('');
    // Focused on open: the whole point is that the next thing the operator does is type a number.
    const t = setTimeout(() => homeRef.current?.select(), 60);
    return () => clearTimeout(t);
  }, [open, entry]);

  if (!entry) return null;

  const valid = home !== '' && away !== '' && Number(home) >= 0 && Number(away) >= 0;

  function submit() {
    if (!valid || !entry) return;
    scoreMut.mutate(
      {
        gameId: entry.id,
        homeScore: Number(home),
        awayScore: Number(away),
        ...(forfeit ? { isForfeit: true } : {}),
        ...(correcting && reason.trim() ? { reason: reason.trim() } : {}),
      },
      {
        onSuccess: () => {
          toast.success(correcting ? 'Score corrigé.' : 'Score enregistré.');
          onClose();
        },
        onError: (e) => toastApiError(e),
      },
    );
  }

  // The spinner arrows are removed: they are unusable at courtside, they eat the width the
  // clubs' names need, and nobody nudges a basketball score one point at a time.
  const field =
    'h-16 w-20 rounded-lg border border-line bg-surface text-center text-3xl font-bold tabular-nums text-ink ' +
    'transition-colors hover:border-line-strong focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent ' +
    '[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none';

  return (
    <Modal
      open={open}
      onOpenChange={(next) => !next && onClose()}
      title={correcting ? 'Corriger le score' : 'Saisir le score'}
      className="max-w-lg"
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="space-y-5"
      >
        {/* Two names either side of the two numbers, which is how a result is read and how the
            paper sheet in front of the operator is laid out. */}
        <div className="flex items-center gap-2.5">
          <div className="min-w-0 flex-1 text-right">
            <p className="truncate text-sm font-semibold text-ink">{entry.home.name}</p>
            <p className="text-xs text-ink-subtle">domicile</p>
          </div>
          <input
            ref={homeRef}
            type="number"
            inputMode="numeric"
            min={0}
            value={home}
            onChange={(e) => setHome(e.target.value)}
            aria-label={`Score de ${entry.home.name}`}
            className={field}
          />
          <span className="text-xl text-ink-subtle" aria-hidden>
            –
          </span>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            value={away}
            onChange={(e) => setAway(e.target.value)}
            aria-label={`Score de ${entry.away.name}`}
            className={field}
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-ink">{entry.away.name}</p>
            <p className="text-xs text-ink-subtle">extérieur</p>
          </div>
        </div>

        {/* A forfeit is not a heavy loss, it is a different outcome — LIPROBAKIN give a point for
            a loss and nothing for a forfeit, so this checkbox is worth a point in the table. */}
        <label
          className={cn(
            'flex cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2.5 transition-colors',
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

        {correcting && (
          <div>
            <Label htmlFor="sc-reason">Raison de la correction</Label>
            <input
              id="sc-reason"
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={300}
              placeholder="Erreur de saisie, feuille corrigée…"
              className="mt-1 h-9 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink transition-colors hover:border-line-strong focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            />
            <p className="mt-1.5 flex items-start gap-1.5 text-xs text-ink-subtle">
              <Info className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden />
              Le classement est recalculé et la correction reste dans l’historique du match.
            </p>
          </div>
        )}

        <div className="flex justify-end gap-2 border-t border-line pt-4">
          <Button type="button" variant="outline" onClick={onClose} disabled={scoreMut.isPending}>
            Annuler
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={!valid || scoreMut.isPending}
            isLoading={scoreMut.isPending}
          >
            {correcting ? 'Corriger' : 'Enregistrer'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
