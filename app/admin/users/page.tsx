// app/(admin)/users/page.tsx
"use client";
import { useEffect, useState } from 'react';
import { api } from '@/services/api';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
//import {  User as PrismaUser } from "@prisma/client"; // Import User for type
import { User } from '@/prisma';





export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [leagueFilter, setLeagueFilter] = useState(''); // League ID to filter by

  // You'd fetch actual leagues for the filter dropdown in a real app
  // const [leaguesForFilter, setLeaguesForFilter] = useState<{id: string, name: string}[]>([]);


  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const params: any = {};
        if (searchTerm) params.filter = searchTerm;
        if (leagueFilter) params.leagueId = leagueFilter;
        // Add pagination params.skip, params.take if needed

        const response = await api.get('/system-admin/users', { params });
        setUsers(response.data || []); // Ensure response.data is an array
        setError(null);
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to fetch users.");
        setUsers([]); // Clear users on error
      } finally {
        setLoading(false);
      }
    };
    // Debounce search or fetch on filter change
    const debounceTimer = setTimeout(() => {
        fetchUsers();
    }, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchTerm, leagueFilter]);

  if (loading && users.length === 0) return <p>Loading users...</p>;
  // Don't show main error if there's already data and loading is for a filter
  if (error && users.length === 0) return <p className="text-red-500">Error: {error}</p>;

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold">Manage Users</h1>
        <div className="flex gap-2">
            <input 
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
            {/* Basic league filter example - replace with a proper Select component fetching leagues */}
            {/* <input 
                type="text"
                placeholder="Filter by League ID..."
                value={leagueFilter}
                onChange={(e) => setLeagueFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            /> */}
            <Link href="/admin/users/create">
                <Button>Create New User</Button>
            </Link>
        </div>
      </div>
      {loading && <p>Filtering users...</p>}
      {error && <p className="text-red-500 bg-red-100 p-2 rounded mb-4">Error: {error}</p>}
      
      {users.length === 0 && !loading ? (
        <p>No users found matching your criteria.</p>
      ) : (
        <div className="bg-white shadow rounded-lg overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Full Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">League</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.username}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.firstName} {user.lastName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.role}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.league ? `${user.league.name} (${user.league.leagueCode})` : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                     <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.accountLocked ? 'bg-red-100 text-red-800' : (user.deletedAt ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800')
                     }`}>
                        {user.accountLocked ? 'Locked' : (user.deletedAt ? 'Deleted' : 'Active')}
                     </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <Link href={`/admin/users/id/${user.id}`} className="text-indigo-600 hover:text-indigo-900 mr-3">View</Link>
                    <Link href={`/admin/users/id/${user.id}/edit`} className="text-indigo-600 hover:text-indigo-900">Edit</Link>
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
