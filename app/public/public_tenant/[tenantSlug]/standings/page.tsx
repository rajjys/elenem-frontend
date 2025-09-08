"use client";

import React, { useEffect, useState, use } from "react";
import { api } from "@/services/api";
import { Card, CardContent, CardTitle } from "@/components/ui";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import StandingsTable from "@/components/public/standings-table";
import { Skeleton } from "@/components/ui/skeleton";
import { Gender } from "@/schemas";

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
}

interface PublicTenantDetails {
  id: string;
  slug: string;
  name: string;
  logoUrl?: string | null;
  leagues: {
    id: string;
    name: string;
    slug: string;
    parentLeagueId: string | null;
  }[];
}

const TenantStandingsPage = ({ params }: { params: Promise<{ tenantSlug: string }> }) => {
  const { tenantSlug } = use(params);
  const [tenant, setTenant] = useState<PublicTenantDetails | null>(null);
  const [mainLeagues, setMainLeagues] = useState<{ id: string; name: string; slug: string; division: string; gender: Gender}[]>([]);
  const [selectedLeagueSlug, setSelectedLeagueSlug] = useState<string | null>(null);
  const [standings, setStandings] = useState<Standing[]>([]);
  const [loadingTenant, setLoadingTenant] = useState(true);
  const [loadingStandings, setLoadingStandings] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTenant = async () => {
      if (!tenantSlug) return;
      setLoadingTenant(true);
      try {
        const response = await api.get(`/public-tenants/${tenantSlug}`);
        const tenantData = response.data;
        setTenant(tenantData);

        const leagues = tenantData.leagues
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .sort((a: any, b: any) => {
            if (a.parentLeagueId === null && b.parentLeagueId !== null) return -1;
            if (a.parentLeagueId !== null && b.parentLeagueId === null) return 1;
            return 0;
          })
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .map((league: any) => ({
            id: league.id,
            name: league.name,
            slug: league.slug,
            division: league.division,
            gender: league.gender,
          }));

        setMainLeagues(leagues);
        if (leagues.length > 0) {
          setSelectedLeagueSlug(leagues[0].slug);
        }
      } catch (err) {
        console.error("Failed to fetch tenant:", err);
        setError("Erreur lors du chargement du tenant.");
      } finally {
        setLoadingTenant(false);
      }
    };

    fetchTenant();
  }, [tenantSlug]);

  useEffect(() => {
    const fetchStandings = async () => {
      if (!selectedLeagueSlug) {
        setStandings([]);
        return;
      }

      setLoadingStandings(true);
      try {
        const response = await api.get(`/public-games/standings/${selectedLeagueSlug}`);
        setStandings(response.data);
      } catch (err) {
        console.error("Failed to fetch standings:", err);
        setStandings([]);
      } finally {
        setLoadingStandings(false);
      }
    };

    fetchStandings();
  }, [selectedLeagueSlug]);

  if (loadingTenant) {
    return (
      <div className="p-8 space-y-4">
        <Skeleton className="h-12 w-1/2" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-red text-xl">{error}</p>
      </div>
    );
  }

  return (
    <div className="py-8 px-4 md:px-16">
      <Card className="max-w-3xl mx-auto">
        <CardTitle className="text-center text-2xl font-bold py-4">
          Classements {tenant?.name}
        </CardTitle>
        <CardContent>
          {mainLeagues.length > 0 ? (
            <Tabs value={selectedLeagueSlug || ""} onValueChange={setSelectedLeagueSlug}>
              <TabsList className="flex justify-between items-center flex-wrap gap-2">
                {mainLeagues.map((league) => (
                  <TabsTrigger key={league.id} value={league.slug}>
                    {league.division} - {league.gender === Gender.MALE ? 'M' : league.gender === Gender.FEMALE ? 'F' : 'X'}
                  </TabsTrigger>
                ))}
              </TabsList>
              {mainLeagues.map((league) => (
                <TabsContent key={league.id} value={league.slug} className="mt-6">
                  <StandingsTable standings={standings} isLoading={loadingStandings} />
                </TabsContent>
              ))}
            </Tabs>
          ) : (
            <div className="text-center py-16">
              <h3 className="text-xl font-semibold">Pas de Classements Disponibles</h3>
              <p className="mt-2 text-muted-foreground">Aucun classement n&apos;est disponible pour le moment.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TenantStandingsPage;
