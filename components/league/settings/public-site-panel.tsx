'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { Button, Switch } from '@/components/ui';
import { useLeagueSiteSettings, useUpdateLeagueSiteSettings } from '@/services/leagues';
import { toastApiError } from '@/utils';
import { SettingsSection } from './settings-section';

/**
 * « Site public » — what the league's site shows of this competition (PHASE5B_LEAGUE_SITES §4.9).
 *
 * One decision for now: whether players are named. On by default. A youth competition is the
 * reason it can be switched off: the site then shows rosters, scoresheets and scorers by number and
 * club only, and has no Marqueurs page for it. A player whose own visibility is not public is never
 * named, whatever this says.
 */
export function PublicSitePanel({ leagueId }: { leagueId: string }) {
  const { data, isPending } = useLeagueSiteSettings(leagueId);
  const update = useUpdateLeagueSiteSettings();
  const [names, setNames] = useState(true);

  useEffect(() => {
    if (data) setNames(data.publicPlayerIdentity);
  }, [data]);

  const dirty = !!data && names !== data.publicPlayerIdentity;

  const save = () =>
    update.mutate(
      { id: leagueId, publicPlayerIdentity: names },
      {
        onSuccess: () => toast.success('Enregistré. Le site public suit dans la minute.'),
        onError: (e) => toastApiError(e, 'Le réglage n’a pas pu être enregistré.'),
      },
    );

  return (
    <SettingsSection
      title="Site public"
      description="Ce que le site de votre ligue montre de cette compétition."
      footer={
        <>
          <p className="text-sm text-ink-muted">Le site public est mis à jour dans la minute.</p>
          <Button type="button" variant="primary" disabled={!dirty || update.isPending} onClick={save}>
            {update.isPending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : 'Enregistrer'}
          </Button>
        </>
      }
    >
      <div className="flex items-start justify-between gap-6">
        <div>
          <p id="public-names-label" className="font-medium text-ink">
            Afficher les noms des joueurs sur le site public
          </p>
          <p className="mt-1 text-sm leading-relaxed text-ink-muted">
            Effectifs, feuilles de marque et classement des marqueurs montrent le nom de chaque joueur.
            Désactivé, le site ne montre que les numéros — pour une compétition de jeunes, par exemple —
            et n’a pas de page Marqueurs pour elle. Un joueur dont la visibilité n’est pas publique n’est
            jamais nommé.
          </p>
        </div>
        <Switch
          checked={names}
          onCheckedChange={setNames}
          disabled={isPending}
          aria-labelledby="public-names-label"
        />
      </div>
    </SettingsSection>
  );
}
