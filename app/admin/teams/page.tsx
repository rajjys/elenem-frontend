// app/(admin)/teams/page.tsx
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/services/api'; // Your actual API instance
import { PaginatedTeamsResponseSchema, SortableColumn, TeamDetails, TeamDetailsSchema, TeamFilterParams, TeamFilterParamsSchema } from '@/schemas'; // Your new filter schema
import { TeamsFilters, TeamsTable } from '@/components/team/'; // Your new TeamsFilters component
import { Pagination, LoadingSpinner, Button } from '@/components/ui/'; // Your Pagination component
import { toast } from 'sonner'; // Your toast notification library (e.g., Sonner)
import { Role } from '@/schemas';
import { useAuthStore } from '@/store/auth.store'; // Auth store to get user roles

export default function AdminTeamsPage() {
  const router = useRouter();
  const { user } = useAuthStore(); // Get user from auth store
  const currentUserRoles = user?.roles || [];
  const currentTenantId = user?.tenantId;
  const currentLeagueId = user?.managingLeagueId;

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
  });

  const fetchTeams = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Validate filters with Zod before sending to API
      const validatedFilters = TeamFilterParamsSchema.parse(filters);
      const params = new URLSearchParams();

      // Append filters to URLSearchParams
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
  }, [filters]);

  useEffect(() => {
    // Authorization check for System Admin
    if (!user || !currentUserRoles.includes(Role.SYSTEM_ADMIN)) {
      toast.error("Unauthorized", { description: "You do not have permission to view this page." });
      router.push('/dashboard'); // Redirect to a suitable page
      return;
    }
    fetchTeams();
  }, [fetchTeams, user, currentUserRoles, router]);

  const handleFilterChange = useCallback((newFilters: TeamFilterParams) => {
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

  const handleSort = useCallback((column: SortableColumn) => {
    setFilters(prev => ({
      ...prev,
      sortBy: column,
      sortOrder: prev.sortBy === column && prev.sortOrder === 'asc' ? 'desc' : 'asc',
      page: 1, // Reset to first page on sort change
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
      fetchTeams(); // Re-fetch teams to update the list
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to delete team.';
      toast.error('Error deleting team', { description: errorMessage });
      console.error('Delete team error:', err);
    }
  }, [fetchTeams]);

  if (loading && !teams.length) { // Show loading spinner only if no teams are loaded yet
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
          // No fixedTenantId or fixedLeagueId for System Admin page
        />
        <Link href="/admin/teams/create" passHref>
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