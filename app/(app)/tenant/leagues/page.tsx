// app/tenant/leagues/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { FiSearch } from 'react-icons/fi';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { api } from '@/services/api';
import { toast } from 'sonner';
import { LeagueBasic, PaginatedLeaguesResponseSchema, Role } from '@/schemas';
import { useContextualLink } from '@/hooks';
import { Plus, Settings } from 'lucide-react';

// Define the League schema based on common data structures
// This should match your backend DTO for a single League


// Define the PaginatedLeaguesResponseSchema as per your backend structure


// Define filter parameters
interface LeagueFilterParams {
  search?: string;
  sportType?: string;
  country?: string;
  visibility?: 'public' | 'private';
  isActive?: boolean;
  gender?: 'male' | 'female' | 'mixed';
  parentLeagueId?: string;
  division?: string;
  establishedYear?: number;
  page: number;
  pageSize: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export default function TenantLeaguesPage() {
  const router = useRouter();
  const userAuth = useAuthStore((state) => state.user);

  const [leagues, setLeagues] = useState<LeagueBasic[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [filters, setFilters] = useState<LeagueFilterParams>({
    page: 1,
    pageSize: 10,
    sortBy: 'name',
    sortOrder: 'asc',
  });
  const { buildLink } = useContextualLink();
  const currentUserRoles = userAuth?.roles || [];
  const ctxTenantId = useSearchParams().get('ctxTenantId'); // Use search params if needed
  // Determine current tenant ID based on user roles
      const isSystemAdmin = currentUserRoles.includes(Role.SYSTEM_ADMIN);
      const isTenantAdmin = currentUserRoles.includes(Role.TENANT_ADMIN);
  const currentTenantId = isSystemAdmin
    ? ctxTenantId
    : isTenantAdmin
    ? userAuth?.tenantId
    : null;

  const fetchLeagues = useCallback(async () => {
    if (!currentTenantId) {
      setError("Tenant ID is not available.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if(isSystemAdmin){
        params.append('tenantId', currentTenantId); // Use currentTenantId directly
        }

      console.log('Fetching leagues with params:', params.toString());

      const response = await api.get(`/leagues?${params.toString()}`);
      const validatedData = PaginatedLeaguesResponseSchema.parse(response.data);

      setLeagues(validatedData.data);
      setTotalItems(validatedData.totalItems);
      setTotalPages(validatedData.totalPages);
    } catch (error) {
      const errorMessage = 'Failed to fetch leagues.';
      setError(errorMessage);
      toast.error('Error fetching leagues', { description: errorMessage });
      console.error('Fetch leagues error:', error);
    } finally {
      setLoading(false);
    }
  }, [currentTenantId]); // Dependency on  and currentTenantId

  useEffect(() => {
    fetchLeagues();
  }, [fetchLeagues]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-xl text-gray-600">Loading leagues...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-red-600 text-xl">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <Head>
        <title>Leagues - ELENEM Sports</title>
      </Head>

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Leagues</h1>
        <div className='flex whitespace-nowrap text-sm gap-3'>
                    <button onClick={() => router.push('/tenant/settings')}
                        className="w-full flex items-center justify-center text-gray-800 px-2 py-2 mx-2 border border-gray-200 rounded-md transition-colors">
                        <Settings className="h-4 w-4 mr-2" />Settings
                    </button>
                    <button onClick={() => router.push('/league/create')}
                        className="w-full flex items-center justify-center bg-emerald-600 text-white py-2 px-2 rounded-md hover:bg-emerald-700 transition-colors">
                        <Plus className="h-4 w-4 mr-2" />Create New League
                    </button>
          </div>
      </div>

      {/* Filter and Search Section */}
      <div className="bg-white p-4 rounded-lg shadow-md mb-6 flex items-center space-x-4">
        <FiSearch className="text-gray-400" size={20} />
        <input
          type="text"
          placeholder="Search leagues by name..."
          className="flex-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
          value={filters.search || ''}
          //onChange={handleSearchChange}
        />
        {/* Add more filter dropdowns here if needed */}
      </div>

      {leagues.length === 0 && !loading && !error ? (
        <div className="text-center text-gray-500 text-lg mt-10">No leagues found for this tenant.</div>
      ) : (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <span hidden>{totalItems} leagues</span>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sport Type
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Country
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Established Year
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {leagues.map((league) => (
                  <tr key={league.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      <Link href={buildLink('/league/dashboard', { ctxLeagueId: league.id })} className="text-emerald-600 hover:underline">
                        {league.name}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {league.sportType}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {league.country || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        league.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {league.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {league.establishedYear || 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <nav
              className="flex items-center justify-between pt-4"
              aria-label="Pagination"
            >
              <div className="flex-1 flex justify-between sm:justify-end">
                <button
                  //onClick={() => handlePageChange(filters.page - 1)}
                  disabled={filters.page <= 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                 // onClick={() => handlePageChange(filters.page + 1)}
                  disabled={filters.page >= totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex sm:items-center">
                <p className="text-sm text-gray-700">
                  Page <span className="font-medium">{filters.page}</span> of{' '}
                  <span className="font-medium">{totalPages}</span>
                </p>
              </div>
            </nav>
          )}
        </div>
      )}
    </div>
  );
}