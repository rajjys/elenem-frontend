"use client";

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { BlogPost, GameDetails, GameStatus, Gender, LeagueBasic, Standings } from '@/schemas'; // Assuming GameStatus is a valid import
import TenantHeroSection from "@/components/public/tenant-hero-section";
import GamePublicCard from '@/components/game/game-public-card'; // Assuming this is the correct path
import { Skeleton } from "@/components/ui/skeleton";
import { Plus } from 'lucide-react'; // For the "details" icon
import { api } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
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
}
const TenantLandingPage = ({ params }: { params: Promise<{ tenantSlug: string }> }) => {
    const { tenantSlug } = use(params);
    const [games, setGames] = useState<GameDetails[]>([]);
    const [loading, setLoading] = useState(true);
    const [tenant, setTenant] = useState<PublicTenantDetails | null>(null);
    const [mainLeagues, setMainLeagues] = useState<{ id: string; name: string; slug: string }[]>([]);
    const [selectedLeagueSlug, setSelectedLeagueSlug] = useState<string | null>(null);
    const [standings, setStandings] = useState<Standings[]>([]);
    const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
    const [loadingStandings, setLoadingStandings] = useState(false);
    const [error, setError] = useState<string | null>(null);


    const themeColors: Record<string, { primary: string; secondary: string }> = {
        eubago: { primary: 'indigo', secondary: 'orange' },
        eubabuk: { primary: 'emerald', secondary: 'yellow' },
        lifnoki: { primary: 'orange', secondary: 'indigo' },
        default: { primary: 'emerald', secondary: 'gray' }
    };
    const { primary, secondary } = themeColors[tenantSlug] || themeColors.default;

    useEffect(() => {
  const fetchTenantAndGames = async () => {
    if (!tenantSlug) return;
    setLoading(true);
    try {
      // Fetch tenant data
      const tenantResponse = await api.get(`/public-tenants/${tenantSlug}`);
      setTenant(tenantResponse.data);
      // Identify main leagues
      const mainLeagues = tenantResponse.data.leagues
        .sort((a: LeagueBasic, b: LeagueBasic) => {
            if (a.parentLeagueId === null && b.parentLeagueId !== null) return -1;
            if (a.parentLeagueId !== null && b.parentLeagueId === null) return 1;
            if (a.gender === Gender.MALE && b.gender !== Gender.MALE) return -1;
            if (a.gender !== Gender.MALE && b.gender === Gender.MALE) return 1;
            return 0;
        })
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((league: any) => ({
            id: league.id,
            name: league.name,
            slug: league.slug,
        }));

      setMainLeagues(mainLeagues);

      // Set default selected league
      if (mainLeagues.length > 0) {
        setSelectedLeagueSlug(mainLeagues[0].slug);
      }

      // Fetch and process games
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
      //const recentPosts = getRecentPosts(tenantSlug, mockBlogPosts);
      //setBlogPosts(recentPosts);
      
    } catch (error) {
      setError('Failed to fetch data');
      console.error(error);
      setGames([]);
    } finally {
      setLoading(false);
    }
  };

  fetchTenantAndGames();
}, [tenantSlug]);
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
                primaryColor={primary}
                secondaryColor={secondary}
            />

            {/* Games Section */}
            <div className={`py-4 bg-${primary}-900 text-white`}>
                    
                        <div>
                            <div className="flex items-center justify-between px-8 mb-4">
                                <h2 className="text-2xl font-bold md:pl-42 lg:pl-56">Matchs</h2>
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
                                    <div className="space-y-4 md:hidden">
                                        {games.slice(0, 4).map((game) => (
                                            <div key={game.id}>
                                                <Link href={`/games/${game.league.slug}/${game.slug}`} className="block">
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
            </div>
            {/* Video Section */}

            {/* Standings Section */}
            <div className={`space-y-4 py-6 bg-gradient-to-b from-${primary}-900 to-transparent`} >
                    {mainLeagues.length > 0 ? (
                        <Card className={`shadow-sm max-w-2xl mx-auto`}>
                            <CardTitle><div className="text-2xl font-bold text-gray-700  text-center pl-4 pt-4">Classements {tenant?.name}</div></CardTitle>
                            <CardContent className="p-6">
                                <Tabs value={selectedLeagueSlug || ''} onValueChange={setSelectedLeagueSlug} className="w-full">
                                    <TabsList className="flex justify-around items-center">
                                        {mainLeagues.map((league) => (
                                            <TabsTrigger key={league.id} value={league.slug} className="text-xs md:text-sm cursor-pointer hover:bg-gray-200 focus:bg-gray-300">
                                                {league.name}
                                            </TabsTrigger>
                                        ))}
                                    </TabsList>
                                    {mainLeagues.map((league) => (
                                        <TabsContent key={league.id} value={league.slug} className="mt-6">
                                            <StandingsTable standings={standings} isLoading={loadingStandings} rowsToShow={5} />
                                            {/* "Classements Complet" link */}
                                            {!loadingStandings && standings.length > 0 && (
                                                <div className="mt-4 flex justify-center">
                                                    <Link href={`/standings?leagueSlug=${selectedLeagueSlug}`} className="text-sm font-semibold text-blue-500 hover:underline">
                                                        Classements Complet
                                                    </Link>
                                                </div>
                                            )}
                                        </TabsContent>
                                    ))}
                                </Tabs>
                            </CardContent>
                        </Card>
                    ) : (
                         <div className="text-center py-16 rounded-lg border">
                            <h3 className="text-xl font-semibold">Pas de Classements Disponibles</h3>
                            <p className="mt-2 text-muted-foreground">Aucun classement n&apos;est disponible pour le moment.</p>
                        </div>
                    )}
            </div>
            {/* Recent News Section */}
            <div className="space-y-4 py-4 bg-gray-400">
                
                <div className='text-white'>
                    <h2 className="text-2xl font-bold pl-2 md:pl-42 lg:pl-56 pb-4 lg:py-6">Dernières Actus</h2>
                    {
                        blogPosts.length > 0 ? (
                            <div className="flex space-x-4 overflow-x-auto pb-4 pl-2 md:pl-42 lg:pl-56 no-scrollbar">
                                {blogPosts.slice(0, 10).map((post, index) =>( 
                                <span key={index} className='flex-shrink-0 w-52'>
                                    <VerticalBlogPostCard post={post} themeColor={secondary} />
                                </span>))}
                            </div>
                        ) : (
                            <div className="text-center py-16 rounded-lg border">
                                <h3 className="text-xl font-semibold">Pas d&apos;informations disponibles</h3>
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
