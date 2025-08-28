// app/(team)/team/create/page.tsx
'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { AccessGate } from '@/app/(auth)/AccessGate'
import { Roles, TeamDetails } from '@/schemas'
import { TeamCreationForm } from '@/components/forms'
import { useAuthStore } from '@/store/auth.store'
import { toast } from 'sonner'

export default function CreateTeamPage() {
  const router = useRouter()
  const { user: userAuth } = useAuthStore();
  const roles = userAuth?.roles ?? [];
  const isSystemAdmin = roles.includes(Roles.SYSTEM_ADMIN);
  const isTenantAdmin = roles.includes(Roles.TENANT_ADMIN);
  const isLeagueAdmin = roles.includes(Roles.LEAGUE_ADMIN);

  const handleSuccess = async (team: TeamDetails) => {
    toast.success(`Team ${team.name} created successfully`);
    if(isSystemAdmin){
      //router.push(`/team/dashboard?ctxTenantId=${team.tenantId}&ctxLeagueId=${team.leagueId}&ctxTeamId=${team.id}`); // Redirect to context dashboard
      router.push('/admin/teams');
    }
    else if(isTenantAdmin){
      //router.push(`/team/dashboard?ctxLeagueId=${team.leagueId}&ctxTeamId=${team.id}`)
      router.push('/tenant/teams');
    }
    else if(isLeagueAdmin){
      //router.push(`/team/dashboard?ctxTeamId=${team.id}`)
      router.push('/leagues/teams')
    }
    else {
      router.push(`/teams`)///Fallback. Won't be necessary
    }
  }

  const handleCancel = () => {
    if(isSystemAdmin){
      router.push(`/admin/teams`); // Redirect to context dashboard
    }
    else if(isTenantAdmin){
      router.push(`/tenant/teams`)
    }
    else if(isLeagueAdmin){
      router.push(`/league/teams`)
    }
    else {
      router.push(`/`)  ///Fallback. Won't be necessary
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center">Create New Team</h1>

      <AccessGate allowedRoles={[Roles.SYSTEM_ADMIN, Roles.TENANT_ADMIN, Roles.LEAGUE_ADMIN]}>
        <TeamCreationForm onSuccess={handleSuccess} onCancel={handleCancel} />
      </AccessGate>
    </div>
  )
}
