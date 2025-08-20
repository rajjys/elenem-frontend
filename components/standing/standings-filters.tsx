"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Roles } from '@/schemas';
import { api } from '@/services/api';
import { useAuthStore } from '@/store/auth.store';

interface BasicDto { id: string; name: string; }

interface StandingsFiltersProps {
  onFiltersChange: (filters: { tenantId?: string; leagueId?: string; seasonId?: string }) => void;
}

export function StandingsFilters({ onFiltersChange }: StandingsFiltersProps) {
  const { user: userAuth } = useAuthStore();

  const searchParams = useSearchParams();
  const ctxTenantId = useMemo(() => searchParams.get('ctxTenantId'), [searchParams]);
  const ctxLeagueId = useMemo(() => searchParams.get('ctxLeagueId'), [searchParams]);
  const ctxSeasonId = useMemo(() => searchParams.get('ctxSeasonId'), [searchParams]);

  const isSystemAdmin = userAuth?.roles?.includes(Roles.SYSTEM_ADMIN);
  const isTenantAdmin = userAuth?.roles?.includes(Roles.TENANT_ADMIN);
  const isLeagueAdmin = userAuth?.roles?.includes(Roles.LEAGUE_ADMIN);
  const isTeamAdmin = userAuth?.roles?.includes(Roles.TEAM_ADMIN);

  const initialTenantId = useMemo(() => {
    return ctxTenantId ?? (!isSystemAdmin ? userAuth?.tenantId ?? undefined : undefined);
  }, [ctxTenantId, isSystemAdmin, userAuth]);

  const initialLeagueId = useMemo(() => {
    if (ctxLeagueId) return ctxLeagueId;
    if (isSystemAdmin || isTenantAdmin) return undefined;
    if (isLeagueAdmin) return userAuth?.managingLeagueId ?? undefined;
    if (isTeamAdmin) return userAuth?.managingTeam?.leagueId;
    return undefined;
  }, [ctxLeagueId, isSystemAdmin, isTenantAdmin, isLeagueAdmin, isTeamAdmin, userAuth]);

  const [selectedTenantId, setSelectedTenantId] = useState<string | undefined>(() => initialTenantId);
  const [selectedLeagueId, setSelectedLeagueId] = useState<string | undefined>(() => initialLeagueId);
  const [selectedSeasonId, setSelectedSeasonId] = useState<string | undefined>(() => ctxSeasonId ?? undefined);

  const [tenants, setTenants] = useState<BasicDto[]>([]);
  const [leagues, setLeagues] = useState<BasicDto[]>([]);
  const [seasons, setSeasons] = useState<BasicDto[]>([]);
  const [contextNames, setContextNames] = useState({ tenant: '', league: '', season: '' });

  // 🔄 Update selected IDs if initial values change after mount
  useEffect(() => {
    setSelectedTenantId(initialTenantId);
  }, [initialTenantId]);

  useEffect(() => {
    if(initialLeagueId){
        setSelectedLeagueId(initialLeagueId);
    }
  }, [initialLeagueId]);

  useEffect(() => {
    if (ctxSeasonId) setSelectedSeasonId(ctxSeasonId);
  }, [ctxSeasonId]);

  // 🏢 Tenants (System Admin only)
  useEffect(() => {
    if (isSystemAdmin && !ctxTenantId) {
      api.get('/tenants', { params: { pageSize: 100 } })
        .then(res => setTenants(res.data.data))
        .catch(() => toast.error('Failed to load tenants.'));
    }
  }, [isSystemAdmin, ctxTenantId]);

  // 🏟️ Leagues (when tenant changes)
  useEffect(() => {
    if (ctxLeagueId) return;
    if (!selectedTenantId || !(isSystemAdmin || isTenantAdmin)) {
      //setLeagues([]);
      //setSelectedLeagueId(undefined);
      return;
    }
    api.get('/leagues', { params: { tenantId: selectedTenantId, pageSize: 100 } })
      .then(res => setLeagues(res.data.data))
      .catch(() => toast.error('Failed to load leagues.'));
  }, [selectedTenantId, isSystemAdmin, isTenantAdmin, ctxLeagueId]);

  // 📆 Seasons (when league changes)
  useEffect(() => {
    if (ctxSeasonId) return;
    if (!selectedLeagueId) {
      setSeasons([]);
      setSelectedSeasonId(undefined);
      return;
    }
    api.get('/seasons', {
      params: { leagueId: selectedLeagueId, pageSize: 100, status: 'ACTIVE' }
    })
      .then(res => {
        setSeasons(res.data.data);
        if (res.data.data.length > 0 && !selectedSeasonId) {
          setSelectedSeasonId(res.data.data[0].id);
        }
      })
      .catch(() => toast.error('Failed to load seasons.'));
  }, [selectedLeagueId, selectedSeasonId, ctxSeasonId]);

  // 🧠 Context name resolution (for disabled inputs)
  useEffect(() => {
    const fetchContextNames = async () => {
      try {
        if (ctxTenantId) {
          const res = await api.get(`/tenants/${ctxTenantId}`);
          setContextNames(prev => ({ ...prev, tenant: res.data.name }));
        }
        if (ctxLeagueId) {
          const res = await api.get(`/leagues/${ctxLeagueId}`);
          setContextNames(prev => ({ ...prev, league: res.data.name }));
        }
        if (ctxSeasonId) {
          const res = await api.get(`/seasons/${ctxSeasonId}`);
          setContextNames(prev => ({ ...prev, season: res.data.name }));
        }
      } catch {
        toast.error("Could not load context names from URL.");
      }
    };
    fetchContextNames();
  }, [ctxTenantId, ctxLeagueId, ctxSeasonId]);

  // 📣 Notify parent of filter updates
  useEffect(() => {
    onFiltersChange({
      tenantId: selectedTenantId,
      leagueId: selectedLeagueId,
      seasonId: selectedSeasonId,
    });
    console.log("Initial League ID: ", initialLeagueId);
  }, [selectedTenantId, selectedLeagueId, selectedSeasonId, onFiltersChange]);
  const renderTenantFilter = () => {
    if (ctxTenantId) {
      return (
        <div>
          <Label htmlFor="tenant-ctx">Tenant</Label>
          <Input id="tenant-ctx" value={contextNames.tenant || ctxTenantId} disabled />
        </div>
      );
    }
    if (isSystemAdmin) {
      return (
        <div>
          <Label htmlFor="tenant-select">Tenant</Label>
          <Select value={selectedTenantId} onValueChange={setSelectedTenantId}>
            <SelectTrigger id="tenant-select"><SelectValue placeholder="Select Tenant" /></SelectTrigger>
            <SelectContent>{tenants.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      );
    }
    return null; // Hidden for other roles
  };
  
  const renderLeagueFilter = () => {
      if (ctxLeagueId) {
          return (
              <div>
                  <Label htmlFor="league-ctx">League</Label>
                  <Input id="league-ctx" value={contextNames.league || ctxLeagueId} disabled />
              </div>
          );
      }
      if (isSystemAdmin || isTenantAdmin) {
          return (
              <div>
                  <Label htmlFor="league-select">League</Label>
                  <Select value={selectedLeagueId} onValueChange={setSelectedLeagueId} disabled={!selectedTenantId}>
                      <SelectTrigger id="league-select"><SelectValue placeholder="Select League" /></SelectTrigger>
                      <SelectContent>{leagues.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}</SelectContent>
                  </Select>
              </div>
          );
      }
      return null; // Hidden for league/team admins as their league is implicit
  };

  const renderSeasonFilter = () => {
      if (ctxSeasonId) {
          return (
              <div>
                  <Label htmlFor="season-ctx">Season</Label>
                  <Input id="season-ctx" value={contextNames.season || ctxSeasonId} disabled />
              </div>
          );
      }
      return (
          <div>
              <Label htmlFor="season-select">Season</Label>
              <Select value={selectedSeasonId} onValueChange={setSelectedSeasonId} disabled={!selectedLeagueId}>
                  <SelectTrigger id="season-select"><SelectValue placeholder="Select Season" /></SelectTrigger>
                  <SelectContent>{seasons.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
              </Select>
          </div>
      );
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {renderTenantFilter()}
      {renderLeagueFilter()}
      {renderSeasonFilter()}
    </div>
  );
}
