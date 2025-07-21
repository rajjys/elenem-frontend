'use client';
import { FiUsers, FiDollarSign, FiAward, FiBarChart2, FiShoppingCart, FiCalendar, FiBox, FiTrendingUp, FiUser, FiActivity, FiList, FiZap, FiFilm, FiSpeaker, FiCreditCard, FiShield, FiSettings, FiAlertTriangle, FiMessageSquare } from 'react-icons/fi';
import Head from 'next/head';
import { useParams, useRouter, useSearchParams } from 'next/navigation'; // Or useNavigation from next/navigation for App Router
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth.store';
import { LeagueBasic, PaginatedLeaguesResponseSchema, Role, TenantDetails, TenantDetailsSchema } from '@/schemas';
import { api } from '@/services/api';
import { toast } from 'sonner';
import { useContextualLink } from '@/hooks';
import { StatsCard } from '@/components/ui/stats-card';
import { Building, Building2, Calendar, Crown, Eye, Flag, FlagIcon, MoreVertical, Plus, Settings, ShoppingCart, Target, Ticket, TrendingUp, Trophy, UserPlus, Users } from 'lucide-react';
import { Avatar, Badge, Button, Card, CardContent, CardHeader, CardTitle, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui';
import Image from 'next/image';
import { capitalize } from '@/utils';

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

interface NavItem {
    label: string;
    basePath: string;
    icon: React.ElementType;
}

interface NavCategory {
    label: string;
    icon: React.ElementType;
    subItems: NavItem[];
}

    const mockUpcomingGames: UpcomingGame[] = [
        { id: '1', homeTeam: "Thunderbolts FC", awayTeam: "Rapid Strikers", league: "Premier League '25", date: "2025-07-07", time: "19:00", venue: "City Arena", status: "Scheduled" },
        { id: '2', homeTeam: "Crimson Knights", awayTeam: "Emerald Dragons", league: "Division A Cup", date: "2025-07-08", time: "14:30", venue: "Park View Stadium", status: "Scheduled" },
        { id: '3', homeTeam: "United Titans", awayTeam: "Galaxy Stars", league: "Youth League '25", date: "2025-07-08", time: "17:00", venue: "Community Pitch 3", status: "Scheduled" },
        { id: '4', homeTeam: "Silver Arrows", awayTeam: "Golden Eagles", league: "Premier League '25", date: "2025-07-09", time: "20:00", venue: "National Stadium", status: "Scheduled" },
        { id: '5', homeTeam: "Phoenix Rising", awayTeam: "Storm Breakers", league: "Division B League", date: "2025-07-10", time: "16:00", venue: "Training Grounds A", status: "Scheduled" },
    ];
    // Example navItems structure, directly correlating to backend endpoints
    const navItems: NavCategory[] = [
        {
            label: "Overview",
            icon: FiBarChart2,
            subItems: [
                { label: "Dashboard", basePath: "/dashboard", icon: FiBarChart2 },
                { label: "Analytics", basePath: "/analytics", icon: FiActivity },
            ],
        },
        {
            label: "Leagues & Seasons",
            icon: FiAward,
            subItems: [
                { label: "All Leagues", basePath: "/leagues", icon: FiList },
                { label: "Seasons", basePath: "/seasons", icon: FiCalendar },
            ],
        },
        {
            label: "Teams & Players",
            icon: FiUsers,
            subItems: [
                { label: "All Teams", basePath: "/teams", icon: FiUsers },
                { label: "Players", basePath: "/players", icon: FiUser },
                { label: "Transfers", basePath: "/transfers", icon: FiZap },
            ],
        },
        {
            label: "Games & Ticketing",
            icon: FiFilm,
            subItems: [
                { label: "All Games", basePath: "/games", icon: FiFilm },
                { label: "Match Events", basePath: "/match-events", icon: FiSpeaker },
                { label: "Ticket Sales", basePath: "/tickets", icon: FiShoppingCart },
            ],
        },
        {
            label: "Finance",
            icon: FiDollarSign,
            subItems: [
                { label: "Transactions", basePath: "/finance/transactions", icon: FiCreditCard },
                { label: "Revenue", basePath: "/finance/revenue", icon: FiTrendingUp },
            ],
        },
        {
            label: "Settings",
            icon: FiSettings,
            subItems: [
                { label: "Tenant Settings", basePath: "/settings/tenant", icon: FiShield },
                { label: "User Management", basePath: "/settings/users", icon: FiUsers },
            ],
        },
        // Add more categories as needed for a comprehensive system
    ];

    
export default function TenantDashboard() {
    const router = useRouter(); // Use useRouter for client-side navigation
    const userAuth = useAuthStore((state) => state.user);
    const currentUserRoles = userAuth?.roles || [];
    const [tenant, setTenant] = useState<TenantDetails | null>(null);
    const [leagues, setLeagues] = useState<LeagueBasic>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { buildLink } = useContextualLink();
    const ctxTenantId = useSearchParams().get('ctxTenantId'); // Use search params if needed
    
    // Determine current tenant ID based on user roles
    const isSystemAdmin = currentUserRoles.includes(Role.SYSTEM_ADMIN);
    const isTenantAdmin = currentUserRoles.includes(Role.TENANT_ADMIN);
    
    const currentTenantId = isSystemAdmin
    ? ctxTenantId
    : isTenantAdmin
    ? userAuth?.tenantId
    : null;
    //Fetch tenant-specific data if needed, e.g., tenant name, logo, etc.
    const fetchTenantDetails = async () => {
        setLoading(true);
        setError(null);
        try {
          const response = await api.get(`/tenants/${currentTenantId}`);
          //console.log(response);
          const validatedTenant = TenantDetailsSchema.parse(response.data);
          setTenant(validatedTenant);
        } catch (err: any) {
          const errorMessage = err.response?.data?.message || err.message || "Failed to fetch tenant details.";
          setError(errorMessage);
          toast.error("Error loading tenant", { description: errorMessage });
          console.error('Fetch tenant details error:', err);
        } finally {
          setLoading(false);
        }
      };
      const fetchLeagues = async () => {

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
                console.log('Fetched leagues:', validatedData.data);
              setLeagues(validatedData.data);
            } catch (err: any) {
              const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch leagues.';
              setError(errorMessage);
              toast.error('Error fetching leagues', { description: errorMessage });
              console.error('Fetch leagues error:', err);
            } finally {
              setLoading(false);
            }
      };
    useEffect(() => {
        // Fetch tenant-specific data if needed, e.g., tenant name, logo, etc.
        if (currentTenantId) {
            fetchTenantDetails();
            fetchLeagues();
        }
    }, [currentTenantId]);
    
    // Dynamically generate stat cards based on tenant data
    const statCards = [
        { title: "Total Leagues", value: tenant?.leagues?.length || 0, description: "Active Leagues Under Management", trend: {isPositive: true, value: 3.6, timespan: "season"}, icon: Trophy, bgColorClass: "bg-blue-400", textColorClass: "text-white", href: buildLink("/tenant/leagues") },
        { title: "Total Teams", value: tenant?.teams?.length || 0, description: "Active Teams in all Leagues", trend: {isPositive: false, value: 2.6, timespan: "season"}, icon: Building, bgColorClass: "bg-green-400", textColorClass: "text-white", href: buildLink("/tenant/teams") },
        { title: "Total Players", value: mockUpcomingGames.length, description: "Active Players in all Leagues", trend: {isPositive: true, value: 4.8, timespan: "season"}, icon: Calendar, bgColorClass: "bg-orange-400", textColorClass: "text-white", href: buildLink("/tenant/players") },
        { title: "Tickets Sold (Today)", value: 120, description: "Active Leagues Under Management", trend: {isPositive: true, value: 3.6, timespan: "season"}, icon: Ticket, bgColorClass: "bg-red-400", textColorClass: "text-white", href: buildLink("/tenant/tickets") }, // Keeping mock for now as per request
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
                <title>Tenant Dashboard - ELENEM Sports</title>
            </Head>  
            <section className='flex items-center justify-between'>
                <h1 className="text-2xl font-bold text-gray-800 mb-6">{tenant?.name}</h1>
                <div className='flex whitespace-nowrap text-sm gap-3'>
                    <button onClick={() => router.push('/tenant/settings')}
                        className="w-full flex items-center justify-center text-gray-800 px-2 py-2 mx-2 border border-gray-200 rounded-md transition-colors">
                        <Settings className="h-4 w-4 mr-2" /> Settings
                    </button>
                    <button onClick={() => router.push('/league/create')}
                        className="w-full flex items-center justify-center bg-emerald-600 text-white py-2 px-2 rounded-md hover:bg-emerald-700 transition-colors">
                        <Plus className="h-4 w-4 mr-2" /> Create New League
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
                            <CardTitle className="text-lg font-semibold">Your Leagues</CardTitle>
                            <Button variant="default" size="sm" onClick={() => router.push(buildLink('/tenant/leagues'))}>
                                <Eye className="h-4 w-4 mr-2" />
                                    View All
                            </Button>
                        </CardHeader>
                        <CardContent className="space-y-4">
                        {leagues?.map((league: LeagueBasic) => (
                        <Link href={buildLink('/league/dashboard', { ctxLeagueId: league.id })} className='m-1' key={league.id}>
                            <div className="p-4 border border-gray-200 rounded-lg hover:bg-gray-200/30 transition-colors">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <Avatar src={league.logoUrl} name={league.name} size={50} className="mr-2" />
                                        <div>
                                        <h3 className="font-semibold text-foreground">{league.name}</h3>
                                        <div className="flex items-center gap-2 text-xs text-gray-500">
                                            <span>{capitalize(tenant?.sportType.toString())}</span>
                                            <span>•</span>
                                            <span>season 2025</span>
                                        </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge variant={league.isActive === true ? 'success' : 'secondary'}>
                                        {league.isActive === true? "Active" : "inactive"}
                                        </Badge>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="secondary" size="sm">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem>
                                                <Eye className="mr-2 h-4 w-4" />
                                                View Details
                                                </DropdownMenuItem>
                                                <DropdownMenuItem>
                                                <UserPlus className="mr-2 h-4 w-4" />
                                                Assign Manager
                                                </DropdownMenuItem>
                                                <DropdownMenuItem>
                                                <Settings className="mr-2 h-4 w-4" />
                                                Configure
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-3 gap-4 text-sm">
                                    <div className="flex items-center gap-1 text-muted-foreground">
                                        <Building2 className="h-3 w-3" />
                                        <span className='text-gray-500'>{league.teams?.length} Teams</span>
                                    </div>
                                    <div className="flex items-center gap-1 text-muted-foreground">
                                        <Crown className="h-3 w-3" />
                                        <span className='text-gray-500'>{league.managingUsers?.length} Managers</span>
                                    </div>
                                    <div className="flex items-center gap-1 text-green-600 font-bold">
                                        <TrendingUp className="h-3 w-3" />
                                        <span>$0</span>
                                    </div>
                                    </div>
                                </div>
                            </Link>
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
                        </div>
                    </CardContent>
                    </Card>
            </section>    
            {/* Upcoming Games Table */}
            <section className="bg-white p-6 rounded-lg shadow-md mb-8" hidden>
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