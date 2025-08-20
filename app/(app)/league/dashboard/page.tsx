'use client';
import Head from 'next/head';
import { useRouter, useSearchParams } from 'next/navigation'; // Or useNavigation from next/navigation for App Router
import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { LeagueBasic, LeagueBasicSchema, Roles } from '@/schemas';
import { api } from '@/services/api';
import { toast } from 'sonner';
import { useContextualLink } from '@/hooks';
import { StatsCard } from '@/components/ui/stats-card';
import { Award, Building, Calendar, Clock, Eye, MapPin, Plus, Settings, Target, Ticket, TrendingUp, Trophy,  Users } from 'lucide-react';
import { Avatar, Button, Card, CardContent, CardHeader, CardTitle, LoadingSpinner } from '@/components/ui';

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
        { id: '1', homeTeam: "Goma West", awayTeam: "Virunga", league: "Premier League '25", date: "2025-07-07", time: "19:00", venue: "City Arena", status: "Scheduled" },
        { id: '2', homeTeam: "Cyclone", awayTeam: "Barcelone", league: "Division A Cup", date: "2025-07-08", time: "14:30", venue: "Park View Stadium", status: "Scheduled" },
        { id: '3', homeTeam: "Relax", awayTeam: "Byern", league: "Youth League '25", date: "2025-07-08", time: "17:00", venue: "Community Pitch 3", status: "Scheduled" },
        { id: '4', homeTeam: "Silverback", awayTeam: "Shem", league: "Premier League '25", date: "2025-07-09", time: "20:00", venue: "National Stadium", status: "Scheduled" },
        { id: '5', homeTeam: "Don Bosco", awayTeam: "Zebre", league: "Division B League", date: "2025-07-10", time: "16:00", venue: "Training Grounds A", status: "Scheduled" },
    ];


    
export default function TenantDashboard() {
    const router = useRouter(); // Use useRouter for client-side navigation
    const userAuth = useAuthStore((state) => state.user);
    const currentUserRoles = userAuth?.roles || [];
    //const [tenant, setTenant] = useState<TenantDetails | null>(null);
    const [league, setLeague] = useState<LeagueBasic>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const { buildLink } = useContextualLink();

    const ctxTenantId = useSearchParams().get('ctxTenantId'); // Use search params if needed
    const ctxLeagueId = useSearchParams().get('ctxLeagueId');
    
    // Determine current tenant ID based on user roles
    const isSystemAdmin = currentUserRoles.includes(Roles.SYSTEM_ADMIN);
    const isTenantAdmin = currentUserRoles.includes(Roles.TENANT_ADMIN);
    const isLeagueAdmin = currentUserRoles.includes(Roles.LEAGUE_ADMIN);
    
    const currentTenantId = isSystemAdmin
      ? ctxTenantId
      : isTenantAdmin || isLeagueAdmin
      ? userAuth?.tenantId
      : null;

  const currentLeagueId = isSystemAdmin || isTenantAdmin
      ? ctxLeagueId
      : isLeagueAdmin
      ? userAuth?.managingLeagueId
      : null;
    //Fetch tenant-specific data if needed, e.g., tenant name, logo, etc.
    const fetchLeagueDetails = async () => {
        setLoading(true);
        setError(null);
        if (!currentTenantId || !currentLeagueId) {
          setLoading(false);
          setError("League or Tenant ID not available. Please log in as a League Admin.");
          return;
        }
        try {
          const response = await api.get(`/leagues/${currentLeagueId}`);
          const validatedLeague = LeagueBasicSchema.parse(response.data);
          setLeague(validatedLeague);
        } catch (err) {
          const errorMessage = "Failed to fetch League details.";
          setError(errorMessage);
          toast.error("Error loading League", { description: errorMessage });
          console.error('Fetch League details error:', err);
        } finally {
          setLoading(false);
        }
      };

    useEffect(() => {
        // Fetch tenant-specific data if needed, e.g., tenant name, logo, etc.
        if (currentLeagueId) {
            fetchLeagueDetails();
            //fetchLeagues();
        }
    }, [currentLeagueId]);
    
    // Dynamically generate stat cards based on tenant data
    const statCards = [
        { title: "Total Teams", value: league?.teams?.length || 0, description: "Active Teams Under Management", trend: {isPositive: true, value: 3.6, timespan: "season"}, icon: Trophy, bgColorClass: "bg-blue-400", textColorClass: "text-white", href: buildLink("/league/teams") },
        { title: "Total Players", value: league?.players?.length || 0, description: "Active Players in the League", trend: {isPositive: false, value: 2.6, timespan: "season"}, icon: Building, bgColorClass: "bg-green-400", textColorClass: "text-white", href: buildLink("/league/players") },
        { title: "Games Played", value: mockUpcomingGames.length, description: "Games Played So far", trend: {isPositive: true, value: 4.8, timespan: "season"}, icon: Calendar, bgColorClass: "bg-orange-400", textColorClass: "text-white", href: buildLink("/league/games") },
        { title: "Tickets Sold (Today)", value: 120, description: "Game Tickets sold today", trend: {isPositive: true, value: 3.6, timespan: "season"}, icon: Ticket, bgColorClass: "bg-red-400", textColorClass: "text-white", href: buildLink("/league/tickets") }, // Keeping mock for now as per request
    ]
    const recentActivities = [
  { id: 1, action: "New league created", details: "Professional Volleyball League", time: "5 min ago", type: "league" },
  { id: 2, action: "Manager assigned", details: "John Smith assigned to Basketball League", time: "15 min ago", type: "manager" },
  { id: 3, action: "Payment received", details: "$3,200 from Soccer League subscription", time: "1 hour ago", type: "payment" },
  { id: 4, action: "League completed", details: "Junior Tennis League finished season", time: "2 hours ago", type: "league" },
  { id: 5, action: "New team registered", details: "Thunder Bolts joined Basketball League", time: "3 hours ago", type: "team" }
];
    if(loading) return <LoadingSpinner />
    if(error) return <div className='text-red-500 text-center mt-8'>Error: {error}</div>;
    return (
        <div className="min-h-screen">
            <Head>
                <title>Tenant Dashboard - ELENEM Sports</title>
            </Head>  
            <section className='flex items-center justify-between'>
                <h1 className="text-2xl font-bold text-gray-800 mb-6">{league?.name}</h1>
                <div className='flex whitespace-nowrap text-sm gap-3'>
                    <button onClick={() => router.push(buildLink(`/league/edit/${currentLeagueId}`))}
                        className="w-full flex items-center justify-center text-gray-800 px-2 py-2 mx-2 border border-gray-200 rounded-md transition-colors">
                        <Settings className="h-4 w-4 mr-2"/> Settings
                    </button>
                    <button onClick={() => router.push(buildLink('/game/create'))}
                        className="w-full flex items-center justify-center bg-emerald-600 text-white py-2 px-2 rounded-md hover:bg-emerald-700 transition-colors">
                        <Plus className="h-4 w-4 mr-2" /> Schedule Game
                    </button>
                </div>
            </section>
                {/* Key Metrics Section */}
            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
                {statCards.map((card, index) => (
                    <StatsCard key={index} {...card} />
                ))}    
            </section>
            {/* Leagues Overview */}
            <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-4">
                <div className="lg:col-span-2">
                    <Card className="shadow-elevated">
                      <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-lg font-semibold">Upcoming Games</CardTitle>
                        <Button variant="default" size="sm" onClick={() => router.push(buildLink('/league/games'))}>
                          <Eye className="h-4 w-4 mr-2" />
                          View All
                        </Button>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {mockUpcomingGames.slice(0, 4).map((game) => (
                          <div key={game.id} className="p-4 rounded-lg border border-gray-200 hover:bg-gray-200/30 transition-colors">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-6">
                                <div className="flex items-center gap-3">
                                  <Avatar  name={game.homeTeam} size={45}>
                                  </Avatar>
                                  <div className="text-center">
                                    <div className="text-sm">{game.homeTeam}</div>
                                    <div className="text-xs text-gray-500">Home</div>
                                  </div>
                                </div>
                                <div className="text-xl font-bold text-gray-500">VS</div>
                                <div className="flex items-center gap-3">
                                  <div className="text-center">
                                    <div className="text-sm">{game.awayTeam}</div>
                                    <div className="text-xs text-gray-500">Away</div>
                                  </div>
                                  <Avatar  name={game.awayTeam} size={45}>
                                  </Avatar>
                                </div>
                              </div>
                              <Button variant="default" size="sm">
                                View Details
                              </Button>
                            </div>
                            
                            <div className="grid grid-cols-3 gap-4 text-xs text-gray-500 pt-1">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3 mb-1 text-purple-700" />
                                <span>{game.date}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3 text-amber-700" />
                                <span>{game.time}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <MapPin className="h-3 w-3 text-red-700" />
                                <span>{game.venue}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                </div>

                {/* Recent Activity */}
                <div>
                    <Card className="shadow-elevated">
                    <CardHeader>
                        <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
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