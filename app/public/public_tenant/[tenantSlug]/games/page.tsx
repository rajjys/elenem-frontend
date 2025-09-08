// app/(public)/games/page.tsx
"use client";

import React, { useState, useEffect, useCallback, use } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from '@/services/api';
import { toast } from 'sonner';
import { GameDetails } from '@/schemas';
import GamePublicCard from '@/components/game/game-public-card';
import { format } from 'date-fns';
import GamesPageSkeleton from '@/components/game/games-page-skeleton';
import DateCarousel from '@/components/game/date-carousel';
import { fr } from 'date-fns/locale';


interface TenantWithGames {
  tenantId: string;
  logoUrl?: string | null;
  tenantName: string;
  tenantSlug: string;
  games: GameDetails[];
}

export default function PublicGamesPage({ params }: { params: Promise<{ tenantSlug: string }> }) {
  const { tenantSlug } = use(params);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [tenantData, setTenantdata] = useState<TenantWithGames>();
  const [loadingDates, setLoadingDates] = useState(true);
  const [loadingGames, setLoadingGames] = useState(false);
  
  //const ROOT_DOMAIN = process.env.NODE_ENV === 'development' ? process.env.NEXT_PUBLIC_HOME_URL_LOCAL : process.env.NEXT_PUBLIC_HOME_URL;
  //const handler = (process.env.NODE_ENV === 'development' ) ? 'http://' : 'https://';

  // Fetch available dates on initial load
  const fetchDates = useCallback(async () => {
      try {
          const response = await api.get<string[]>(`/public-games/dates`, { params: { tenantSlug } });
          const dates = response.data;
          if (!dates || dates.length === 0) {
            //toast.error("Aucune date de match disponible.");
            console.warn("No available dates found.");
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
        console.warn(error);
      }
      finally{
          setLoadingDates(false)
      }
    }, [tenantSlug]);
  // Fetch games when a date is selected
  const fetchGames = useCallback(async (date: string) => {
    if (!date) return;
    setLoadingGames(true);
    try {
      const response = await api.get<TenantWithGames[]>('/public-games', { params: { date, tenantSlug } });
      const tenantsWithGames = response.data;
      const onlyTenant = tenantsWithGames[0];
      setTenantdata(onlyTenant);
    } catch (error) {
        toast.error(`Failed to load games for ${date}.`);
        console.log(error);
    }
    finally{
        setLoadingGames(false)
    }
  }, [tenantSlug]);

  useEffect(() => {
     fetchDates(); 
  }, [fetchDates]);

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

  if (loadingDates) {
      return (
          <div className="container max-w-2xl mx-auto p-4 sm:p-6">
              <GamesPageSkeleton />
          </div>
      );
  }

  return (
    <div className="min-h-screen max-w-2xl mx-auto">
      <div className="container mx-auto p-4 sm:p-6 space-y-8">
        <header>
          <h1 className="text-2xl font-bold tracking-tight text-gray-800">Matchs et Résultats: {tenantData?.tenantName}</h1>
          <p className="mt-2 text-md text-gray-500">Parcourez les Matchs publics de: {tenantData?.tenantName}.</p>
        </header>
        <Card className="overflow-hidden shadow-sm">
          <CardHeader>
            <CardTitle className='text-gray-500 text-base px-2'>Selectionner une date</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:gap-6 grid-cols-1">
            <DateCarousel dates={availableDates} selectedDate={selectedDate} onDateSelect={setSelectedDate} />
          </CardContent>
        </Card>
        {loadingGames ? (
            <div className="space-y-8">
                 {Array.from({ length: 2 }).map((_, i) => (
                     <Card key={i} className="overflow-hidden">
                        <CardHeader><Skeleton className="h-7 w-1/3" /></CardHeader>
                        <CardContent className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                            <Skeleton className="h-48 w-full rounded-lg" />
                            <Skeleton className="h-48 w-full rounded-lg" />
                            <Skeleton className="h-48 w-full rounded-lg" />
                        </CardContent>
                    </Card>
                 ))}
            </div>
        ) : tenantData ? (
          <div className="space-y-8">
              <Card className="overflow-hidden shadow-sm bg-gray-400 pb-2">
                <CardHeader>
                  <CardTitle className='text-white text-center font-semibold text-lg'>
                    Matchs du {selectedDate ? format(new Date(selectedDate), 'dd MMMM yyyy', { locale: fr }) : 'Sélectionnez une date'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-2 grid-cols-1">
                  {tenantData.games.map((game) => (
                    <Link key={game.id} href={`/games/${game.slug}`} target="_blank" rel="noopener noreferrer">
                        <GamePublicCard game={game}/>
                    </Link>
                  ))}
                </CardContent>
              </Card>
          </div>
        ) : (
            <div className="text-center py-16 bg-white rounded-lg border">
                <h3 className="text-xl font-semibold">Pas des Matchs Disponible</h3>
                <p className="text-muted-foreground mt-2">Pas de matchs Disponible a la date selectionnee.</p>
            </div>
        )}
      </div>
    </div>
  );
}
