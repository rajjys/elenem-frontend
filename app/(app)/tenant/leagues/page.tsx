// app/tenant/leagues/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { api } from '@/services/api';
import { toast } from 'sonner';
import { LeagueDetails, PaginatedLeaguesResponseSchema, Roles } from '@/schemas';
import { useContextualLink } from '@/hooks';
import { Trophy } from 'lucide-react';
import axios from 'axios';
import { LeagueCard } from '@/components/ui';

// Define the League schema based on common data structures
// This should match your backend DTO for a single League

export default function TenantLeaguesPage() {
  const userAuth = useAuthStore((state) => state.user);

  const [leagues, setLeagues] = useState<LeagueDetails[]>([]);
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
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>Leagues - ELENEM Sports</title>
      </Head>

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-lg md:text-xl lg:text-2xl font-bold text-gray-800">{totalItems} Ligues</h1>
        <div className='flex whitespace-nowrap text-sm gap-3'>
          <Link
          href={buildLink("/league/create")}
          className="flex items-center gap-2 bg-emerald-600 text-white px-3 py-2 rounded-md hover:bg-emerald-700 transition-colors">
              <Trophy className="h-4 w-4" />
              <span className="">Créer une Ligue</span>
          </Link>
        </div>
      </div>
      {leagues.length === 0 && !loading && !error ? (
        <div className="text-center text-gray-500 text-lg mt-10">Pas de ligues disponibles pour cette organisation.</div>
      ) : (
        <div className="bg-white p-2 md:p-6 rounded-lg shadow-md">
          <div className="overflow-x-auto">
            {leagues?.map((league: LeagueDetails) => (
                  <LeagueCard key={league.id} league={league} tenant={league.tenant}/>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}