"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { GameDetails, GameStatus } from '@/schemas'; // Assuming GameStatus is a valid import
import TenantHeroSection from "@/components/public/tenant-hero-section";
import GamePublicCard from '@/components/game/game-public-card'; // Assuming this is the correct path
import { Skeleton } from "@/components/ui/skeleton";
import { Plus } from 'lucide-react'; // For the "details" icon
import { api } from '@/services/api';

// Define the interface for the game data to ensure type safety.
// This matches the structure returned by the new public games endpoint.
/* interface GameDetails {
    id: string;
    slug: string;
    dateTime: string;
    location?: string | null;
    status: GameStatus;
    homeScore?: number | null;
    awayScore?: number | null;
    notes?: string | null;
    round?: string | null;
    bannerImageUrl?: string | null;
    highlightsUrl?: string | null;
    isActive: boolean;
    leagueId: string;
    tenantId: string;
    homeTeamId: string;
    awayTeamId: string;
    homeVenueId?: string | null;
    homeTeam: {
        id: string;
        name: string;
        slug: string;
        shortCode: string;
        logoUrl?: string | null;
    };
    awayTeam: {
        id: string;
        name: string;
        slug: string;
        shortCode: string;
        logoUrl?: string | null;
    };
    league: {
        id: string;
        name: string;
        leagueCode: string;
    };
    tenant: {
        id: string;
        name: string;
        tenantCode: string;
        sportType?: string | null;
        slug: string;
    };
    season: {
        id: string;
        name: string;
    };
    homeVenue?: {
        id: string;
        name: string;
        address?: string | null;
    } | null;
}
    */

// A simple component to show a loading state for the games section
const GamesSectionSkeleton = ({ primaryColor }: { primaryColor: string }) => (
    <div className={`p-4 bg-${primaryColor}-900`}>
        <div className="flex items-center justify-between mb-4">
            <Skeleton className="h-8 w-1/4 bg-gray-600" />
            <Skeleton className="h-8 w-24 rounded-md bg-gray-600 md:block hidden" />
        </div>
        {/* Horizontal Carousel Skeleton */}
        <div className="md:flex md:space-x-4 overflow-hidden hidden">
            {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-48 w-full md:w-1/3 lg:w-1/4 rounded-md bg-gray-600 flex-shrink-0" />
            ))}
        </div>
        {/* Mobile Stacked Skeleton */}
        <div className="space-y-2 md:hidden">
            {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-32 w-full rounded-md bg-gray-600" />
            ))}
            <Skeleton className="h-8 w-full rounded-md bg-gray-600" />
        </div>
    </div>
);

const LandingPage = ({ params }: { params: { tenantSlug: string } }) => {
    const { tenantSlug } = params;
    const [games, setGames] = useState<GameDetails[]>([]);
    const [loading, setLoading] = useState(true);

    const themeColors: Record<string, { primary: string; secondary: string }> = {
        eubago: { primary: 'indigo', secondary: 'orange' },
        eubabuk: { primary: 'emerald', secondary: 'yellow' },
        lifnoki: { primary: 'orange', secondary: 'indigo' },
        default: { primary: 'emerald', secondary: 'gray' }
    };
    const { primary, secondary } = themeColors[tenantSlug] || themeColors.default;

    useEffect(() => {
        const fetchGames = async () => {
            setLoading(true);
            try {
                // Using axios to fetch games from the new public endpoint
                const response = await api.get<GameDetails[]>(
                    `/public/games/search`, {
                    params: { tenantSlug }
                });
                const fetchedGames = response.data;
                
                // Separate games into upcoming/in-progress and completed
                const upcomingInProgress = fetchedGames.filter(game => 
                    game.status === GameStatus.IN_PROGRESS ||
                   (game.status === GameStatus.SCHEDULED && new Date(game.dateTime) > new Date())

                );
                const completed = fetchedGames.filter(game => 
                    game.status === GameStatus.COMPLETED
                );
                
                // Sort upcoming games by date ascending
                upcomingInProgress.sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());
                
                // Sort completed games by date descending (most recent first)
                completed.sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime());

                // Combine and limit the number of games to a maximum of 12
                const sortedGames = upcomingInProgress.length > 0 ? [...upcomingInProgress].slice(0, 12):
                                    completed.length > 0 ?          [...completed].slice(0, 12)         : [];
                
                setGames(sortedGames);
            } catch (error) {
                console.error("Failed to fetch games:", error);
                setGames([]); // Set to empty array on error
            } finally {
                setLoading(false);
            }
        };

        fetchGames();
    }, [tenantSlug]);

    return (
        <div>
            {/* Hero Section */}
            <TenantHeroSection
                tenantSlug={tenantSlug}
                primaryColor={primary}
                secondaryColor={secondary}
            />

            {/* Games Section */}
            <div className={`py-8 bg-${primary}-900 text-white`}>
                <div className="container mx-auto">
                    {loading ? (
                        <GamesSectionSkeleton primaryColor={primary} />
                    ) : (
                        <div>
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-bold">Matchs</h2>
                                {/* "Voir Touts les matchs" link for larger screens */}
                                {games.length > 0 && (
                                    <Link 
                                        href={`/games`} 
                                        className="text-white text-sm font-semibold hover:underline hidden md:flex items-center space-x-1"
                                    >
                                        <span>Voir Touts les matchs</span>
                                        <Plus className="h-4 w-4" />
                                    </Link>
                                )}
                            </div>

                            {games.length > 0 ? (
                                <>
                                    {/* Carousel for md and lg screens */}
                                    <div className="hidden md:flex flex-row space-x-4 overflow-x-auto snap-x snap-mandatory">
                                        {games.map((game) => (
                                            <div key={game.id} className="w-[calc(100%/3 - 1.33rem)] lg:w-[calc(100%/4)] flex-shrink-0 snap-center">
                                                <Link href={`/games/${game.slug}`} className="block">
                                                    <GamePublicCard game={game} />
                                                </Link>
                                            </div>
                                        ))}
                                    </div>
                                    
                                    {/* Stacked view for small screens */}
                                    <div className="space-y-4 md:hidden">
                                        {games.slice(0, 4).map((game) => (
                                            <div key={game.id}>
                                                <Link href={`/games/${game.slug}`} className="block">
                                                    <GamePublicCard game={game} />
                                                </Link>
                                            </div>
                                        ))}
                                    </div>
                                    {/* "Voir Touts les matchs" link for small screens */}
                                    {games.length > 4 && (
                                        <Link 
                                            href={`/games`} 
                                            className="mt-4 md:hidden block w-full text-center bg-gray-800 hover:bg-gray-700 py-3 rounded-lg font-semibold transition-colors"
                                        >
                                            Voir Touts les matchs
                                        </Link>
                                    )}
                                </>
                            ) : (
                                <div className="text-center py-16 rounded-lg">
                                    <h3 className="text-xl font-semibold">Pas de Matchs Disponibles</h3>
                                    <p className="mt-2">Aucun match n&apos;est planifié pour le moment.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LandingPage;
