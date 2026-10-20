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
  SelectField,
  ConfirmDialog,
  Label,
} from '@/components/ui';
import { useDeletePlannedFixture, usePromotePlannedFixture } from '@/services/planned-fixtures';
import { useLeagueTeams } from '@/services/teams-lite';
import type { CalendarEntry } from '@/services/calendar';
import { toastApiError } from '@/utils';
import { toast } from 'sonner';

/**
 * Naming the two teams of a bracket fixture, which is the only verb a placeholder has.
 *
 * Two selects and nothing else. It already has its day, its hour and its hall — reserving them
 * three weeks before the semi-finals are played is the whole reason it exists — so this moment
 * only has to answer the question that was open.
 *
 * Once it is answered the placeholder is gone and an ordinary fixture stands in its place, with an
 * ordinary slug, a scoresheet and a state machine.
 */
export function PromoteDialog({
  open,
  onClose,
  entry,
  leagueId,
}: {
  open: boolean;
  onClose: () => void;
  entry: CalendarEntry | null;
  leagueId?: string;
}) {
  const promote = usePromotePlannedFixture();
  const drop = useDeletePlannedFixture();
  const [dropping, setDropping] = useState(false);
  const [dropReason, setDropReason] = useState('');
  const teams = useLeagueTeams(leagueId);
  const [homeTeamId, setHomeTeamId] = useState('');
  const [awayTeamId, setAwayTeamId] = useState('');

  useEffect(() => {
    if (open) {
      setHomeTeamId('');
      setAwayTeamId('');
      setDropReason('');
    }
  }, [open, entry?.id]);

  if (!entry) return null;

  const options = (teams.data ?? []).map((t) => ({ value: t.id, label: t.name }));
  const invalid = !homeTeamId || !awayTeamId || homeTeamId === awayTeamId;

  async function submit() {
    if (!entry || invalid) return;
    try {
      await promote.mutateAsync({ id: entry.id, homeTeamId, awayTeamId });
      toast.success('Les équipes sont désignées — la rencontre est au calendrier.');
      onClose();
    } catch (err) {
      toastApiError(err, 'Les équipes n’ont pas pu être désignées.');
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Désigner les équipes</DialogTitle>
          <DialogDescription>
            {entry.home.name} — {entry.away.name}. La date, l’heure et la salle sont déjà réservées.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <SelectField
            label="Équipe à domicile"
            placeholder="Choisir"
            value={homeTeamId}
            onChange={setHomeTeamId}
            options={options}
          />
          <SelectField
            label="Visiteur"
            placeholder="Choisir"
            value={awayTeamId}
            onChange={setAwayTeamId}
            options={options.filter((o) => o.value !== homeTeamId)}
          />
        </div>

        <DialogFooter>
          {/* The one way to drop a placeholder: the API had the route, nothing called it. */}
          <Button
            variant="ghost"
            className="mr-auto text-negative"
            onClick={() => setDropping(true)}
            disabled={promote.isPending}
          >
            Supprimer
          </Button>
          <Button variant="secondary" onClick={onClose} disabled={promote.isPending}>
            Annuler
          </Button>
          <Button variant="primary" onClick={submit} disabled={invalid || promote.isPending}>
            {promote.isPending ? 'Enregistrement…' : 'Créer la rencontre'}
          </Button>
        </DialogFooter>
      </DialogContent>

      <ConfirmDialog
        open={dropping}
        onOpenChange={setDropping}
        tone="danger"
        title="Supprimer cette rencontre à définir ?"
        description={`« ${entry.home.name} — ${entry.away.name} » quitte le calendrier, et sa salle est libérée. Aucun match n’est touché.`}
        confirmLabel="Supprimer"
        onConfirm={() =>
          drop.mutateAsync({ id: entry.id, reason: dropReason }).then(() => {
            toast.success('Rencontre à définir supprimée.');
            onClose();
          })
        }
      >
        <div>
          <Label htmlFor="drop-reason">Raison (facultative)</Label>
          <input
            id="drop-reason"
            type="text"
            value={dropReason}
            onChange={(e) => setDropReason(e.target.value)}
            maxLength={300}
            placeholder="Barrage inutile, le classement a tranché…"
            className="mt-1 h-9 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink transition-colors hover:border-line-strong focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>
      </ConfirmDialog>
    </Dialog>
  );
}
