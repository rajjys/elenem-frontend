'use client';
import { FiUsers, FiDollarSign, FiAward, FiBarChart2, FiShoppingCart, FiCalendar, FiBox, FiTrendingUp, FiUser, FiActivity, FiList, FiZap, FiFilm, FiSpeaker, FiCreditCard, FiShield, FiSettings, FiAlertTriangle, FiMessageSquare } from 'react-icons/fi';
import Head from 'next/head';
import { useRouter } from 'next/navigation'; // Or useNavigation from next/navigation for App Router
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth.store';
import { Role, TenantDetails, TenantDetailsSchema } from '@/prisma';
import { api } from '@/services/api';
import { toast } from 'sonner';

// Assuming these types are defined elsewhere or inline for this example
interface StatCardProps {
    title: string;
    value: string | number;
    icon: React.ElementType;
    bgColorClass: string;
    textColorClass: string;
    href: string; // Added href prop
}

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

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, bgColorClass, textColorClass, href }) => {
    return (
        <Link href={href} className="block"> {/* Wrap with Link component */}
            <div className="bg-white p-6 rounded-lg shadow-md flex items-center justify-between transition-transform transform hover:scale-105">
                <div>
                    <p className="text-sm font-medium text-gray-500">{title}</p>
                    <p className="text-2xl font-bold mt-1">{value}</p>
                </div>
                <div className={`p-3 rounded-full ${bgColorClass}`}>
                    <Icon className={`w-8 h-8 ${textColorClass}`} />
                </div>
            </div>
        </Link>
    );
};



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
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);


    const currentTenantId = userAuth?.tenantId;//Or get it from a global store or context
    const isSystemAdmin = currentUserRoles.includes(Role.SYSTEM_ADMIN);
    const isTenantAdmin = currentUserRoles.includes(Role.TENANT_ADMIN);

    //Fetch tenant-specific data if needed, e.g., tenant name, logo, etc.
    const fetchTenantDetails = async () => {
        setLoading(true);
        setError(null);
        try {
          const response = await api.get(`/tenants/${currentTenantId}`);
          console.log(response);
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
    useEffect(() => {
        // Fetch tenant-specific data if needed, e.g., tenant name, logo, etc.
        if (currentTenantId) {
            fetchTenantDetails();
            
        }
    }, [currentTenantId]);
    
    // Dynamically generate stat cards based on tenant data
    const statCards = [
        { title: "Total Leagues", value: tenant?.leagues?.length || 0, icon: FiAward, bgColorClass: "bg-blue-100", textColorClass: "text-blue-600", href: "/tenant/leagues" },
        { title: "Total Teams", value: tenant?.teams?.length || 0, icon: FiUsers, bgColorClass: "bg-green-100", textColorClass: "text-green-600", href: "/tenant/teams" },
        { title: "Total Players", value: tenant?.players?.length || 0, icon: FiUser, bgColorClass: "bg-purple-100", textColorClass: "text-purple-600", href: "/tenant/players" },
        { title: "Upcoming Games", value: mockUpcomingGames.length, icon: FiCalendar, bgColorClass: "bg-orange-100", textColorClass: "text-orange-600", href: "/tenant/games" },
        { title: "Tickets Sold (Today)", value: 120, icon: FiShoppingCart, bgColorClass: "bg-red-100", textColorClass: "text-red-600", href: "/tenant/tickets" }, // Keeping mock for now as per request
        { title: "Active Seasons", value: tenant?.seasons?.length || 0, icon: FiTrendingUp, bgColorClass: "bg-teal-100", textColorClass: "text-teal-600", href: "/tenant/seasons" }, // Keeping mock for now as per request
    ];

    return (
            <div className="min-h-screen">
              <Head>
                <title>Tenant Dashboard - ELENEM Sports</title>
              </Head>
                <h1 className="text-3xl font-bold text-gray-800 mb-6">Dashboard Overview</h1>

                {/* Key Metrics Section */}
                <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
                    {statCards.map((card, index) => (
                        <StatCard key={index} {...card} />
                    ))}
                </section>

                {/* Quick Actions / Important Alerts Section (Example) */}
                <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4">Quick Actions</h2>
                        <div className="space-y-3">
                            <button
                                onClick={() => router.push('/tenant/games/schedule')}
                                className="w-full flex items-center justify-center bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
                            >
                                <FiCalendar className="mr-2" /> Schedule Game
                            </button>
                            <button
                                onClick={() => router.push('/tenant/leagues/create')}
                                className="w-full flex items-center justify-center bg-emerald-600 text-white py-2 px-4 rounded-md hover:bg-emerald-700 transition-colors"
                            >
                                <FiAward className="mr-2" /> Create New League
                            </button>
                            <button
                                onClick={() => router.push('/tenant/teams/create')}
                                className="w-full flex items-center justify-center border border-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-50 transition-colors"
                            >
                                <FiUsers className="mr-2" /> Add New Team
                            </button>
                            <button
                                onClick={() => router.push('/tenant/players/register')}
                                className="w-full flex items-center justify-center border border-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-50 transition-colors"
                            >
                                <FiUser className="mr-2" /> Register New Player
                            </button>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4">Important Alerts</h2>
                        <ul className="space-y-2">
                            <li className="flex items-center text-red-600">
                                <FiAlertTriangle className="mr-2" /> Pending Player Transfers: 3
                            </li>
                            <li className="flex items-center text-orange-600">
                                <FiMessageSquare className="mr-2" /> New Support Tickets: 1
                            </li>
                            <li className="flex items-center text-blue-600">
                                <FiDollarSign className="mr-2" /> Unreconciled Payments: 2
                            </li>
                        </ul>
                    </div>
                </section>

                {/* Upcoming Games Table */}
                <section className="bg-white p-6 rounded-lg shadow-md mb-8">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold text-gray-800">Upcoming Games</h2>
                        <Link href="/games" className="text-emerald-600 hover:text-emerald-700 text-sm font-medium">
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