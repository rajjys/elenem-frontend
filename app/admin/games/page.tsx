// app/(admin)/games/page.tsx
"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/services/api'; // Your actual API instance
import { GameDetails, GameFilterParams, PaginatedGamesResponseSchema, GameFilterParamsSchema } from '@/schemas'; // Your Game DTOs and schemas
import { GamesFilters } from '@/components/game/games-filters'; // Your new GamesFilters component
import { Pagination, LoadingSpinner, Button } from '@/components/ui/'; // Your Pagination components
import { GameCard } from '@/components/ui'; // Your existing GameCard component
import { toast } from 'sonner'; // Your toast notification library (e.g., Sonner)
import { Roles } from '@/schemas'; // Assuming Role enum is here
import { useAuthStore } from '@/store/auth.store'; // Auth store to get user roles
import { useContextualLink } from '@/hooks'; // Your useContextualLink hook

export default function AdminGamesPage() {
  const router = useRouter();
  const { user: userAuth } = useAuthStore(); // Get user from auth store
  const currentUserRoles = useMemo(() => userAuth?.roles || [], [userAuth?.roles]);;
  //const currentTenantId = user?.tenantId;
  //const currentLeagueId = user?.managingLeagueId;
  //const currentSeasonId = user?.managingSeasonId; // Assuming user might have a managingSeasonId
  //const currentTeamId = user?.managingTeamId; // Assuming user might have a managingTeamId

  const { buildLink } = useContextualLink();

  const [games, setGames] = useState<GameDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState<GameFilterParams>({
    page: 1,
    pageSize: 12, // Default to 12 for grid display
    sortBy: 'dateTime', // Assuming games are sorted by date/time
    sortOrder: 'asc',
  });

  const fetchGames = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Validate filters with Zod before sending to API
      const validatedFilters = GameFilterParamsSchema.parse(filters);
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
      const response = await api.get(`/games?${params.toString()}`);
      // Assuming your API returns data in { data: [], totalItems, totalPages, currentPage, pageSize } format
      const validatedData = PaginatedGamesResponseSchema.parse(response.data);
      
      setGames(validatedData.data);
      setTotalItems(validatedData.totalItems);
      setTotalPages(validatedData.totalPages);
    } catch (error) {
      const errorMessage = 'Failed to fetch games.';
      setError(errorMessage);
      toast.error('Error fetching games', { description: errorMessage });
      console.error('Fetch games error:', error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    // Authorization check for System Admin
    if (!userAuth || !currentUserRoles.includes(Roles.SYSTEM_ADMIN)) {
      toast.error("Unauthorized", { description: "You do not have permission to view this page." });
      // router.push('/dashboard'); // Uncomment to redirect
      return;
    }
    fetchGames();
  }, [fetchGames, userAuth, currentUserRoles, router]);

  const handleFilterChange = useCallback((newFilters: GameFilterParams) => {
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

  if (loading && !games.length) { // Show loading spinner only if no games are loaded yet
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
          <p className="text-muted-foreground text-gray-600">View and manage all games across tenants, leagues, and seasons.</p>
        </div>
        <div className="flex justify-between items-center">
          <GamesFilters
            filters={filters}
            onFilterChange={handleFilterChange}
            onPageSizeChange={handlePageSizeChange}
            // No fixed IDs for System Admin page
          />
          <Link href="/game/create" passHref>
            <Button variant="primary" className='whitespace-nowrap'>Create New Game</Button>
          </Link>
        </div>
      </div>

      {games.length === 0 ? (
        <p className="text-center text-gray-500 mt-8">No games found matching your criteria.</p>
      ) : (
        <div className="mt-4 gap-4"> 
        <span hidden>{totalItems} Games</span>
        {/* Responsive grid for GameCards */}
          {games.map((game) => (
            <GameCard
              key={game.id}
              game={game}
              buildLink={buildLink}
              //onDelete={handleDeleteGame}
              // Pass context IDs for dashboard link if GameCard needs to generate it
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
