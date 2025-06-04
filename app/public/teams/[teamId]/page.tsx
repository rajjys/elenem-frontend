// app/public/teams/[teamId]/page.tsx
"use client";
import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/services/api';
import { TeamPublicFrontendDto } from '@/prisma';
import { TeamPublicProfile } from '@/components/public/TeamPublicProfile';
import Link from 'next/link';

export default function PublicTeamProfilePage() {
  const params = useParams();
  const teamId = params.teamId as string;
  const router = useRouter();

  const [team, setTeam] = useState<TeamPublicFrontendDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTeam = useCallback(async () => {
    if (!teamId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await api.get<TeamPublicFrontendDto>(`/public/teams/${teamId}`);
      setTeam(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load team profile.");
      if (err.response?.status === 404) {
        // router.push('/404'); // Or a custom "team not found" page
      }
    } finally {
      setLoading(false);
    }
  }, [teamId]);

  useEffect(() => {
    fetchTeam();
  }, [fetchTeam]);

  if (loading) return <div className="container mx-auto px-4 py-8 text-center">Loading team profile...</div>;
  if (error) return <div className="container mx-auto px-4 py-8 text-center text-red-500 bg-red-50 p-4 rounded-md">{error}</div>;
  if (!team) return <div className="container mx-auto px-4 py-8 text-center">Team not found. <Link href="/public/leagues" className="text-indigo-600 hover:underline">Browse leagues</Link></div>;

  return (
    <div className="container mx-auto px-2 py-8 sm:px-4">
        <div className="mb-6">
            <Link href={`/public/leagues/${team.leagueId}/teams`} className="text-indigo-600 hover:text-indigo-800 text-sm">
                &larr; Back to Teams in League
            </Link>
        </div>
      <TeamPublicProfile team={team} />
      {/* Here you could also fetch and display team's public roster, schedule, etc. */}
    </div>
  );
}
