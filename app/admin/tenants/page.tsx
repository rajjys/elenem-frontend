// app/(admin)/tenants/page.tsx
"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useTenants, useDeleteTenant } from '@/services/tenants';
import { toastApiError } from '@/utils';
import { TenantFilterParams } from '@/schemas';
import { TenantFilters } from '@/components/tenant/tenant-filters';
import { TenantsTable } from '@/components/tenant/tenants-table';
import { Pagination } from '@/components/ui/';
import { LoadingSpinner } from '@/components/ui/';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function AdminTenantsPage() {
  const [filters, setFilters] = useState<TenantFilterParams>({
    page: 1,
    pageSize: 10,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  // Server state is owned by React Query: caching, dedup, loading/error, and
  // keepPreviousData for smooth pagination — no useEffect/useState fetch triad.
  const { data, isLoading, isError } = useTenants(filters);
  const deleteTenant = useDeleteTenant();

  const tenants = data?.data ?? [];
  const totalItems = data?.totalItems ?? 0;
  const totalPages = data?.totalPages ?? 1;

  const handleFilterChange = (newFilters: TenantFilterParams) => {
    setFilters(prev => ({ ...prev, ...newFilters, page: 1 }));
  };

  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  const handlePageSizeChange = (newSize: number) => {
    setFilters(prev => ({ ...prev, pageSize: newSize, page: 1 }));
  };

  type SortableColumn = 'name' | 'tenantCode' | 'tenantType' | 'sportType' | 'country' | 'ownerUsername' | 'createdAt' | 'updatedAt';
  const handleSort = (column: SortableColumn) => {
    setFilters(prev => ({
      ...prev,
      sortBy: column,
      sortOrder: prev.sortBy === column && prev.sortOrder === 'asc' ? 'desc' : 'asc',
      page: 1,
    }));
  };

  const handleDeleteTenant = (tenantId: string) => {
    const confirmed = window.confirm('Are you sure you want to delete this tenant? This action cannot be undone.');
    if (!confirmed) return;

    deleteTenant.mutate(tenantId, {
      onSuccess: () => toast.success('Organisation supprimee avec success.'),
      onError: (error) => toastApiError(error, "Erreur lors de la suppression de l'organisation."),
    });
  };

  return (
    <div className="container mx-auto p-6">
      {isError && <p className='text-negative pb-2'>Erreur: Failed to fetch tenants.</p>}
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

      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <>
          <span hidden>{totalItems} Tenants</span>
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
