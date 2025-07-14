// app/(admin)/tenants/page.tsx
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/services/api'; // Your actual API instance
import { TenantBasic, PaginatedTenantsResponseSchema, TenantFilterParams } from '@/schemas'// Your actual Prisma types and schemas
import { TenantFilters } from '@/components/tenant/tenant-filters'; // Your new TenantFilters component
import { TenantsTable } from '@/components/tenant/tenants-table'; // Your new TenantsTable component
import { Pagination } from '@/components/ui/'; // Your Pagination component
import { LoadingSpinner } from '@/components/ui/loading-spinner'; // Your LoadingSpinner component
import { Button } from '@/components/ui/button'; // Your Button component
import { toast } from 'sonner'; // Your toast notification library (e.g., Sonner)
import z from 'zod'; // Your Zod library

export default function AdminTenantsPage() {
  const router = useRouter();
  const [tenants, setTenants] = useState<TenantBasic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState<TenantFilterParams>({
    page: 1,
    pageSize: 10,
    sortBy: 'createdAt', // Default sort
    sortOrder: 'desc',   // Default sort order
  });

  const fetchTenants = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      // Append filters to URLSearchParams
      if (filters.search) params.append('search', filters.search);
      if (filters.isActive !== undefined) params.append('isActive', String(filters.isActive));
      if (filters.tenantType) params.append('tenantType', filters.tenantType);
      if (filters.sportType) params.append('sportType', filters.sportType);
      if (filters.country) params.append('country', filters.country);
      if (filters.page) params.append('page', String(filters.page));
      if (filters.pageSize) params.append('pageSize', String(filters.pageSize));
      if (filters.sortBy) params.append('sortBy', filters.sortBy);
      if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);

      const response = await api.get(`/tenants?${params.toString()}`);
      // Validate data with Zod schema
      // Assuming your backend response for tenants is paginated and directly maps to PaginatedTenantsResponseSchema
      const validatedData = PaginatedTenantsResponseSchema.parse(response.data);

      setTenants(validatedData.data);
      setTotalItems(validatedData.totalItems);
      setTotalPages(validatedData.totalPages);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch tenants.';
      setError(errorMessage);
      toast.error('Error fetching tenants', { description: errorMessage });
      console.error('Fetch tenants error:', err);
    } finally {
      setLoading(false);
    }
  }, [filters]); // Dependency on filters to re-fetch when filters change

  useEffect(() => {
    fetchTenants();
  }, [fetchTenants]); // Re-fetch when fetchTenants callback changes (due to filters)

  // Use useCallback for handler functions to prevent unnecessary re-renders in child components
  const handleFilterChange = (newFilters: TenantFilterParams) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters,
      page: 1, // Reset to first page on any filter change
    }));
  };

  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  const handlePageSizeChange = (newSize: number) => {
    setFilters(prev => ({ ...prev, pageSize: newSize, page: 1 })); // Reset page to 1
  };

  type SortableColumn = 'name' | 'tenantCode' | 'tenantType'| 'sportType' | 'country' | 'ownerUsername' | 'createdAt' | 'updatedAt';
  const handleSort = (column: SortableColumn) => {
    setFilters(prev => ({
      ...prev,
      sortBy: column,
      sortOrder: prev.sortBy === column && prev.sortOrder === 'asc' ? 'desc' : 'asc',
      page: 1, // Reset to first page on sort change
    }));
  };

  const handleDeleteTenant = async (tenantId: string) => {
    // Replacing window.confirm with a toast for non-blocking confirmation.
    // In a production app, use a dedicated custom modal for user confirmation.
    const confirmed = window.confirm('Are you sure you want to delete this tenant? This action cannot be undone.'); // Using window.confirm temporarily for demonstration
    if (!confirmed) {
      return;
    }

    try {
      await api.delete(`/tenants/${tenantId}`); // Your actual DELETE API call
      toast.success('Tenant deleted successfully.');
      fetchTenants(); // Re-fetch tenants to update the list
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to delete tenant.';
      toast.error('Error deleting tenant', { description: errorMessage });
      console.error('Delete tenant error:', err);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-4">
        <TenantFilters
          filters={filters}
          onFilterChange={handleFilterChange}
          onPageSizeChange={handlePageSizeChange}
        />
        <Link href="/tenant/create" passHref>
          <Button variant="primary" className='whitespace-nowrap'>Create New Tenant</Button>
        </Link>
      </div>

      {/* Tenant Filters component */}
  

      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <p className="text-red-500 text-center mt-8">Error: {error}</p>
      ) : (
        <>
          <TenantsTable
            tenants={tenants}
            onSort={handleSort}
            sortBy={filters.sortBy || 'createdAt'}
            sortOrder={filters.sortOrder || 'desc'}
            onDelete={handleDeleteTenant}
          />
          <Pagination
            currentPage={filters.page || 1}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </>
      )}
    </div>
  );
}
