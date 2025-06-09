// app/public/leagues/[leagueId]/teams/page.tsx
"use client"; // This page fetches data on client-side
import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/services/api';
import { TeamCard } from '@/components/public/TeamCard';
import { TeamPublicFrontendDto,LeaguePublicDetailsDto } from '@/prisma';
import Link from 'next/link';

export default function PublicLeagueTeamsPage() {
  const params = useParams();
  const leagueId = params.leagueId as string;
  const router = useRouter();

  const [teams, setTeams] = useState<TeamPublicFrontendDto[]>([]);
  const [leagueDetails, setLeagueDetails] = useState<LeaguePublicDetailsDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');


  const fetchLeagueAndTeams = useCallback(async () => {
    if (!leagueId) return;
    setLoading(true);
    setError(null);
    try {
      // Fetch league details first
      const leagueRes = await api.get<LeaguePublicDetailsDto>(`/leagues/${leagueId}`);
      setLeagueDetails(leagueRes.data);

      // Then fetch teams for this league
      const teamParams: any = {};
      if (searchTerm) teamParams.filter = searchTerm;
      // Add pagination if needed

      const teamsRes = await api.get<TeamPublicFrontendDto[]>(`/leagues/${leagueId}/teams`, { params: teamParams });
      setTeams(teamsRes.data || []);

    } catch (err: any) {
      console.error("Error fetching league/teams:", err);
      setError(err.response?.data?.message || "Failed to load league or team data.");
      if (err.response?.status === 404) {
        // Optionally redirect if league itself not found
        // router.push('/leagues'); 
      }
    } finally {
      setLoading(false);
    }
  }, [leagueId, searchTerm]);
  
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
        fetchLeagueAndTeams();
    }, 300);
    return () => clearTimeout(debounceTimer);
  }, [fetchLeagueAndTeams]);


  if (loading && !leagueDetails) return <div className="container mx-auto px-4 py-8 text-center">Loading league teams...</div>;
  if (error && !leagueDetails) return <div className="container mx-auto px-4 py-8 text-center text-red-500">{error}</div>;
  if (!leagueDetails) return <div className="container mx-auto px-4 py-8 text-center">League not found. <Link href="/leagues" className="text-indigo-600 hover:underline">View all leagues</Link></div>;


  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 text-center">
        {leagueDetails.logoUrl && 
            <img src={leagueDetails.logoUrl} alt={`${leagueDetails.name} logo`} className="w-24 h-24 mx-auto mb-2 rounded-full object-contain"
                 onError={(e) => { e.currentTarget.style.display = 'none'; }}/>
        }
        <h1 className="text-4xl font-bold text-gray-800">{leagueDetails.name} - Teams</h1>
        {leagueDetails.description && <p className="mt-2 text-lg text-gray-600 max-w-2xl mx-auto">{leagueDetails.description}</p>}
         <div className="mt-4">
            <Link href={`/leagues/${leagueId}`} className="text-indigo-600 hover:text-indigo-800 text-sm">
                &larr; Back to League Details
            </Link>
        </div>
      </div>
      
      <div className="mb-6 max-w-md mx-auto">
        <input 
            type="text"
            placeholder={`Search teams in ${leagueDetails.name}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>

      {loading && <p className="text-center text-gray-500">Searching teams...</p>}
      {error && !loading && <p className="text-center text-red-500 bg-red-100 p-3 rounded">{error}</p>}

      {teams.length === 0 && !loading ? (
        <p className="text-center text-gray-500">No teams found in this league {searchTerm ? 'matching your search' : ''}.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {teams.map(team => (
            <TeamCard key={team.id} team={team} leagueId={leagueId} />
          ))}
        </div>
      )}
    </div>
  );
}
