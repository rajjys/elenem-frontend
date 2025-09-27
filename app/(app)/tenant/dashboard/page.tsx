'use client';
import Head from 'next/head';
import { useSearchParams } from 'next/navigation'; // Or useNavigation from next/navigation for App Router
import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth.store';
import { LeagueBasic, PaginatedLeaguesResponseSchema, Roles, TenantDetails, TenantDetailsSchema } from '@/schemas';
import { api } from '@/services/api';
import { toast } from 'sonner';
import { useContextualLink } from '@/hooks';
import { StatsCard } from '@/components/ui/stats-card';
import { Building, Calendar, CalendarPlus, Plus, Target, Ticket, TrendingUp, Trophy, UserPlus, Users } from 'lucide-react';
import { Avatar, Button, Card, CardContent, CardHeader, CardTitle, LeagueCard, LoadingSpinner } from '@/components/ui';
import { capitalizeFirst, countryNameToCode } from '@/utils';
import axios from 'axios';
import Image from 'next/image';
import CountryFlag from 'react-country-flag';

interface UpcomingGame {
    id: string;
    homeTeam: string;
    awayTeam: string;
    league: string;
    date: string;
    time: string;
    venue: string;
    status: string; // e.g., 'Scheduled', 'Postponed'
}

    const mockUpcomingGames: UpcomingGame[] = [
        { id: '1', homeTeam: "Thunderbolts FC", awayTeam: "Rapid Strikers", league: "Premier League '25", date: "2025-07-07", time: "19:00", venue: "City Arena", status: "Scheduled" },
        { id: '2', homeTeam: "Crimson Knights", awayTeam: "Emerald Dragons", league: "Division A Cup", date: "2025-07-08", time: "14:30", venue: "Park View Stadium", status: "Scheduled" },
        { id: '3', homeTeam: "United Titans", awayTeam: "Galaxy Stars", league: "Youth League '25", date: "2025-07-08", time: "17:00", venue: "Community Pitch 3", status: "Scheduled" },
        { id: '4', homeTeam: "Silver Arrows", awayTeam: "Golden Eagles", league: "Premier League '25", date: "2025-07-09", time: "20:00", venue: "National Stadium", status: "Scheduled" },
        { id: '5', homeTeam: "Phoenix Rising", awayTeam: "Storm Breakers", league: "Division B League", date: "2025-07-10", time: "16:00", venue: "Training Grounds A", status: "Scheduled" },
    ];
    // Example navItems structure, directly correlating to backend endpoints

    
export default function TenantDashboard() {
    const userAuth = useAuthStore((state) => state.user);
    const currentUserRoles = userAuth?.roles || [];
    const [tenant, setTenant] = useState<TenantDetails | null>(null);
    const [leagues, setLeagues] = useState<LeagueBasic>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
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
    
    // Dynamically generate stat cards based on tenant data
    const statCards = [
        { title: "Total Leagues", value: tenant?.leagues?.length || 0, description: "Active Leagues Under Management", trend: {isPositive: true, value: 3.6, timespan: "season"}, icon: Trophy, bgColorClass: "bg-blue-400", textColorClass: "text-white", href: buildLink("/tenant/leagues") },
        { title: "Total Teams", value: tenant?.teams?.length || 0, description: "Active Teams in all Leagues", trend: {isPositive: false, value: 2.6, timespan: "season"}, icon: Building, bgColorClass: "bg-green-400", textColorClass: "text-white", href: buildLink("/tenant/teams") },
        { title: "Total Players", value: 0, description: "Active Players in all Leagues", trend: {isPositive: true, value: 0, timespan: "season"}, icon: Calendar, bgColorClass: "bg-orange-400", textColorClass: "text-white", href: buildLink("/tenant/players") },
        { title: "Tickets Sold (Today)", value: 0, description: "Active Leagues Under Management", trend: {isPositive: true, value: 0, timespan: "season"}, icon: Ticket, bgColorClass: "bg-red-400", textColorClass: "text-white", href: buildLink("/tenant/tickets") }, // Keeping mock for now as per request
    ]
    const recentActivities = [
  { id: 1, action: "New league created", details: "Professional Volleyball League", time: "5 min ago", type: "league" },
  { id: 2, action: "Manager assigned", details: "John Smith assigned to Basketball League", time: "15 min ago", type: "manager" },
  { id: 3, action: "Payment received", details: "$3,200 from Soccer League subscription", time: "1 hour ago", type: "payment" },
  { id: 4, action: "League completed", details: "Junior Tennis League finished season", time: "2 hours ago", type: "league" },
  { id: 5, action: "New team registered", details: "Thunder Bolts joined Basketball League", time: "3 hours ago", type: "team" }
];

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
            {/* Leagues Overview */}
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
                    <CardHeader>
                        <CardTitle className="text-lg font-semibold">Matchs</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {recentActivities.map((activity) => (
                        <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/30 transition-colors">
                            <div className="flex-shrink-0 mt-1">
                            {activity.type === 'league' && <Trophy className="h-4 w-4 text-primary" />}
                            {activity.type === 'manager' && <Users className="h-4 w-4 text-warning" />}
                            {activity.type === 'payment' && <TrendingUp className="h-4 w-4 text-success" />}
                            {activity.type === 'team' && <Target className="h-4 w-4 text-accent" />}
                            </div>
                            <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm text-foreground">{activity.action}</p>
                            <p className="text-xs text-muted-foreground truncate">{activity.details}</p>
                            <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
                            </div>
                        </div>
                        ))}
                        <Link href={buildLink('/tenant/games')} className="py-3 flex items-center justify-center text-sm font-medium text-emerald-600 hover:text-emerald-800 transition-colors">
                            <Trophy className="h-4 w-4 mr-1 text-emerald-600" />
                            <span>Tout les Matchs</span>
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
            {/* Upcoming Games Table */}
            <section className="bg-white p-6 rounded-lg shadow-md mb-8">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold text-gray-800">Upcoming Games</h2>
                        <Link href={buildLink("/games")} className="text-emerald-600 hover:text-emerald-700 text-sm font-medium">
                            View All Games
                        </Link>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Match
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        League
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Date & Time
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Venue
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {mockUpcomingGames.map((game) => (
                                    <tr key={game.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {game.homeTeam} vs {game.awayTeam}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {game.league}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {game.date} at {game.time}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {game.venue}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                                {game.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
            </section>
            {/* Additional sections can be added here, e.g., "Recent Activity," "Revenue Trends" */}
        </div>
    );
}