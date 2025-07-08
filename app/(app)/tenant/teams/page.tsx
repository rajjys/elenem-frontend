// app/(tenant)/teams/page.tsx
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/services/api';
import { TeamDetails, TeamFilterParams, TeamFilterParamsSchema, Role, SortableColumn } from '@/schemas/';
import { TeamsFilters, TeamsTable } from '@/components/team/';
import { Pagination, LoadingSpinner, Button } from '@/components/ui/';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/auth.store';

export default function TenantTeamsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const currentUserRoles = user?.roles || [];
  const currentTenantId = user?.tenantId; // Tenant Admin's tenant ID
  const currentLeagueId = user?.managingLeagueId; // Not directly used for filtering here, but passed to table

  const [teams, setTeams] = useState<TeamDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState<TeamFilterParams>({
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

  const fetchTeams = useCallback(async () => {
    setLoading(true);
    setError(null);
    if (!currentTenantId) {
      setLoading(false);
      setError("Tenant ID not available. Please log in as a Tenant Admin.");
      return;
    }

    try {
      const validatedFilters = TeamFilterParamsSchema.parse(filters);
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

      const response = await api.get(`/teams?${params.toString()}`);
            // Assuming your API returns data in { data: [], totalItems, totalPages, currentPage, pageSize } format
            //const validatedData = PaginatedTeamsResponseSchema.parse(response.data);
            const validatedData = response.data;
      
            setTeams(validatedData.data); //
            setTotalItems(validatedData.totalItems);
            setTotalPages(validatedData.totalPages);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch teams.';
      setError(errorMessage);
      toast.error('Error fetching teams', { description: errorMessage });
      console.error('Fetch teams error:', err);
    } finally {
      setLoading(false);
    }
  }, [filters, currentTenantId]);

  useEffect(() => {
    // Authorization check for Tenant Admin
    //if (!user || !currentUserRoles.includes(Role.TENANT_ADMIN)) {
      //toast.error("Unauthorized", { description: "You do not have permission to view this page." });
      //router.push('/dashboard');
     // return;
    //}
    if (currentTenantId) { // Only fetch if tenantId is available
      fetchTeams();
    }
  }, [fetchTeams, user, currentUserRoles, router, currentTenantId]);

  const handleFilterChange = useCallback((newFilters: TeamFilterParams) => {
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

  const handleSort = useCallback((column: SortableColumn) => {
    setFilters(prev => ({
      ...prev,
      sortBy: column,
      sortOrder: prev.sortBy === column && prev.sortOrder === 'asc' ? 'desc' : 'asc',
      page: 1,
    }));
  }, []);

  const handleDeleteTeam = useCallback(async (teamId: string) => {
    const confirmed = window.confirm('Are you sure you want to delete this team? This action cannot be undone.');
    if (!confirmed) {
      return;
    }

    try {
      await api.delete(`/teams/${teamId}`);
      toast.success('Team deleted successfully.');
      fetchTeams();
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to delete team.';
      toast.error('Error deleting team', { description: errorMessage });
      console.error('Delete team error:', err);
    }
  }, [fetchTeams]);

  if (loading && !teams.length) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <p className="text-red-500 text-center mt-8">Error: {error}</p>;
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-4">
        <TeamsFilters
          filters={filters}
          onFilterChange={handleFilterChange}
          onPageSizeChange={handlePageSizeChange}
          fixedTenantId={currentTenantId} // Pass fixed tenant ID to filters
        />
        <Link href="/tenant/teams/create" passHref>
          <Button variant="primary" className='whitespace-nowrap'>Create New Team</Button>
        </Link>
      </div>

      <TeamsTable
        teams={teams}
        onSort={handleSort}
        sortBy={filters.sortBy || 'createdAt'}
        sortOrder={filters.sortOrder || 'desc'}
        onDelete={handleDeleteTeam}
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