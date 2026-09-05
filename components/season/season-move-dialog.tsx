'use client';

import React, { useEffect, useState } from 'react';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Label,
  TextArea,
} from '@/components/ui';
import { SeasonStatus } from '@/schemas';
import { useTransitionSeason, type SeasonRow } from '@/services/seasons';
import { toastApiError } from '@/utils';
import { toast } from 'sonner';

export interface SeasonMove {
  to: SeasonStatus;
  /** The verb, on the button. */
  label: string;
  /** What this costs, in a few words. Shown before the move, not after. */
  consequence: string;
  /** What happened, once it has. A confirmation is a statement, not the verb repeated back. */
  done: string;
  needsReason: boolean;
  tone: 'primary' | 'danger' | 'default';
}

/**
 * One move of a season, and the reason it owes whoever it costs.
 *
 * Closing a season stops a club's result being recorded; cancelling one voids a table; reopening
 * one changes a classification the competition has already signed and published. The reason is
 * required by the server for all three and it lands on the audit row, so the secretary answering a
 * club three weeks later has a sentence to repeat rather than an enum.
 *
 * Opening a season is the exception and asks for nothing: it costs nobody anything and it is the
 * move the product performs on its own the moment a first result arrives.
 */
export function SeasonMoveDialog({
  open,
  onClose,
  season,
  move,
}: {
  open: boolean;
  onClose: () => void;
  season: SeasonRow | null;
  move: SeasonMove | null;
}) {
  const [reason, setReason] = useState('');
  const transition = useTransitionSeason();

  useEffect(() => {
    if (open) setReason('');
  }, [open, move?.to]);

  if (!season || !move) return null;

  const tooShort = move.needsReason && reason.trim().length < 3;

  async function submit() {
    if (!season || !move) return;
    try {
      await transition.mutateAsync({
        id: season.id,
        status: move.to,
        reason: reason.trim() || undefined,
      });
      toast.success(`« ${season.name} » ${move.done}.`);
      onClose();
    } catch (err) {
      toastApiError(err, 'Ce changement n’a pas pu être enregistré.');
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{move.label}</DialogTitle>
          <DialogDescription>
            {season.name} — {move.consequence}
          </DialogDescription>
        </DialogHeader>

        {move.needsReason && (
          <div className="space-y-1.5">
            <Label htmlFor="season-move-reason">Raison</Label>
            <TextArea
              id="season-move-reason"
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Fin de la saison sportive 2026-2027"
              autoFocus
            />
            <p className="text-xs text-ink-muted">
              Conservée dans l’historique de la saison, avec votre nom et la date.
            </p>
          </div>
        )}

        <DialogFooter>
          <Button variant="secondary" onClick={onClose} disabled={transition.isPending}>
            Annuler
          </Button>
          <Button
            variant={move.tone === 'danger' ? 'danger' : 'primary'}
            onClick={submit}
            disabled={tooShort || transition.isPending}
          >
            {transition.isPending ? 'Enregistrement…' : move.label}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
