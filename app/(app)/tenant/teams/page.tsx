// app/(tenant)/teams/page.tsx
"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { api } from '@/services/api';
import { TeamDetails, TeamFilterParams, TeamFilterParamsSchema, Roles, SortableColumn } from '@/schemas/';
import { TeamsFilters, TeamsTable } from '@/components/team/';
import { Pagination, LoadingSpinner } from '@/components/ui/';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/auth.store';
import { useSearchParams } from 'next/navigation';
import { Plus } from 'lucide-react';
import { useContextualLink } from '@/hooks';

export default function TenantTeamsPage() {
  const { user: userAuth } = useAuthStore();
  const currentUserRoles = useMemo(() => userAuth?.roles || [], [userAuth?.roles]);
  const ctxTenantId = useSearchParams().get('ctxTenantId'); // Use search params if needed
      // Determine current tenant ID based on user roles
      const isSystemAdmin = currentUserRoles.includes(Roles.SYSTEM_ADMIN);
      const isTenantAdmin = currentUserRoles.includes(Roles.TENANT_ADMIN);
      
      const currentTenantId = isSystemAdmin
      ? ctxTenantId
      : isTenantAdmin
      ? userAuth?.tenantId
      : null;
  const currentLeagueId = userAuth?.managingLeagueId; // Not directly used for filtering here, but passed to table
  const { buildLink } = useContextualLink();
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
    } catch (error) {
      const errorMessage = 'Failed to fetch teams.';
      setError(errorMessage);
      toast.error('Error fetching teams', { description: errorMessage });
      console.error('Fetch teams error:', error);
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
  }, [fetchTeams, currentTenantId]);

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
    } catch (error) {
      const errorMessage = 'Failed to delete team.';
      toast.error('Error deleting team', { description: errorMessage });
      console.error('Delete team error:', error);
    }
  }, [fetchTeams]);

  if (loading && !teams.length) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <p className="text-red-500 text-center mt-8">Error: {error}</p>;
  }

  return (
    <div className="container mx-auto">
      <div className="flex justify-between items-center mb-4">
        <TeamsFilters
          filters={filters}
          onFilterChange={handleFilterChange}
          onPageSizeChange={handlePageSizeChange}
          fixedTenantId={currentTenantId} // Pass fixed tenant ID to filters
        />
        <Link href={buildLink("/league/create")} className="flex items-center text-sm gap-2 px-3 py-2 rounded-md transition-all duration-150 soft-theme-gradient">
          <Plus className="h-4 w-4"/>
          <span className="whitespace-nowrap">Nouvelle Equipe</span>
        </Link>
      </div>
      <span hidden>{totalItems} Teams</span>
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