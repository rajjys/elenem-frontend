'use client';

import { SettingsSection } from './settings-section';
import { AdminsPanel } from '@/components/access/admins-panel';
import { useLeague } from '@/services/leagues';
import { useLeagueAdmins } from '@/services/access';
import { useCurrentUser, useHasRole } from '@/hooks';
import { Roles } from '@/schemas';

/**
 * « Administrateurs »: who runs this competition (ROADMAP_V2 §15, U3). Several may (D2). Its own
 * administrators see the list; naming or removing one is the organisation's (AccessService).
 */
export function LeagueAdminsPanel({ leagueId }: { leagueId: string }) {
  const me = useCurrentUser();
  const isSystemAdmin = useHasRole(Roles.SYSTEM_ADMIN);
  const isTenantAdmin = useHasRole(Roles.TENANT_ADMIN);
  const { data: league } = useLeague(leagueId);
  const { data: admins, isLoading } = useLeagueAdmins(leagueId);

  const tenantId = league?.tenantId ?? undefined;
  const canManage = isSystemAdmin || (isTenantAdmin && !!me?.tenantId && me.tenantId === tenantId);

  return (
    <SettingsSection
      title="Administrateurs"
      description="Ces personnes gèrent la compétition : ses clubs, ses saisons, son calendrier et son classement. Une personne n’administre qu’une compétition."
    >
      <AdminsPanel
        role="LEAGUE_ADMIN"
        scopeId={leagueId}
        scopeName={league?.name ?? 'cette compétition'}
        tenantId={tenantId}
        admins={admins}
        isLoading={isLoading}
        canManage={canManage}
        canPickExisting={canManage}
      />
    </SettingsSection>
  );
}
