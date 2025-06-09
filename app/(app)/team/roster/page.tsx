// app/(app)/team/players/page.tsx (TA: View Roster)
"use client";
import { useEffect, useState, useCallback } from 'react';
import { api } from '@/services/api';
import { useAuthStore } from '@/store/auth.store';
import { Button } from '@/components/ui/button';
import { PlayerDetailsDto } from '@/prisma';
export default function TeamAdminRosterPage() {
  const { user } = useAuthStore();
  const [roster, setRoster] = useState<PlayerDetailsDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRoster = useCallback(async () => {
    if (!user?.teamManagingId) return;
    setLoading(true);
    try {
      const response = await api.get<PlayerDetailsDto[]>('/players/team-admin/my-roster');
      setRoster(response.data || []);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to fetch your team roster.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchRoster();
  }, [fetchRoster]);

  if (loading) return <div className="p-6 text-center">Loading your team roster...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">My Team Roster</h1>
        {/* As requested, a placeholder for TA to create player, but disabled */}
        <Button disabled title="Player registration is managed by your League Administrator.">
          Add Player (Disabled)
        </Button>
      </div>
      {error && <p className="text-red-500">{error}</p>}
      <div className="bg-white shadow rounded-lg overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="th">Name</th>
              <th className="th">Jersey #</th>
              <th className="th">Position</th>
              <th className="th">Status</th>
              <th className="th">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {roster.length > 0 ? roster.map(player => (
              <tr key={player.id}>
                <td className="td font-medium text-gray-900 flex items-center space-x-3">
                    {player.profileImageUrl ? (
                        <img src={player.profileImageUrl} alt="player" className="h-8 w-8 rounded-full object-cover" />
                    ) : (
                        <div className="h-8 w-8 rounded-full bg-gray-200" />
                    )}
                    <span>{player.firstName} {player.lastName}</span>
                </td>
                <td className="td">{player.jerseyNumber || '-'}</td>
                <td className="td">{player.position || 'N/A'}</td>
                <td className="td">
                   <span className={`pill ${player.isActive ? 'pill-green' : 'pill-red'}`}>{player.isActive ? 'Active' : 'Inactive'}</span>
                </td>
                <td className="td">
                  {/* TA can view public profile or a slightly more detailed private view */}
                  <a href={`/players/${player.id}`} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">
                    View Public Profile
                  </a>
                </td>
              </tr>
            )) : (
                <tr><td colSpan={5} className="text-center py-6 text-gray-500">Your roster is empty. Players are assigned by your League Administrator.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
