// hooks/useSidebarEligibility.ts
'use client'
import { useAuthStore } from '@/store/auth.store'
import { usePathname, useSearchParams } from 'next/navigation'

export function useSidebarEligibility() {
  const { user } = useAuthStore()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const ctxTenantId = searchParams.get('ctxTenantId') || user?.tenantId;
  // A club administrator's competition is on their club, not on them: `managingLeagueId` names the
  // league you *administer*, and they administer a team. Reading only that field meant every
  // `/team/*` route failed the check below and rendered with no navigation at all — on the one
  // surface whose reader is never also a competition admin, and who is sent there at login.
  const ctxLeagueId =
    searchParams.get('ctxLeagueId') ||
    user?.managingLeagueId ||
    user?.managingLeague?.id ||
    user?.managingTeam?.leagueId;
  const ctxTeamId = searchParams.get('ctxTeamId') || user?.managingTeamId;

  const routeSection = pathname.split('/')[1] // 'tenant', 'league', 'team', etc.

  const requiredContext = (() => {
    switch (routeSection) {
      case 'tenant':
        return [ctxTenantId]
      case 'league':
        return [ctxTenantId, ctxLeagueId]
      case 'team':
        return [ctxTenantId, ctxLeagueId, ctxTeamId]
      default:
        return []
    }
  })()
  const hasRequiredContext = requiredContext.every(Boolean)

  return hasRequiredContext
}
