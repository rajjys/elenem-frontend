// app/league/settings/general/page.tsx (Next.js App Router)
"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner"; // or your toast lib
import { api } from "@/services/api"; // axios instance
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { LeagueBasic, SeasonDetails } from "@/schemas";
import axios from "axios";
import { useContextualLink } from "@/hooks";

export default function GeneralLeagueSettingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { buildLink } = useContextualLink();
  //const ctxTenantId = searchParams.get("ctxTenantId");
  const ctxLeagueId = searchParams.get("ctxLeagueId");

  const [league, setLeague] = useState<LeagueBasic>();
  const [seasons, setSeasons] = useState<SeasonDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedSeason, setSelectedSeason] = useState<string | null>(null);

  // Fetch league details
  const fetchLeagueDetails = useCallback(async () => {
    if (!ctxLeagueId) return;
    try {
      setLoading(true);
      const res = await api.get<LeagueBasic>(`/leagues/${ctxLeagueId}`);
      setLeague(res.data);
      setSelectedSeason(res.data.currentSeasonId ?? null);
    } catch (error) {
      let errorMessage = "Failed to fetch league details.";
      if (axios.isAxiosError(error)) {
          errorMessage = error.response?.data?.message || errorMessage;
      }
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [ctxLeagueId]);

  // Fetch seasons
  const fetchSeasons = useCallback(async () => {
    if (!ctxLeagueId) return;
    try {
      const res = await api.get(`/seasons?leagueId=${ctxLeagueId}&page=1&pageSize=50&sortBy=createdAt&sortOrder=desc`);
      setSeasons(res.data.data);
    } catch (error) {
      let errorMessage = "Failed to fetch Seasons.";
      if (axios.isAxiosError(error)) {
          errorMessage = error.response?.data?.message || errorMessage;
      }
      setError(errorMessage);
      toast.error(errorMessage);
    }
  }, [ctxLeagueId]);

  useEffect(() => {
    fetchLeagueDetails();
    fetchSeasons();
  }, [fetchLeagueDetails, fetchSeasons]);

  const handleSave = async () => {
    if (!ctxLeagueId) return;
    try {
      setSaving(true);
      await api.put(`/leagues/${ctxLeagueId}`, {
        currentSeasonId: selectedSeason || null,
      });
      toast.success("League updated successfully");
      //router.refresh();
      router.push(buildLink('/league/dashboard'))
    } catch (error) {
      let errorMessage = "Failed to update league. Try Again later";
      if (axios.isAxiosError(error)) {
          errorMessage = error.response?.data?.message || errorMessage;
      }
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <Skeleton className="h-6 w-40 mb-4" />
        <Skeleton className="h-10 w-full max-w-md" />
      </div>
    );
  }

  if (error) {
    return <div className="p-6 text-red-500">{error}</div>;
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-semibold mb-6"><span>{league.name}</span> - General Settings</h1>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Current Season
          </label>
          <select
            value={selectedSeason || ""}
            onChange={(e) =>
              setSelectedSeason(e.target.value || null)
            }
            className="w-full border rounded-lg p-2"
          >
            <option value="">— None —</option>
            {seasons.map((season) => (
              <option key={season.id} value={season.id}>
                {season.name}
              </option>
            ))}
          </select>
        </div>

        <div className="pt-4 flex justify-end">
          <Button variant="primary" onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
        </Button>
        </div>
      </div>
    </div>
  );
}
