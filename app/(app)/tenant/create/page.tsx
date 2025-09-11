// app/(tenant)/tenant/create/page.tsx
'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { AccessGate } from '@/app/(auth)/AccessGate'
import { Roles } from '@/schemas'
import { TenantCreationForm } from '@/components/forms/tenant-creation-form'
import { useAuthStore } from '@/store/auth.store'

export default function CreateTenantPage() {
  const router = useRouter()
  const { user: userAuth, fetchUser } = useAuthStore();
  const handleSuccess = async (tenantId: string) => {
    //console.log(`Tenant ${tenantId} created successfully.`)
    if(userAuth?.roles.includes(Roles.SYSTEM_ADMIN)){
      router.push(`/tenant/dashboard?ctxTenantId=${tenantId}`) // Redirect to list or dashboard
    }
    else {
      //The user is a TENANT_ADMIN as creating a tenant/organisation makes you the automatic owner and assigns you the role of TENANT_ADMIN
      ///The issue is, the front end doenst know yet so we need to fetch the user from backend again
      //Otherwise we get a 403 Access Denied
      const updatedUser = await fetchUser();
      if (updatedUser?.roles.includes(Roles.TENANT_ADMIN)) {
        router.push('/tenant/dashboard');
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
    <div className="container mx-auto max-w-2xl">
      <h1 className="text-3xl font-bold text-gray-900 text-center">Create New Tenant</h1>

      <AccessGate allowedRoles={[Roles.SYSTEM_ADMIN, Roles.GENERAL_USER]}>
        <TenantCreationForm onSuccess={handleSuccess} onCancel={handleCancel} />
      </AccessGate>
    </div>
  )
}
