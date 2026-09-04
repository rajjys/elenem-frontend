'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { AlertTriangle } from 'lucide-react';
import { Button, Label, Modal } from '@/components/ui';
import { toastApiError, cn } from '@/utils';
import {
  useDeleteGame,
  useGameStateChange,
  useInvertGame,
  type StateVerb,
} from '@/services/games';

/**
 * One decision about a fixture, asked one at a time.
 *
 * On the calendar these live together inside "Déplacer, reporter, supprimer…", and that is right
 * *there*: the day panel is 22rem wide and every one of them is a rare, deliberate act reached
 * while reading a month. On the match's own page it is wrong. Postponing a fixture, cancelling it
 * and deleting it are three different things with three different consequences — one keeps the
 * match and loses its date, one keeps the record and voids the result, one removes it from the
 * season — and stacking them behind a single ellipsis makes the page look like a shortcut to the
 * calendar instead of the place the decision is taken.
 *
 * So the page lists them separately and each opens this: the consequence stated in a sentence, and
 * the reason, which is what the club turning up on the wrong day is actually owed.
 */

export type GameAction = 'postpone' | 'cancel' | 'delete' | 'invert' | 'confirm' | 'schedule';

interface Spec {
  title: string;
  /** What this actually does, in the words of somebody it will happen to. */
  consequence: string;
  confirm: string;
  /** Whether the reason is required. The server demands one for postpone and cancel. */
  reasonRequired: boolean;
  placeholder: string;
  danger?: boolean;
}

const SPECS: Record<GameAction, Spec> = {
  postpone: {
    title: 'Reporter le match',
    consequence:
      'Le match reste au calendrier mais perd sa date. Il faudra le reprogrammer pour qu’il compte au classement.',
    confirm: 'Reporter',
    reasonRequired: true,
    placeholder: 'Salle indisponible, équipe bloquée en route…',
  },
  cancel: {
    title: 'Annuler le match',
    consequence:
      'Le match ne sera pas joué. Il reste visible au calendrier, marqué annulé, et ne compte pas au classement.',
    confirm: 'Annuler le match',
    reasonRequired: true,
    placeholder: 'Forfait des deux équipes, compétition interrompue…',
    danger: true,
  },
  delete: {
    title: 'Supprimer le match',
    consequence:
      'Le match disparaît du calendrier et de la saison. À n’utiliser que pour un match saisi par erreur — un match qui n’a pas été joué se reporte ou s’annule.',
    confirm: 'Supprimer',
    reasonRequired: false,
    placeholder: 'Saisi deux fois, mauvaise compétition…',
    danger: true,
  },
  invert: {
    title: 'Inverser domicile et visiteur',
    consequence:
      'Les deux équipes échangent leur rôle. C’est le même match, saisi dans le mauvais sens — refusé une fois qu’un score existe.',
    confirm: 'Inverser',
    reasonRequired: false,
    placeholder: 'Saisi à l’envers…',
  },
  confirm: {
    title: 'Confirmer le match',
    consequence: 'La date et la salle sont arrêtées. Les clubs peuvent s’organiser dessus.',
    confirm: 'Confirmer',
    reasonRequired: false,
    placeholder: '',
  },
  schedule: {
    title: 'Reprogrammer le match',
    consequence:
      'Le match repasse au statut programmé. Vérifiez sa date : c’est elle qui décide de la journée à laquelle il comptera.',
    confirm: 'Reprogrammer',
    reasonRequired: false,
    placeholder: 'Nouvelle date convenue…',
  },
};

export function GameActionDialog({
  action,
  gameId,
  matchup,
  onClose,
  onDeleted,
}: {
  /** `null` closes it. */
  action: GameAction | null;
  gameId: string;
  /** "VIR – MUU", so the dialog names what it is about. */
  matchup: string;
  onClose: () => void;
  /** A deleted fixture has no page to return to. */
  onDeleted?: () => void;
}) {
  const [reason, setReason] = useState('');

  const stateMut = useGameStateChange();
  const deleteMut = useDeleteGame();
  const invertMut = useInvertGame();

  useEffect(() => {
    if (action) setReason('');
  }, [action]);

  if (!action) return null;
  const spec = SPECS[action];
  const busy = stateMut.isPending || deleteMut.isPending || invertMut.isPending;
  const ready = !spec.reasonRequired || reason.trim().length > 0;

  function run() {
    if (!ready || !action) return;
    const trimmed = reason.trim();
    const done = (message: string) => () => {
      toast.success(message);
      onClose();
    };
    const fail = (e: unknown) => toastApiError(e);

    if (action === 'delete') {
      deleteMut.mutate(
        { gameId, ...(trimmed ? { reason: trimmed } : {}) },
        {
          onSuccess: () => {
            toast.success('Match supprimé.');
            onClose();
            onDeleted?.();
          },
          onError: fail,
        },
      );
      return;
    }

    if (action === 'invert') {
      invertMut.mutate(
        { gameId, ...(trimmed ? { reason: trimmed } : {}) },
        { onSuccess: done('Domicile et visiteur inversés.'), onError: fail },
      );
      return;
    }

    const labels: Record<string, string> = {
      postpone: 'Match reporté.',
      cancel: 'Match annulé.',
      confirm: 'Match confirmé.',
      schedule: 'Match reprogrammé.',
    };
    stateMut.mutate(
      { gameId, verb: action as StateVerb, ...(trimmed ? { reason: trimmed } : {}) },
      { onSuccess: done(labels[action]), onError: fail },
    );
  }

  return (
    <Modal
      open
      onOpenChange={(next) => !next && onClose()}
      title={spec.title}
      className="max-w-md"
      footer={
        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={busy}>
            Fermer
          </Button>
          <Button
            variant={spec.danger ? 'danger' : 'primary'}
            onClick={run}
            disabled={!ready || busy}
            isLoading={busy}
            title={ready ? undefined : 'Indiquez la raison'}
          >
            {spec.confirm}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <p className="text-sm font-medium text-ink">{matchup}</p>

        <p
          className={cn(
            'flex items-start gap-2 rounded-lg border px-3.5 py-3 text-sm',
            spec.danger
              ? 'border-negative/30 bg-negative-soft text-ink'
              : 'border-line bg-surface-sunk text-ink-muted',
          )}
        >
          {spec.danger && (
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-negative" aria-hidden />
          )}
          {spec.consequence}
        </p>

        {spec.placeholder && (
          <div>
            <Label htmlFor="ga-reason">
              Raison{spec.reasonRequired ? '' : ' (facultative)'}
            </Label>
            <input
              id="ga-reason"
              type="text"
              autoFocus
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={300}
              placeholder={spec.placeholder}
              className="mt-1 h-9 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink transition-colors hover:border-line-strong focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            />
            <p className="mt-1.5 text-xs text-ink-subtle">
              Elle reste dans l&apos;historique du match. « Reporté » ne dit rien à un club ;
              « la salle était prise » lui dit tout.
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
}
