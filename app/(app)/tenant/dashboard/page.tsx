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
import { Building, CalendarPlus, Clock, Clock1, Newspaper, Ticket, TrendingUp, Trophy, UserPlus, Users } from 'lucide-react';
import { Avatar, Card, CardContent, CardFooter, CardHeader, CardTitle, getStatusBadge, LeagueCard, LoadingSpinner } from '@/components/ui';
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
    const [leagues, setLeagues] = useState<LeagueBasic[]>([]);
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
            console.log(error);
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
      const fetchDates = useCallback( async () => {
          if (!currentTenantId) return;
          setLoadingDates(true);
          try {
              const response = await api.get<string[]>('/games/dates',
                { params: { tenantId: currentTenantId}}
              );
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
        }, [currentTenantId])
        // Fetch games when a date is selected
          const fetchGames = useCallback(async (date: string) => {
            if (!date) return;
            if (!currentTenantId) return;
            setLoadingGames(true);
            try {
              const response = await api.get<{data: GameDetails[]}>('/games', { params: { date, tenantId: currentTenantId } });
              const gamesResponse = response.data;
              setGamesByDate(gamesResponse.data);
            } catch (error) {
                //toast.error(`Failed to load games for ${date}.`);
                console.error(error);
            }
            finally{
                setLoadingGames(false)
            }
          }, [currentTenantId]);
          useEffect(() => {
             fetchDates(); 
          }, [fetchDates]);
        
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
        { title: "Ligues", value: tenant?.leagues?.length || 0, description: "Ligues Actives de l'organisation", trend: {isPositive: true, value: 3.6, timespan: "season"}, icon: Trophy, bgColorClass: "bg-blue-400", textColorClass: "text-white", href: buildLink("/tenant/leagues") },
        { title: "Equipes", value: tenant?.teams?.length || 0, description: "Equipes actives de l'organisation", trend: {isPositive: false, value: 2.6, timespan: "season"}, icon: Building, bgColorClass: "bg-green-400", textColorClass: "text-white", href: buildLink("/tenant/teams") },
        { title: "Athletes", value: 0, description: "Athletes actifs dans l'organisation", trend: {isPositive: true, value: 0, timespan: "season"}, icon: Users, bgColorClass: "bg-orange-400", textColorClass: "text-white", href: buildLink("/tenant/players") },
        { title: "Ventes (Aujourdh'hui)", value: 0, description: "Billets Vendus Aujourd'hui", trend: {isPositive: true, value: 0, timespan: "season"}, icon: Ticket, bgColorClass: "bg-red-400", textColorClass: "text-white", href: buildLink("/tenant/tickets") }, // Keeping mock for now as per request
    ]

    return (
        <div className="min-h-screen">
            <Head>
                <title>{tenant?.tenantCode || "Tenant"} - Tableau de Bord</title>
            </Head>
            {/* Header Section */}
            <section className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 md:gap-0 px-4 py-3 mb-4 bg-white shadow-md rounded-md">
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
                            <CountryFlag countryCode={countryNameToCode[tenant.country] || tenant.country} svg style={{ width: '2em', height: '1em' }} />
                        </p>
                    )}
                    </div>
                </div>
                <div className="flex flex-wrap gap-2 md:gap-3 text-sm">
                    <Link href={buildLink("/game/create")}
                        className="flex items-center gap-2 px-3 py-2 rounded-md transition-all duration-150 soft-theme-gradient">
                        <CalendarPlus className="h-4 w-4" />
                        <span className="">Nouveau Match</span>
                    </Link>
                    <Link href={buildLink("/league/create")}
                        className="flex items-center gap-2 px-3 py-2 rounded-md transition-all duration-150 soft-theme-gradient">
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
                <div className="h-full lg:col-span-2">
                    <Card className="h-full flex flex-col justify-between shadow-elevated">
                        <CardHeader className="flex flex-row items-center justify-between gap-2 sm:gap-4 px-4 py-2 border-b border-slate-200">
                            <CardTitle className="text-xl font-semibold text-gray-800">{tenant?.leagues?.length} Ligues</CardTitle>
                            <Link href={buildLink('/tenant/leagues')} className="inline-flex items-center text-sm font-medium text-emerald-700 hover:text-emerald-800 transition-colors">
                                <Trophy className="h-4 w-4 mr-1 text-emerald-600" />
                                <span>Toutes les Ligues</span>
                            </Link>
                        </CardHeader>
                        <CardContent className="flex-1">
                        {leagues?.map((league: LeagueBasic) => (
                            <LeagueCard key={league.id} league={league} tenant={tenant!} />
                        ))}
                        
                        </CardContent>
                        <CardFooter className='flex items-center justify-center border-t border-slate-200'>
                            <Link href={buildLink('/tenant/leagues')} className="py-1 flex items-center justify-center text-sm font-medium text-emerald-600 hover:text-emerald-800 transition-colors">
                                <Trophy className="h-4 w-4 mr-1 text-emerald-600" />
                                <span>Toutes les Ligues</span>
                            </Link>
                        </CardFooter>
                    </Card>
                </div>
                {/* Games */}
                <div className='h-full'>
                    <Card className="h-full flex flex-col justify-between shadow-elevated">
                        <CardHeader className="flex flex-row items-center justify-between gap-2 sm:gap-4 px-4 py-2 border-b border-slate-200">
                            <CardTitle className="text-xl font-semibold text-gray-800">Matchs</CardTitle>
                            <Link href={buildLink('/tenant/games')} className="inline-flex items-center text-sm font-medium text-emerald-700 hover:text-emerald-800 transition-colors">
                                <Clock1 className="h-4 w-4 mr-1 text-emerald-600" />
                                <span>Tout les Matchs</span>
                            </Link>
                        </CardHeader>
                        <CardContent className="flex-1 pt-1">
                            { !loadingDates ?
                                availableDates.length > 0 && 
                                    <DateCarousel
                                        dates={availableDates}
                                        selectedDate={selectedDate}
                                        onDateSelect={setSelectedDate}
                                    />
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
                                        : !loadingDates && <p className='text-center font-bold text-base lg:text-lg h-full'>Aucun Match Disponible</p>
                                            
                                        : <LoadingSpinner message='Chargement des Matchs' />
                                }
                            </div>       
                        </CardContent>
                        <CardFooter className='flex items-center justify-center border-t border-slate-200'>
                            <Link href={buildLink('/tenant/games')} className="py-1 flex items-center justify-center text-sm font-medium text-emerald-600 hover:text-emerald-800 transition-colors">
                                <Clock className="h-4 w-4 mr-1 text-emerald-600" />
                                <span>Resultats & Calendrier</span>
                            </Link>
                        </CardFooter>
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
                            <Link href="/season/create"
                                className="h-20 w-full flex flex-col items-center justify-center gap-2 rounded-md border border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium transition-colors">
                                <Trophy className="h-6 w-6" />
                                <span>Créer Une Nouvelle Saison</span>
                            </Link>
                            <Link href="/tenant/admin/add"
                                className="h-20 w-full flex flex-col items-center justify-center gap-2 rounded-md border border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium transition-colors">
                                <UserPlus className="h-6 w-6" />
                                <span>Ajouter un Admin</span>
                            </Link>
                            <Link href="/post/create"
                                className="h-20 w-full flex flex-col items-center justify-center gap-2 rounded-md border border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium transition-colors">
                                <Newspaper className="h-6 w-6" />
                                <span>Créer une publication</span>
                            </Link>
                            <Link
                                href="/tenant/analytics"
                                className="h-20 w-full flex flex-col items-center justify-center gap-2 rounded-md border border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium transition-colors">
                                <TrendingUp className="h-6 w-6" />
                                <span>Analytics</span>
                            </Link>
                    </CardContent>
                </Card>
            </section>
            {/* Additional sections can be added here, e.g., "Recent Activity," "Revenue Trends" */}
        </div>
    );
}