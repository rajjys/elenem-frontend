// app/admin/tenants/[tenantId]/page.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/services/api';
import { TenantDetails, TenantDetailsSchema } from '@/prisma/';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { countryNameToCode } from '@/utils';
import { LeaguesTable } from '@/components/league';

interface TenantDetailPageProps {
  params: {
    tenantId: string;
  };
}

export default function TenantDetailPage({ params }: TenantDetailPageProps) {
  const router = useRouter();
  const { tenantId } = useParams<{ tenantId: string }>();

  const [tenant, setTenant] = useState<TenantDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchTenantDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/tenants/${tenantId}`);
      console.log(response);
      const validatedTenant = TenantDetailsSchema.parse(response.data);
      setTenant(validatedTenant);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || "Failed to fetch tenant details.";
      setError(errorMessage);
      toast.error("Error loading tenant", { description: errorMessage });
      console.error('Fetch tenant details error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tenantId) {
      fetchTenantDetails();
    } else {
      setError("Tenant ID not provided.");
      setLoading(false);
    }
  }, [tenantId]);

  const handleEdit = () => {
    router.push(`/admin/tenants/${tenantId}/edit`);
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to soft-delete this tenant? This action can be undone by an admin but will deactivate the tenant and all its associated data.')) {
      return;
    }
    setIsDeleting(true);
    try {
      await api.delete(`/tenants/${tenantId}`); // Soft delete endpoint
      toast.success("Tenant soft-deleted successfully!");
      router.push('/admin/tenants'); // Redirect to tenant list
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || "Failed to delete tenant.";
      toast.error("Error deleting tenant", { description: errorMessage });
      console.error('Delete tenant error:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleViewAsContext = () => {
    // This functionality depends on your authentication system supporting "impersonation"
    // or switching context based on tenantId. For demonstration, we'll redirect
    // to the league dashboard with a query parameter.
    // In a real application, you might set a specific cookie or local storage item
    // and then redirect, allowing your middleware/backend to pick up the tenant context.
    toast.info("Attempting to view tenant as context...", { description: "This functionality requires backend support for context switching." });
    router.push(`/tenant/dashboard?tenantId=${tenantId}`);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <p className="text-red-500 text-center mt-8">{error}</p>;
  }

  if (!tenant) {
    return <p className="text-center mt-8">Tenant not found.</p>;
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">{tenant.name} ({tenant.tenantCode})</h1>
        <div className="space-x-4">
          <Button variant="outline" onClick={handleViewAsContext}>
            View as Context
          </Button>
          <Button onClick={handleEdit} disabled={isDeleting}>
            Edit Tenant
          </Button>
          <Button variant="danger" onClick={handleDelete} disabled={isDeleting}>
            {isDeleting ? 'Deleting...' : 'Delete Tenant'}
          </Button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md space-y-4">
        {tenant.bannerImageUrl && (
          <img
            src={tenant.bannerImageUrl}
            alt={`${tenant.name} Banner`}
            className="w-full h-48 object-cover rounded-md mb-4"
          />
        )}
        <div className="flex items-center space-x-4 mb-4">
          {tenant.logoUrl && (
            <img
              src={tenant.logoUrl}
              alt={`${tenant.name} Logo`}
              className="w-24 h-24 object-contain"
            />
          )}
          <div>
            <p className="text-lg font-semibold">{tenant.name}</p>
            <p className="text-gray-600">Code: {tenant.tenantCode}</p>
            <p className="text-gray-600">Sport: {tenant.sportType.replace(/_/g, ' ')}</p>
          </div>
        </div>

        {tenant.description && (
          <div>
            <span className="font-medium">Description:</span>
            <p className="whitespace-pre-wrap">{tenant.description}</p>
          </div>
        )}

        <p><span className="font-medium">Status:</span> {tenant.isActive ? 'Active' : 'Inactive'}</p>
        {tenant.establishedYear && <p><span className="font-medium">Established:</span> {tenant.establishedYear}</p>}

        {tenant.country && (
          <p>
            <span className="font-medium">Location:</span> {tenant.city ? `${tenant.city}, ` : ''}
            {tenant.region ? `${tenant.region}, ` : ''}
            {tenant.state ? `${tenant.state}, ` : ''}
            {Object.keys(countryNameToCode).find(key => countryNameToCode[key] === tenant.country) || tenant.country}
          </p>
        )}

        {tenant.owner && (
          <p>
            <span className="font-medium">Owner:</span> {tenant.owner.firstName} {tenant.owner.lastName} (@{tenant.owner.username}, {})
          </p>
        )}
        {!tenant.owner && tenant.ownerId && (
          <p className="text-gray-600 text-sm">Owner ID: {tenant.ownerId} (details not available)</p>
        )}
        {!tenant.owner && !tenant.ownerId && (
          <p className="text-gray-600 text-sm">No specific owner assigned.</p>
        )}

        <div className="mt-6 border-t pt-4">
          <h3 className="text-xl font-semibold mb-2">Audit Information</h3>
          <p className="text-sm text-gray-500">Created At: {new Date(tenant.createdAt).toLocaleString()}</p>
          <p className="text-sm text-gray-500">Last Updated At: {new Date(tenant.updatedAt).toLocaleString()}</p>
        </div>
      </div>
      <LeaguesTable 
        leagues={tenant.leagues || []} 
        onSort={function (sortBy: 'name' | 'sportType' | 'country' | 'establishedYear' | 'createdAt' | 'updatedAt' | 'leagueCode' | 'ownerUsername' | 'division'): void {
          throw new Error('Function not implemented.');
        } } sortOrder={'desc'} sortBy={''} onDelete={function (leagueId: string): void {
          throw new Error('Function not implemented.');
        } }        
      />
    </div>
  );
}
