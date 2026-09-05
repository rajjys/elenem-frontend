// app/league/settings/general/page.tsx
"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { api, isAxiosError } from '@/services/api';
import { Button, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Switch, LoadingSpinner } from "@/components/ui"; // Added all necessary UI components
import { LeagueDetails, Roles, SeasonDetails, UpdateLeagueSchema, Gender, VisibilityLevel, GenderSchema, VisibilityLevelSchema } from "@/schemas"; // Added Gender, VisibilityLevel, and their Schemas (assuming they are exported)
import * as z from "zod";
import { useAuthStore } from "@/store/auth.store";
import { useForm, Controller } from "react-hook-form"; // Added react-hook-form imports
import { zodResolver } from "@hookform/resolvers/zod"; // Added zod resolver
import { Loader2 } from "lucide-react"; // Added Loader2 for loading indicator
import Link from "next/link";
import { useContextualLink } from "@/hooks";

// Define the schema for the form. We will use a modified version of UpdateLeagueSchema
// to include the currentSeasonId for submission.
const LeagueGeneralSettingsSchema = UpdateLeagueSchema.partial().extend({
  // The fields we want to edit in this form
  name: z.string().min(3, { message: "League name must be at least 3 characters." }).optional(),
  division: z.string().optional(),
  gender: GenderSchema.optional(),
  visibility: VisibilityLevelSchema.optional(),
  isActive: z.boolean().optional(),
  ownerId: z.string().cuid().optional().nullable(),
  // Add the currentSeasonId which is NOT part of the UpdateLeagueSchema by default
  currentSeasonId: z.string().cuid().nullable().optional(), 
});

type FormValues = z.infer<typeof LeagueGeneralSettingsSchema>;

// Helper: build a shape matching the FormValues from the full LeagueDetails
function buildDefaultValues(league: LeagueDetails): FormValues {
  return {
    name: league.name,
    gender: league.gender ?? undefined, // Use undefined for optional/nullable fields if Zod is configured for it
    division: league.division,
    parentLeagueId: league.parentLeagueId,
    isActive: league.isActive,
    visibility: league.visibility,
    ownerId: league.ownerId,
    currentSeasonId: league.currentSeasonId, // Include the current season ID
  };
}

// Keep the utility functions from general-settings.tsx
function isEqual(a: unknown, b: unknown) {
  if (a === b) return true;
  try {
    return JSON.stringify(a) === JSON.stringify(b);
  } catch {
    return false;
  }
}

function computeDelta(oldObj: Partial<FormValues>, newObj: Partial<FormValues>) {
  const delta: Partial<FormValues> = {};
  Object.keys(newObj).forEach((key) => {
    const k = key as keyof FormValues;
    if (!isEqual(oldObj[k], newObj[k])) {
      // Exclude currentSeasonId from the delta payload for the main league update
      if (k !== 'currentSeasonId') { 
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        delta[k] = newObj[k] as any;
      }
    }
  });
  return delta;
}

export default function GeneralLeagueSettingsPage() {
  const searchParams = useSearchParams();
  const userAuth = useAuthStore((state) => state.user);
  const currentUserRoles = userAuth?.roles || [];
  const ctxLeagueId = searchParams.get('ctxLeagueId');

  const isSystemAdmin = currentUserRoles.includes(Roles.SYSTEM_ADMIN);
  const isTenantAdmin = currentUserRoles.includes(Roles.TENANT_ADMIN);
  const isLeagueAdmin = currentUserRoles.includes(Roles.LEAGUE_ADMIN);
  const currentLeagueId = isSystemAdmin || isTenantAdmin
      ? ctxLeagueId
      : isLeagueAdmin
      ? userAuth?.managingLeagueId
      : null;

  const [league, setLeague] = useState<LeagueDetails | null>(null); // Initialize as null
  const [seasons, setSeasons] = useState<SeasonDetails[]>([]);
  const { buildLink } = useContextualLink();
  const currentSeasonName = seasons.find((s) => s.id === league?.currentSeasonId)?.name ?? null;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form setup
  const initialRef = useRef<FormValues | null>(null);

  // Initialize form with default empty values until data is fetched
  const form = useForm<FormValues>({
    resolver: zodResolver(LeagueGeneralSettingsSchema),
    defaultValues: {}, // Will be set in useEffect
    mode: "onChange",
  });

  const {
    control,
    handleSubmit,
    formState: { isSubmitting, isDirty, errors },
    reset,
    getValues,
    //setValue,
  } = form;

  // Watch for changes to currentSeasonId
  //const currentSeasonId = form.watch('currentSeasonId');

  // Fetch league details
  const fetchLeagueDetails = useCallback(async () => {
    if (!currentLeagueId) return;
    try {
      setLoading(true);
      const response = await api.get<LeagueDetails>(`/leagues/${currentLeagueId}`);
      const fetchedLeague = response.data;
      setLeague(fetchedLeague);
      
      // Update form's initial and current state
      const defaults = buildDefaultValues(fetchedLeague);
      initialRef.current = defaults;
      reset(defaults); // Reset form with fetched data
    } catch (error) {
      let errorMessage = "Failed to fetch league details.";
      if (isAxiosError(error)) {
        errorMessage = error.response?.data?.message || errorMessage;
      }
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [currentLeagueId, reset]);

  // Fetch seasons
  const fetchSeasons = useCallback(async () => {
    if (!currentLeagueId) return;
    try {
      const res = await api.get(`/seasons`, {
        params: {
          leagueId: currentLeagueId,
          page: 1, 
          pageSize: 50, 
          sortBy: "startDate", 
          sortOrder: "desc" }
      });
      setSeasons(res.data.data);
    } catch (error) {
      let errorMessage = "Failed to fetch Seasons.";
      if (isAxiosError(error)) {
        errorMessage = error.response?.data?.message || errorMessage;
      }
      toast.error(errorMessage);
    }
  }, [currentLeagueId]);

  useEffect(() => {
    if (!currentLeagueId)  return;
      fetchLeagueDetails();
      fetchSeasons();
  }, [currentLeagueId, fetchLeagueDetails, fetchSeasons]);


  const onSubmit = async () => {
    if (!currentLeagueId || !league || !initialRef.current) return;

    const currentValues = getValues();
    const leagueUpdatePayload = computeDelta(initialRef.current, currentValues);

    const noChanges = Object.keys(leagueUpdatePayload).length === 0;

    if (noChanges) {
      toast.info("Aucune modification à enregistrer.");
      return;
    }

    try {
      const updatePromises: Promise<unknown>[] = [
        api.put(`/leagues/${currentLeagueId}`, leagueUpdatePayload),
      ];

      // Execute all necessary updates
      await Promise.all(updatePromises);

      toast.success("League settings updated successfully!");
      // Update the "saved" baseline and reset the form's dirty state
      const updatedValues = getValues();
      initialRef.current = updatedValues;
      // Re-run fetch to get the fully updated LeagueDetails object, which is cleaner
      await fetchLeagueDetails(); 
      // Reset form to updated initial values and mark as pristine
      reset(initialRef.current);

    } catch (error) {
      let errorMessage = "Failed to update league settings";
      if (isAxiosError(error)) {
        errorMessage = error.response?.data?.message || errorMessage;
      }
      toast.error(errorMessage);
      console.error("error updating League:", error);
      // Re-establish dirty state based on previous initialRef.current
      reset(initialRef.current);
    } 
    // finally block not strictly needed as isSubmitting is managed by useForm
  };


  if (loading) {
    return <LoadingSpinner message="Loading league settings..." />;
  }

  if (error) {
    return <div className="p-6 text-negative font-semibold">Error: {error}</div>;
  }
  
  if (!league) {
    return <div className="p-6 text-negative font-semibold">Error: League not found or access denied.</div>;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Parametres Generales: {league?.name}</h1>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 p-6 shadow-md bg-surface rounded-lg">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* League Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Nom de la ligue</Label>
            <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <Input
                  id="name"
                  {...field}
                  placeholder="ex: Ligue de la Paix"
                />
              )}
            />
            {errors.name && <p className="text-negative text-xs">{errors.name.message}</p>}
          </div>

          {/* Division */}
          <div className="space-y-2">
            <Label htmlFor="division">Division</Label>
            <Controller
              name="division"
              control={control}
              render={({ field }) => (
                <Input
                  id="division"
                  {...field}
                  placeholder="ex: Nationale 1 / U17"
                />
              )}
            />
            {errors.division && <p className="text-negative text-xs">{errors.division.message}</p>}
          </div>

          <div className="border-b border-line col-span-1 md:col-span-2"/>

          {/* Gender */}
          <div className="space-y-2">
            <Label htmlFor="gender">Genre</Label>
            <Controller
              name="gender"
              control={control}
              render={({ field }) => (
                <Select
                  onValueChange={(value) => field.onChange(value as Gender)}
                  value={field.value ?? ""} // Use null or undefined check
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selectionnez le genre" />
                  </SelectTrigger>
                  <SelectContent> 
                    {Object.values(Gender).map((type) => (
                      <SelectItem key={type} value={type}>
                        {type.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase())}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.gender && <p className="text-negative text-xs">{errors.gender.message}</p>}
          </div>
          
          {/* Visibility select */}
          <div className="space-y-2">
            <Label htmlFor="visibility">Visibilité</Label>
            <Controller
              name="visibility"
              control={control}
              render={({ field }) => (
                <Select
                  onValueChange={(value) => field.onChange(value as VisibilityLevel)}
                  value={field.value}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selectionnez le niveau de visibilité" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(VisibilityLevel).map((level) => (
                      <SelectItem key={level} value={level}>
                        {level.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase())}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.visibility && <p className="text-negative text-xs">{errors.visibility.message}</p>}
          </div>

          {/* isActive (Status) Switch */}
          <div className="space-y-2">
            <Label htmlFor="isActive">Status de la ligue</Label>
            <Controller
              name="isActive"
              control={control}
              render={({ field }) => (
                <div className="flex items-center gap-3">
                  <Switch id="isActive" checked={!!field.value} onCheckedChange={(val) => field.onChange(val)} />
                  <span className="text-sm text-ink-muted">{field.value ? "Actif" : "Inactif"}</span>
                </div>
              )}
            />
          </div>

          {/* The current season is not settable here any more.
              It names the season being played, and that is decided by opening and closing seasons
              rather than by pointing a field at one — it is also the write target for every new
              fixture and the season the standings fall back to for a club administrator, who
              cannot name one. A dropdown here could aim all of that at a season that finished last
              year. See docs/SEASON_AND_DASHBOARDS.md §3. */}
          <div className="space-y-2">
            <Label>Saison en cours</Label>
            <div className="flex flex-wrap items-center gap-2 rounded-md border border-line bg-surface-sunk px-3 py-2">
              <span className="text-sm text-ink">
                {currentSeasonName ?? 'Aucune saison'}
              </span>
              <Link
                href={buildLink('/league/seasons', currentLeagueId ? { ctxLeagueId: currentLeagueId } : undefined)}
                className="ml-auto text-sm font-medium text-accent-text nav-hover"
              >
                Gérer les saisons
              </Link>
            </div>
            <p className="text-xs text-ink-muted">
              Elle change quand vous ouvrez ou terminez une saison, pas depuis ce formulaire.
            </p>
          </div>

          {/* Parent League ID: Ignored as requested, but you might want to display it as read-only */}
          {league.parentLeagueId && (
            <div className="space-y-2">
              <Label htmlFor="lg-parent">Ligue Parent</Label>
              <Input id="lg-parent" disabled value={league.parentLeague?.name || league.parentLeagueId} className="bg-surface-sunk"/>
            </div>
          )}

        </div>

        <div className="flex justify-end pt-4">
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => reset(initialRef.current!)} // Reset to initial fetched values
              disabled={isSubmitting || !isDirty}
            >
              Réinitialiser
            </Button>
            <Button type="submit" disabled={!isDirty || isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  <span>Sauvegarde...</span>
                </>
              ) : (
                <span>Sauvegarder les Changements</span>
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}