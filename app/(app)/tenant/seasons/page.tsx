"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/services/api';
import { SeasonResponseDto, SeasonFilterParams, PaginatedSeasonsResponseSchema, SeasonFilterParamsSchema, SeasonSortableColumn } from '@/schemas';
import { SeasonsFilters } from '@/components/season/seasons-filters';
import { SeasonsTable } from '@/components/season/seasons-table';
import { Pagination } from '@/components/ui/pagination';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Roles } from '@/schemas';
import { useAuthStore } from '@/store/auth.store';
import axios from 'axios';
export default function TenantSeasonsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const currentUserRoles = user?.roles || [];
  const currentTenantId = user?.tenantId; // Tenant Admin's tenant ID
  const currentLeagueId = user?.managingLeagueId;

  const [seasons, setSeasons] = useState<SeasonResponseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState<SeasonFilterParams>({
    page: 1,
    pageSize: 10,
    sortBy: 'createdAt',
    sortOrder: 'desc',
    tenantId: currentTenantId, // Automatically filter by current tenant ID
  });

  // Update filters when currentTenantId becomes available
  useEffect(() => {
    if (currentTenantId && filters.tenantId !== currentTenantId) {
      setFilters(prev => ({ ...prev, tenantId: currentTenantId, page: 1 }));
    }
  }, [currentTenantId, filters.tenantId]);

  const fetchSeasons = useCallback(async () => {
    setLoading(true);
    setError(null);
    if (!currentTenantId) {
      setLoading(false);
      setError("Tenant ID not available. Please log in as a Tenant Admin.");
      return;
    }

    try {
      const validatedFilters = SeasonFilterParamsSchema.parse(filters);
      const params = new URLSearchParams();

      Object.entries(validatedFilters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          if (Array.isArray(value)) {
            value.forEach(item => params.append(key, String(item)));
          } else {
            params.append(key, String(value));
          }
        }
      });

      const response = await api.get(`/seasons?${params.toString()}`);
      const validatedData = PaginatedSeasonsResponseSchema.parse(response.data);

      setSeasons(validatedData.data as SeasonResponseDto[]);
      setTotalItems(validatedData.totalItems);
      setTotalPages(validatedData.totalPages);
    } catch (error) {
      let errorMessage = "Filed to fetch seasons. Please try again later.";
        if (axios.isAxiosError(error)) {
            errorMessage = error.response?.data?.message || errorMessage;
        }
        setError(errorMessage);
        toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [filters, currentTenantId]);

  useEffect(() => {
    // Authorization check for Tenant Admin
    if (!user || !currentUserRoles.includes(Roles.TENANT_ADMIN)) {
      toast.error("Unauthorized", { description: "You do not have permission to view this page." });
      router.push('/dashboard');
      return;
    }
    if (currentTenantId) { // Only fetch if tenantId is available
      fetchSeasons();
    }
  }, [fetchSeasons, user, currentUserRoles, router, currentTenantId]);

  const handleFilterChange = useCallback((newFilters: SeasonFilterParams) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters,
      tenantId: currentTenantId, // Ensure tenantId remains fixed
      page: 1,
    }));
  }, [currentTenantId]);

  const handlePageChange = useCallback((newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  }, []);

  const handlePageSizeChange = useCallback((newSize: number) => {
    setFilters(prev => ({ ...prev, pageSize: newSize, page: 1 }));
  }, []);

  const handleSort = useCallback((column: SeasonSortableColumn) => {
    setFilters(prev => ({
      ...prev,
      sortBy: column,
      sortOrder: prev.sortBy === column && prev.sortOrder === 'asc' ? 'desc' : 'asc',
      page: 1,
    }));
  }, []);

  const handleDeleteSeason = useCallback(async (seasonId: string) => {
    const confirmed = window.confirm('Are you sure you want to delete this season? This action cannot be undone.');
    if (!confirmed) {
      return;
    }

    try {
      await api.delete(`/seasons/${seasonId}`);
      toast.success('Season deleted successfully.');
      fetchSeasons();
    } catch (error) {
      const errorMessage = 'Failed to delete season.';
      toast.error('Error deleting season', { description: errorMessage });
      console.error('Delete season error:', error);
    }
  }, [fetchSeasons]);

  if (loading && !seasons.length) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <p className="text-red-500 text-center mt-8">Error: {error}</p>;
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-4">
        <SeasonsFilters
          filters={filters}
          onFilterChange={handleFilterChange}
          onPageSizeChange={handlePageSizeChange}
          fixedTenantId={currentTenantId} // Pass fixed tenant ID to filters
        />
        <Link href="/season/create" passHref>
          <Button variant="primary" className='whitespace-nowrap'>Create New Season</Button>
        </Link>
      </div>
      <span hidden>{totalItems} Seasons</span>
      <SeasonsTable
        seasons={seasons}
        onSort={handleSort}
        sortBy={filters.sortBy || 'createdAt'}
        sortOrder={filters.sortOrder || 'desc'}
        onDelete={handleDeleteSeason}
        currentUserRoles={currentUserRoles}
        currentTenantId={currentTenantId}
        currentLeagueId={currentLeagueId}
      />
      <Pagination
        currentPage={filters.page || 1}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />
    </div>
  );
}
