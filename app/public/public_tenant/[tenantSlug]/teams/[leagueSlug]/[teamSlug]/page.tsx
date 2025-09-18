// app/(public)/teams/[leagueSlug]/[teamSlug]/page.tsx
"use client";

import React, { useState, useEffect, useCallback, use } from "react";
import { api } from "@/services/api";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import GamePublicCard from "@/components/game/game-public-card";
import DateCarousel from "@/components/game/date-carousel";
import { GameDetails, TeamDetails } from "@/schemas";
import Image from "next/image";
import { ArrowRight } from "lucide-react";

interface TenantWithGames {
  tenantId: string;
  logoUrl?: string | null;
  tenantName: string;
  tenantSlug: string;
  games: GameDetails[];
}
interface Standing {
  team: {
    id: string;
    name: string;
    shortCode: string;
    slug: string;
    businessProfile: {
      logoUrl: string | null;
      bannerImageUrl: string | null;
    },
  };
  rank: number;
  points: number;
  form?: string | null;
  gamesPlayed: number;
  wins: number;
  losses: number;
}
export default function TeamLandingPage({ params }: { params: Promise<{ leagueSlug: string; teamSlug: string }> }) {
  const { leagueSlug, teamSlug } = use(params);

  const [team, setTeam] = useState<TeamDetails | null>(null);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [games, setGames] = useState<GameDetails[]>([]);
  const [standings, setStandings] = useState<Standing | null>(null);
  const [loadingTeam, setLoadingTeam] = useState(true);
  const [loadingGames, setLoadingGames] = useState(false);
  const [loadingStandings, setLoadingStandings] = useState(false);

  // --- Fetch team profile ---
  const fetchTeam = useCallback(async () => {
    setLoadingTeam(true);
    try {
      const res = await api.get<TeamDetails>(`/public-teams/${teamSlug}`);
      setTeam(res.data);
    } catch (err) {
      console.error(err);
      toast.error("Impossible de charger le profil de l'équipe.");
    } finally {
      setLoadingTeam(false);
    }
  }, [teamSlug]);

  // --- Fetch available dates ---
  const fetchDates = useCallback(async () => {
    if (!team) return;
    try {
      const res = await api.get<string[]>(`/public-games/dates`, {
        params: { tenantSlug: team.tenant.slug, leagueSlug, teamSlug },
      });
      console.log(res);
      const dates = res.data;
      setAvailableDates(dates);
      if (dates.length > 0) {
        const today = new Date().toISOString().split("T")[0];
        setSelectedDate(dates.includes(today) ? today : dates[0]);
      }
    } catch (err) {
      console.error(err);
      toast.error("Impossible de charger les dates des matchs.");
    }
  }, [team, leagueSlug, teamSlug]);

  // --- Fetch games ---
  const fetchGames = useCallback(
    async (date: string) => {
      if (!team || !date) return;
      setLoadingGames(true);
      try {
        const response = await api.get<TenantWithGames[]>(`/public-games`, {
          params: { tenantSlug: team.tenant.slug, leagueSlug, teamSlug, date },
        });
        const tenantsWithGames = response.data;
        const onlyTenant = tenantsWithGames[0];
        setGames(onlyTenant.games);
      } catch (err) {
        console.error(err);
        toast.error("Impossible de charger les matchs.");
      } finally {
        setLoadingGames(false);
      }
    },
    [team, leagueSlug, teamSlug]
  );
  
const fetchStandings = useCallback(async () => {
    setLoadingStandings(true);
    try {
        const standingsResponse = await api.get<Standing[]>(`/public-games/standings/${leagueSlug}`,
          { params: { teamSlug }}
        );
        setStandings(standingsResponse.data[0]);
    } catch (err) {
        console.error("Failed to fetch standings:", err);
        setStandings(null); // Clear standings on error
    } finally {
        setLoadingStandings(false);
    }
}, [leagueSlug, teamSlug]); 

  useEffect(() => {
    fetchTeam();
  }, [fetchTeam]);

  useEffect(() => {
    if (team) {
      fetchDates();
    }
  }, [team, fetchDates]);

  useEffect(() => {
    if (selectedDate) {
      fetchGames(selectedDate);
    }
  }, [selectedDate, fetchGames]);

  useEffect(() => {
    if(team){
      fetchStandings();
    }
  },[fetchStandings, team]);
  if (loadingTeam) {
    return (
      <div className="container mx-auto p-6">
        <Skeleton className="h-48 w-full rounded-lg mb-6" />
        <Skeleton className="h-10 w-1/3 mb-4" />
        <Skeleton className="h-6 w-1/4" />
      </div>
    );
  }

  if (!team) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-semibold">Équipe introuvable</h2>
        <p className="text-gray-500 mt-2">Vérifiez le lien ou réessayez plus tard.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen max-w-4xl mx-auto">
      <div className="container mx-auto space-y-10">
        {/* Header */}
        <div className="relative">
          {team.businessProfile?.bannerAsset?.url ? (
            <Image
              src={team.businessProfile.bannerAsset.url}
              alt="Team banner"
              width={736}
              height={480}
              className="w-full h-60 object-cover rounded-lg"
            />
          ) : (
            <div className="w-full h-48 bg-gray-200 rounded-lg" />
          )}
          <div className="absolute bottom-0 left-4 flex items-center gap-4">
            {team.businessProfile?.logoAsset?.url && (
              <Image
                src={team.businessProfile.logoAsset.url}
                alt={team.name}
                width={50}
                height={50}
                className="w-20 h-20 rounded-full border-4 border-white shadow-md"
              />
            )}
            <div className="text-white drop-shadow-md">
              <h1 className="text-2xl font-bold">{team.name}</h1>
              <p className="text-sm">{team.shortCode}</p>
            </div>
          </div>
        </div>

        {/* Team Stats */}
        <Card className="py-2">
          <CardHeader>
            <CardTitle className="px-2 flex justify-between pb-1">
              <span className="text-gray-700">Statistiques de l&apos;équipe</span>
              <Link href='/standings' className="flex justify-center items-center text-gray-500 hover:text-gray-700 transition-colors duration-300 ease-in-out">
                Classememnts <ArrowRight className="h-4 w-4"/>
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent className="">
            {
              loadingStandings ? 
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
                <Skeleton className="h-6 w-12 p-4" />
                <Skeleton className="h-6 w-12" />
                <Skeleton className="h-6 w-12" />
                <Skeleton className="h-6 w-12" />
              </div>
              :
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
                <div className="">
                  <p className="text-2xl font-bold">{standings?.rank}</p>
                  <p className="text-sm text-gray-500">Rang</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">{standings?.points}</p>
                  <p className="text-sm text-gray-500">Points</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">{standings?.wins}</p>
                  <p className="text-sm text-gray-500">Victoires</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">{standings?.losses}</p>
                  <p className="text-sm text-gray-500">Défaites</p>
                </div>
              </div>
            }
          </CardContent>
        </Card>

        {/* Games Section */}
        <Card className="pb-2">
          <CardHeader>
            <CardTitle className="text-gray-700">Matchs</CardTitle>
          </CardHeader>
          <CardContent>
            {availableDates.length > 0 && (
              <DateCarousel
                dates={availableDates}
                selectedDate={selectedDate}
                onDateSelect={setSelectedDate}
              />
            )}
            {loadingGames ? (
              <div className="grid gap-4 mt-4">
                {Array.from({ length: 2 }).map((_, i) => (
                  <Skeleton key={i} className="h-24 w-full rounded-lg" />
                ))}
              </div>
            ) : games.length > 0 ? (
              <div className="grid gap-4 mt-4">
                {games.map((game) => (
                  <Link key={game.id} href={`/games/${game.league.slug}/${game.slug}`}>
                    <GamePublicCard game={game} />
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 mt-6">Aucun match trouvé.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
