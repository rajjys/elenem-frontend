// app/(admin)/leagues/page.tsx
"use client";
import { useEffect, useState } from 'react';
import { api } from '@/services/api';
import Link from 'next/link';
import { Button } from '@/components/ui/button'; // Assuming you have a Button component
import { League } from '@/prisma';
import { useRouter } from 'next/navigation';

export default function LeaguesPage() {
  const [leagues, setLeagues] = useState<League[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
   
  useEffect(() => {
    const fetchLeagues = async () => {
      try {
        setLoading(true);
        const response = await api.get('/system-admin/leagues'); // Using the API client
        setLeagues(response.data);
        setError(null);
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to fetch leagues.");
      } finally {
        setLoading(false);
      }
    };
    fetchLeagues();
  }, []);

  if (loading) return <p>Loading leagues...</p>;
  if (error) {
    ///If Unauthorized, redirect to login
    if (error === "Unauthorized"){
      // Logout user and redirect to login

      ///return null; //prevent further rendering
    }
    return <p className="text-red-500">Error: {error}</p>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Manage Leagues</h1>
        <Link href="/leagues/create">
          <Button type="button">Create New League</Button>
        </Link>
      </div>
      {leagues.length === 0 ? (
        <p>No leagues found.</p>
      ) : (
        <div className="bg-white shadow rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sport</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {leagues.map((league) => (
                <tr key={league.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{league.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{league.leagueCode}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{league.sportType}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                     <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${league.status ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {league.status ? 'Active' : 'Inactive'}
                     </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <Link href={`/leagues/${league.id}/`} className="text-indigo-400 hover:text-indigo-700 mr-3">View</Link>
                    <Link href={`/leagues/${league.id}/edit`} className="text-indigo-600 hover:text-indigo-900">Edit</Link>
                    {/* Add Delete button with confirmation */}
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