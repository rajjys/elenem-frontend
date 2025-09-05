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
import { LeagueBasic, PaginatedLeaguesResponseDto } from "@/schemas";

interface Team {
  name: string;
  shortName: string;
  slug: string;
  businessProfile?: {
    logoUrl?: string | null;
  };
}

export default function PublicTeamsPage({ params }: { params: Promise<{ tenantSlug: string }> }) {
  const { tenantSlug } = use(params);

  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedLeague, setSelectedLeague] = useState<string | undefined>();
  const [leagues, setLeagues] = useState<LeagueBasic[]>([]);

  // fetch leagues for dropdown
  const fetchLeagues = useCallback(async () => {
    try {
      const res = await api.get<PaginatedLeaguesResponseDto>("/public-leagues", { params: { tenantSlug } });
      setLeagues(res.data.data);
    } catch (err) {
      console.error(err);
      //toast.error("Impossible de charger les ligues.");
    }
  }, [tenantSlug]);
  // fetch teams
  const fetchTeams = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<{data: Team[]}>("/public-teams", {
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
    <div className="min-h-screen max-w-3xl mx-auto">
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
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <Input
            placeholder="Rechercher une équipe..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
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
          <div className="grid gap-4">
            {teams.map((team) => (
              <Card key={team.slug} className="overflow-hidden hover:shadow-md transition">
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-4">
                    {team.businessProfile?.logoUrl ? (
                      <Image
                        src={team.businessProfile.logoUrl}
                        alt={team.name}
                        height={30}
                        width={30}
                        className="h-12 w-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-full bg-gray-200" />
                    )}
                    <div>
                      <h3 className="font-semibold">{team.name}</h3>
                      <p className="text-sm text-gray-500">{team.shortName}</p>
                    </div>
                  </div>
                  <Link href={`/teams/${team.slug}`}>
                    <ArrowRight className="text-gray-500 hover:text-gray-800" />
                  </Link>
                </CardContent>
              </Card>
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
