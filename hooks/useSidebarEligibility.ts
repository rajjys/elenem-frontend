// hooks/useSidebarEligibility.ts
import { useAuthStore } from '@/store/auth.store'
import { usePathname, useSearchParams } from 'next/navigation'
import { Role } from '@/schemas'

export function useSidebarEligibility() {
  const { user } = useAuthStore()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const ctxTenantId = searchParams.get('ctxTenantId') || user?.tenantId
  const ctxLeagueId = searchParams.get('ctxLeagueId') || user?.managingLeagueId
  const ctxTeamId = searchParams.get('ctxTeamId') || user?.managingTeamId

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
