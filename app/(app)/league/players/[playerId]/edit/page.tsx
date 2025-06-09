// app/(app)/league/players/[playerId]/edit/page.tsx (LA: Edit Player)
"use client";
import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/services/api';
import { PlayerFormByLA } from '@/components/forms/PlayerFormByLA';
import { PlayerTeamAssignment } from '@/components/league/PlayerTeamAssignment';
import { PlayerDetailsDto, PlayerFormValues } from '@/prisma';
import { TeamDetailsFrontendDto } from '@/prisma'; // Use shared type

export default function EditPlayerPageLA() {
  const params = useParams();
  const playerId = params.playerId as string;
  
  const [player, setPlayer] = useState<PlayerDetailsDto | null>(null);
  const [teams, setTeams] = useState<TeamDetailsFrontendDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPlayerData = useCallback(async () => {
    if (!playerId) return;
    setLoading(true);
    try {
      const playerRes = await api.get<PlayerDetailsDto>(`/players/league-admin/${playerId}`);
      setPlayer(playerRes.data);
      if (playerRes.data.leagueId) {
          const teamsRes = await api.get<TeamDetailsFrontendDto[]>(`/teams/league-admin/list`);
          setTeams(teamsRes.data || []);
      }
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to fetch data.");
    } finally {
      setLoading(false);
    }
  }, [playerId]);

  useEffect(() => {
    fetchPlayerData();
  }, [fetchPlayerData]);

  const handleUpdate = (updatedPlayerData: PlayerDetailsDto) => {
      setPlayer(updatedPlayerData);
  };

  if (loading) return <div className="p-6 text-center">Loading player details...</div>;
  if (error) return <div className="p-6 text-center text-red-500 bg-red-50 rounded-md">{error}</div>;
  if (!player) return <div className="p-6 text-center">Player not found.</div>;

  return (
    <div className="space-y-8">
       <h1 className="text-3xl font-bold text-gray-900">Edit Player: {player.firstName} {player.lastName}</h1>
       <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-white shadow-md rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Player Details</h2>
                <PlayerFormByLA
                    playerId={playerId}
                    initialData={normalizePlayerToFormValues(player)}
                    onSuccess={handleUpdate}
                />
            </div>
            <div className="bg-white shadow-md rounded-lg p-6">
                 <h2 className="text-xl font-semibold text-gray-800 mb-4">Team Assignment</h2>
                 <PlayerTeamAssignment 
                    playerId={playerId}
                    currentTeamId={player.teamId}
                    teamsInLeague={teams}
                    onAssignmentChange={handleUpdate}
                 />
            </div>
       </div>
    </div>
  );
}

// Normalizes PlayerDetailsDto to PlayerFormValues
function normalizePlayerToFormValues(player: PlayerDetailsDto | null | undefined): Partial<PlayerFormValues> | undefined {
  if (!player) return undefined;
  return {
    firstName: player.firstName ?? "",
    lastName: player.lastName ?? "",
    dateOfBirth: player.dateOfBirth
      ? typeof player.dateOfBirth === "string"
        ? player.dateOfBirth
        : player.dateOfBirth.toISOString().split("T")[0]
      : "",
    position: player.position ?? "",
    profileImageUrl: player.profileImageUrl ?? "",
    bio: player.bio ?? "",
    jerseyNumber: player.jerseyNumber ?? undefined,
    isActive: player.isActive ?? true,
  };
}
