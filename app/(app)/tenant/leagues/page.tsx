// app/tenant/leagues/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { api } from '@/services/api';
import { toast } from 'sonner';
import { LeagueBasic, PaginatedLeaguesResponseSchema, Roles } from '@/schemas';
import { useContextualLink } from '@/hooks';
import { Plus, Settings } from 'lucide-react';
import axios from 'axios';

// Define the League schema based on common data structures
// This should match your backend DTO for a single League

export default function TenantLeaguesPage() {
  const router = useRouter();
  const userAuth = useAuthStore((state) => state.user);

  const [leagues, setLeagues] = useState<LeagueBasic[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [totalItems, setTotalItems] = useState<number>(0);
  const { buildLink } = useContextualLink();
  const currentUserRoles = userAuth?.roles || [];
  const ctxTenantId = useSearchParams().get('ctxTenantId'); // Use search params if needed
  // Determine current tenant ID based on user roles
  const isSystemAdmin = currentUserRoles.includes(Roles.SYSTEM_ADMIN);
  const isTenantAdmin = currentUserRoles.includes(Roles.TENANT_ADMIN);
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
        params.append('page', "1");
        params.append('sortBy', 'name');
        params.append('sortOrder', 'asc');
        }

      const response = await api.get(`/leagues?${params.toString()}`);
      const validatedData = PaginatedLeaguesResponseSchema.parse(response.data);

      setLeagues(validatedData.data);
      setTotalItems(validatedData.totalItems);
    } catch (error) {
      let errorMessage = "Failed to fetch leagues";
      if (axios.isAxiosError(error)) {
          errorMessage = error.response?.data?.message || errorMessage;
      }
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [currentTenantId, isSystemAdmin]); // Dependency on  and currentTenantId

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
        <h1 className="text-3xl font-bold text-gray-800">{totalItems} Leagues</h1>
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
        </div>
      )}
    </div>
  );
}