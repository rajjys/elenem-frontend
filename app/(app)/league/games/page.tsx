// app/(league)/games/page.tsx
"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react'; // Added useMemo
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { api } from '@/services/api';
import { GameDetails, GameFilterParams, PaginatedGamesResponseSchema, GameFilterParamsSchema } from '@/schemas';
import { GamesFilters } from '@/components/game/games-filters';
import { Pagination, LoadingSpinner, Button, getStatusBadge } from '@/components/ui/';
import { GameCard } from '@/components/ui';
import { toast } from 'sonner';
import { Roles } from '@/schemas';
import { useAuthStore } from '@/store/auth.store';
import { useContextualLink } from '@/hooks';

export default function LeagueGamesPage() {
    const { user: userAuth } = useAuthStore();
    const currentUserRoles = userAuth?.roles || [];
    const searchParams = useSearchParams(); // Get search params once

    // Determine current tenant ID based on user roles
    const isSystemAdmin = currentUserRoles.includes(Roles.SYSTEM_ADMIN);
    const isTenantAdmin = currentUserRoles.includes(Roles.TENANT_ADMIN);
    const isLeagueAdmin = currentUserRoles.includes(Roles.LEAGUE_ADMIN);

    const ctxTenantId = searchParams.get('ctxTenantId');
    const ctxLeagueId = searchParams.get('ctxLeagueId');

    const currentTenantId = useMemo(() => { // Use useMemo to stabilize these values
        return isSystemAdmin
            ? ctxTenantId
            : isTenantAdmin
            ? userAuth?.tenantId
            : null;
    }, [isSystemAdmin, isTenantAdmin, ctxTenantId, userAuth?.tenantId]);

    const currentLeagueId = useMemo(() => { // Use useMemo to stabilize these values
        return isSystemAdmin || isTenantAdmin
            ? ctxLeagueId
            : isLeagueAdmin
            ? userAuth?.managingLeagueId
            : null;
    }, [isSystemAdmin, isTenantAdmin, isLeagueAdmin, ctxLeagueId, userAuth?.managingLeagueId]);

    const { buildLink } = useContextualLink();

    const [games, setGames] = useState<GameDetails[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [totalItems, setTotalItems] = useState(0);
    const [totalPages, setTotalPages] = useState(1);

    // Initialize filters once based on the determined IDs
    const [filters, setFilters] = useState<GameFilterParams>(() => ({
        page: 1,
        pageSize: 12,
        sortBy: 'dateTime',
        sortOrder: 'desc',
        tenantId: currentTenantId || undefined, // Use undefined if null for initial state
        leagueId: currentLeagueId || undefined, // Use undefined if null for initial state
    }));

    // This effect now only runs when currentTenantId or currentLeagueId *change their values*
    // It will ensure initial filters are set correctly or updated if context changes (e.g., user logs in)
    // The previous separate useEffect for updating filters is no longer needed here.
    useEffect(() => {
        // This effect will run on initial render and whenever currentTenantId or currentLeagueId *values* change.
        // It's crucial that currentTenantId and currentLeagueId are stable (e.g., derived from useMemo as above).
        setFilters(prev => {
            // Only update if the values are truly different to prevent unnecessary renders/fetches
            if (prev.tenantId !== currentTenantId || prev.leagueId !== currentLeagueId) {
                return {
                    ...prev,
                    tenantId: currentTenantId || undefined,
                    leagueId: currentLeagueId || undefined,
                    page: 1 // Reset page when context changes
                };
            }
            return prev; // No change needed
        });
    }, [currentTenantId, currentLeagueId]);


    const fetchGames = useCallback(async () => {
        setLoading(true);
        setError(null);

        // This check is good to prevent fetches if IDs aren't available
        if (!filters.leagueId) { // Check filters.leagueId instead of currentLeagueId directly here
            setLoading(false);
            setError("League ID not available. Please ensure a league is selected or you have appropriate permissions.");
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
            const errorMessage = 'Failed to fetch games.';
            setError(errorMessage);
            toast.error('Error fetching games', { description: errorMessage });
            console.error('Fetch games error:', error);
        } finally {
            setLoading(false);
        }
    }, [filters]); // Only depend on filters now. currentLeagueId/currentTenantId are implicitly part of filters.


    useEffect(() => {
        // Authorization check for League Admin
        if (!userAuth) {
            toast.error("Unauthorized", { description: "You do not have permission to view this page." });
            //router.push('/dashboard'); // Consider redirecting here if authentication is strict
            return;
        }
        // This useEffect now *only* triggers fetchGames when filters change.
        // The leagueId presence check is already handled inside fetchGames.
        fetchGames();
    }, [fetchGames, userAuth]); // Keep userAuth as a dependency if userAuth state changes should refetch

    const handleFilterChange = useCallback((newFilters: GameFilterParams) => {
        setFilters(prev => ({
            ...prev,
            ...newFilters,
            // Ensure tenantId and leagueId are always derived from the context/user auth, not user input
            tenantId: currentTenantId || undefined,
            leagueId: currentLeagueId || undefined,
            page: 1, // Always reset page when filters change
        }));
    }, [currentTenantId, currentLeagueId]); // Depend on these stable values

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
                    <Link href={buildLink('/game/create')} passHref> {/* Use buildLink here */}
                        <Button variant="primary" className='whitespace-nowrap'>Create New Game</Button>
                    </Link>
                </div>
            </div>

            {games.length === 0 ? (
                <p className="text-center text-gray-500 mt-8">No games found matching your criteria.</p>
            ) : (
                <div className="mt-4">
                    <span hidden>{totalItems} Games Found</span>
                    {games.map((game) => (
                        <GameCard
                            key={game.id}
                            game={game}
                            buildLink={buildLink}
                            getStatusBadge={getStatusBadge}
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