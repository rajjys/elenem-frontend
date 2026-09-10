'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button, Input, Label } from '@/components/ui';
import { useLeague, useDeleteLeague } from '@/services/leagues';
import { toastApiError } from '@/utils';
import { SettingsSection } from './settings-section';

/**
 * Deleting a competition.
 *
 * Its own tab, at the end, because that is where an irreversible action belongs: a reader who came
 * to rename something should not have to scroll past it, and a reader who came to delete knows to
 * look for it. The competitions list has a bin too — this is the same action, reachable from inside
 * the thing being deleted, which is where somebody who has just been through its settings is.
 *
 * **Typing the name is the confirmation**, not a checkbox. A dialog with an Annuler and a Supprimer
 * is dismissed by reflex; writing « Championnat Goma D1 Messieurs » cannot be done by reflex, and
 * it makes the reader read the name of the thing they are about to remove. Everything a season has
 * produced goes with it, and the button says so.
 */
export function DangerPanel({ leagueId }: { leagueId: string }) {
  const router = useRouter();
  const { data: league } = useLeague(leagueId);
  const del = useDeleteLeague();
  const [typed, setTyped] = useState('');

  const name = league?.name ?? '';
  const confirmed = typed.trim() === name && !!name;

  const teamCount = league?.teams?.length ?? 0;
  const playerCount = league?.players?.length ?? 0;

  return (
    <SettingsSection
      tone="danger"
      title="Supprimer cette compétition"
      description="Ses saisons, ses phases, son calendrier, son classement et ses feuilles de match sont supprimés avec elle. C’est définitif."
      footer={
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-ink-muted">
            {confirmed
              ? 'Le nom correspond.'
              : 'Saisissez le nom exact de la compétition pour confirmer.'}
          </p>
          <Button
            variant="danger"
            disabled={!confirmed}
            isLoading={del.isPending}
            onClick={() =>
              del.mutate(leagueId, {
                onSuccess: () => {
                  toast.success(`${name} supprimée.`);
                  router.push('/tenant/leagues');
                },
                onError: (e) => toastApiError(e),
              })
            }
          >
            Supprimer définitivement
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {(teamCount > 0 || playerCount > 0) && (
          <p className="rounded-lg border border-negative/30 bg-negative-soft/40 px-3.5 py-2.5 text-sm text-ink">
            Cette compétition compte {teamCount} club{teamCount > 1 ? 's' : ''}
            {playerCount > 0 && (
              <>
                {' '}
                et {playerCount} joueur{playerCount > 1 ? 's' : ''}
              </>
            )}
            . Ils perdent leur compétition.
          </p>
        )}

        <div className="max-w-md">
          <Label htmlFor="confirm-name">
            Tapez <span className="font-normal text-ink-muted">{name}</span> pour confirmer
          </Label>
          <Input
            id="confirm-name"
            name="confirm-name"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            placeholder={name}
            autoComplete="off"
          />
        </div>
      </div>
    </SettingsSection>
  );
}
