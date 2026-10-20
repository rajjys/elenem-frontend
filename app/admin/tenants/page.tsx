// app/(admin)/tenants/page.tsx
"use client";

import React, { useState } from 'react';
import { useTenants } from '@/services/tenants';
import { TenantFilterParams } from '@/schemas';
import { TenantFilters } from '@/components/tenant/tenant-filters';
import { TenantsTable } from '@/components/tenant/tenants-table';
import { Pagination } from '@/components/ui/';
import { LoadingSpinner } from '@/components/ui/';
import { DeleteDialog } from '@/components/deletion';

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

  // The product's dialog, not the browser's: it says what the delete would take with it, or why
  // it is refused, from the API (RESOURCE_DELETION.md §8, R2).
  const [toDelete, setToDelete] = useState<string | null>(null);
  const handleDeleteTenant = (id: string) => setToDelete(id);

  return (
    <div className="container mx-auto p-6">
      {isError && <p className='text-negative pb-2'>Erreur: Failed to fetch tenants.</p>}
      <div className="flex justify-between items-center mb-4">
        <TenantFilters
          filters={filters}
          onFilterChange={handleFilterChange}
          onPageSizeChange={handlePageSizeChange}
        />
        {/* No create button: organisations are created by signing up (/register), and the old
            creation form this opened is gone (PHASE5A_PRODUCT_SITE §2). */}
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
      <DeleteDialog
        resource="tenant"
        id={toDelete}
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
      />
    </div>
  );
}
