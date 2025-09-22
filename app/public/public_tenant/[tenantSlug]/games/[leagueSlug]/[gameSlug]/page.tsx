// app/(public)/leagues/[leagueSlug]/games/[gameSlug]/page.tsx
"use client";

import React, { useState, useEffect, useCallback, use } from "react";
import { api } from "@/services/api";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { GameDetails, GameStatus } from "@/schemas";
import Image from "next/image";
import { formatDateFr } from "@/utils";
import { ListBulletsIcon } from "@phosphor-icons/react";
import Link from "next/link";
import { getStatusBadge } from "@/components/ui";

interface Standing {
  teamSlug: string;
  rank: number;
  wins: number;
  losses: number;
  forfeits: number;
}

export default function GamePage({
  params,
}: {
  params: Promise<{ leagueSlug: string; gameSlug: string }>;
}) {
  const { leagueSlug, gameSlug } = use(params);

  const [game, setGame] = useState<GameDetails | null>(null);
  const [loadingGame, setLoadingGame] = useState(true);
  const [homeStanding, setHomeStanding] = useState<Standing | null>(null);
  const [awayStanding, setAwayStanding] = useState<Standing | null>(null);
  const [loadingStandings, setLoadingStandings] = useState(true);

  // Fetch game details
  const fetchGame = useCallback(async () => {
    setLoadingGame(true);
    try {
      const res = await api.get<GameDetails>(
        `/public-games/${leagueSlug}/${gameSlug}`
      );
      setGame(res.data);
    } catch (err) {
      console.error(err);
      toast.error("Impossible de charger le match.");
    } finally {
      setLoadingGame(false);
    }
  }, [leagueSlug, gameSlug]);

  // Fetch standings for both teams
  const fetchStandings = useCallback(
    async (homeSlug: string, awaySlug: string) => {
      setLoadingStandings(true);
      try {
        const [homeRes, awayRes] = await Promise.all([
          api.get<Standing[]>(`/public-games/standings/${leagueSlug}`, {
            params: { teamSlug: homeSlug },
          }),
          api.get<Standing[]>(`/public-games/standings/${leagueSlug}`, {
            params: { teamSlug: awaySlug },
          }),
        ]);
        setHomeStanding(homeRes.data[0]);
        setAwayStanding(awayRes.data[0]);
      } catch (err) {
        console.error("Failed to fetch standings:", err);
        setHomeStanding(null);
        setAwayStanding(null);
      } finally {
        setLoadingStandings(false);
      }
    },
    [leagueSlug]
  );

  useEffect(() => {
    fetchGame();
  }, [fetchGame]);

  useEffect(() => {
    if (game) {
      fetchStandings(game.homeTeam.slug, game.awayTeam.slug);
    }
  }, [game, fetchStandings]);

  if (loadingGame) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-48 w-full rounded-lg" />
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-6 w-1/4" />
      </div>
    );
  }

  if (!game) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-semibold">Match introuvable</h2>
        <p className="text-gray-500 mt-2">Vérifiez le lien ou réessayez plus tard.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen max-w-5xl mx-auto">
      {/* Banner */}
      <div className="relative" hidden>
        {game.bannerImageUrl ? (
          <Image
            src={game.bannerImageUrl}
            alt="Banner"
            height={480}
            width={736}
            className="w-full h-56 object-cover rounded-lg"
          />
        ) : (
          <div className="w-full h-56 bg-gray-200 rounded-lg" />
        )}
      </div>

      {/* Main game card */}
      <Card className="mt-6 shadow-md">
        <CardContent className="p-6">
          {/* Teams row */}
          <div className="grid grid-cols-3 gap-3 items-center">
            {/* Home Team */}
            <div className="text-center">
              {homeStanding && <span className="text-center text-base text-green-900 font-semibold py-1 flex items-center justify-center gap-1">
                {homeStanding.rank}
                <ListBulletsIcon/>
              </span>}
              {game.homeTeam.businessProfile.logoAsset?.url ? (
                <Image
                  src={game.homeTeam.businessProfile.logoAsset.url}
                  alt={game.homeTeam.name}
                  height={60}
                  width={60}
                  className="w-20 h-20 mx-auto rounded-full"
                />
              ) :
                <div className="h-20 w-20 rounded-full bg-gray-300 mx-auto border-4 border-white" />}
              <Link href={`/teams/${leagueSlug}/${game.homeTeam.slug}`}>
                <h3 className="mt-2 font-bold hover:text-green-700 transition-colors duration-300 ease-in-out">
                  {game.homeTeam.name}
                </h3>
              </Link>
              <p className="text-sm text-gray-500">{game.homeTeam.shortCode}</p>
              {loadingStandings ? (
                <Skeleton className="h-4 w-20 mx-auto mt-1" />
              ) : homeStanding ? (
                <p className="text-xs text-gray-600 mt-1">
                  {homeStanding.wins}-{homeStanding.losses}-{homeStanding.forfeits}
                </p>
              ) : null}
            </div>
            {/* Score & status */}
            <div className="text-center">
              <p className="text-base md:text-lg font-semibold">{getStatusBadge(game.status)}</p>
              {(game.status === GameStatus.IN_PROGRESS ||
                game.status === GameStatus.COMPLETED) && (
                <p className="text-2xl md:text-3xl font-bold my-2">
                  {game.homeScore ?? "-"} : {game.awayScore ?? "-"}
                </p>
              )}
              <p className="text-sm text-gray-500">
                  {formatDateFr(game.dateTime)}
              </p>
              {game.round && (
                <p className="text-xs text-gray-500 mt-1">Round {game.round}</p>
              )}
            </div>

            {/* Away Team */}
            <div className="text-center">
              {awayStanding && <span className="text-center text-base text-green-900 font-semibold py-1 flex items-center justify-center gap-1">{awayStanding.rank}<ListBulletsIcon/></span>}
              {game.awayTeam.businessProfile.logoAsset?.url ? (
                <Image
                  src={game.awayTeam.businessProfile.logoAsset.url}
                  alt={game.awayTeam.name}
                  height={60}
                  width={60}
                  className="w-20 h-20 mx-auto rounded-full"
                />
              ) :
                <div className="h-20 w-20 rounded-full bg-gray-300 mx-auto border-4 border-white" />
              }
              <Link href={`/teams/${leagueSlug}/${game.awayTeam.slug}`}>
                <h3 className="mt-2 font-bold hover:text-green-700 transition-colors duration-300 ease-in-out">
                  {game.awayTeam.name}
                </h3>
              </Link>
              <p className="text-sm text-gray-500">{game.awayTeam.shortCode}</p>
              {loadingStandings ? (
                <Skeleton className="h-4 w-20 mx-auto mt-1" />
              ) : awayStanding ? (
                <p className="text-xs text-gray-600 mt-1">
                  {awayStanding.wins}-{awayStanding.losses}-{awayStanding.forfeits}
                </p>
              ) : null}
            </div>
          </div>

          {/* Venue / notes */}
          <div className="mt-6 text-center text-sm text-gray-600">
            {game.homeVenue?.name && <p>Lieu: {game.homeVenue.name}</p>}
            {game.location && <p>Adresse: {game.location}</p>}
            {game.notes && <p className="italic mt-2">{game.notes}</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
