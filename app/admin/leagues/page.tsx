// app/(admin)/leagues/page.tsx
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/services/api'; // Your actual API instance
import { LeagueBasic, PaginatedLeaguesResponseSchema, LeagueFilterParams } from '@/schemas/league-schemas'; // Your actual League types and schemas
import { LeagueFilters } from '@/components/league/league-filters'; // Your new LeagueFilters component
import { LeaguesTable } from '@/components/league/leagues-table'; // Your new LeaguesTable component
import { Pagination } from '@/components/ui/'; // Your Pagination component
import { LoadingSpinner } from '@/components/ui/loading-spinner'; // Your LoadingSpinner component
import { Button } from '@/components/ui/button'; // Your Button component
import { toast } from 'sonner'; // Your toast notification library (e.g., Sonner)
import z from 'zod'; // Your Zod library

export default function AdminLeaguesPage() {
  const router = useRouter();
  const [leagues, setLeagues] = useState<LeagueBasic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState<LeagueFilterParams>({
    page: 1,
    pageSize: 10,
    sortBy: 'createdAt', // Default sort
    sortOrder: 'desc',   // Default sort order
  });

  const fetchLeagues = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      // Append filters to URLSearchParams based on LeagueFilterParams
      if (filters.search) params.append('search', filters.search);
      if (filters.tenantIds && filters.tenantIds.length > 0) {
        filters.tenantIds.forEach(id => params.append('tenantIds', id));
      }
      if (filters.leagueIds && filters.leagueIds.length > 0) {
        filters.leagueIds.forEach(id => params.append('leagueIds', id));
      }
      if (filters.sportType) params.append('sportType', filters.sportType);
      if (filters.country) params.append('country', filters.country);
      if (filters.visibility) params.append('visibility', filters.visibility);
      if (filters.isActive !== undefined) params.append('isActive', String(filters.isActive)); // Use 'isActive' as per your DTO/model
      if (filters.gender) params.append('gender', filters.gender);
      if (filters.parentLeagueId) params.append('parentLeagueId', filters.parentLeagueId);
      if (filters.division) params.append('division', filters.division);
      if (filters.establishedYear !== undefined) params.append('establishedYear', String(filters.establishedYear));
      if (filters.page) params.append('page', String(filters.page));
      if (filters.pageSize) params.append('pageSize', String(filters.pageSize));
      if (filters.sortBy) params.append('sortBy', filters.sortBy);
      if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);
      //console.log('Fetching leagues with params:', params.toString());
      // Your actual API call to list leagues
      const response = await api.get(`/leagues?${params.toString()}`);
      // Validate data with Zod schema
      console.log('Leagues response:', response.data);
      const validatedData = PaginatedLeaguesResponseSchema.parse(response.data);

      setLeagues(validatedData.data);
      setTotalItems(validatedData.totalItems);
      setTotalPages(validatedData.totalPages);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch leagues.';
      setError(errorMessage);
      toast.error('Error fetching leagues', { description: errorMessage });
      console.error('Fetch leagues error:', err);
    } finally {
      setLoading(false);
    }
  }, [filters]); // Dependency on filters to re-fetch when filters change

  useEffect(() => {
    fetchLeagues();
  }, [fetchLeagues]); // Re-fetch when fetchLeagues callback changes (due to filters)

  // Use useCallback for handler functions to prevent unnecessary re-renders in child components
  const handleFilterChange = useCallback((newFilters: LeagueFilterParams) => {
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

  type SortableColumn = 'name' | 'leagueCode' | 'sportType' | 'country' | 'ownerUsername' | 'createdAt' | 'updatedAt' | 'division' | 'establishedYear';
  const handleSort = useCallback((column: SortableColumn) => {
    setFilters(prev => ({
      ...prev,
      sortBy: column,
      sortOrder: prev.sortBy === column && prev.sortOrder === 'asc' ? 'desc' : 'asc',
      page: 1, // Reset to first page on sort change
    }));
  }, []);

  const handleDeleteLeague = useCallback(async (leagueId: string) => {
    // Replacing window.confirm with a toast for non-blocking confirmation.
    // In a production app, use a dedicated custom modal for user confirmation.
    const confirmed = window.confirm('Are you sure you want to delete this league? This action cannot be undone.'); // Using window.confirm temporarily for demonstration
    if (!confirmed) {
      return;
    }

    try {
      await api.delete(`/leagues/${leagueId}`); // Your actual DELETE API call
      toast.success('League deleted successfully.');
      fetchLeagues(); // Re-fetch leagues to update the list
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to delete league.';
      toast.error('Error deleting league', { description: errorMessage });
      console.error('Delete league error:', err);
    }
  }, [fetchLeagues]); // fetchLeagues is a dependency because it's called inside

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-4">
        {/* League Filters component */}
        <LeagueFilters
          filters={filters}
          onFilterChange={handleFilterChange}
          onPageSizeChange={handlePageSizeChange}
        />
        <Link href="/admin/leagues/create" passHref>
          <Button variant="primary" className='whitespace-nowrap'>Create New League</Button>
        </Link>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <p className="text-red-500 text-center mt-8">Error: {error}</p>
      ) : (
        <>
          <LeaguesTable
            leagues={leagues}
            onSort={handleSort}
            sortBy={filters.sortBy || 'createdAt'}
            sortOrder={filters.sortOrder || 'desc'}
            onDelete={handleDeleteLeague}
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
