// app/(admin)/tenants/page.tsx
"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/services/api'; // Your API instance
import { TenantBasic, TenantBasicSchema } from '@/prisma'; // Import your TenantBasic DTO and schema
import { LoadingSpinner } from '@/components/ui/loading-spinner'; // Your loading spinner component
import { TenantsTable } from '@/components/tenant/tenants-table'; // Your tenant table component
import { Button } from '@/components/ui/button'; // Your Button component
import z from 'zod';

export default function AdminTenantsPage() {
  const [tenants, setTenants] = useState<TenantBasic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Function to fetch tenants
  const fetchTenants = async () => {
    setLoading(true);
    setError(null);
    try {
      // Assuming your backend endpoint for listing tenants is GET /admin/tenants
      // And it returns a paginated response like { items: TenantBasic[], total: number }
      const response = await api.get<{ tenants: TenantBasic[], total: number }>('/system-admin/tenants');
      //console.log("Tenants: ", response);
      // Validate data with Zod schema
      const validatedTenants = z.array(TenantBasicSchema).parse(response.data.tenants);
      setTenants(validatedTenants);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || "Failed to fetch tenants.";
      setError(errorMessage);
      console.error('Fetch tenants error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenants();
  }, []); // Fetch on component mount

  const handleEditTenant = (tenantId: string) => {
    // Implement navigation to an edit page or open a modal
    console.log('Edit tenant:', tenantId);
    // Example: router.push(`/admin/tenants/edit/${tenantId}`);
  };

  const handleDeleteTenant = async (tenantId: string) => {
    if (window.confirm('Are you sure you want to delete this tenant? This action cannot be undone.')) {
      try {
        await api.delete(`/system-admin/tenants/${tenantId}`); // Assuming DELETE /admin/tenants/:id
        alert('Tenant deleted successfully!');
        fetchTenants(); // Re-fetch tenants to update the list
      } catch (err: any) {
        const errorMessage = err.response?.data?.message || err.message || "Failed to delete tenant.";
        setError(errorMessage);
        console.error('Delete tenant error:', err);
      }
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Manage Tenants</h1>
        <Link href="/admin/tenants/create">
          <Button>Create New Tenant</Button>
        </Link>
      </div>

      {loading && <LoadingSpinner />}
      {error && <p className="text-red-500 text-center">{error}</p>}

      {!loading && !error && (
        <TenantsTable
          tenants={tenants}
          onEdit={handleEditTenant}
          onDelete={handleDeleteTenant}
        />
      )}
    </div>
  );
}
