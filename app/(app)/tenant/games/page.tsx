// app/(tenant)/games/page.tsx
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/services/api';
import { GameDetails, GameFilterParams, PaginatedGamesResponseSchema, GameFilterParamsSchema } from '@/schemas';
import { GamesFilters } from '@/components/game/games-filters';
import { Pagination, LoadingSpinner, Button, getStatusBadge } from '@/components/ui/';
import { GameCard } from '@/components/ui';
import { toast } from 'sonner';
import { Roles } from '@/schemas';
import { useAuthStore } from '@/store/auth.store';
import { useContextualLink } from '@/hooks';
import axios from 'axios';

export default function TenantGamesPage() {
  const router = useRouter();
  const { user: userAuth } = useAuthStore();
  const currentUserRoles = userAuth?.roles || [];
  const ctxTenantId = useSearchParams().get('ctxTenantId'); // Use search params if needed
  // Determine current tenant ID based on user roles
  const isSystemAdmin = currentUserRoles.includes(Roles.SYSTEM_ADMIN);
  const isTenantAdmin = currentUserRoles.includes(Roles.TENANT_ADMIN);
  
  const currentTenantId = isSystemAdmin
    ? ctxTenantId
    : isTenantAdmin
    ? userAuth?.tenantId
    : null;
  const { buildLink } = useContextualLink();

  const [games, setGames] = useState<GameDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState<GameFilterParams>({
    page: 1,
    pageSize: 12,
    sortBy: 'dateTime',
    sortOrder: 'asc',
    tenantId: currentTenantId, // Automatically filter by current tenant ID
  });

  // Update filters when currentTenantId becomes available
  useEffect(() => {
    if (currentTenantId && filters.tenantId !== currentTenantId) {
      setFilters(prev => ({ ...prev, tenantId: currentTenantId, page: 1 }));
    }
  }, [currentTenantId, filters.tenantId]);

  const fetchGames = useCallback(async () => {
    setLoading(true);
    setError(null);
    if (!currentTenantId) {
      setLoading(false);
      setError("Tenant ID not available. Please log in as a Tenant Admin.");
      return;
    }
    try {
      const validatedFilters = GameFilterParamsSchema.parse(filters);
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
      const response = await api.get(`/games?${params.toString()}`);
      const validatedData = PaginatedGamesResponseSchema.parse(response.data);

      setGames(validatedData.data);
      setTotalItems(validatedData.totalItems);
      setTotalPages(validatedData.totalPages);
    } catch (error) {
        let errorMessage = "Error fetching games";
        if (axios.isAxiosError(error)) {
          errorMessage = error.response?.data?.message || errorMessage;
        }
        toast.error(errorMessage);
        console.error(error);
    } finally {
      setLoading(false);
    }
  }, [filters, currentTenantId]);

  useEffect(() => {
    if (currentTenantId) { // Only fetch if tenantId is available
      fetchGames();
    }
  }, [fetchGames, userAuth, router, currentTenantId]);

  const handleFilterChange = useCallback((newFilters: GameFilterParams) => {
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

  if (loading && !games.length) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <p className="text-red-500 text-center mt-8">Error: {error}</p>;
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex flex-col space-y-4 mb-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Games</h1>
          <p className="text-muted-foreground text-gray-600">View and manage games within your tenant.</p>
        </div>
        <div className="flex justify-between items-center">
          <GamesFilters
            filters={filters}
            onFilterChange={handleFilterChange}
            onPageSizeChange={handlePageSizeChange}
            fixedTenantId={currentTenantId} // Pass fixed tenant ID to filters
          />
          <Link href={buildLink("/game/create")} passHref>
            <Button variant="primary" className='whitespace-nowrap'>Create New Game</Button>
          </Link>
        </div>
      </div>

      {games.length === 0 ? (
        <p className="text-center text-gray-500 mt-8">No games found matching your criteria.</p>
      ) : (
        <div className="mt-4">
          <span hidden>{totalItems} Games</span>
          {games.map((game) => (
            <GameCard
              key={game.id}
              game={game}
              buildLink={buildLink}
              getStatusBadge={getStatusBadge}
              ///ctxTenantId={currentTenantId}
              //ctxLeagueId={currentLeagueId}
              //ctxSeasonId={currentSeasonId}
              //ctxTeamId={currentTeamId}
            />
          ))}
        </div>
      )}

      <Pagination
        currentPage={filters.page || 1}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />
    </div>
  );
}
