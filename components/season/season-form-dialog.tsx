'use client';

import React, { useEffect, useState } from 'react';
import {
  Button,
  DatePicker,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
} from '@/components/ui';
import {
  useCreateSeason,
  useUpdateSeason,
  suggestSeasonName,
  type SeasonRow,
} from '@/services/seasons';
import { toastApiError } from '@/utils';
import { toast } from 'sonner';

/**
 * A season is a name and two dates.
 *
 * It used to be a page — `/season/create`, which redirected a tenant administrator to
 * `/tenant/seasons`, a route that does not exist. A dialog on the list instead: creating an
 * edition is a thing you do while looking at the ones that already exist, and the reason you are
 * doing it is usually that the one on screen has just ended.
 *
 * There is no status field. There never was a real choice — the old dropdown offered eight values,
 * three of which the server refused the moment they were submitted — and the answer it was
 * reaching for belongs to the state machine now.
 */
export function SeasonFormDialog({
  open,
  onClose,
  leagueId,
  existing,
}: {
  open: boolean;
  onClose: () => void;
  leagueId: string;
  /** Present when editing. Absent when creating. */
  existing: SeasonRow | null;
}) {
  const create = useCreateSeason();
  const update = useUpdateSeason();

  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Seeded when the dialog opens and not touched afterwards, so a keystroke is never overwritten
  // by a re-render — the same rule the scoresheet had to learn (GAME_AND_STANDINGS §6.1).
  useEffect(() => {
    if (!open) return;
    if (existing) {
      setName(existing.name);
      setStartDate(existing.startDate.slice(0, 10));
      setEndDate(existing.endDate.slice(0, 10));
      return;
    }
    // A season here is a school year more often than a calendar one, and it opens in the second
    // half of the year. A starting point, not a rule.
    const today = new Date();
    const end = new Date(today);
    end.setFullYear(end.getFullYear() + 1);
    setName(suggestSeasonName(today));
    setStartDate(today.toISOString().slice(0, 10));
    setEndDate(end.toISOString().slice(0, 10));
  }, [open, existing]);

  const pending = create.isPending || update.isPending;
  const datesWrong = !!startDate && !!endDate && endDate <= startDate;
  const invalid = name.trim().length < 2 || !startDate || !endDate || datesWrong;

  async function submit() {
    try {
      if (existing) {
        await update.mutateAsync({ id: existing.id, name: name.trim(), startDate, endDate });
        toast.success(`« ${name.trim()} » enregistrée.`);
      } else {
        await create.mutateAsync({ leagueId, name: name.trim(), startDate, endDate });
        toast.success(`« ${name.trim()} » créée, en préparation.`);
      }
      onClose();
    } catch (err) {
      toastApiError(err, 'La saison n’a pas pu être enregistrée.');
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{existing ? 'Modifier la saison' : 'Nouvelle saison'}</DialogTitle>
          {!existing && (
            <DialogDescription>
              Elle démarre en préparation et s’ouvre d’elle-même au premier résultat enregistré.
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="season-name">Nom</Label>
            <Input
              id="season-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Saison 2026-2027"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="season-start">Début</Label>
              <DatePicker id="season-start" value={startDate} onChange={setStartDate} compact />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="season-end">Fin</Label>
              <DatePicker
                id="season-end"
                value={endDate}
                onChange={setEndDate}
                compact
                invalid={datesWrong}
              />
            </div>
          </div>

          {datesWrong && (
            <p className="text-sm text-negative">La fin doit être après le début.</p>
          )}
          {!existing && (
            <p className="text-xs text-ink-muted">
              Les dates sont un cadre, pas une contrainte : un calendrier qui glisse ne ferme pas la
              saison.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={onClose} disabled={pending}>
            Annuler
          </Button>
          <Button variant="primary" onClick={submit} disabled={invalid || pending}>
            {pending ? 'Enregistrement…' : existing ? 'Enregistrer' : 'Créer la saison'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
