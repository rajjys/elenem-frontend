// app/(admin)/tenants/create/page.tsx
"use client";

import React from 'react';
import { CreateTenantForm } from '@/components/forms/create-tenant-form'; // Your tenant creation form
import { useRouter } from 'next/navigation';

export default function CreateTenantPage() {
  const router = useRouter();

  const handleSuccess = (tenantId: string) => {
    console.log(`Tenant ${tenantId} created successfully. Redirecting...`);
    // Optionally redirect to the newly created tenant's detail page or back to the list
    router.push('/admin/tenants');
  };

  const handleCancel = () => {
    router.push('/admin/tenants'); // Go back to the tenants list
  };

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center">Create New Tenant</h1>
      <CreateTenantForm onSuccess={handleSuccess} onCancel={handleCancel} />
    </div>
  );
}
