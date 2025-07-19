// app/(league)/games/page.tsx
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/services/api';
import { GameDetails, GameFilterParams, PaginatedGamesResponseSchema, GameStatus, GameFilterParamsSchema } from '@/schemas';
import { GamesFilters } from '@/components/game/games-filters';
import { Pagination, LoadingSpinner, Button, Badge } from '@/components/ui/';
import { GameCard } from '@/components/ui';
import { toast } from 'sonner';
import { Role } from '@/schemas';
import { useAuthStore } from '@/store/auth.store';
import { useContextualLink } from '@/hooks';
import * as z from 'zod';

export default function LeagueGamesPage() {
  const router = useRouter();
  const { user: userAuth } = useAuthStore();
  const currentUserRoles = userAuth?.roles || [];
    const ctxTenantId = useSearchParams().get('ctxTenantId'); // Use search params if needed
    const ctxLeagueId = useSearchParams().get('ctxLeagueId');
    // Determine current tenant ID based on user roles
    const isSystemAdmin = currentUserRoles.includes(Role.SYSTEM_ADMIN);
    const isTenantAdmin = currentUserRoles.includes(Role.TENANT_ADMIN);
    const isLeagueAdmin = currentUserRoles.includes(Role.LEAGUE_ADMIN);
    const currentTenantId = isSystemAdmin
      ? ctxTenantId
      : isTenantAdmin
      ? userAuth?.tenantId
      : null;
    const currentLeagueId = isSystemAdmin || isTenantAdmin
      ? ctxLeagueId
      : isLeagueAdmin
      ? userAuth?.managingLeagueId
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
    leagueId: currentLeagueId, // Automatically filter by current league ID
  });

  // Update filters when currentLeagueId becomes available
  useEffect(() => {
    if (currentLeagueId && filters.leagueId !== currentLeagueId) {
      setFilters(prev => ({ ...prev, leagueId: currentLeagueId, tenantId: currentTenantId, page: 1 }));
    }
  }, [currentLeagueId, currentTenantId, filters.leagueId]);


  const fetchGames = useCallback(async () => {
    setLoading(true);
    setError(null);
    if (!currentLeagueId) {
      setLoading(false);
      setError("League ID not available. Please log in as a League Admin.");
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
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch games.';
      setError(errorMessage);
      toast.error('Error fetching games', { description: errorMessage });
      console.error('Fetch games error:', err);
    } finally {
      setLoading(false);
    }
  }, [filters, currentLeagueId, currentTenantId]);

  useEffect(() => {
    // Authorization check for League Admin
    if (!userAuth) {
      toast.error("Unauthorized", { description: "You do not have permission to view this page." });
      //router.push('/dashboard');
      return;
    }
    if (currentLeagueId) { // Only fetch if leagueId is available
      fetchGames();
    }
  }, [fetchGames, userAuth, currentUserRoles, router, currentLeagueId]);

  const handleFilterChange = useCallback((newFilters: GameFilterParams) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters,
      tenantId: currentTenantId, // Ensure tenantId remains fixed
      leagueId: currentLeagueId, // Ensure leagueId remains fixed
      page: 1,
    }));
  }, [currentTenantId, currentLeagueId]);

  const handlePageChange = useCallback((newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  }, []);

  const handlePageSizeChange = useCallback((newSize: number) => {
    setFilters(prev => ({ ...prev, pageSize: newSize, page: 1 }));
  }, []);

  const getStatusBadge = (status: GameStatus, score?: { home: number; away: number }) => {
    switch (status) {
      case GameStatus.IN_PROGRESS:
        return <Badge variant="destructive" className="animate-pulse">Live</Badge>;
      case GameStatus.COMPLETED:
        return <Badge variant="success">Final</Badge>;
      case GameStatus.SCHEDULED:
        return <Badge variant="outline">Upcoming</Badge>;
      case GameStatus.CANCELLED:
        return <Badge variant="destructive">Cancelled</Badge>;
      case GameStatus.POSTPONED:
        return <Badge variant="secondary">Postponed</Badge>;
      default:
        return null;
    }
  };

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
          <p className="text-muted-foreground text-gray-600">View and manage games within your league.</p>
        </div>
        <div className="flex justify-between items-center">
          <GamesFilters
            filters={filters}
            onFilterChange={handleFilterChange}
            onPageSizeChange={handlePageSizeChange}
            fixedTenantId={currentTenantId} // Pass fixed tenant ID
            fixedLeagueId={currentLeagueId} // Pass fixed league ID to filters
          />
          <Link href="/game/create" passHref>
            <Button variant="primary" className='whitespace-nowrap'>Create New Game</Button>
          </Link>
        </div>
      </div>

      {games.length === 0 ? (
        <p className="text-center text-gray-500 mt-8">No games found matching your criteria.</p>
      ) : (
        <div className="mt-4">
          {games.map((game) => (
            <GameCard
              key={game.id}
              game={game}
              buildLink={buildLink}
              getStatusBadge={getStatusBadge}
              //ctxTenantId={currentTenantId}
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
