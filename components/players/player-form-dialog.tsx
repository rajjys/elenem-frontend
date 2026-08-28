'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useCreatePlayer, useUpdatePlayer } from '@/services/players';
import { toastApiError } from '@/utils';
import type { Player } from '@/schemas/player-schemas';
import { Field, LeaguePicker, TeamPicker, useResolvedScope } from './player-scope-fields';

/** Create or edit a single player. Bulk entry lives in BulkRosterDialog. */
export function PlayerFormDialog({
  open,
  onOpenChange,
  player,
  leagueId,
  teamId,
  tenantId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  player?: Player | null;
  leagueId?: string;
  teamId?: string;
  tenantId?: string;
}) {
  const isEdit = !!player;
  const scope = useResolvedScope({ leagueId, teamId, tenantId });

  const [firstName, setFirstName] = useState(player?.firstName ?? '');
  const [lastName, setLastName] = useState(player?.lastName ?? '');
  const [jersey, setJersey] = useState(player?.jerseyNumber != null ? String(player.jerseyNumber) : '');
  const [position, setPosition] = useState(player?.position ?? '');
  const [email, setEmail] = useState(player?.email ?? '');
  const [pickedLeague, setPickedLeague] = useState(leagueId ?? '');
  const [pickedTeam, setPickedTeam] = useState(teamId ?? player?.currentTeam?.id ?? '');

  const create = useCreatePlayer();
  const update = useUpdatePlayer();
  const busy = create.isPending || update.isPending;

  const effectiveLeagueId = leagueId ?? pickedLeague ?? scope.leagueId;
  const canSubmit =
    firstName.trim() && lastName.trim() && !busy && (isEdit || (effectiveLeagueId && scope.tenantId));

  const submit = () => {
    const jerseyNumber = jersey.trim() ? Number(jersey) : undefined;

    if (isEdit && player) {
      update.mutate(
        {
          id: player.id,
          dto: {
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            jerseyNumber: jerseyNumber ?? null,
            position: position.trim() || null,
            email: email.trim() || undefined,
            teamId: pickedTeam || null,
          },
        },
        {
          onSuccess: () => {
            toast.success('Joueur mis à jour.');
            onOpenChange(false);
          },
          onError: (e) => toastApiError(e),
        },
      );
      return;
    }

    create.mutate(
      {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        jerseyNumber,
        position: position.trim() || undefined,
        // Only send an email when one was actually typed: supplying it provisions a login,
        // omitting it creates a plain roster entry, which is the normal case.
        email: email.trim() || undefined,
        tenantId: scope.tenantId as string,
        leagueId: effectiveLeagueId as string,
        teamId: pickedTeam || undefined,
        sportType: scope.sportType,
      },
      {
        onSuccess: () => {
          toast.success(`${firstName} ${lastName} ajouté à l'effectif.`);
          onOpenChange(false);
        },
        onError: (e) => toastApiError(e),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={(o: boolean) => !busy && onOpenChange(o)}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Modifier le joueur' : 'Nouveau joueur'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Prénom" value={firstName} onChange={setFirstName} required />
            <Field label="Nom" value={lastName} onChange={setLastName} required />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Numéro de maillot" value={jersey} onChange={setJersey} type="number" />
            <Field label="Poste" value={position} onChange={setPosition} placeholder="Pivot, Meneur…" />
          </div>

          {!isEdit && !leagueId && (
            <LeaguePicker value={pickedLeague} onChange={setPickedLeague} required />
          )}
          {!teamId && (
            <TeamPicker leagueId={effectiveLeagueId} value={pickedTeam} onChange={setPickedTeam} />
          )}

          <Field
            label="E-mail"
            value={email}
            onChange={setEmail}
            type="email"
            hint="Facultatif. Renseignez-le seulement si ce joueur doit pouvoir se connecter."
          />
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
            Annuler
          </Button>
          <Button variant="primary" onClick={submit} disabled={!canSubmit} isLoading={busy}>
            {isEdit ? 'Enregistrer' : 'Ajouter'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
