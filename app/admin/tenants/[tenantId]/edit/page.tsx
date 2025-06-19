// app/(admin)/tenants/[tenantId]/edit/page.tsx
"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { UpdateTenantForm } from '@/components/forms/update-tenant-form'; // Your update form component
import { LoadingSpinner } from '@/components/ui/loading-spinner'; // Your loading spinner

interface TenantEditPageProps {
  params: {
    tenantId: string; // The tenant ID will be extracted from the URL path
  };
}

export default function TenantEditPage({ params }: TenantEditPageProps) {
  const router = useRouter();
  const { tenantId } = params;

  if (!tenantId) {
    // This case should ideally not happen if routing is set up correctly,
    // but as a fallback, we can show an error or redirect.
    return <p className="text-red-500 text-center mt-8">Error: Tenant ID not found in URL.</p>;
  }

  const handleSuccess = (updatedTenantId: string) => {
    console.log(`Tenant ${updatedTenantId} updated successfully. Redirecting...`);
    router.push('/admin/tenants'); // Redirect back to the tenants list after update
  };

  const handleCancel = () => {
    router.push('/admin/tenants'); // Go back to the tenants list
  };

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center">Edit Tenant</h1>
      <UpdateTenantForm tenantId={tenantId} onSuccess={handleSuccess} onCancel={handleCancel} />
    </div>
  );
}
