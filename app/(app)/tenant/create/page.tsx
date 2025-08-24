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
  const { user: userAuth } = useAuthStore();
  const handleSuccess = (tenantId: string) => {
    //console.log(`Tenant ${tenantId} created successfully.`)
    if(userAuth?.roles.includes(Roles.SYSTEM_ADMIN)){
      router.push(`/tenant/dashboard?ctxTenantId=${tenantId}`) // Redirect to list or dashboard
    }
    else {
      router.push('/tenant/dashboard') // Redirect to dashboard
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
      <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center">Create New Tenant</h1>

      <AccessGate allowedRoles={[Roles.SYSTEM_ADMIN, Roles.GENERAL_USER]}>
        <TenantCreationForm onSuccess={handleSuccess} onCancel={handleCancel} />
      </AccessGate>
    </div>
  )
}
