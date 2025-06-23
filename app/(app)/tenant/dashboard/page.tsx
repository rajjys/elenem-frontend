// app/(tenant)/dashboard/page.tsx
"use client";

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { api } from '@/services/api'; // Your API instance
import { Role, TenantBasic, TenantBasicSchema } from '@/prisma'; // Import your TenantDetails DTO and schema (renamed to TenantBasic for clarity on fetched data)
import { LoadingSpinner } from '@/components/ui/loading-spinner'; // Your loading spinner component
import { useAuthStore } from '@/store/auth.store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/'; // Assuming you have a Card component (shadcn/ui or similar)
import { Button } from '@/components/ui/button'; // Assuming you have a Button component

// Placeholder Interfaces for tenant-specific data (replace with actual Prisma types if available)
interface League {
  id: string;
  name: string;
  sportType: string;
  isActive: boolean;
  slug: string;
}

interface Team {
  id: string;
  name: string;
  city: string;
  isActive: boolean;
}

interface Game {
  id: string;
  homeTeamName: string;
  awayTeamName: string;
  date: string;
  status: string; // e.g., 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED'
}

export default function TenantDashboardPage() {
  const searchParams = useSearchParams();
  const { user } = useAuthStore();
  //const ContextTenantSlug = searchParams.get('tenantSlug'); // Get the tenant slug from the URL
  const contextTenantId = searchParams.get('tenantId');
  

  const [tenantDetails, setTenantDetails] = useState<TenantBasic | null>(null);
  const [leagues, setLeagues] = useState<League[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTenantData = async () => {
      setLoading(true);
      setError(null);
      try {
        let tenantIdToFetch: string | null | undefined;

        // Determine which tenant ID to use based on user role and context
        if (user?.roles.includes(Role.TENANT_ADMIN)) {
          tenantIdToFetch = user.tenantId; // TENANT_ADMIN always views their own tenant
        } else if (user?.roles.includes(Role.SYSTEM_ADMIN)) {
          tenantIdToFetch = contextTenantId; // SYSTEM_ADMIN can view a specific tenant from context param
        }

        if (!tenantIdToFetch) {
          setError('No tenant ID found in user context or URL parameters.');
          setLoading(false);
          return;
        }

        // 1. Fetch Tenant Details
        const tenantResponse = await api.get<TenantBasic>(`/tenants/${tenantIdToFetch}`);
        const validatedTenant = TenantBasicSchema.parse(tenantResponse.data); // Use TenantBasicSchema
        setTenantDetails(validatedTenant);

        // 2. Fetch Placeholder Data for Leagues, Teams, Games (Replace with actual API calls later)
        // In a real application, you'd make API calls like:
        // const leaguesResponse = await api.get<League[]>(`/leagues?tenantId=${tenantIdToFetch}`);
        // setLeagues(leaguesResponse.data);
        // ... and so on for teams and games.

        // Placeholder data for demonstration:
        setLeagues([
          { id: 'l1', name: 'Elite Basketball League', sportType: 'BASKETBALL', isActive: true, slug: 'elite-basketball-league' },
          { id: 'l2', name: 'Youth Soccer Cup', sportType: 'SOCCER', isActive: true, slug: 'youth-soccer-cup' },
          { id: 'l3', name: 'Regional Hockey Championship', sportType: 'HOCKEY', isActive: false, slug: 'regional-hockey-championship' },
        ]);

        setTeams([
          { id: 't1', name: 'Thunderbolts', city: 'Springfield', isActive: true },
          { id: 't2', name: 'Wildcats United', city: 'Riverside', isActive: true },
          { id: 't3', name: 'Phoenix Fire', city: 'Capital City', isActive: false },
        ]);

        setGames([
          { id: 'g1', homeTeamName: 'Thunderbolts', awayTeamName: 'Wildcats United', date: '2025-07-10', status: 'SCHEDULED' },
          { id: 'g2', homeTeamName: 'Phoenix Fire', awayTeamName: 'Dragons FC', date: '2025-07-05', status: 'COMPLETED' },
          { id: 'g3', homeTeamName: 'Storm Chasers', awayTeamName: 'Ice Wolves', date: '2025-07-12', status: 'SCHEDULED' },
        ]);

      } catch (err: any) {
        console.error('Failed to fetch tenant data:', err);
        setError(err.response?.data?.message || 'Failed to load tenant data.');
      } finally {
        setLoading(false);
      }
    };

    if (user) { // Only fetch if user data is available
      fetchTenantData();
    }
  }, [user, contextTenantId]); // Re-run effect if user or contextTenantId changes

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-100">
        <LoadingSpinner />
        <p className="ml-4 text-lg text-gray-700">Loading tenant dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-red-50 text-red-700">
        <h1 className="text-2xl font-bold mb-4">Error</h1>
        <p className="text-lg">{error}</p>
        <p className="mt-4 text-gray-600">Please try again or contact support.</p>
      </div>
    );
  }

  if (!tenantDetails) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-gray-100 text-gray-700">
        <h1 className="text-2xl font-bold mb-4">No Tenant Selected or Available</h1>
        <p className="text-lg">Please navigate from a tenant selection page or ensure a tenant ID is provided.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 sm:p-8 lg:p-10">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 leading-tight tracking-tight">
          {tenantDetails.name} Dashboard
        </h1>
        {tenantDetails.logoUrl && (
          <img
            src={tenantDetails.logoUrl}
            alt={`${tenantDetails.name} Logo`}
            className="h-16 w-auto rounded-full shadow-md object-cover"
          />
        )}
      </div>

      {/* Tenant Basic Info */}
      <Card className="mb-8 shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-indigo-700">Tenant Overview</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-4 gap-x-8 text-gray-700">
          <div><strong className="text-gray-800">Tenant Code:</strong> {tenantDetails.tenantCode}</div>
          <div><strong className="text-gray-800">Sport Type:</strong> {tenantDetails.sportType}</div>
          <div><strong className="text-gray-800">Status:</strong> <span className={`font-semibold ${tenantDetails.isActive ? 'text-green-600' : 'text-red-600'}`}>{tenantDetails.isActive ? 'Active' : 'Inactive'}</span></div>
          {tenantDetails.country && <div><strong className="text-gray-800">Country:</strong> {tenantDetails.country}</div>}
        </CardContent>
      </Card>

      {/* Leagues Section */}
      <Card className="mb-8 shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-2xl font-bold text-purple-700">Leagues ({leagues.length})</CardTitle>
          <Button variant="outline">View All Leagues</Button> {/* Placeholder for navigation */}
        </CardHeader>
        <CardContent>
          {leagues.length === 0 ? (
            <p className="text-gray-600">No leagues found for this tenant.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {leagues.slice(0, 3).map((league) => ( // Display top 3
                <div key={league.id} className="bg-white p-4 rounded-lg shadow-md border border-gray-200 hover:shadow-xl transition-shadow">
                  <h3 className="text-lg font-semibold text-gray-800 mb-1">{league.name}</h3>
                  <p className="text-sm text-gray-600">Sport: {league.sportType}</p>
                  <p className="text-sm text-gray-600">Status: <span className={league.isActive ? 'text-green-600' : 'text-red-600'}>{league.isActive ? 'Active' : 'Inactive'}</span></p>
                  <Button variant="link" size="sm" className="mt-2 pl-0">View Details</Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Teams Section */}
      <Card className="mb-8 shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-2xl font-bold text-teal-700">Teams ({teams.length})</CardTitle>
          <Button variant="outline">View All Teams</Button> {/* Placeholder for navigation */}
        </CardHeader>
        <CardContent>
          {teams.length === 0 ? (
            <p className="text-gray-600">No teams found for this tenant.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {teams.slice(0, 3).map((team) => ( // Display top 3
                <div key={team.id} className="bg-white p-4 rounded-lg shadow-md border border-gray-200 hover:shadow-xl transition-shadow">
                  <h3 className="text-lg font-semibold text-gray-800 mb-1">{team.name}</h3>
                  <p className="text-sm text-gray-600">City: {team.city}</p>
                  <p className="text-sm text-gray-600">Status: <span className={team.isActive ? 'text-green-600' : 'text-red-600'}>{team.isActive ? 'Active' : 'Inactive'}</span></p>
                  <Button variant="link" size="sm" className="mt-2 pl-0">View Details</Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upcoming Games Section */}
      <Card className="mb-8 shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-2xl font-bold text-orange-700">Upcoming Games ({games.filter(g => g.status === 'SCHEDULED').length})</CardTitle>
          <Button variant="outline">View All Games</Button> {/* Placeholder for navigation */}
        </CardHeader>
        <CardContent>
          {games.length === 0 ? (
            <p className="text-gray-600">No games found for this tenant.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {games.filter(g => g.status === 'SCHEDULED').slice(0, 3).map((game) => ( // Display top 3 upcoming
                <div key={game.id} className="bg-white p-4 rounded-lg shadow-md border border-gray-200 hover:shadow-xl transition-shadow">
                  <h3 className="text-lg font-semibold text-gray-800 mb-1">{game.homeTeamName} vs {game.awayTeamName}</h3>
                  <p className="text-sm text-gray-600">Date: {game.date}</p>
                  <p className="text-sm text-gray-600">Status: <span className="text-blue-600 font-medium">{game.status.replace('_', ' ')}</span></p>
                  <Button variant="link" size="sm" className="mt-2 pl-0">Game Details</Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Additional Features Section (conceptual) */}
      <Card className="mb-8 shadow-lg bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-blue-800">Tenant Specific Features</CardTitle>
        </CardHeader>
        <CardContent className="text-blue-700">
          <p className="mb-4">
            This dashboard serves as the central hub for {tenantDetails.name}. Here, you can access and manage
            all aspects related to this tenant's operations.
          </p>
          <ul className="list-disc list-inside space-y-2">
            <li><strong>User Management:</strong> Manage users associated with this tenant, assign roles.</li>
            <li><strong>Team Management:</strong> Oversee all teams registered under this tenant.</li>
            <li><strong>Event Scheduling:</strong> Plan and manage games, tournaments, and other events.</li>
            <li><strong>Analytics & Reports:</strong> View performance metrics and generate reports for tenant activity.</li>
            <li><strong>Settings:</strong> Configure tenant-specific settings, branding, and integrations.</li>
          </ul>
        </CardContent>
      </Card>

    </div>
  );
}