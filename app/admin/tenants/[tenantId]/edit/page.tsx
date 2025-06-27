// app/admin/tenants/[tenantId]/edit/page.tsx
"use client";

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { TenantForm } from '@/components/forms/tenant-form';
import { Button } from '@/components/ui/button';
import { TenantDetails, TenantDetailsSchema } from '@/prisma';
import { api } from '@/services/api';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { toast } from 'sonner';

interface EditTenantPageProps {
  params: {
    tenantId: string;
  };
}

export default function EditTenantPage({ params }: EditTenantPageProps) {
  const router = useRouter();
  const { tenantId } = useParams<{ tenantId: string }>();

  const [tenantData, setTenantData] = React.useState<TenantDetails | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const fetchTenantData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.get(`/system-admin/tenants/${tenantId}`);
        const validatedData = TenantDetailsSchema.parse(response.data);
        setTenantData(validatedData);
      } catch (err: any) {
        const errorMessage = err.response?.data?.message || err.message || "Failed to load tenant data for editing.";
        setError(errorMessage);
        toast.error("Error loading tenant for edit", { description: errorMessage });
        console.error('Fetch tenant for edit error:', err);
      } finally {
        setLoading(false);
      }
    };

    if (tenantId) {
      fetchTenantData();
    } else {
      setError("Tenant ID not provided for editing.");
      setLoading(false);
    }
  }, [tenantId]);

  const handleSuccess = () => {
    router.push(`/admin/tenants/${tenantId}`); // Redirect back to tenant detail page after update
  };

  const handleCancel = () => {
    router.push(`/admin/tenants/${tenantId}`); // Go back to tenant detail page
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <p className="text-red-500 text-center mt-8">{error}</p>;
  }

  if (!tenantData) {
    return <p className="text-center mt-8">Tenant data not found for editing.</p>;
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Edit Tenant: {tenantData.name}</h1>
        <Button variant="outline" onClick={handleCancel}>
          Cancel
        </Button>
      </div>
      <TenantForm initialData={tenantData} isEditMode={true} onSuccess={handleSuccess} onCancel={handleCancel} />
    </div>
  );
}
