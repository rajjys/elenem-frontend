// app/(team)/team/create/page.tsx
'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { AccessGate } from '@/app/(auth)/AccessGate'
import { Roles } from '@/schemas'
import { TeamCreationForm } from '@/components/forms'
import { useAuthStore } from '@/store/auth.store'

export default function CreateTeamPage() {
  const router = useRouter()
  const { user: userAuth, fetchUser } = useAuthStore();
  const handleSuccess = async (teamId: string) => {
    //console.log(`Team ${teamId} created successfully.`)
    if(userAuth?.roles.includes(Roles.SYSTEM_ADMIN)){
      router.push(`/team/dashboard?ctxTeamId=${teamId}`) // Redirect to list or dashboard
    }
    else {
      //The user is a team_ADMIN as creating a team/organisation makes you the automatic owner and assigns you the role of team_ADMIN
      ///The issue is, the front end doenst know yet so we need to fetch the user from backend again
      //Otherwise we get a 403 Access Denied
      const updatedUser = await fetchUser();
      if (updatedUser?.roles.includes(Roles.TEAM_ADMIN)) {
        router.push('/team/dashboard');
      }
    }
  }

  const handleCancel = () => {
    if(userAuth?.roles.includes(Roles.SYSTEM_ADMIN)){
      router.push(`/admin/dashboard`) // Redirect to list or dashboard
    }
    else {
      router.push('/account/dashboard') // Redirect to dashboard
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center">Create New Team</h1>

      <AccessGate allowedRoles={[Roles.SYSTEM_ADMIN, Roles.GENERAL_USER]}>
        <TeamCreationForm onSuccess={handleSuccess} onCancel={handleCancel} />
      </AccessGate>
    </div>
  )
}
