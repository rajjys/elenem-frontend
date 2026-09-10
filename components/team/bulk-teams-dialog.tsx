'use client';

import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { Button, Label, Modal, SelectField } from '@/components/ui';
import { useStandingsLeagues } from '@/services/standings';
import { useCreateTeamsBulk, type BulkTeamResult } from '@/services/setup';
import { teamKeys } from '@/services/teams';
import { useQueryClient } from '@tanstack/react-query';
import {
  TeamRowsEditor,
  emptyRows,
  filledRows,
  type EditableTeamRow,
} from '@/components/onboarding/team-rows-editor';

/**
 * A season's entry list, in one go.
 *
 * The same editor onboarding uses, on the clubs list, because it is the same act: a competition's
 * clubs arrive as a *list* — a WhatsApp message, a photographed page — far more often than one at a
 * time, and typing sixteen of them through a three-step form is how an evening disappears.
 *
 * It sits beside « Nouveau club » rather than replacing it: both ways in are real, so both are on
 * the header, the way the roster offers « Nouveau joueur » and « Ajouter une liste ».
 *
 * **Partial success is reported, not swallowed.** `useCreateTeamsBulk` posts one club at a time and
 * collects what failed, because a list of sixteen with one duplicate name should register fifteen
 * and say which one it could not — not roll the lot back and leave the organiser to work out why.
 */
export function BulkTeamsDialog({
  open,
  onOpenChange,
  leagueId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Pinned when the screen is already inside one competition. */
  leagueId?: string;
}) {
  const qc = useQueryClient();
  const [rows, setRows] = useState<EditableTeamRow[]>(() => emptyRows());
  const [pickedLeague, setPickedLeague] = useState('');
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [result, setResult] = useState<BulkTeamResult | null>(null);

  useEffect(() => {
    if (!open) return;
    setRows(emptyRows());
    setPickedLeague(leagueId ?? '');
    setProgress(null);
    setResult(null);
  }, [open, leagueId]);

  const leagues = useStandingsLeagues(open && !leagueId);
  const leagueOptions = useMemo(() => leagues.data?.data ?? [], [leagues.data]);
  const needsLeaguePicker = !leagueId && leagueOptions.length > 1;

  const bulk = useCreateTeamsBulk();
  const ready = filledRows(rows);
  /**
   * Which competition these clubs join.
   *
   * `??` was wrong here: `pickedLeague` starts as the empty string, which is not nullish, so it
   * short-circuited the fallback and the form sat permanently disabled with a picker showing
   * « Choisir une compétition ». When the picker is on screen a choice is genuinely required;
   * when it is not, there is exactly one competition and it is the answer.
   */
  const effectiveLeagueId = leagueId || pickedLeague || (needsLeaguePicker ? '' : leagueOptions[0]?.id ?? '');
  const canSubmit = ready.length > 0 && !!effectiveLeagueId && !bulk.isPending;

  const submit = () => {
    if (!canSubmit) return;
    setProgress({ done: 0, total: ready.length });
    bulk.mutate(
      {
        rows: ready,
        leagueId: effectiveLeagueId,
        onProgress: (done, total) => setProgress({ done, total }),
      },
      {
        onSuccess: (res) => {
          setProgress(null);
          qc.invalidateQueries({ queryKey: teamKeys.all });
          if (res.failed.length === 0) {
            toast.success(
              `${res.created.length} club${res.created.length > 1 ? 's' : ''} inscrit${res.created.length > 1 ? 's' : ''}.`,
            );
            onOpenChange(false);
            return;
          }
          // Something did not go in. The dialog stays open holding the reason, because a toast
          // that disappears is not where you put a list of what to fix.
          setResult(res);
        },
        onError: () => setProgress(null),
      },
    );
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Ajouter une liste de clubs"
      className="max-w-2xl"
      footer={
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs text-ink-subtle">
            {progress
              ? `${progress.done} / ${progress.total}…`
              : ready.length > 0
                ? `${ready.length} club${ready.length > 1 ? 's' : ''} à inscrire`
                : ''}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={bulk.isPending}>
              {result ? 'Fermer' : 'Annuler'}
            </Button>
            <Button
              variant="primary"
              onClick={submit}
              disabled={!canSubmit}
              isLoading={bulk.isPending}
            >
              Inscrire
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-4 pb-2">
        {needsLeaguePicker && (
          <div>
            <Label htmlFor="bulk-league">Compétition</Label>
            <SelectField
              id="bulk-league"
              label="Compétition"
              placeholder="Choisir une compétition"
              value={pickedLeague}
              onChange={setPickedLeague}
              className="w-full"
              options={leagueOptions.map((l) => ({ value: l.id, label: l.name }))}
            />
          </div>
        )}

        {result && result.failed.length > 0 && (
          <div className="rounded-lg border border-caution/40 bg-caution-soft px-3.5 py-3 text-sm">
            <p className="flex items-center gap-2 font-medium text-ink">
              <AlertTriangle className="h-4 w-4 shrink-0 text-caution" aria-hidden />
              {result.created.length} inscrit{result.created.length > 1 ? 's' : ''},{' '}
              {result.failed.length} refusé{result.failed.length > 1 ? 's' : ''}
            </p>
            <ul className="mt-1.5 space-y-0.5 text-xs text-ink-muted">
              {result.failed.map((f) => (
                <li key={f.name}>
                  <span className="font-medium text-ink">{f.name}</span> — {f.error}
                </li>
              ))}
            </ul>
          </div>
        )}

        {bulk.isPending && (
          <p className="flex items-center gap-2 text-sm text-ink-muted">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            Inscription en cours…
          </p>
        )}

        <TeamRowsEditor rows={rows} onChange={setRows} />
      </div>
    </Modal>
  );
}
