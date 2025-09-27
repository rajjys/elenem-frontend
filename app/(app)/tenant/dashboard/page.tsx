'use client';
import Head from 'next/head';
import { useSearchParams } from 'next/navigation'; // Or useNavigation from next/navigation for App Router
import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth.store';
import { GameDetails, LeagueBasic, PaginatedLeaguesResponseSchema, Roles, TenantDetails, TenantDetailsSchema } from '@/schemas';
import { api } from '@/services/api';
import { toast } from 'sonner';
import { useContextualLink } from '@/hooks';
import { StatsCard } from '@/components/ui/stats-card';
import { Building, Calendar, CalendarPlus, Plus, Ticket, TrendingUp, Trophy, UserPlus } from 'lucide-react';
import { Avatar, Button, Card, CardContent, CardHeader, CardTitle, getStatusBadge, LeagueCard, LoadingSpinner } from '@/components/ui';
import { capitalizeFirst, countryNameToCode } from '@/utils';
import axios from 'axios';
import Image from 'next/image';
import CountryFlag from 'react-country-flag';
import { format } from 'date-fns';
import DateCarousel from '@/components/game/date-carousel';

export default function TenantDashboard() {
    const userAuth = useAuthStore((state) => state.user);
    const currentUserRoles = userAuth?.roles || [];
    const [tenant, setTenant] = useState<TenantDetails | null>(null);
    const [leagues, setLeagues] = useState<LeagueBasic>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [availableDates, setAvailableDates] = useState<string[]>([]);
    const [selectedDate, setSelectedDate] = useState<string>('');
    const [gamesByDate, setGamesByDate] = useState<GameDetails[]>([]);
    const [loadingDates, setLoadingDates] = useState(true);
    const [loadingGames, setLoadingGames] = useState(false);

    const { buildLink } = useContextualLink();
    const ctxTenantId = useSearchParams().get('ctxTenantId'); // Use search params if needed
    
    // Determine current tenant ID based on user roles
    const isSystemAdmin = currentUserRoles.includes(Roles.SYSTEM_ADMIN);
    const isTenantAdmin = currentUserRoles.includes(Roles.TENANT_ADMIN);
    
    const currentTenantId = isSystemAdmin
    ? ctxTenantId
    : isTenantAdmin
    ? userAuth?.tenantId
    : null;
    //Fetch tenant-specific data if needed, e.g., tenant name, logo, etc.
    const fetchTenantDetails = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
          const response = await api.get(`/tenants/${currentTenantId}`);
          const validatedTenant = TenantDetailsSchema.parse(response.data);
          setTenant(validatedTenant);
        } catch (error) {
            let errorMessage = "Failed to fetch tenant details.";
            if (axios.isAxiosError(error)) {
                errorMessage = error.response?.data?.message || errorMessage;
            }
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
          setLoading(false);
        }
      }, [currentTenantId]);
      
      const fetchLeagues = useCallback(async () => {
        if (!currentTenantId) {
              setError("Tenant ID is not available.");
              setLoading(false);
              return;
            }
        
            setLoading(true);
            setError(null);
            try {
              const params = new URLSearchParams();
              if(isSystemAdmin){
                params.append('tenantId', currentTenantId); // Use currentTenantId directly
                }
              const response = await api.get(`/leagues?${params.toString()}`);
              const validatedData = PaginatedLeaguesResponseSchema.parse(response.data);
              setLeagues(validatedData.data);
            } catch (error) {
              const errorMessage = 'Failed to fetch leagues.';
              setError(errorMessage);
              toast.error('Error fetching leagues', { description: errorMessage });
              console.error('Fetch leagues error:', error);
            } finally {
              setLoading(false);
            }
      }, [currentTenantId, isSystemAdmin]);
    useEffect(() => {
        // Fetch tenant-specific data if needed, e.g., tenant name, logo, etc.
        if (currentTenantId) {
            fetchTenantDetails();
            fetchLeagues();
        }
    }, [currentTenantId, fetchLeagues, fetchTenantDetails]);
    
    // Fetch available dates on initial load
      async function fetchDates() {
          setLoadingDates(true);
          try {
              const response = await api.get<string[]>('/games/dates');
              const dates = response.data;
              if (!dates || dates.length === 0) {
                //toast.info("Aucune date de match disponible.");
                //console.warn("No available dates found.");
                return;
              }
              setAvailableDates(dates);
              if (dates.length > 0) {
              // Select today's date if available, otherwise the first available date
              const today = format(new Date(), 'yyyy-MM-dd');
              setSelectedDate(dates.includes(today) ? today : dates[0]);
            }
          }
          catch(error){
            //toast.error("Failed to load game dates.");
            console.error(error);
          }
          finally{
              setLoadingDates(false)
          }
        }
        // Fetch games when a date is selected
          const fetchGames = useCallback(async (date: string) => {
            if (!date) return;
            setLoadingGames(true);
            try {
              const response = await api.get<{data: GameDetails[]}>('/games', { params: { date } });
              const gamesResponse = response.data;
              setGamesByDate(gamesResponse.data);
            } catch (error) {
                //toast.error(`Failed to load games for ${date}.`);
                console.error(error);
            }
            finally{
                setLoadingGames(false)
            }
          }, []);
          useEffect(() => {
             fetchDates(); 
          }, []);
        
          useEffect(() => {
              fetchGames(selectedDate);
          }, [selectedDate, fetchGames]);
          
          const todayISO = new Date().toISOString().split('T')[0];
              useEffect(() => {
                  if (availableDates.length) {
                      const futureOrToday = availableDates.find(d => d >= todayISO) ?? availableDates[0];
                      setSelectedDate(futureOrToday);
                  }
              }, [availableDates, todayISO]);

    // Dynamically generate stat cards based on tenant data
    const statCards = [
        { title: "Total Leagues", value: tenant?.leagues?.length || 0, description: "Active Leagues Under Management", trend: {isPositive: true, value: 3.6, timespan: "season"}, icon: Trophy, bgColorClass: "bg-blue-400", textColorClass: "text-white", href: buildLink("/tenant/leagues") },
        { title: "Total Teams", value: tenant?.teams?.length || 0, description: "Active Teams in all Leagues", trend: {isPositive: false, value: 2.6, timespan: "season"}, icon: Building, bgColorClass: "bg-green-400", textColorClass: "text-white", href: buildLink("/tenant/teams") },
        { title: "Total Players", value: 0, description: "Active Players in all Leagues", trend: {isPositive: true, value: 0, timespan: "season"}, icon: Calendar, bgColorClass: "bg-orange-400", textColorClass: "text-white", href: buildLink("/tenant/players") },
        { title: "Tickets Sold (Today)", value: 0, description: "Active Leagues Under Management", trend: {isPositive: true, value: 0, timespan: "season"}, icon: Ticket, bgColorClass: "bg-red-400", textColorClass: "text-white", href: buildLink("/tenant/tickets") }, // Keeping mock for now as per request
    ]

    return (
        <div className="min-h-screen">
            <Head>
                <title>{tenant?.tenantCode || "Tenant"} - Dashboard</title>
            </Head>
            {/* Header Section */}
            <section className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 md:gap-0 px-4 py-3 mb-4 bg-white shadow-sm rounded-md">
                <div className="flex items-center gap-3">
                    {tenant?.businessProfile.logoAsset?.url ? (
                    <Image
                        src={tenant.businessProfile.logoAsset.url}
                        alt={tenant.tenantCode}
                        width={40}
                        height={40}
                        className="rounded-full"
                    />
                    ) : (
                    <Avatar name={tenant?.name || 'Tenant'} size={40} className="rounded-full" />
                    )}

                    <div>
                    <h1 className="text-lg md:text-xl lg:text-2xl font-bold text-gray-800 leading-tight">
                        {tenant?.name}
                    </h1>
                    {tenant?.tenantCode && (
                        <p className="text-sm text-gray-500 flex items-center gap-1">
                            <span>{capitalizeFirst(tenant.tenantCode)}</span>
                            -
                            <CountryFlag countryCode={countryNameToCode[tenant.country]} svg style={{ width: '2em', height: '1em' }} />
                        </p>
                    )}
                    </div>
                </div>

                <div className="flex flex-wrap gap-2 md:gap-3 text-sm">
                    <Link
                    href={buildLink("/game/create")}
                    className="flex items-center gap-2 bg-emerald-600 text-white px-3 py-2 rounded-md hover:bg-emerald-700 transition-colors"
                    >
                        <CalendarPlus className="h-4 w-4" />
                        <span className="">Nouveau Match</span>
                    </Link>

                    <Link
                    href={buildLink("/league/create")}
                    className="flex items-center gap-2 bg-emerald-600 text-white px-3 py-2 rounded-md hover:bg-emerald-700 transition-colors"
                    >
                        <Trophy className="h-4 w-4" />
                        <span className="">Créer une Ligue</span>
                    </Link>
                </div>
            </section>

                {/* Key Metrics Section */}
            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-4">
                {loading ? <LoadingSpinner /> : error ? <p className='text-red-500'>{error}</p> :
                statCards.map((card, index) => (
                    <StatsCard key={index} {...card} />
                ))}    
            </section>
            {/* Leagues and Games Overview */}
            <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-4">
                <div className="lg:col-span-2">
                    <Card className="shadow-elevated">
                        <CardHeader className="flex flex-row items-center justify-between gap-2 sm:gap-4 px-4 py-3">
                            <CardTitle className="text-xl font-semibold text-gray-800">{tenant?.leagues?.length} Ligues</CardTitle>
                            <Link href={buildLink('/tenant/leagues')} className="inline-flex items-center text-sm font-medium text-emerald-700 hover:text-emerald-800 transition-colors">
                                <Trophy className="h-4 w-4 mr-1 text-emerald-600" />
                                <span>Toutes les Ligues</span>
                            </Link>
                        </CardHeader>
                        <CardContent className="py-2">
                        {leagues?.map((league: LeagueBasic) => (
                            <LeagueCard key={league.id} league={league} tenant={tenant!} />
                        ))}
                        <Link href={buildLink('/tenant/leagues')} className="py-3 flex items-center justify-center text-sm font-medium text-emerald-600 hover:text-emerald-800 transition-colors">
                            <Trophy className="h-4 w-4 mr-1 text-emerald-600" />
                            <span>Toutes les Ligues</span>
                        </Link>
                    </CardContent>
                    </Card>
                </div>
                {/* Recent Activity */}
                <div>
                    <Card className="shadow-elevated">
                        <CardHeader className="flex flex-row items-center justify-between gap-2 sm:gap-4 px-4 py-3">
                            <CardTitle className="text-xl font-semibold text-gray-800">Matchs</CardTitle>
                            <Link href={buildLink('/tenant/games')} className="inline-flex items-center text-sm font-medium text-emerald-700 hover:text-emerald-800 transition-colors">
                                <Trophy className="h-4 w-4 mr-1 text-emerald-600" />
                                <span>Tout les Matchs</span>
                            </Link>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {
                            !loadingDates ?
                                availableDates.length > 0 ? 
                                    (<DateCarousel
                                        dates={availableDates}
                                        selectedDate={selectedDate}
                                        onDateSelect={setSelectedDate}
                                    />):
                                <p>Aucune date disponible</p>
                                :
                                <LoadingSpinner message='Chargement des dates' />
                            }
                            <div>
                                {
                                    !loadingGames ?
                                        gamesByDate.length > 0 ? (
                                            gamesByDate.map( game => (
                                                <Link key={game.id} href={buildLink(`/game/${game.id}/dashboard`)} >
                                                    <div className="flex items-center justify-between gap-4 px-3 py-2 my-1 border border-slate-200 rounded-md bg-white hover:bg-slate-100 transition-colors shadow-sm">
                                                        {/* Game Status Badge */}
                                                        <div className="shrink-0 ">
                                                            {getStatusBadge(game.status)}
                                                        </div>
                                                        {/* Teams & Scores */}
                                                        
                                                        <div className="flex items-center justify-between gap-2 flex-1 text-sm font-medium text-slate-700">
                                                            {/* Home Team */}
                                                            <div className='flex items-center justify-start gap-2'>
                                                                {game.homeTeam.businessProfile.logoAsset?.url ? (
                                                                <Image
                                                                    src={game.homeTeam.businessProfile.logoAsset.url}
                                                                    alt={`${game.homeTeam.shortCode} Logo`}
                                                                    width={24}
                                                                    height={24}
                                                                    className="rounded-full border border-slate-300 "
                                                                />
                                                                ) : (
                                                                <div className="h-6 w-6 rounded-full bg-gradient-to-tr from-gray-400 to-blue-700" />
                                                                )}
                                                                <span>{game.homeTeam.shortCode}</span>
                                                            </div>
                                                            
                                                            {/* Score */}
                                                            {game.homeScore !== null && game.awayScore !== null && (
                                                            <span className="px-2 font-bold text-slate-900">
                                                                {game.homeScore} - {game.awayScore}
                                                            </span>
                                                            )}

                                                            {/* Away Team */}
                                                            <div className='flex items-center justify-end gap-2'>
                                                                <span>{game.awayTeam.shortCode}</span>
                                                                {game.awayTeam.businessProfile.logoAsset?.url ? (
                                                                <Image
                                                                    src={game.awayTeam.businessProfile.logoAsset.url}
                                                                    alt={`${game.awayTeam.shortCode} Logo`}
                                                                    width={24}
                                                                    height={24}
                                                                    className="rounded-full border border-slate-300"
                                                                />
                                                                ) : (
                                                                <div className="h-6 w-6 rounded-full bg-gradient-to-tr from-gray-400 to-blue-700" />
                                                                )}
                                                            </div>
                                                            
                                                        </div>
                                                    </div>
                                                </Link>
                                            ))
                                        )   
                                        : <p>Aucun Match Trouve</p>
                                            
                                        : <LoadingSpinner message='Chargement des Matchs' />
                                }
                            </div>
                            <Link href={buildLink('/tenant/games')} className="py-3 flex items-center justify-center text-sm font-medium text-emerald-600 hover:text-emerald-800 transition-colors">
                                <Trophy className="h-4 w-4 mr-1 text-emerald-600" />
                                <span>Resultats & Calendrier</span>
                            </Link>
                        </CardContent>
                    </Card>
                </div>
            </section>
            {/* Quick Actions */}
            <section className='mb-4'>
                <Card className="shadow-elevated">
                    <CardHeader>
                        <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent className='pb-4 grid grid-cols-2 md:grid-cols-4 gap-4'>
                        <Button variant="default" className="h-20 flex-col gap-2">
                            <Plus className="h-6 w-6" />
                            <span className="text-sm">Create League</span>
                        </Button>
                        <Button variant="default" className="h-20 flex-col gap-2">
                            <UserPlus className="h-6 w-6" />
                            <span className="text-sm">Add Manager</span>
                        </Button>
                        <Button variant="default" className="h-20 flex-col gap-2">
                            <Calendar className="h-6 w-6" />
                            <span className="text-sm">Schedule Game</span>
                        </Button>
                        <Button variant="default" className="h-20 flex-col gap-2">
                            <TrendingUp className="h-6 w-6" />
                            <span className="text-sm">View Analytics</span>
                        </Button>
                    </CardContent>
                </Card>
            </section>
            {/* Additional sections can be added here, e.g., "Recent Activity," "Revenue Trends" */}
        </div>
    );
}