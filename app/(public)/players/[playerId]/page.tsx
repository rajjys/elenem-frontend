// app/(public)/players/[playerId]/page.tsx
"use client";
import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/services/api';
import { PlayerPublicDto } from '@/prisma'
import Link from 'next/link';

export default function PublicPlayerProfilePage() {
  const params = useParams();
  const playerId = params.playerId as string;

  const [player, setPlayer] = useState<PlayerPublicDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPlayer = useCallback(async () => {
    if (!playerId) return;
    setLoading(true);
    try {
      const response = await api.get<PlayerPublicDto>(`/public/players/${playerId}`);
      setPlayer(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || "Could not load player profile.");
    } finally {
      setLoading(false);
    }
  }, [playerId]);

  useEffect(() => { fetchPlayer() }, [fetchPlayer]);

  if (loading) return <div className="p-8 text-center">Loading player profile...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;
  if (!player) return <div className="p-8 text-center">Player not found.</div>;

  return (
    <div className="container mx-auto p-4 md:p-8">
       <div className="bg-white rounded-lg shadow-xl overflow-hidden">
        <div className="p-8">
            <div className="md:flex md:items-center">
                <div className="md:w-1/4 text-center">
                    {player.profileImageUrl ? (
                        <img className="w-32 h-32 rounded-full mx-auto object-cover" src={player.profileImageUrl} alt="Player" />
                    ) : (
                        <div className="w-32 h-32 rounded-full mx-auto bg-gray-300 flex items-center justify-center text-3xl text-gray-500">
                            {player.firstName[0]}{player.lastName[0]}
                        </div>
                    )}
                </div>
                <div className="md:w-3/4 mt-4 md:mt-0 md:ml-6">
                    <h1 className="text-4xl font-bold text-gray-800">{player.firstName} {player.lastName}</h1>
                    {player.jerseyNumber && <p className="text-2xl text-indigo-600 font-semibold">#{player.jerseyNumber}</p>}
                    <div className="mt-2 text-gray-600">
                        {player.position && <span className="mr-4"><strong>Position:</strong> {player.position}</span>}
                        {player.dateOfBirth && <span><strong>Age:</strong> {/* Calculate Age */}</span>}
                    </div>
                    <div className="mt-2 text-sm">
                        {player.team && <Link href={`/public/teams/${player.team.id}`} className="text-indigo-500 hover:underline">{player.team.name}</Link>}
                        {player.team && player.league && ' | '}
                        {player.league && <Link href={`/public/leagues/${player.league.id}`} className="text-gray-500 hover:underline">{player.league.name}</Link>}
                    </div>
                </div>
            </div>
        </div>
        
        {player.bio && (
            <div className="border-t p-8">
                <h2 className="text-xl font-semibold mb-2">Biography</h2>
                <p className="text-gray-700">{player.bio}</p>
            </div>
        )}

        {/* Placeholder for stats */}
        <div className="border-t p-8">
            <h2 className="text-xl font-semibold mb-2">Player Statistics</h2>
            <p className="text-gray-500">Player stats will be displayed here once available.</p>
        </div>
       </div>
    </div>
  );
}

// You can create /app/(public)/teams/[teamId]/roster/page.tsx similarly,
// fetching from /public/players/team/:teamId/roster and displaying a list of PlayerCards.
