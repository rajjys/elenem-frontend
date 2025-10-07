'use client';
import Head from 'next/head';
import { useRouter, useSearchParams } from 'next/navigation'; // Or useNavigation from next/navigation for App Router
import React, { useCallback, useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { GameDetails, GameStatus, Gender, LeagueDetails, LeagueDetailsSchema, LeagueMetrics, LeagueMetricsSchema, Roles, StandingsBasic } from '@/schemas';
import { api } from '@/services/api';
import { toast } from 'sonner';
import { useContextualLink } from '@/hooks';
import { StatsCard } from '@/components/ui/stats-card';
import { Award, Building2, Calendar, CalendarPlus, Clock, Clock1, Settings, Ticket, Trophy,  User2,  Users } from 'lucide-react';
import { Avatar, Card, CardContent, CardFooter, CardHeader, CardTitle, LoadingSpinner, SeasonStatusBadge, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui';
import Image from 'next/image';
import Link from 'next/link';
import { formatDateFr } from '@/utils';
import qs from 'qs';

export default function LeagueDashboard() {
    const userAuth = useAuthStore((state) => state.user);
    const currentUserRoles = userAuth?.roles || [];
    const [league, setLeague] = useState<LeagueDetails>();
    const [detailsLoading, setDetailsLoading] = useState(true);
    const [metricsLoading, setMetricsLoading] = useState(false);
    const [metrics, setMetrics] = useState<LeagueMetrics>();
    const [upcomingGames, setUpcomingGames] = useState<GameDetails[]>([]);
    const [Standings, setStandings] = useState<StandingsBasic[]>([]);
    const [recentGames, setRecentGames] = useState<GameDetails[]>([]);
    const [error, setError] = useState<string | null>(null);

    const { buildLink } = useContextualLink();

    const ctxLeagueId = useSearchParams().get('ctxLeagueId');
    
    // Determine current tenant ID based on user roles
    const isSystemAdmin = currentUserRoles.includes(Roles.SYSTEM_ADMIN);
    const isTenantAdmin = currentUserRoles.includes(Roles.TENANT_ADMIN);
    const isLeagueAdmin = currentUserRoles.includes(Roles.LEAGUE_ADMIN);
    
    const currentLeagueId = isSystemAdmin || isTenantAdmin
        ? ctxLeagueId
        : isLeagueAdmin
        ? userAuth?.managingLeagueId
        : null;
    //Fetch tenant-specific data if needed, e.g., tenant name, logo, etc.
    const fetchLeagueDetails = useCallback(async () => {
        setDetailsLoading(true);
        setError(null);
        if (!currentLeagueId) {
          setDetailsLoading(false);
          setError("League or Tenant ID not available. Please log in as a League Admin.");
          return;
        }
        try {
          const response = await api.get(`/leagues/${currentLeagueId}`);
          const validatedLeague = LeagueDetailsSchema.parse(response.data);
          setLeague(validatedLeague);
        } catch (err) {
          const errorMessage = "Failed to fetch League details.";
          setError(errorMessage);
          toast.error("Error loading League", { description: errorMessage });
          console.error('Fetch League details error:', err);
        } finally {
          setDetailsLoading(false);
        }
      }, [currentLeagueId]);

    const fetchLeagueMetrics = useCallback(async () => {
      setMetricsLoading(true);
      if (!currentLeagueId || !league?.currentSeasonId) {
        setMetricsLoading(false);
        return;
      }
      try {
        const response = await api.get(`/leagues/${currentLeagueId}/metrics`);
        const validatedMetrics = LeagueMetricsSchema.parse(response.data);
        setMetrics(validatedMetrics);
      } catch (err) {
        console.error("Failed to fetch metrics:", err);
        toast.error("Error loading metrics", { description: "Could not load league metrics." });
      } finally {
        setMetricsLoading(false)
      }
    }, [currentLeagueId, league?.currentSeasonId]);
/// Fetch recent, upcoming games and standings
    const fetchRecentGames = useCallback( async () => {
      if (!currentLeagueId) return;
      try {
        const response = await api.get('/games/', { 
          params: { leagueId: currentLeagueId, 
          pageSize: 5,
          sortBy: 'dateTime',
          sortOrder: 'desc',
          status: GameStatus.COMPLETED,
        }});
        setRecentGames(response.data.data);
      } catch (error) {
        console.error("Error fetching recent games:", error)
      }
    }, [currentLeagueId])

    ///Fetch upcoming games
    const fetchUpcomingGames = useCallback( async () => {
      if (!currentLeagueId) return;
      try {
        const response = await api.get('/games', {
          params: { leagueId: currentLeagueId,
            pageSize: 5,
            sortBy: 'dateTime',
            sortOrder: 'asc',
            status: [GameStatus.SCHEDULED, GameStatus.IN_PROGRESS],
            fromDate: new Date("2025-09-09").toISOString(), // Only future games
          },
          paramsSerializer: (params) => qs.stringify(params, { arrayFormat: 'repeat' })
        });
        setUpcomingGames(response.data.data);
      } catch (error){
          console.error("Error fetching upcoming games:", error)
      }
    }, [currentLeagueId]);
    /// Fetch league standings
    const fetchLeagueStandings = useCallback( async () => {
      if(!currentLeagueId || league?.currentSeasonId) return;
      try {
        const response = await api.get('/games/standings', 
          { params: { 
            leagueId: currentLeagueId,
            seasonId: league?.currentSeasonId
          }}
        );
        setStandings(response.data);
      } catch(error) {
        console.error("Error fetching standings:", error)
      }
    }, [currentLeagueId, league?.currentSeasonId])
    useEffect(() => {
        // Fetch tenant-specific data if needed, e.g., tenant name, logo, etc.
        if (currentLeagueId) {
          fetchLeagueMetrics();
          fetchLeagueDetails();
          fetchRecentGames();
          fetchUpcomingGames()
          fetchLeagueStandings();
        }
    }, [currentLeagueId, fetchLeagueDetails, fetchLeagueMetrics, fetchRecentGames, fetchUpcomingGames, fetchLeagueStandings]);
    if(detailsLoading) return <LoadingSpinner />
    if(error) return <div className='text-red-500 text-center mt-8'>Error: {error}</div>;
    return (
        <div className="min-h-screen">
            <Head>
                <title>{league?.tenant?.tenantCode || "Ligue"} - Tableau de Bord</title>
            </Head>  
            <section className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 md:gap-0 px-4 py-3 mb-6 bg-white shadow-md rounded-md">
              <div className="flex items-center gap-3">
                  {league?.businessProfile?.logoAsset?.url ? (
                  <Image
                      src={league.businessProfile.logoAsset.url}
                      alt={league.division}
                      width={40}
                      height={40}
                      className="rounded-full"
                  />
                  ) : (
                  <Avatar name={league?.name || 'Ligue'} size={40} className="rounded-full" />
                  )}
                  {
                    league &&
                    <div>
                      <h1 className="text-lg md:text-xl lg:text-2xl font-bold text-gray-800 leading-tight">
                          {league.name}
                      </h1>
                      <p className="text-sm text-gray-500 flex items-center gap-2">
                          <span>{league?.division}</span>
                          -
                          <span className='italic'>{
                            league?.gender === Gender.MALE ? "Masculin" :
                            league?.gender === Gender.FEMALE ? "Feminin" :
                            league?.gender === Gender.MIXED ? "Mixte" : "-"
                            }
                          </span>
                          -
                          <SeasonStatusBadge status={league.currentSeason?.status} />
                      </p>
                    </div>}
              </div>
              {
                league &&
                <div className="flex flex-wrap gap-2 md:gap-3 text-sm">
                  <Link href={buildLink("/game/create", { ctxLeagueId: league.id })}
                    className="flex items-center gap-2 px-3 py-2 rounded-md transition-all duration-150 soft-theme-gradient">
                    <CalendarPlus className="h-4 w-4" />
                    <span>Nouveau Match</span>
                  </Link>
                  <Link href={buildLink("/team/create", { ctxLeagueId: league.id })}
                    className="flex items-center gap-2 px-3 py-2 rounded-md transition-all duration-150 soft-theme-gradient">
                      <Users className="h-4 w-4" />
                      <span>Nouvelle Équipe</span>
                  </Link>
                  {
                    league.currentSeasonId ?
                    <Link href={buildLink(`/season/${league.currentSeasonId}/dashboard`)}
                      className="flex items-center gap-2 px-3 py-2 rounded-md transition-all duration-150 soft-theme-gradient">
                        <Settings className="h-4 w-4" />
                        <span>Gérer la Saison</span>
                    </Link> :
                    <Link href={buildLink("/league/settings")}
                      className="flex items-center gap-2 px-3 py-2 rounded-md transition-all duration-150 soft-theme-gradient">
                        <Settings className="h-4 w-4" />
                        <span>Activer la Saison</span>
                    </Link>
                  }
                </div>
              }
            </section>
                {/* Key Metrics Section */}
            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-6">
                  <StatsCard title="Equipes" value={metrics?.activeTeamCount ?? 0}
                    description={`Total: ${metrics?.totalTeamCount ?? 0}`}
                    trend={{
                      value: Math.abs(metrics?.participatingTeamDelta ?? 0),
                      timespan: "season",
                    }} 
                    icon={Building2} 
                    variant="success" 
                    href={buildLink("/league/teams")} 
                    loading={metricsLoading}/>
                  <StatsCard 
                    title="Athletes" 
                    value={metrics?.activePlayerCount ?? 0}
                    description={`Total: ${metrics?.totalPlayerCount ?? 0}`}
                    trend={{
                      value: Math.abs(metrics?.participatingPlayerDelta ?? 0),
                      timespan: "season",
                    }} icon={User2} 
                    variant="success" 
                    href={buildLink("/league/players")}  
                    loading={metricsLoading}/>
                  <StatsCard 
                    title="Matchs Joués" 
                    value={metrics?.gamesPlayed ?? 0}
                    description={`Sur ${metrics?.gamesScheduled ?? 0} programmés`}
                    trend={{
                      value: metrics?.gamesPlayedRatio ?? 0,
                    }} 
                    icon={Calendar} 
                    variant="danger" 
                    href={buildLink("/league/games")}  
                    loading={metricsLoading}/>
                  <StatsCard 
                    title="Billets vendus (Aujourd'hui)" 
                    value={0} // Placeholder
                    description="Ventes de billets aujourd'hui"
                    trend={{
                      value: 3.6,
                      timespan: "season",
                    }} icon={Ticket} variant="neutral"  
                    loading={metricsLoading}/>
            </section>

            {/* Games & Standings Overview */}
            <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                {/* Recent Games */}
                <div className="h-full lg:col-span-1">
                    <Card className="h-full flex flex-col justify-between shadow-elevated bg-gray-50">
                      <CardHeader className="flex flex-row items-center justify-between gap-2 sm:gap-4 px-4 border-b border-slate-200">
                          <CardTitle className="text-lg font-semibold text-gray-500">Matchs Recents</CardTitle>
                          <Link href={buildLink('/league/games#results')} className="inline-flex items-center text-sm font-medium text-slate-500 nav-hover">
                              <Clock1 className="h-4 w-4 mr-1" />
                              <span>Resultats</span>
                          </Link>
                      </CardHeader>
                      <CardContent className="flex-1">
                        {
                          recentGames.length > 0 ?
                          recentGames.slice(0, 5).map((game) => (
                            <MinimalGameCard key={game.id} game={game} />
                          ))
                          :
                          <p className="text-center text-sm text-slate-500 py-8">Aucun match récent</p>
                        }
                      </CardContent>
                      <CardFooter className='flex items-center justify-center border-t border-slate-200'>
                          <Link href={buildLink('/league/games#results')} className="py-1 flex items-center justify-center text-sm font-medium text-slate-500 nav-hover">
                              <Clock className="h-4 w-4 mr-1" />
                              <span>Tout les Resultats</span>
                          </Link>
                      </CardFooter>
                    </Card>
                </div>
                {/* Upcoming Games */}
                <div className="h-full lg:col-span-1">
                    <Card className="h-full flex flex-col justify-between shadow-elevated bg-gray-50">
                      <CardHeader className="flex flex-row items-center justify-between gap-2 sm:gap-4 px-4 border-b border-slate-200">
                          <CardTitle className="text-lg font-semibold text-gray-500">Prochains Matchs</CardTitle>
                          <Link href={buildLink('/league/games#schedule')} className="inline-flex items-center text-sm font-medium text-slate-500 nav-hover">
                              <Clock1 className="h-4 w-4 mr-1" />
                              <span>Calendriers</span>
                          </Link>
                      </CardHeader>
                      <CardContent className="flex-1">
                        {
                          upcomingGames.length > 0 ?
                            upcomingGames.slice(0, 5).map((game) => (
                              <MinimalGameCard key={game.id} game={game} />
                            ))
                          :
                            <p className="text-center text-sm text-slate-500 py-8">Aucun match programmé</p>
                        }
                      </CardContent>
                      <CardFooter className='flex items-center justify-center border-t border-slate-200'>
                          <Link href={buildLink('/league/games#schedule')} className="py-1 flex items-center justify-center text-sm font-medium text-slate-500 nav-hover">
                              <Clock className="h-4 w-4 mr-1" />
                              <span>Calendriers Complets</span>
                          </Link>
                      </CardFooter>
                    </Card>
                </div>
                <div className="h-full lg:col-span-1">
                    <Card className="h-full flex flex-col justify-between shadow-elevated bg-gray-50">
                      <CardHeader className="flex flex-row items-center justify-between gap-2 sm:gap-4 px-4 border-b border-slate-200">
                          <CardTitle className="text-lg font-semibold text-gray-500">Classements</CardTitle>
                          <Link href={buildLink('/league/standings')} className="inline-flex items-center text-sm font-medium text-slate-500 nav-hover">
                              <Clock1 className="h-4 w-4 mr-1" />
                              <span>Liste complete</span>
                          </Link>
                      </CardHeader>
                      <CardContent className="flex-1">
                        {
                          Standings.length > 0 ?
                          <StandingsTable standings={Standings.slice(0, 8)} />
                          :
                          <p className="text-center text-sm text-slate-500 py-8">Aucun classement disponible</p>
                        }
                      </CardContent>
                      <CardFooter className='flex items-center justify-center border-t border-slate-200'>
                          <Link href={buildLink('/league/standings')} className="py-1 flex items-center justify-center text-sm font-medium text-slate-500 nav-hover">
                              <Clock className="h-4 w-4 mr-1" />
                              <span>Classements Complets</span>
                          </Link>
                      </CardFooter>
                    </Card>
                </div>
            </section>
            {/* Quick Actions */}
            <section className='mb-6 hidden'>
                <Card className="shadow-elevated">
                    <CardHeader>
                        <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="p-4 border border-gray-200 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-green-400 flex items-center justify-center text-white">
                              <Users className="h-5 w-5" />
                            </div>
                            <div>
                              <div className="font-medium text-sm">Manage Teams</div>
                              <div className="text-xs text-gray-500">Add, edit teams</div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="p-4 border border border-gray-200 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-orange-400 flex items-center justify-center text-white">
                              <Calendar className="h-5 w-5" />
                            </div>
                            <div>
                              <div className="font-medium text-sm">Schedule Game</div>
                              <div className="text-xs text-gray-500">Create new games</div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="p-4 border border border-gray-200 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-green-400 flex items-center justify-center text-white">
                              <Trophy className="h-5 w-5" />
                            </div>
                            <div>
                              <div className="font-medium text-sm">View Standings</div>
                              <div className="text-xs text-muted-foreground">League rankings</div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="p-4 border border border-gray-200 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-indigo-400 flex items-center justify-center text-white">
                              <Award className="h-5 w-5" />
                            </div>
                            <div>
                              <div className="font-medium text-sm">Player Stats</div>
                              <div className="text-xs text-muted-foreground">Performance data</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                </Card>
            </section>
            {/* Additional sections can be added here, e.g., "Recent Activity," "Revenue Trends" */}
        </div>
    );
}

const MinimalGameCard = ({ game }: { game: GameDetails }) => {
  return (
    <Link href={`/game/${game.id}/dashboard`} key={game.id} className="block">
      <div className="bg-white rounded-lg shadow-sm hover:shadow-md hover:bg-slate-100 transition p-2 my-2 space-y-3">
        {/* Date & Status */}
        <div className="flex items-center justify-between text-xs text-gray-600 font-semibold">
          <span>{formatDateFr(game.dateTime)}</span>
          {game.status === GameStatus.IN_PROGRESS && 
            <span className='text-red-500 bg-red-50 border border-red-200 rounded-full px-3 py-0.5 font-semibold animate-pulse'>
              Live
            </span>
          }
        </div>
        {/* Teams & Score */}
        <div className="flex items-center justify-between gap-4">
          {/* Home Team */}
          <div className="flex items-center gap-2">
            <Avatar
              src={game.homeTeam.businessProfile.logoAsset?.url}
              name="logo"
              size={30}
            />
            <span className="font-semibold text-sm">{game.homeTeam.shortCode}</span>
          </div>
          {/* Score */}
          <div className="flex items-center gap-2 text-lg font-bold text-gray-800">
            <span>{game.homeScore}</span>
            <span>-</span>
            <span>{game.awayScore}</span>
          </div>
          {/* Away Team */}
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm">{game.awayTeam.shortCode}</span>
            <Avatar
              src={game.awayTeam.businessProfile.logoAsset?.url}
              name="logo"
              size={30}
            />
          </div>
        </div>
      </div>
    </Link>
  )
}

const StandingsTable = ({ standings } : { standings: StandingsBasic []}) => {
  const { buildLink } = useContextualLink();
  const router = useRouter();
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-center px-1"></TableHead>
            <TableHead className="min-w-[100px]"></TableHead>
            <TableHead className="font-bold text-center">Pts</TableHead>
            <TableHead className="text-center">J</TableHead>
            <TableHead className="text-center">G</TableHead>
            <TableHead className="text-center">P</TableHead>
            <TableHead className="text-center">N</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {standings.map((item) => {
            return (
                  <TableRow key={item.team.id} className="cursor-pointer hover:bg-gray-100"
                    onClick={() => router.push(buildLink(`/team/dashboard`, { ctxTeamId: item.team.id }))}>
                    <TableCell className="font-medium text-center px-1">{item.rank}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                          <Avatar src={item.team.businessProfile?.logoAsset?.url} name={item.team.name} size={25} />
                        <span className="font-medium">{item.team.shortCode}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-bold text-center">{item.points}</TableCell>
                    <TableCell className="text-center">{item.gamesPlayed}</TableCell>
                    <TableCell className="text-center">{item.wins}</TableCell>
                    <TableCell className="text-center">{item.losses}</TableCell>
                    <TableCell className="text-center">{item.draws}</TableCell>
                  </TableRow>
            )})
          }
        </TableBody>
      </Table>
    </div>
  );
}
