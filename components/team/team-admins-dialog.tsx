'use client';

import { Modal } from '@/components/ui';
import { AdminsPanel } from '@/components/access/admins-panel';
import { useTeamAdmins } from '@/services/access';
import { de } from '@/utils/french';

/**
 * « Responsables » of one club, from the clubs list (ROADMAP_V2 §15, U3): who runs it, remove,
 * give it to someone, invite. An organisation's administrator may pick among its people; a
 * competition's administrator invites (an address with an account here just gets the role).
 */
export function TeamAdminsDialog({
  team,
  onOpenChange,
  canManage,
  canPickExisting,
}: {
  team: { id: string; name: string; tenantId: string } | null;
  onOpenChange: (open: boolean) => void;
  canManage: boolean;
  canPickExisting: boolean;
}) {
  const { data: admins, isLoading } = useTeamAdmins(team?.id);
  if (!team) return null;
  return (
    <Modal
      open
      onOpenChange={onOpenChange}
      title={`Responsables ${de(team.name)}`}
      description="Les responsables consultent le club et corrigent la fiche de ses joueurs. Une personne n’est responsable que d’un club."
      className="max-w-xl"
    >
      <div className="pb-2">
        <AdminsPanel
          role="TEAM_ADMIN"
          scopeId={team.id}
          scopeName={team.name}
          tenantId={team.tenantId}
          admins={admins}
          isLoading={isLoading}
          canManage={canManage}
          canPickExisting={canPickExisting}
        />
      </div>
    </Modal>
  );
}
