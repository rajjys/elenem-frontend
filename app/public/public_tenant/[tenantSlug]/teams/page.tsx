// app/(public)/teams/page.tsx
"use client";

import React, { useState, useEffect, useCallback, use } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/services/api";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowRight } from "lucide-react";
import Image from "next/image";
import { LeagueDetails, PaginatedLeaguesResponseDto, TeamDetails } from "@/schemas";

export default function PublicTeamsPage({ params }: { params: Promise<{ tenantSlug: string }> }) {
  const { tenantSlug } = use(params);

  const [teams, setTeams] = useState<TeamDetails[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedLeague, setSelectedLeague] = useState<string | undefined>();
  const [leagues, setLeagues] = useState<LeagueDetails[]>([]);

  // fetch leagues for dropdown
  const fetchLeagues = useCallback(async () => {
    try {
      const res = await api.get<PaginatedLeaguesResponseDto>("/public-leagues", { params: { tenantSlug } });
      const sortedLeagues = res.data.data.sort((a: LeagueDetails, b: LeagueDetails) => {
            if (a.parentLeagueId === null && b.parentLeagueId !== null) return -1;
            if (a.parentLeagueId !== null && b.parentLeagueId === null) return 1;
            return 0;
        })
      setLeagues(sortedLeagues);
    } catch (err) {
      console.error(err);
      //toast.error("Impossible de charger les ligues.");
    }
  }, [tenantSlug]);
  // fetch teams
  const fetchTeams = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/public-teams", {
        params: {
          tenantSlug,
          q: search || undefined,
          leagueSlug: selectedLeague || undefined,
        },
      });
      setTeams(res.data.data);
    } catch (err) {
      console.error(err);
      //toast.error("Impossible de charger les équipes.");
    } finally {
      setLoading(false);
    }
  }, [tenantSlug, search, selectedLeague]);

  useEffect(() => {
    fetchLeagues();
  }, [fetchLeagues]);

  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  return (
    <div className="min-h-screen max-w-6xl mx-auto">
      <div className="container mx-auto p-4 sm:p-6 space-y-8">
        <header>
          <h1 className="text-2xl font-bold tracking-tight text-gray-800">
            Équipes
          </h1>
          <p className="mt-2 text-md text-gray-500">
            Explorez les équipes affiliées.
          </p>
        </header>
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-grow">
            <Input
              placeholder="Rechercher une équipe..."
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full py-2 pl-10 rounded-full border border-gray-300"
            />
          </div>
          <Select
            value={selectedLeague}
            onValueChange={(val) => setSelectedLeague(val === "all" ? undefined : val)}
          >
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Filtrer par ligue" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les ligues</SelectItem>
              {leagues.map((league) => (
                <SelectItem key={league.slug} value={league.slug}>
                  {league.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {/* Teams List */}
        {loading ? (
          <div className="grid gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <CardHeader>
                  <Skeleton className="h-6 w-1/3" />
                </CardHeader>
                <CardContent className="flex items-center gap-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <Skeleton className="h-6 w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : teams.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {teams.map((team) => (
              <Link href={`/teams/${team.league.slug}/${team.slug}`} key={team.slug}>
                <Card key={team.slug} className="overflow-hidden hover:shadow-md transition bg-gray-200 hover:bg-gray-50">
                  <CardContent className="flex items-center justify-between p-3">
                    <div className="flex items-center gap-4">
                      {team.businessProfile?.logoAsset?.url ? (
                        <Image
                          src={team.businessProfile.logoAsset.url}
                          alt={team.name}
                          height={30}
                          width={30}
                          className="h-8 w-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-gray-300" />
                      )}
                      <div>
                        <h3 className="font-semibold">{team.name}</h3>
                        <p className="text-sm text-gray-500">{team.shortCode}</p>
                      </div>
                    </div>
                    <div>
                      <ArrowRight className="h-4 w-4 text-gray-600" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
              
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-lg border">
            <h3 className="text-xl font-semibold">Aucune équipe trouvée</h3>
            <p className="text-muted-foreground mt-2">
              Essayez de modifier vos filtres ou votre recherche.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
