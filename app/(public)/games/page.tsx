// app/(public)/games/page.tsx
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from '@/services/api';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { GameDetails } from '@/schemas';
import { Avatar } from '@/components/ui';
import GamePublicCard from '@/components/ui/game-public-card';


interface TenantWithGames {
  tenantId: string;
  logoUrl?: string | null;
  tenantName: string;
  tenantSlug: string;
  games: GameDetails[];
}

// --- Skeleton Component ---
function GamesPageSkeleton() {
    return (
        <div className="space-y-8">
            {/*Header Skeleton*/}
            <header className='space-y-2'>
                <Skeleton className='h-8 w-1/3 rounded-md' />
                <Skeleton className='h-4 w-2/3 rounded-md'/>
            </header>
            {/* Date Carousel Skeleton */}
            <div className="flex items-center space-x-2">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 overflow-hidden">
                    <div className="flex space-x-4">
                        {Array.from({ length: 7 }).map((_, i) => (
                            <Skeleton key={i} className="h-20 w-24 rounded-lg flex-shrink-0" />
                        ))}
                    </div>
                </div>
                <Skeleton className="h-10 w-10 rounded-full" />
            </div>
            {/* Game List Skeleton */}
            {Array.from({ length: 2 }).map((_, i) => (
                 <Card key={i} className="overflow-hidden pb-2">
                    <CardHeader>
                        <Skeleton className="h-7 w-1/3" />
                    </CardHeader>
                    <CardContent className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                        <Skeleton className="h-48 w-full rounded-lg" />
                        <Skeleton className="h-48 w-full rounded-lg" />
                        <Skeleton className="h-48 w-full rounded-lg" />
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

// --- Date Carousel Filter ---
function DateCarousel({ dates, selectedDate, onDateSelect }: { dates: string[], selectedDate: string, onDateSelect: (date: string) => void }) {
    if (!dates.length) return null;

    return (
        <div className="relative">
            <div className="flex items-center space-x-2 overflow-x-auto pb-4 scrollbar-hide">
                {dates.map(dateStr => {
                    const dateObj = parseISO(dateStr);
                    const isSelected = dateStr === selectedDate;
                    return (
                        <button
                            key={dateStr}
                            onClick={() => onDateSelect(dateStr)}
                            className={`flex-shrink-0 w-14 h-20 rounded-lg flex flex-col items-center justify-center transition-all duration-200
                                ${isSelected ? 'bg-gray-600 text-gray-200 shadow-md scale-105' : 'bg-card hover:bg-muted'}`}
                        >
                            <span className={`text-xs font-semibold ${isSelected? "text-gray-100" : "text-gray-500"}`}>{format(dateObj, 'EEE', { locale: fr }).charAt(0).toUpperCase() + format(dateObj, 'EEE', { locale: fr }).slice(1)}</span>
                            <span className={`text-2xl font-bold ${isSelected? "text-yellow-100" : "text-gray-800"}`}>{format(dateObj, 'dd', { locale: fr })}</span>
                            <span className={`text-xs font-semibold ${isSelected? "text-gray-100" : "text-gray-500"}`}>{format(dateObj, 'MMM',{ locale: fr }).charAt(0).toUpperCase() + format(dateObj, 'MMM').slice(1)}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}


export default function PublicGamesPage() {
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [gamesByTenant, setGamesByTenant] = useState<TenantWithGames[]>([]);
  const [loadingDates, setLoadingDates] = useState(true);
  const [loadingGames, setLoadingGames] = useState(false);
  
  const ROOT_DOMAIN = (process.env.NODE_ENV === 'development' ) ? 'lvh.me:3000' : "website.com";
  const handler = (process.env.NODE_ENV === 'development' ) ? 'http://' : 'https://';

  // Fetch available dates on initial load
  useEffect(() => {
    api.get('/public/games/dates')
      .then(response => {
        const dates = response.data;
        setAvailableDates(dates);
        if (dates.length > 0) {
          // Select today's date if available, otherwise the first available date
          const today = format(new Date(), 'yyyy-MM-dd');
          setSelectedDate(dates.includes(today) ? today : dates[0]);
        }
      })
      .catch(() => toast.error("Failed to load game dates."))
      .finally(() => setLoadingDates(false));
  }, []);

  // Fetch games when a date is selected
  const fetchGames = useCallback((date: string) => {
    if (!date) return;
    setLoadingGames(true);
    api.get('/public/games', { params: { date } })
      .then(response => {
        setGamesByTenant(response.data);
      })
      .catch(() => toast.error(`Failed to load games for ${date}.`))
      .finally(() => setLoadingGames(false));
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
          <h1 className="text-4xl font-bold tracking-tight text-gray-800">Matchs et Résultats: Toutes les Organisations</h1>
          <p className="mt-2 text-md text-gray-500">Parcourez les Matchs publics dans toutes les ligues.</p>
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
        ) : gamesByTenant.length > 0 ? (
          <div className="space-y-8">
            {gamesByTenant.map(({ tenantId, tenantName, tenantSlug, logoUrl, games }) => (
              <Card key={tenantId} className="overflow-hidden shadow-sm pb-2 bg-gray-400">
                <CardHeader>
                  <CardTitle>
                    <Link href={`${handler}${tenantSlug}.${ROOT_DOMAIN}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-start space-x-2 text-white">
                      <Avatar src={logoUrl} name={tenantName} size={35} />
                      <span>{tenantName}</span>
                    </Link>
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-2 grid-cols-1">
                  {games.map((game) => (
                    <Link key={game.id} href={`${handler}${tenantSlug}.${ROOT_DOMAIN}/games/${game.slug}`} target="_blank" rel="noopener noreferrer">
                        <GamePublicCard game={game}/>
                    </Link>
                  ))}
                </CardContent>
              </Card>
            ))}
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
