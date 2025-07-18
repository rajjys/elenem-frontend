// components/forms/game-form.tsx
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { TextArea } from '../ui';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { api } from '@/services/api'; // Assuming your API service instance
import { useAuthStore } from '@/store/auth.store';
import { Role } from '@/schemas';
import { FiChevronDown, FiChevronRight, FiInfo, FiAward, FiCalendar, FiUsers, FiBarChart2, FiImage } from 'react-icons/fi';

// --- Zod Schema for Validation ---
// This schema enforces the logic we discussed: scores are optional, but if one is present, the other is required.
const createGameSchema = z.object({
  tenantId: z.string().cuid("Tenant Id is required"), // Optional for League Admin, required for others
  leagueId: z.string().cuid("League is required."),
  seasonId: z.string().cuid("Season is required."),
  homeTeamId: z.string().cuid("Home team is required."),
  awayTeamId: z.string().cuid("Away team is required."),
  dateTime: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Invalid date format" }),
  homeVenueId: z.string().cuid().optional().nullable(),
  homeScore: z.coerce.number().int().min(0).optional(),
  awayScore: z.coerce.number().int().min(0).optional(),
  customStats: z.string().optional().refine((val) => {
    if (!val) return true;
    try {
      JSON.parse(val);
      return true;
    } catch (e) {
      return false;
    }
  }, { message: "Invalid JSON format." }),
  notes: z.string().optional(),
  round: z.string().optional(),
  bannerImageUrl: z.string().url().optional().or(z.literal('')),
  highlightsUrl: z.string().url().optional().or(z.literal('')),
}).refine(data => data.homeTeamId !== data.awayTeamId, {
  message: "Home and away teams cannot be the same.",
  path: ["awayTeamId"],
}).refine(data => (data.homeScore !== undefined) === (data.awayScore !== undefined), {
  message: "Both home and away scores must be provided, or neither.",
  path: ["homeScore"],
});

type CreateGameFormValues = z.infer<typeof createGameSchema>;

// --- Helper Interfaces for Fetched Data ---
interface BasicDto {
  id: string;
  name: string;
}
interface TeamDto extends BasicDto {
    shortCode?: string;
}

// --- Component Props ---
interface GameFormProps {
  onSuccess: (gameId: string) => void;
  onCancel: () => void;
}

export function GameForm({ onSuccess, onCancel }: GameFormProps) {
  const { user } = useAuthStore();
  const currentUserRoles = user?.roles || [];

  const isSystemAdmin = currentUserRoles.includes(Role.SYSTEM_ADMIN);
  const isTenantAdmin = currentUserRoles.includes(Role.TENANT_ADMIN);
  const isLeagueAdmin = currentUserRoles.includes(Role.LEAGUE_ADMIN);

  // --- State Management ---
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState({
      tenants: isSystemAdmin,
      leagues: isTenantAdmin,
      dependencies: isLeagueAdmin, // For seasons & teams
  });
  
  const [tenants, setTenants] = useState<BasicDto[]>([]);
  const [leagues, setLeagues] = useState<BasicDto[]>([]);
  const [seasons, setSeasons] = useState<BasicDto[]>([]);
  const [teams, setTeams] = useState<TeamDto[]>([]);

  const [openSections, setOpenSections] = useState({
    context: true,
    matchup: true,
    details: false,
    scoring: false,
    media: false,
  });

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const form = useForm<CreateGameFormValues>({
    resolver: zodResolver(createGameSchema),
    defaultValues: {
      tenantId: isSystemAdmin ? '' : user?.tenantId ?? '',
      leagueId: isLeagueAdmin ? '' : user?.managingLeagueId ?? '',
      homeScore: undefined,
      awayScore: undefined,
      dateTime: new Date().toISOString().slice(0,16),
      customStats: "{}",
    },
  });

  const { handleSubmit, control, watch, setValue, formState: { errors } } = form;

  const watchedTenantId = watch('tenantId');
  const watchedLeagueId = watch('leagueId');

  // --- Data Fetching Hooks ---

  // Fetch Tenants (for System Admin)
  useEffect(() => {
    if (!isSystemAdmin) return;
    const fetchTenants = async () => {
      setLoading(prev => ({ ...prev, tenants: true }));
      try {
        const response = await api.get('/tenants', { params: { pageSize: 100 } });
        setTenants(response.data.data);
      } catch (error) {
        toast.error('Failed to load tenants.');
      } finally {
        setLoading(prev => ({ ...prev, tenants: false }));
      }
    };
    fetchTenants();
  }, [isSystemAdmin]);

  // Fetch Leagues (for System & Tenant Admins)
  useEffect(() => {
    if (isLeagueAdmin || !watchedTenantId) {
        setLeagues([]);
        setValue('leagueId', '');
        return;
    };
    const fetchLeagues = async () => {
      setLoading(prev => ({ ...prev, leagues: true }));
      try {
        const response = await api.get('/leagues', { params: { tenantIds: watchedTenantId, pageSize: 100 } });
        setLeagues(response.data.data);
      } catch (error) {
        toast.error('Failed to load leagues for the selected tenant.');
      } finally {
        setLoading(prev => ({ ...prev, leagues: false }));
      }
    };
    fetchLeagues();
  }, [watchedTenantId, isLeagueAdmin, setValue]);

  // Fetch Seasons & Teams (for all admins, once a league is selected)
  useEffect(() => {
    if (!watchedLeagueId) {
        setSeasons([]);
        setTeams([]);
        setValue('seasonId', '');
        setValue('homeTeamId', '');
        setValue('awayTeamId', '');
        return;
    };
    const fetchDependencies = async () => {
      setLoading(prev => ({ ...prev, dependencies: true }));
      try {
        const [seasonsRes, teamsRes] = await Promise.all([
          api.get(`/seasons`, { params: { leagueId: watchedLeagueId, pageSize: 100, status: 'ACTIVE' } }),
          api.get(`/teams`, { params: { leagueId: watchedLeagueId, pageSize: 100 } }),
        ]);
        setSeasons(seasonsRes.data.data);
        setTeams(teamsRes.data.data);
      } catch (error) {
        toast.error('Failed to load seasons and teams for the selected league.');
      } finally {
        setLoading(prev => ({ ...prev, dependencies: false }));
      }
    };
    fetchDependencies();
  }, [watchedLeagueId, setValue]);

  // --- Form Submission ---
  const onSubmit = async (data: CreateGameFormValues) => {
    if (isSubmitting) return; //Prevent multiple submissions
    // Convert dateTime to ISO string if it's not already
    let dateTime = data.dateTime;
    if (dateTime && dateTime.length === 16) {
      // "2025-08-01T16:30" → "2025-08-01T16:30:00"
      dateTime = new Date(dateTime).toISOString(); // "2025-08-01T16:30:00.000Z"
    }

    setIsSubmitting(true);
    try {
      const payload = { ...data, dateTime };
      // Ensure customStats is a valid JSON object or null
      try {
        payload.customStats = payload.customStats ? JSON.parse(payload.customStats) : null;
      } catch {
        form.setError('customStats', { type: 'manual', message: 'Invalid JSON format.' });
        setIsSubmitting(false);
        return;
      }
      const response = await api.post('/games', payload);
      toast.success('Game created successfully!');
      onSuccess(response.data.id);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message;
      console.error('Error creating game:', err);
      toast.error('Error', { description: errorMessage });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-4xl mx-auto p-4 sm:p-6 bg-white rounded-lg shadow-sm border">
      <h2 className="text-2xl font-bold text-gray-800 border-b pb-3 mb-4">Create New Game</h2>

      {/* --- Context Selection --- */}
      <div className="border rounded-lg bg-gray-50/50">
          <button type="button" className="w-full flex justify-between items-center p-3 font-semibold text-left" onClick={() => toggleSection('context')}>
              <span><FiAward className="inline mr-2" />Context</span>
              {openSections.context ? <FiChevronDown /> : <FiChevronRight />}
          </button>
          {openSections.context && <div className="p-4 border-t grid grid-cols-1 md:grid-cols-2 gap-4">
              {isSystemAdmin && (
                  <Controller name="tenantId" control={control} render={({ field }) => (
                      <div className="space-y-1">
                          <Label htmlFor="tenantId">Tenant</Label>
                          <Select onValueChange={field.onChange} value={field.value} disabled={loading.tenants}>
                              <SelectTrigger id="tenantId"><SelectValue placeholder="Select a Tenant..." /></SelectTrigger>
                              <SelectContent>{tenants.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
                          </Select>
                          {errors.tenantId && <p className="text-red-500 text-xs">{errors.tenantId.message}</p>}
                      </div>
                  )} />
              )}
              {(isSystemAdmin || isTenantAdmin) && (
                  <Controller name="leagueId" control={control} render={({ field }) => (
                      <div className="space-y-1">
                          <Label htmlFor="leagueId">League</Label>
                          <Select onValueChange={field.onChange} value={field.value} disabled={!watchedTenantId || loading.leagues}>
                              <SelectTrigger id="leagueId"><SelectValue placeholder="Select a League..." /></SelectTrigger>
                              <SelectContent>{leagues.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}</SelectContent>
                          </Select>
                          {errors.leagueId && <p className="text-red-500 text-xs">{errors.leagueId.message}</p>}
                      </div>
                  )} />
              )}
          </div>}
      </div>

      {/* --- Matchup Selection --- */}
       <div className="border rounded-lg bg-gray-50/50">
          <button type="button" className="w-full flex justify-between items-center p-3 font-semibold text-left" onClick={() => toggleSection('matchup')}>
              <span><FiUsers className="inline mr-2" />Matchup</span>
              {openSections.matchup ? <FiChevronDown /> : <FiChevronRight />}
          </button>
          {openSections.matchup && <div className="p-4 border-t grid grid-cols-1 md:grid-cols-2 gap-4">
              <Controller name="seasonId" control={control} render={({ field }) => (
                  <div className="space-y-1 md:col-span-2">
                      <Label htmlFor="seasonId">Season</Label>
                      <Select onValueChange={field.onChange} value={field.value} disabled={!watchedLeagueId || loading.dependencies}>
                          <SelectTrigger id="seasonId"><SelectValue placeholder="Select a Season..." /></SelectTrigger>
                          <SelectContent>{seasons.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                      </Select>
                      {errors.seasonId && <p className="text-red-500 text-xs">{errors.seasonId.message}</p>}
                  </div>
              )} />
              <Controller name="homeTeamId" control={control} render={({ field }) => (
                  <div className="space-y-1">
                      <Label htmlFor="homeTeamId">Home Team</Label>
                      <Select onValueChange={field.onChange} value={field.value} disabled={!watchedLeagueId || loading.dependencies}>
                          <SelectTrigger id="homeTeamId"><SelectValue placeholder="Select Home Team..." /></SelectTrigger>
                          <SelectContent>{teams.map(t => <SelectItem key={t.id} value={t.id}>{t.name} ({t.shortCode})</SelectItem>)}</SelectContent>
                      </Select>
                      {errors.homeTeamId && <p className="text-red-500 text-xs">{errors.homeTeamId.message}</p>}
                  </div>
              )} />
              <Controller name="awayTeamId" control={control} render={({ field }) => (
                  <div className="space-y-1">
                      <Label htmlFor="awayTeamId">Away Team</Label>
                      <Select onValueChange={field.onChange} value={field.value} disabled={!watchedLeagueId || loading.dependencies}>
                          <SelectTrigger id="awayTeamId"><SelectValue placeholder="Select Away Team..." /></SelectTrigger>
                          <SelectContent>{teams.map(t => <SelectItem key={t.id} value={t.id}>{t.name} ({t.shortCode})</SelectItem>)}</SelectContent>
                      </Select>
                      {errors.awayTeamId && <p className="text-red-500 text-xs">{errors.awayTeamId.message}</p>}
                  </div>
              )} />
          </div>}
      </div>

      {/* --- Game Details --- */}
       <div className="border rounded-lg bg-gray-50/50">
          <button type="button" className="w-full flex justify-between items-center p-3 font-semibold text-left" onClick={() => toggleSection('details')}>
              <span><FiCalendar className="inline mr-2" />Details</span>
              {openSections.details ? <FiChevronDown /> : <FiChevronRight />}
          </button>
          {openSections.details && <div className="p-4 border-t grid grid-cols-1 md:grid-cols-2 gap-4">
              <Controller name="dateTime" control={control} render={({ field }) => (
                  <div className="space-y-1">
                      <Label htmlFor="dateTime">Date & Time</Label>
                      <Input id="dateTime" type="datetime-local" {...field} value={field.value ?? ''}/>
                      {errors.dateTime && <p className="text-red-500 text-xs">{errors.dateTime.message}</p>}
                  </div>
              )} />
              <Controller name="round" control={control} render={({ field }) => (
                  <div className="space-y-1">
                      <Label htmlFor="round">Round / Week (Optional)</Label>
                      <Input id="round" placeholder="e.g., Round 5" {...field} />
                      {errors.round && <p className="text-red-500 text-xs">{errors.round.message}</p>}
                  </div>
              )} />
              <Controller name="notes" control={control} render={({ field }) => (
                  <div className="space-y-1 md:col-span-2">
                      <Label htmlFor="notes">Notes (Optional)</Label>
                      <TextArea id="notes" placeholder="Any specific notes about the game..." {...field} />
                      {errors.notes && <p className="text-red-500 text-xs">{errors.notes.message}</p>}
                  </div>
              )} />
          </div>}
      </div>
      
      {/* --- Scoring (for completed games) --- */}
      <div className="border rounded-lg bg-gray-50/50">
          <button type="button" className="w-full flex justify-between items-center p-3 font-semibold text-left" onClick={() => toggleSection('scoring')}>
              <span><FiBarChart2 className="inline mr-2" />Scoring (Optional: For Completed Games)</span>
              {openSections.scoring ? <FiChevronDown /> : <FiChevronRight />}
          </button>
          {openSections.scoring && <div className="p-4 border-t space-y-4">
              <div className="grid grid-cols-2 gap-4">
                  <Controller name="homeScore" control={control} render={({ field }) => (
                      <div className="space-y-1">
                          <Label htmlFor="homeScore">Home Score</Label>
                          <Input id="homeScore" type="number" placeholder="e.g., 3" {...field} />
                          {errors.homeScore && <p className="text-red-500 text-xs">{errors.homeScore.message}</p>}
                      </div>
                  )} />
                  <Controller name="awayScore" control={control} render={({ field }) => (
                      <div className="space-y-1">
                          <Label htmlFor="awayScore">Away Score</Label>
                          <Input id="awayScore" type="number" placeholder="e.g., 1" {...field} />
                          {errors.awayScore && <p className="text-red-500 text-xs">{errors.awayScore.message}</p>}
                      </div>
                  )} />
              </div>
              <Controller name="customStats" control={control} render={({ field }) => (
                  <div className="space-y-1">
                      <Label htmlFor="customStats">Custom Stats (JSON Format)</Label>
                      <TextArea id="customStats" placeholder='e.g., { "period1": { "home": 1, "away": 0 } }' {...field} rows={4} />
                      {errors.customStats && <p className="text-red-500 text-xs">{errors.customStats.message}</p>}
                  </div>
              )} />
          </div>}
      </div>
      
      {/* --- Media --- */}
      <div className="border rounded-lg bg-gray-50/50">
          <button type="button" className="w-full flex justify-between items-center p-3 font-semibold text-left" onClick={() => toggleSection('media')}>
              <span><FiImage className="inline mr-2" />Media (Optional)</span>
              {openSections.media ? <FiChevronDown /> : <FiChevronRight />}
          </button>
          {openSections.media && <div className="p-4 border-t grid grid-cols-1 md:grid-cols-2 gap-4">
              <Controller name="bannerImageUrl" control={control} render={({ field }) => (
                  <div className="space-y-1">
                      <Label htmlFor="bannerImageUrl">Banner Image URL</Label>
                      <Input id="bannerImageUrl" placeholder="https://example.com/banner.png" {...field} />
                      {errors.bannerImageUrl && <p className="text-red-500 text-xs">{errors.bannerImageUrl.message}</p>}
                  </div>
              )} />
              <Controller name="highlightsUrl" control={control} render={({ field }) => (
                  <div className="space-y-1">
                      <Label htmlFor="highlightsUrl">Highlights URL</Label>
                      <Input id="highlightsUrl" placeholder="https://youtube.com/watch?v=..." {...field} />
                      {errors.highlightsUrl && <p className="text-red-500 text-xs">{errors.highlightsUrl.message}</p>}
                  </div>
              )} />
          </div>}
      </div>

      {/* --- Form Actions --- */}
      <div className="flex justify-end space-x-4 pt-4">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting || Object.values(loading).some(Boolean)}>
          {isSubmitting ? 'Creating...' : 'Create Game'}
        </Button>
      </div>
    </form>
  );
}
