"use client";

import React, { useState, useEffect, use, useCallback } from 'react';
import Link from 'next/link';
import { BlogPost, GameDetails, GameStatus, Gender, LeagueDetails, StandingsBasic } from '@/schemas'; // Assuming GameStatus is a valid import
import TenantHeroSection from "@/components/public/tenant-hero-section";
import GamePublicCard from '@/components/game/game-public-card'; // Assuming this is the correct path
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronRight } from 'lucide-react'; // For the "details" icon
import { api } from '@/services/api';
import { Card, CardContent, CardHeader } from '@/components/ui';
import StandingsTable from '@/components/public/standings-table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import VerticalBlogPostCard from '@/components/ui/vertical-blogpost-card';
import axios from 'axios';


interface PublicTenantDetails {
    id: string;
    slug: string;
    name: string;
    description: string;
    leagues: {
        id: string;
        name: string;
        slug: string;
        parentLeagueId: string | null;
    }[];
};

interface LeagueBasic {
    id: string;
    name: string;
    slug: string;
}
const TenantLandingPage = ({ params }: { params: Promise<{ tenantSlug: string }> }) => {
    const { tenantSlug } = use(params);
    const [games, setGames] = useState<GameDetails[]>([]);
    const [loading, setLoading] = useState(true);
    const [tenant, setTenant] = useState<PublicTenantDetails | null>(null);
    const [mainLeagues, setMainLeagues] = useState<{ id: string; name: string; slug: string }[]>([]);
    const [selectedLeagueSlug, setSelectedLeagueSlug] = useState<string | null>(null);
    const [selectedLeague, setSelectedLeague] = useState<LeagueBasic | undefined>(undefined);
    const [standings, setStandings] = useState<StandingsBasic[]>([]);
    const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
    const [loadingStandings, setLoadingStandings] = useState(false);
    const [error, setError] = useState<string | null>(null);


    const themeColors: Record<string, { primary: string; secondary: string }> = {
        eubago: { primary: 'indigo', secondary: 'orange' },
        eubabuk: { primary: 'emerald', secondary: 'yellow' },
        lifnoki: { primary: 'orange', secondary: 'indigo' },
        default: { primary: 'emerald', secondary: 'gray' }
    };
    const { primary: primaryColor, secondary: secondaryColor } = themeColors[tenantSlug] || themeColors.default;

    /// Fetch tenant basic info, leagues, league standings, recent games,...
    /// Fetch tenant basic informations
    const fetchTenantDetails = useCallback(async () => {
        if (!tenantSlug) return;
        setLoading(true);
        try {
            const tenantResponse = await api.get(`/public-tenants/${tenantSlug}`);
            setTenant(tenantResponse.data);
            // Identify main leagues
            // Here we need to select one or two or the most importants leagues to display quick standings for
            // placeholder logic
            const mainLeagues = tenantResponse.data.leagues
                .sort((a: LeagueDetails, b: LeagueDetails) => {
                    if (a.parentLeagueId === null && b.parentLeagueId !== null) return -1;
                    if (a.parentLeagueId !== null && b.parentLeagueId === null) return 1;
                    if (a.gender === Gender.MALE && b.gender !== Gender.MALE) return -1;
                    if (a.gender !== Gender.MALE && b.gender === Gender.MALE) return 1;
                    return 0;
                })
                .map((league: LeagueDetails) => ({
                    id: league.id,
                    name: league.name,
                    slug: league.slug,
                }));

            setMainLeagues(mainLeagues);

            // Set default selected league slug and try to set the full league object
            if (mainLeagues.length > 0) {
            setSelectedLeagueSlug(mainLeagues[0].slug);
            const full = tenantResponse.data.leagues.find((l: LeagueDetails) => l.slug === mainLeagues[0].slug);
            setSelectedLeague(full);
            }
        } catch (error) {
            setError('Failed to fetch Tenant details');
            console.error(error);
            setGames([]);
        } finally {
            setLoading(false);
        }
    }, [tenantSlug]);

    // NEW: keep selectedLeague in sync with the selected slug
    useEffect(() => {
    if (!selectedLeagueSlug) {
        setSelectedLeague(undefined);
        return;
    }

    // Prefer the full league object from tenant if available
    const full = tenant?.leagues?.find(l => l.slug === selectedLeagueSlug);
    if (full) {
        setSelectedLeague(full);
        return;
    }

    // Fallback to mainLeagues (only id/name/slug available)
    const short = mainLeagues.find(l => l.slug === selectedLeagueSlug);
    if (short) {
        // create a minimal object if you need LeagueDetails shape,
        // or cast if you're confident other properties aren't used.
        setSelectedLeague(short as unknown as LeagueDetails);
        return;
    }

    // nothing matched
    setSelectedLeague(undefined);
    }, [selectedLeagueSlug, tenant, mainLeagues]);

    /// fetch tenant games
    const fetchTenantGames = useCallback( async () => {
        if (!tenantSlug) return;
        try {
            const gamesResponse = await api.get<GameDetails[]>(`/public-games/search`, {
                params: { tenantSlug },
            });
            const fetchedGames = gamesResponse.data;

            const upcomingInProgress = fetchedGames.filter(
                (game) =>
                game.status === GameStatus.IN_PROGRESS ||
                (game.status === GameStatus.SCHEDULED && new Date(game.dateTime) > new Date())
            );

            const completed = fetchedGames.filter(
                (game) => game.status === GameStatus.COMPLETED
            );

            upcomingInProgress.sort(
                (a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime()
            );
            completed.sort(
                (a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime()
            );

            const sortedGames =
                upcomingInProgress.length > 0
                ? [...upcomingInProgress].slice(0, 12)
                : completed.length > 0
                ? [...completed].slice(0, 12)
                : [];

            setGames(sortedGames);
        } catch (error) {
            setError('Failed to fetch Tenant details');
            console.error(error);
            setGames([]);
        } finally {
            setLoading(false);
        }
    }, [tenantSlug]);

    useEffect(() => {

  fetchTenantDetails();
  fetchTenantGames();
}, [fetchTenantDetails, fetchTenantGames, tenantSlug]);
        // Fetch standings when the selected league changes
    useEffect(() => {
        const fetchStandings = async () => {
            if (!selectedLeagueSlug) {
                setStandings([]);
                return;
            }
            setLoadingStandings(true);
            try {
                const standingsResponse = await api.get(`/public-games/standings/${selectedLeagueSlug}`);
                setStandings(standingsResponse.data);
            } catch (error) {
                let errorMessage = "Failed to load Standings"
                if(axios.isAxiosError(error)){
                    errorMessage = error.response?.data?.message || errorMessage;
                }
                //toast.error(errorMessage);
                console.error("Failed to fetch standings:", errorMessage);
                setStandings([]); // Clear standings on error
            } finally {
                setLoadingStandings(false);
            }
        };
        fetchStandings();
    }, [selectedLeagueSlug]);

/*
    // This function filters and sorts posts for a given tenant.
    const getRecentPosts = (tenantSlug: string, posts: BlogPost[]) => {
    const filteredPosts = posts.filter(post => post.tenantSlug === tenantSlug);
    return filteredPosts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10);
    };
*/
    useEffect(() => {
    async function fetchPosts() {
      try {
        const res = await api.get("/public-posts", {
          params: {
            tenantSlug,
            pageSize: 10,
          },
        });
        setBlogPosts(res.data.data);
      } finally {
        setLoading(false);
      }
    }
    fetchPosts();
  }, [tenantSlug]);

    if (loading) {
        return (
            <div className="space-y-8 p-4 md:p-8">
                <Skeleton className="h-64 w-full rounded-lg" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <Card>
                        <CardHeader><Skeleton className="h-8 w-1/2" /></CardHeader>
                        <CardContent className="space-y-4">
                             {/* Skeleton for games */}
                            {Array.from({ length: 3 }).map((_, i) => (
                                <Skeleton key={i} className="h-20 w-full" />
                            ))}
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader><Skeleton className="h-8 w-1/2" /></CardHeader>
                        <CardContent className="space-y-4">
                            <StandingsTable standings={[]} isLoading={true} />
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }
    if(error) {
        return <div className='flex h-screen items-center justify-center'>
            <p className='text-red text-xl'>Une Erreur s&apos;est produite</p>
        </div>
    }
    return (
        <div>
            {/* Hero Section */}
            <TenantHeroSection
                blogPosts={blogPosts.slice(0, 5)}
                primaryColor={primaryColor}
                secondaryColor={secondaryColor}
            />

            {/* Games Section */}
            <div className={`py-4 bg-${primaryColor}-900`}>   
              <div>
                {games.length > 0 && (
                    <div className="hidden md:flex items-center justify-between px-8 mb-4 text-slate-200">
                        <h2 className="text-2xl font-bold md:pl-42 lg:pl-56">Matchs</h2>
                        <Link href={`/games`} className="hidden md:flex md:items-center md:justify-center md:gap-2 text-sm font-semibold hover:text-white">
                            <span>Voir Tout les matchs</span>
                            <ChevronRight className="h-4 w-4" />
                        </Link>
                    </div> 
             )}
                {games.length > 0 ? (
                    <>
                      {/* Carousel for md and lg screens */}
                      <div className="hidden md:flex flex-row gap-4 overflow-x-auto snap-x snap-mandatory md:pl-42 lg:pl-56 no-scrollbar">
                          {games.map((game) => (
                              <div key={game.id} className="min-w-[calc(100%/2)] lg:min-w-[calc(100%/3)]">
                                  <Link href={`/games/${game.league.slug}/${game.slug}`} className="block">
                                      <GamePublicCard game={game} />
                                  </Link>
                              </div>
                          ))}
                      </div>
                      {/* Stacked view for small screens */}
                      <div className="space-y-4 md:hidden mx-2">
                          {games.slice(0, 4).map((game) => (
                              <div key={game.id}>
                                  <Link href={`/games/${game.league.slug}/${game.slug}`} className="block">
                                      <GamePublicCard game={game} />
                                  </Link>
                              </div>
                          ))}
                      </div>
                      {/* "Voir Tout les matchs" link for small screens */}
                      {games.length > 0 && (
                          <Link href={`/games`} className="flex items-center justify-center gap-2 mt-2 mx-4 md:hidden bg-slate-100 text-slate-700 py-2 border border-slate-200 rounded-full font-semibold">
                              Tout les matchs
                              <ChevronRight className='w-4 h-4 '/>
                          </Link>
                      )}
                    </>
                  ) : (
                      <div className="text-center py-18 rounded-lg">
                          <h3 className="text-xl font-semibold">Pas de Matchs Disponibles</h3>
                          <p className="mt-2">Aucun match n&apos;est planifié pour le moment.</p>
                      </div>
                  )}
              </div>
            </div>
            {/* Video Section */}
            {/* Standings Section */}
            <div className={`space-y-4 py-8`} >
                <div className="hidden md:flex items-center justify-between px-8 mb-4 text-slate-600">
                    <h2 className="text-2xl font-bold md:pl-42 lg:pl-56">Classements</h2>
                    <Link href={`/standings?leagueSlug=${selectedLeagueSlug}`} className="hidden md:flex md:items-center md:justify-center md:gap-2 hover:text-slate-800 font-semibold">
                        <span>Tout les classements</span>
                        <ChevronRight className="h-4 w-4" />
                    </Link>
                </div> 
                {mainLeagues.length > 0 ? (
                    <div className={`max-w-2xl mx-auto bg-white rounded-lg`}>
                        <div className="p-4">
                            <Tabs value={selectedLeagueSlug || ''} 
                                onValueChange={(val) => setSelectedLeagueSlug(val)} className="w-full">
                                <TabsList className="flex justify-center items-center gap-4">
                                    {mainLeagues.slice(0, 3).map((league) => (
                                        <TabsTrigger key={league.id} value={league.slug} className="text-xs md:text-sm cursor-pointer hover:bg-gray-200 focus:bg-gray-300 overflow-hidden">
                                            {league.name}
                                        </TabsTrigger>
                                    ))}
                                </TabsList>
                                {mainLeagues.map((league) => (
                                    <TabsContent key={league.id} value={league.slug} className="mt-6">
                                        <div className='flex flex-col items-center justify-center mb-4'>
                                            <span className="text-2xl font-bold text-gray-700  text-center">
                                                {selectedLeague?.name}
                                            </span>
                                            <span className='text-xs text-slate-500'>{tenant?.name}</span>
                                        </div>
                                        <StandingsTable standings={standings} isLoading={loadingStandings} rowsToShow={5} />
                                        {/* "Classements Complet" link */}
                                        {!loadingStandings && standings.length > 0 && (
                                            <div className="mt-4 flex justify-center">
                                                <Link href={`/standings?leagueSlug=${selectedLeagueSlug}`} className="text-sm font-semibold text-blue-500 hover:underline">
                                                    Tout les classements
                                                </Link>
                                            </div>
                                        )}
                                    </TabsContent>
                                ))}
                            </Tabs>
                        </div>
                    </div>
                ) : (
                     <div className="text-center py-16 rounded-lg">
                        <h3 className="text-xl font-semibold">Pas de Classements Disponibles</h3>
                        <p className="mt-2 text-slate-700">Aucun classement n&apos;est disponible pour le moment.</p>
                    </div>
                )}
            </div>
            {/* Recent News Section */}
            <div className="space-y-4 py-8 bg-gray-500">
                <div className="hidden md:flex items-center justify-between px-8 mb-4 text-white">
                    <h2 className="text-2xl font-bold md:pl-42 lg:pl-56">A la Une</h2>
                    <Link href={`/standings?leagueSlug=${selectedLeagueSlug}`} className="hidden md:flex md:items-center md:justify-center md:gap-2 font-semibold">
                        <span>Toutes les Informations</span>
                        <ChevronRight className="h-4 w-4" />
                    </Link>
                </div> 
                <div className='text-white'>
                    {
                        blogPosts.length > 0 ? (
                            <div className="flex space-x-4 overflow-x-auto pb-4 pl-2 md:pl-42 lg:pl-56 no-scrollbar">
                                {blogPosts.slice(0, 10).map((post, index) =>( 
                                <span key={index} className='flex-shrink-0 w-52'>
                                    <VerticalBlogPostCard post={post} themeColor={secondaryColor} />
                                </span>))}
                            </div>
                        ) : (
                            <div className="text-center py-16 rounded-lg">
                                <h3 className="text-xl font-semibold">Pas d&apos;actualitvs disponibles</h3>
                                <p className="mt-2 text-muted-foreground">Aucune actualité n&apos;est disponible pour le moment.</p>
                            </div>
                        )
                    }
                </div>
                    
            </div>
        </div>
    );
};

export default TenantLandingPage;
