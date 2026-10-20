'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui';
import { DeleteDialog } from '@/components/deletion';
import { useLeague, useUpdateLeague } from '@/services/leagues';
import { toastApiError } from '@/utils';
import { SettingsSection } from './settings-section';

/**
 * Deleting a competition.
 *
 * Its own tab, at the end, because that is where an irreversible action belongs: a reader who came
 * to rename something should not have to scroll past it, and a reader who came to delete knows to
 * look for it. The competitions list has the same action in its card menu.
 *
 * What it does is the API's to say (`DeleteDialog`, backend `LeaguesService.assessDeletion`): a
 * competition in which a game was played is archived, never deleted, and one in which nothing was
 * played goes with everything in it — after its name is typed. This panel used to promise that
 * cascade to every competition, and the server refused every competition that had a season.
 */
export function DangerPanel({ leagueId }: { leagueId: string }) {
  const router = useRouter();
  const { data: league } = useLeague(leagueId);
  const update = useUpdateLeague();
  const [deleting, setDeleting] = useState(false);

  return (
    <>
      <SettingsSection
        tone="danger"
        title="Supprimer cette compétition"
        description="Pour une compétition créée par erreur ou pour essayer. Une compétition dont un match a été joué ne se supprime pas : ses résultats sont publiés. Elle s’archive."
        footer={
          <div className="flex justify-end">
            <Button
              variant="primary"
              onClick={() => setDeleting(true)}
              className="bg-negative text-ink-inverted hover:bg-negative/90"
            >
              Supprimer la compétition…
            </Button>
          </div>
        }
      >
        <p className="text-sm text-ink-muted">
          Avant de supprimer, la liste de ce qui partirait avec elle s’affiche — saisons, matchs,
          clubs, joueurs — et son nom vous est demandé.
        </p>
      </SettingsSection>

      <DeleteDialog
        resource="league"
        id={leagueId}
        open={deleting}
        onOpenChange={setDeleting}
        onDeleted={() => router.push('/tenant/leagues')}
        alternatives={{
          archive: {
            label: 'Archiver la compétition',
            onSelect: () =>
              update.mutate(
                { id: leagueId, isActive: false },
                {
                  onSuccess: () => toast.success(`${league?.name ?? 'La compétition'} est archivée.`),
                  onError: (e) => toastApiError(e),
                },
              ),
          },
        }}
      />
    </>
  );
}
