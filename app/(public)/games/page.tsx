// app/(public)/games/page.tsx
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from '@/services/api';
import { toast } from 'sonner';
import { GameDetails } from '@/schemas';
import { Avatar } from '@/components/ui';
import GamePublicCard from '@/components/game/game-public-card';
import { format } from 'date-fns';
import GamesPageSkeleton from '@/components/game/games-page-skeleton';
import DateCarousel from '@/components/game/date-carousel';


interface TenantWithGames {
  tenantId: string;
  logoUrl?: string | null;
  tenantName: string;
  tenantSlug: string;
  games: GameDetails[];
}

export default function PublicGamesPage() {
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [gamesByTenant, setGamesByTenant] = useState<TenantWithGames[]>([]);
  const [loadingDates, setLoadingDates] = useState(true);
  const [loadingGames, setLoadingGames] = useState(false);
  
  const ROOT_DOMAIN = process.env.NODE_ENV === 'development' ? process.env.NEXT_PUBLIC_HOME_URL_LOCAL : process.env.NEXT_PUBLIC_HOME_URL;
  const handler = (process.env.NODE_ENV === 'development' ) ? 'http://' : 'https://';

  // Fetch available dates on initial load
  async function fetchDates() {
      try {
          console.log("Fetching Game Dates...");
          const response = await api.get<string[]>('/public-games/dates');
          const dates = response.data;
          if (!dates || dates.length === 0) {
            toast.info("Aucune date de match disponible.");
            //console.warn("No available dates found.");
            return;
          }
          setAvailableDates(dates);
          if (dates.length > 0) {
          // Select today's date if available, otherwise the first available date
          const today = format(new Date(), 'yyyy-MM-dd');
          setSelectedDate(dates.includes(today) ? today : dates[0]);
        }
      }
      catch(error){
        //toast.error("Failed to load game dates.");
        console.error(error);
      }
      finally{
          setLoadingDates(false)
      }
    }
  // Fetch games when a date is selected
  const fetchGames = useCallback(async (date: string) => {
    if (!date) return;
    setLoadingGames(true);
    try {
      const response = await api.get<TenantWithGames[]>('/public-games', { params: { date } });
      const tenantsWithGames = response.data;
      setGamesByTenant(tenantsWithGames);
    } catch (error) {
        //toast.error(`Failed to load games for ${date}.`);
        console.error(error);
    }
    finally{
        setLoadingGames(false)
    }
  }, []);

  useEffect(() => {
     fetchDates(); 
  }, []);

  useEffect(() => {
      fetchGames(selectedDate);
  }, [selectedDate, fetchGames]);
  
  const todayISO = new Date().toISOString().split('T')[0];
    useEffect(() => {
        if (availableDates.length) {
            const futureOrToday = availableDates.find(d => d >= todayISO) ?? availableDates[0];
            setSelectedDate(futureOrToday);
        }
    }, [availableDates, todayISO]);

  return (
    <div className="bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200">
      <div className="container mx-auto min-h-screen max-w-2xl p-4 sm:p-6 space-y-8">
        <header>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight ">Matchs et Résultats: Toutes les Organisations</h1>
          <p className="my-2 text-sm md:text-md">Parcourez les Matchs publics dans toutes les ligues.</p>
        </header>
        { !loadingDates &&
          <Card className="overflow-hidden shadow-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
            <CardHeader>
              {availableDates.length > 0 && (
                <CardTitle className="text-base px-2 text-slate-800 dark:text-slate-100">
                  Sélectionner une date
                </CardTitle>
              )}
            </CardHeader>
            <CardContent className="grid gap-4 md:gap-4 grid-cols-1">
              <DateCarousel
                dates={availableDates}
                selectedDate={selectedDate}
                onDateSelect={setSelectedDate}
              />
            </CardContent>
          </Card>
          }
        {loadingDates ? 
          <div className="container max-w-2xl mx-auto">
              <GamesPageSkeleton />
          </div>
            :
        loadingGames ? (
            <div className="space-y-8">
                 {Array.from({ length: 2 }).map((_, i) => (
                     <Card key={i} className="overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                        <CardHeader>
                          <Skeleton className="h-7 w-1/3 bg-slate-200 dark:bg-slate-700" />
                        </CardHeader>
                        <CardContent className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                          <Skeleton className="h-48 w-full rounded-lg bg-slate-200 dark:bg-slate-700" />
                          <Skeleton className="h-48 w-full rounded-lg bg-slate-200 dark:bg-slate-700" />
                          <Skeleton className="h-48 w-full rounded-lg bg-slate-200 dark:bg-slate-700" />
                        </CardContent>
                      </Card>
                 ))}
            </div>
        ) : gamesByTenant.length > 0 ? (
          <div className="space-y-8">
            {gamesByTenant.map(({ tenantId, tenantName, tenantSlug, logoUrl, games }) => (
              <Card key={tenantId} className="overflow-hidden shadow-sm pb-2 bg-slate-200 dark:bg-slate-800">
                <CardHeader>
                  <CardTitle>
                    <Link href={`${handler}${tenantSlug}.${ROOT_DOMAIN}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-start space-x-2 text-slate-800 dark:text-slate-200">
                      <Avatar src={logoUrl} name={tenantName} size={35} />
                      <span>{tenantName}</span>
                    </Link>
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-2 grid-cols-1">
                  {games.map((game) => (
                    <Link key={game.id} href={`${handler}${tenantSlug}.${ROOT_DOMAIN}/games/${game.league.slug}/${game.slug}`} target="_blank" rel="noopener noreferrer">
                        <GamePublicCard game={game}/>
                    </Link>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
            <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
              <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                Pas des Matchs Disponible
              </h3>
              {availableDates.length > 0 && (
                <p className="mt-2 text-slate-500 dark:text-slate-400">
                  Pas de matchs Disponible à la date sélectionnée.
                </p>
              )}
            </div>
          )}
      </div>
    </div>
  );
}
