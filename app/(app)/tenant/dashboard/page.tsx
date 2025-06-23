// app/(tenant)/dashboard/page.tsx
"use client";

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { api } from '@/services/api'; // Your API instance
import { TenantDetails, TenantDetailsSchema } from '@/prisma'; // Import your TenantDetails DTO and schema
import { LoadingSpinner } from '@/components/ui/loading-spinner'; // Your loading spinner component

export default function TenantDashboardPage() {
  const searchParams = useSearchParams();
  const tenantSlug = searchParams.get('tenantSlug'); // Get the tenant slug from the URL
  const tenantId = searchParams.get('tenantId');

  const [tenantDetails, setTenantDetails] = useState<TenantDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTenantDetails = async () => {
      if (!tenantSlug) {
        //setError('No tenant specified in the URL context.');
        //setLoading(false);
        //return;
      }

      setLoading(true);
      setError(null);
      try {
        // Assuming backend endpoint to get tenant by slug is GET /admin/tenants/by-slug/:slug
        // Or if you only expose by ID, you'd need to convert slug to ID first (e.g., from the list page)
        // For now, let's assume `GET /admin/tenants` supports `slug` as a query param or `/admin/tenants/by-slug/:slug`
        // Or, more commonly, a higher-level admin accesses tenants by ID: `/admin/tenants/:id`
        // For this contextual dashboard, let's assume an endpoint like `/admin/tenants/context/:slug`
        // Or we pass `tenantId` instead of `tenantSlug` from the listing page if you want strict ID-based fetching.
        // Let's modify the link from /admin/tenants slightly to use `tenantId` instead for simplicity in this detail page.

        // REVISION: Given the backend uses IDs primarily for direct access, and the contextual link is for UI purposes,
        // it's better to pass `tenantId` (or both) in the URL.
        // For `/admin/tenants` table, let's update `buildLink` to use `tenantId` in the URL,
        // and this page will fetch using that ID.

        // If you actually need to fetch by slug, your backend must provide a /by-slug endpoint.
        // For now, assuming you'll adjust the link from /admin/tenants/page.tsx to pass `tenantId` (as `contextTenantId`).
         // Re-read parameter name from the useContextualLink hook
        if (!tenantId) {
          setError('No tenant ID specified in the URL context.');
          setLoading(false);
          return;
        }

        // Fetch tenant details using the ID. The backend will enforce SYSTEM_ADMIN/TENANT_ADMIN scope.
        const response = await api.get<TenantDetails>(`/system-admin/tenants/${tenantId}`);
        console.log(response);
        const validatedTenant = TenantDetailsSchema.parse(response.data);
        setTenantDetails(validatedTenant);

      } catch (err: any) {
        const errorMessage = err.response?.data?.message || err.message || "Failed to load tenant details.";
        setError(errorMessage);
        console.error('Fetch tenant details error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTenantDetails();
  }, [tenantSlug, searchParams]); // Rerun effect if tenantSlug or searchParams change

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <p className="text-red-500 text-center mt-8">Error: {error}</p>;
  }

  if (!tenantDetails) {
    return <p className="text-center mt-8">Tenant details not found.</p>;
  }

  return (
    <div className="container mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">
        Overview for Tenant: {tenantDetails.name} ({tenantDetails.tenantCode})
      </h2>
      <p className="text-gray-700 mb-2">ID: {tenantDetails.id}</p>
      <p className="text-gray-700 mb-2">External ID: {tenantDetails.externalId}</p>
      <p className="text-gray-700 mb-2">Sport Type: {tenantDetails.sportType}</p>
      <p className="text-gray-700 mb-2">Status: {tenantDetails.isActive ? 'Active' : 'Inactive'}</p>
      {tenantDetails.description && <p className="text-gray-700 mb-2">Description: {tenantDetails.description}</p>}
      {tenantDetails.establishedYear && <p className="text-gray-700 mb-2">Established: {tenantDetails.establishedYear}</p>}

      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <h3 className="text-xl font-semibold text-blue-800 mb-2">Tenant Specific Features</h3>
        <p className="text-blue-700">
          This dashboard would contain features relevant to this specific tenant,
          such as:
        </p>
        <ul className="list-disc list-inside text-blue-700 mt-2">
          <li>Leagues managed by this tenant</li>
          <li>Users within this tenant</li>
          <li>Tenant-specific settings</li>
          <li>Analytics specific to this tenant's activity</li>
        </ul>
        <p className="text-sm text-blue-600 mt-4">
          The presence of `tenantSlug` (or `contextTenantId`) in the URL
          allows the backend to scope API requests to this tenant.
        </p>
      </div>

      {/* Add more sections for tenant-specific data here */}
    </div>
  );
}
