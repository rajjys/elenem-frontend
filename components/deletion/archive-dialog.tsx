'use client';

import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/ui';
import { useUpdateTeam } from '@/services/teams';
import { useUpdatePlayer } from '@/services/players';

type Archivable = 'team' | 'player';

/**
 * « Archiver » — the other door when deleting is refused (`docs/RESOURCE_DELETION.md` §1, R3).
 *
 * A club that has played and a player on a match sheet are never deleted: other clubs' points and
 * the arithmetic of the sheets depend on them. Archiving takes them out of the present — the lists,
 * the pickers, new fixtures, rosters — and leaves them in the past under their real names, on every
 * result, table and sheet. It is undone from the « Archivés » view of the same list.
 *
 * A player is « la fiche »: half the competitions are women's, and this sentence cannot know.
 */
const COPY: Record<Archivable, (name: string) => { title: string; body: string; done: string }> = {
  team: (name) => ({
    title: `Archiver « ${name} » ?`,
    body:
      'Le club quitte la liste des clubs, les choix d’équipes et les nouveaux matchs. Ses résultats restent ' +
      'au classement, sur les feuilles de match et sur le site, sous son nom. Ses matchs à venir restent au ' +
      'calendrier : déplacez-les, annulez-les ou supprimez-les. Il se réactive depuis « Archivés ».',
    done: `${name} est archivé.`,
  }),
  player: (name) => ({
    title: `Archiver la fiche de « ${name} » ?`,
    body:
      'La fiche quitte l’effectif et les choix de joueurs. Ses lignes restent sur les feuilles de match et ' +
      'dans les statistiques, sous son nom. Elle se réactive depuis « Archivés ».',
    done: `La fiche de ${name} est archivée.`,
  }),
};

export function ArchiveDialog({
  kind,
  target,
  onOpenChange,
}: {
  kind: Archivable;
  /** `null` closes it. */
  target: { id: string; name: string } | null;
  onOpenChange: (open: boolean) => void;
}) {
  const team = useUpdateTeam();
  const player = useUpdatePlayer();
  const copy = COPY[kind](target?.name ?? '');

  return (
    <ConfirmDialog
      open={!!target}
      onOpenChange={onOpenChange}
      title={copy.title}
      description={copy.body}
      confirmLabel="Archiver"
      onConfirm={() => {
        if (!target) return;
        const request =
          kind === 'team'
            ? team.mutateAsync({ id: target.id, dto: { isActive: false } })
            : player.mutateAsync({ id: target.id, dto: { isActive: false } });
        return request.then(() => toast.success(copy.done));
      }}
    />
  );
}

/** « Réactiver »: back in the lists and the pickers. Reversible, so it asks nothing. */
export function useReactivate(kind: Archivable) {
  const team = useUpdateTeam();
  const player = useUpdatePlayer();
  return {
    isPending: team.isPending || player.isPending,
    reactivate: (target: { id: string; name: string }) => {
      const request =
        kind === 'team'
          ? team.mutateAsync({ id: target.id, dto: { isActive: true } })
          : player.mutateAsync({ id: target.id, dto: { isActive: true } });
      return request.then(() =>
        toast.success(kind === 'team' ? `${target.name} est réactivé.` : `La fiche de ${target.name} est réactivée.`),
      );
    },
  };
}
