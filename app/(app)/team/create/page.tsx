// app/(team)/team/create/page.tsx
'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { AccessGate } from '@/app/(auth)/AccessGate'
import { Roles, TeamDetails } from '@/schemas'
import { useAuthStore } from '@/store/auth.store'
import { toast } from 'sonner'
import TeamForm from '@/components/forms/team/team-form'

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
      router.push('/league/teams')
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
    <div className="container mx-auto max-w-2xl">
      <h1 className="text-3xl font-bold text-gray-900 text-center">Creer une Equipe</h1>

      <AccessGate allowedRoles={[Roles.SYSTEM_ADMIN, Roles.TENANT_ADMIN, Roles.LEAGUE_ADMIN]}>
        <TeamForm onSuccess={handleSuccess} onCancel={handleCancel} />
      </AccessGate>
    </div>
  )
}
