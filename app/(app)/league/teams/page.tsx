// app/(app)/league/teams/page.tsx (List Teams for LA)
"use client";
import { useEffect, useState, useCallback } from 'react';
import { api } from '@/services/api';
import { useAuthStore } from '@/store/auth.store';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { TeamDetailsFrontendDto } from '@/prisma'; // Use shared type
import { Role } from '@/prisma';

export default function LeagueAdminTeamsPage() {
  const { user, tokens } = useAuthStore();
  const [teams, setTeams] = useState<TeamDetailsFrontendDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchTeams = useCallback(async () => {
    if (user?.role === Role.LEAGUE_ADMIN && user.leagueId && tokens?.accessToken) {
      setLoading(true);
      try {
        const params: any = {};
        if (searchTerm) params.filter = searchTerm;
        // Add pagination if needed: params.skip, params.take

        // Endpoint for LA to list teams in their league
        const response = await api.get<TeamDetailsFrontendDto[]>('/teams/league-admin/list', { params });
        setTeams(response.data || []);
        setError(null);
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to fetch teams.");
        setTeams([]);
      } finally {
        setLoading(false);
      }
    } else {
        setError("Access Denied or not a League Admin.");
        setLoading(false);
    }
  }, [user, tokens, searchTerm]);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
        fetchTeams();
    }, 300);
    return () => clearTimeout(debounceTimer);
  }, [fetchTeams]);


  if (loading && teams.length === 0) return <div className="p-6 text-center">Loading teams...</div>;
  if (error && teams.length === 0) return <div className="p-6 text-center text-red-500 bg-red-50 rounded-md">{error}</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Manage Teams in Your League</h1>
        <div className="flex gap-2 w-full sm:w-auto">
             <input 
                type="text"
                placeholder="Search teams by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm w-full sm:w-auto"
            />
            <Link href="/league/teams/create">
                <Button>Create New Team</Button>
            </Link>
        </div>
      </div>
      
      {loading && <p className="text-sm text-gray-500">Filtering teams...</p>}
      {error && !loading && <p className="text-red-500 bg-red-100 p-3 rounded text-sm mb-4">{error}</p>}

      {teams.length === 0 && !loading ? (
        <div className="text-center py-10 bg-white shadow rounded-lg">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No teams found</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by creating a new team.</p>
            <div className="mt-6">
                <Link href="/league/teams/create">
                    <Button>Create New Team</Button>
                </Link>
            </div>
        </div>

      ) : (
        <div className="bg-white shadow rounded-lg overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Logo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Home Venue</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Admins</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {teams.map((team) => (
                <tr key={team.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {team.logoUrl ? (
                      <img src={team.logoUrl} alt={`${team.name} logo`} className="h-10 w-10 rounded-full object-cover" 
                           onError={(e) => (e.currentTarget.style.display = 'none')} />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-sm">
                        {team.name.substring(0, 2).toUpperCase()}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{team.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{team.homeVenue || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {team.managers && team.managers.length > 0 ? team.managers.map(m => m.username).join(', ') : 'None'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <Link href={`/league/teams/id/${team.id}/edit`} className="text-indigo-600 hover:text-indigo-900">
                      Edit / Manage
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
