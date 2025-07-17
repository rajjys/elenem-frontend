// app/(tenant)/tenant/create/page.tsx
'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { TenantForm } from '@/components/forms'
import { AccessGate } from '@/app/(auth)/AccessGate'
import { Role } from '@/schemas'

export default function CreateTenantPage() {
  const router = useRouter()

  const handleSuccess = (tenantId: string) => {
    console.log(`Tenant ${tenantId} created successfully.`)
    router.push('/admin/tenants') // Redirect to list or dashboard
  }

  const handleCancel = () => {
    router.push('/admin/tenants') // Fallback route
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center">Create New Tenant</h1>

      <AccessGate allowedRoles={[Role.SYSTEM_ADMIN]}>
        <TenantForm onSuccess={handleSuccess} onCancel={handleCancel} />
      </AccessGate>
    </div>
  )
}
