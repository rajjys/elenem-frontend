"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/services/api'; // Your actual API instance
import { SeasonResponseDto, SeasonFilterParams, PaginatedSeasonsResponseSchema, SeasonFilterParamsSchema, SeasonSortableColumn } from '@/schemas'; // Your Season DTOs and schemas
import { SeasonsTable, SeasonsFilters } from '@/components/season/'; // Your new SeasonsTable component
import { Pagination } from '@/components/ui/'; // Your Pagination component
import { LoadingSpinner } from '@/components/ui/'; // Your LoadingSpinner component
import { Button } from '@/components/ui/'; // Your Button component
import { toast } from 'sonner'; // Your toast notification library (e.g., Sonner)
import { Role } from '@/schemas';
import { useAuthStore } from '@/store/auth.store'; // Auth store to get user roles

export default function AdminSeasonsPage() {
  const router = useRouter();
  const { user } = useAuthStore(); // Get user from auth store
  const currentUserRoles = user?.roles || [];
  const currentTenantId = user?.tenantId;
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
  });

  const fetchSeasons = useCallback(async () => {
    setLoading(true);
    setError(null);
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
      const errorMessage = 'Failed to fetch seasons.';
      setError(errorMessage);
      toast.error('Error fetching seasons', { description: errorMessage });
      console.error('Fetch seasons error:', error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    // Authorization check for System Admin
    if (!user || !currentUserRoles.includes(Role.SYSTEM_ADMIN)) {
      toast.error("Unauthorized", { description: "You do not have permission to view this page." });
      router.push('/dashboard'); // Redirect to a suitable page
      return;
    }
    fetchSeasons();
  }, [fetchSeasons, user, currentUserRoles, router]);

  const handleFilterChange = useCallback((newFilters: SeasonFilterParams) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters,
      page: 1, // Reset to first page on any filter change
    }));
  }, []);

  const handlePageChange = useCallback((newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  }, []);

  const handlePageSizeChange = useCallback((newSize: number) => {
    setFilters(prev => ({ ...prev, pageSize: newSize, page: 1 })); // Reset page to 1
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
      await api.delete(`/seasons/${seasonId}`); // Assuming DELETE API call
      toast.success('Season deleted successfully.');
      fetchSeasons(); // Re-fetch seasons to update the list
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
          // No fixedTenantId or fixedLeagueId for System Admin page
        />
        <Link href="/season/create" passHref>
          <Button variant="primary" className='whitespace-nowrap'>Create New Season</Button>
        </Link>
      </div>
      <span hidden>{totalItems}</span>
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
