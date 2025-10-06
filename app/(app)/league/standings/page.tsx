// app/league/standings/page.tsx
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { StandingsFilters } from '@/components/standing/standings-filters';
import { StandingsTable } from '@/components/standing/standings-table';
import { StandingsTableSkeleton } from '@/components/standing/standings-table-skeleton';
import { api } from '@/services/api';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/auth.store';
//import { Role } from '@/schemas';
//import { useSearchParams } from 'next/navigation';

export default function LeagueStandingsPage() {
  const { user: userAuth } = useAuthStore();
  const [filters, setFilters] = useState({});
  const [standings, setStandings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStandings = useCallback(async (currentFilters: { tenantId?: string; leagueId?: string; seasonId?: string }) => {
    // For league/team admin, leagueId is fixed from their context
    const finalFilters = { ...currentFilters };
    if (!finalFilters.leagueId || !finalFilters.seasonId) {
      setStandings([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/games/standings', { params: finalFilters });
      setStandings(response.data);
    } catch (error) {
      setError('Failed to load standings data.');
      toast.error('Failed to load standings data.',);
      console.error('Error fetching standings:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
        fetchStandings(filters);
  }, [filters, fetchStandings, userAuth?.managingLeagueId]);

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">League Standings</h1>
        <p className="text-muted-foreground">View standings for different seasons within your league.</p>
      </div>
      <StandingsFilters onFiltersChange={setFilters} />
      {loading ? (
        <StandingsTableSkeleton />
      ) : error ? (
        <p className="text-center text-red-500">{error}</p>
      ) : standings.length > 0 ? (
        <StandingsTable standings={standings} managingTeamId={userAuth?.managingTeamId} />
      ) : (
        <p className="text-center text-muted-foreground pt-8">Select a season to view standings.</p>
      )}
    </div>
  );
}
