// app/(app)/league/players/page.tsx (LA: List Players)
"use client";
import { useEffect, useState, useCallback } from 'react';
import { api } from '@/services/api';
import { useAuthStore } from '@/store/auth.store';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PlayerDetailsDto } from '@/prisma'; // Create this shared type

export default function LeagueAdminPlayersPage() {
  const { user } = useAuthStore();
  const [players, setPlayers] = useState<PlayerDetailsDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchPlayers = useCallback(async () => {
    if (!user?.leagueId) return;
    setLoading(true);
    try {
      const params: any = { filter: searchTerm, take: 50 }; // Add pagination later
      const response = await api.get<PlayerDetailsDto[]>('/players/league-admin/list', { params });
      setPlayers(response.data || []);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to fetch players.");
    } finally {
      setLoading(false);
    }
  }, [user, searchTerm]);

  useEffect(() => {
    const debounce = setTimeout(() => fetchPlayers(), 300);
    return () => clearTimeout(debounce);
  }, [fetchPlayers]);

  if (loading && players.length === 0) return <div className="p-6 text-center">Loading players...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Manage League Players</h1>
        <div className="flex gap-2">
          <input type="text" placeholder="Search by name..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="input" />
          <Link href="/league/players/create"><Button>Create Player</Button></Link>
        </div>
      </div>
      {error && <p className="text-red-500">{error}</p>}
      <div className="bg-white shadow rounded-lg overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="th">Name</th>
              <th className="th">Position</th>
              <th className="th">Team</th>
              <th className="th">Status</th>
              <th className="th">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {players.length > 0 ? players.map(player => (
              <tr key={player.id}>
                <td className="td font-medium text-gray-900">{player.firstName} {player.lastName}</td>
                <td className="td">{player.position || 'N/A'}</td>
                <td className="td">{player.team?.name || <span className="text-xs italic text-gray-500">Unassigned</span>}</td>
                <td className="td">
                   <span className={`pill ${player.isActive ? 'pill-green' : 'pill-red'}`}>{player.isActive ? 'Active' : 'Inactive'}</span>
                </td>
                <td className="td">
                  <Link href={`/league/players/${player.id}/edit`} className="text-indigo-600 hover:underline">Edit</Link>
                </td>
              </tr>
            )) : (
                <tr><td colSpan={5} className="text-center py-6 text-gray-500">No players found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
// Add some base CSS for table/pills or use Tailwind @apply
// .th { @apply px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider; }
// .td { @apply px-6 py-4 whitespace-nowrap text-sm text-gray-500; }
// .input { @apply px-3 py-2 border border-gray-300 rounded-md; }
// .pill { @apply px-2 inline-flex text-xs leading-5 font-semibold rounded-full; }
// .pill-green { @apply bg-green-100 text-green-800; }
// .pill-red { @apply bg-red-100 text-red-800; }
