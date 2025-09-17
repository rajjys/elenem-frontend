"use client";
import React, { useCallback, useEffect, useState } from "react";
import { Trophy, Users2, CalendarDays, ShieldCheck, Rocket, Star, ArrowRight,
  Smartphone, Building2, Globe2, ExternalLink, Gamepad2, Network, BookOpen, Terminal
} from "lucide-react";
import { api } from '@/services/api';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAudienceStore } from "@/store/audience.store";
import { useRouter } from "next/navigation";
import { GameDetails, PublicTenantBasic } from "@/schemas";
import { capitalizeFirst, countryNameToCode, formatDateFr } from "@/utils";
import { Skeleton } from "@/components/ui";
import GeneralSearchDialog from "@/components/ui/generalSearchDialog";
import axios from "axios";
import Link from "next/link";
import Image from "next/image";

const features = [
  { icon: <CalendarDays className="w-5 h-5 text-blue-500"/>, title: "Planification Intelligente", desc: "Vérifications automatiques des conflits, dates d'interdiction et lieux." },
  { icon: <Users2 className="w-5 h-5 text-blue-500"/>, title: "Effectif et Éligibilité", desc: "Fiches de joueurs, transferts, suspensions, limites d'âge." },
  { icon: <ShieldCheck className="w-5 h-5 text-blue-500"/>, title: "Fair-play", desc: "Affectations des arbitres, rapports de match, flux de travail disciplinaires." },
  { icon: <Globe2 className="w-5 h-5 text-blue-500"/>, title: "Multi-Locataire", desc: "Sous-domaines de marque avec domaines personnalisés plus tard." },
  { icon: <Network className="w-5 h-5 text-blue-500"/>, title: "API Prioritaire", desc: "API JSON claires et webhooks pour l'intégration." },
  { icon: <Smartphone className="w-5 h-5 text-blue-500"/>, title: "UX Natif Mobile", desc: "Navigation rapide et adaptée aux pouces pour les fans." },
];

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-xs rounded-full px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
      {children}
    </span>
  );
}

// --------------------------------------------------
// Composant principal de la page
// --------------------------------------------------
export default function PublicLandingPage() {

  const router = useRouter();
  const [games, setGames] = useState<GameDetails[]>([]);
  const [tenants, setTenants] = useState<PublicTenantBasic[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [Motion, setMotion] = React.useState<any>(null);

  useEffect(() => {
    import("framer-motion").then((mod) => setMotion(mod));
  }, []);
  const isFan = useAudienceStore((state) => state.isFan);
  

  const heroCopy = isFan
    ? {
        eyebrow: "Trouvez votre ligue",
        title: "Scores, calendriers et classements — tout en un seul endroit",
        desc: "Recherchez par Ligue, équipe ou ville pour accéder directement à l'action. Chaque ligue dispose d'un site dédié avec des données en direct.",
        primary: "Parcourir les matchs",
        secondary: "Trouver ma ligue",
        primaryLink: "/games",
        secondaryLink: "/tenants"
      }
    : {
        eyebrow: "Pour les organisateurs",
        title: "Gérez votre ligue comme un pro",
        desc: "Système d'exploitation de ligue tout-en-un : calendrier, effectifs, officiels, résultats, médias et un site Web de marque pour chaque ligue.",
        primary: "Voir les fonctionnalités",
        secondary: "Commencer gratuitement",
        primaryLink: "/features",
        secondaryLink: "/get-started"
      };

      useEffect(() => {
        const fetchGames = async () => {
            //setLoading(true);
            try {
              // Fetch and process games
              const gamesResponse = await api.get<GameDetails[]>(`/public-games/search`, {
                params: { take: 3 },
              });
              const fetchedGames = gamesResponse.data;
        
              setGames(fetchedGames);
              
            } catch (error) {
              //setError('Failed to fetch data');
              console.error("Failed to fetch games:", error);
              setGames([]);
            } finally {
              //setLoading(false);
            }
          };
          fetchGames();
      },[])
      const fetchTenants = useCallback(async (currentFilters: { search?: string, sportType?: string, country?: string, take?: number, pageSize?: number }) => {
          //setIsLoading(true);
          try {
            const params = { ...currentFilters };
            params.pageSize = 4;
            const tenantsResponse = await api.get<{ data: PublicTenantBasic[] }>('/public-tenants', { params });
            setTenants(tenantsResponse.data.data);
          } catch (error) {
            let errorMessage = "Failed to fetch Tenants.";
            if (axios.isAxiosError(error)) {
              errorMessage = error.response?.data?.message || errorMessage;
            }
            //toast.error(errorMessage);
            console.log(errorMessage)
          } finally {
            //setIsLoading(false);
          }
        }, []);
      
        useEffect(() => {
          const filters: { search?: string, sportType?: string, country?: string, take?: number } = { take: 4};
          fetchTenants(filters);
        }, [fetchTenants]); 
  if (!Motion) return null;  
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200">
      {/* Héros */}
      <section className="relative">
        <div className="mx-auto max-w-7xl px-4 pt-10 pb-8 md:pt-14 md:pb-12">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            {/* Texte */}
            <Motion.motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
              <div className="flex items-center gap-2 mb-3">
                <Pill>{heroCopy.eyebrow}</Pill>
                <Badge variant="secondary" className="rounded-full bg-amber-100 text-amber-900 dark:bg-amber-900/70 dark:text-amber-200 border-none">Multi-locataire</Badge>
              </div>
              <h1 className="text-3xl md:text-5xl font-semibold tracking-tight leading-tight text-black dark:text-white">
                {heroCopy.title}
              </h1>
              <p className="mt-4 text-slate-600 dark:text-slate-400 max-w-prose">
                {heroCopy.desc}
              </p>

              {/* CTAs selon l'audience */}
              <div className="mt-6 flex flex-wrap gap-3">
                <Button size="lg" variant="primary" className="" onClick={() => router.push(heroCopy.primaryLink)}>
                  {heroCopy.primary} <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
                <Button size="lg" variant="outline" onClick={() => router.push(heroCopy.secondaryLink)}
                className="rounded-2xl border-slate-300 dark:border-slate-700 hover:bg-slate-200/50 dark:hover:bg-slate-800">
                  {heroCopy.secondary}
                </Button>
              </div>
              {/* Recherche */}
              {/* Recherche */}
              <div className="mt-6">
                <label className="text-xs uppercase tracking-wider text-slate-500">Recherche rapide</label>
                <div className="mt-2 flex items-center gap-2">
                  <GeneralSearchDialog />
                </div>
                <div className="mt-2 text-xs text-slate-500">Astuce : les ligues obtiennent un sous-domaine. Domaines personnalisés pris en charge.</div>
              </div>

              {/* Signaux de confiance */}
              <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-slate-500">
                <Trophy className="w-4 h-4 text-blue-500" /> Approuvé par les associations régionales
                <Star className="w-4 h-4 text-blue-500" /> SLA de disponibilité de 99,9 %
                <Rocket className="w-4 h-4 text-orange-500" /> Lancez un site en quelques minutes
              </div>
            </Motion.motion.div>

            {/* Carte de mise en avant (selon l'audience) */}
            <Motion.motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.05 }}>
              <Card className="rounded-2xl overflow-hidden shadow-2xl shadow-blue-900/10 border border-slate-200/80 dark:border-slate-800/80">
                <CardHeader className="border-b border-slate-200/70 dark:border-slate-800 text-gray-700">
                  <CardTitle className="flex items-center gap-2 text-base">
                    {isFan ? <Gamepad2 className="w-5 h-5 text-blue-500"/> : <Building2 className="w-5 h-5 text-blue-500"/>}
                    {isFan ? "Matchs populaires" : "Gérez votre ligue"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0 text-gray-800">
                    {isFan ? (
                      <div className="divide-y divide-slate-200/70 dark:divide-slate-800">
                        {games.length === 0 ? (
                          // Skeleton loader for 3 games
                          Array.from({ length: 3 }).map((_, i) => (
                            <div key={`skeleton-${i}`} className="p-4 flex items-center justify-between">
                              <div className="flex flex-col gap-2">
                                <Skeleton className="h-4 w-40" />
                                <Pill><Skeleton className="h-3 w-32" /></Pill>
                              </div>
                              <Skeleton className="h-3 w-20" />
                            </div>
                          ))
                        ) : (
                          games.map((g) => (
                            <Link href={`${g.tenant.businessProfile?.website || `https://${g.tenant.tenantCode}.elenem.site`}/games/${g.league.slug}/${g.slug}`} key={g.id} className="block">
                              <div
                                key={g.id}
                                className="p-4 flex items-center justify-between hover:bg-slate-100/60 dark:hover:bg-slate-300/40 transition-colors duration-300 ease-in-out"
                              >
                                <div>
                                  <div className="font-medium">
                                    {g.homeTeam.name} vs {g.awayTeam.name}
                                  </div>
                                  <div className="text-xs text-slate-600 rounded-full pt-1">
                                    <Pill>{capitalizeFirst(g.tenant.tenantCode)}</Pill> • <span>Freedom Stadium</span>
                                  </div>
                                </div>
                                <div className="text-sm text-slate-600 dark:text-slate-700">
                                  {formatDateFr(g.dateTime)}
                                </div>
                              </div>
                            </Link>
                          ))
                        )}
                        <div className="p-4 text-sm text-right">
                          <Link className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline" href="/games">
                            Voir le calendrier complet <ArrowRight className="w-4 h-4" />
                          </Link>
                        </div>
                      </div>
                    ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4">
                      {features.slice(0,4).map((f, i) => (
                        <div key={i} className="flex gap-3">
                          <div className="shrink-0 mt-1">{f.icon}</div>
                          <div>
                            <div className="font-medium">{f.title}</div>
                            <div className="text-sm text-slate-500">{f.desc}</div>
                          </div>
                        </div>
                      ))}
                      <div className="col-span-full text-sm text-right">
                        <a className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline" href="#features">Explorer toutes les fonctionnalités <ArrowRight className="w-4 h-4"/></a>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </Motion.motion.div>
          </div>
        </div>

        {/* Ruban "Propulsé par" */}
        <div className="absolute left-0 -bottom-3 md:-bottom-4 w-full">
          <div className="mx-auto max-w-7xl px-4">
            <div className="rounded-2xl md:rounded-3xl border border-dashed border-blue-200 dark:border-blue-800/50 bg-blue-50/30 dark:bg-blue-950/20 p-3 md:p-4 text-xs flex items-center justify-between">
              <span className="text-slate-600 dark:text-slate-400">Chaque site de ligue est « Propulsé par Elenem Leagues ».</span>
              <a href="/features" className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline">
                En savoir plus sur le logiciel <ExternalLink className="w-3.5 h-3.5"/>
              </a>
            </div>
          </div>
        </div>
      </section>
      {/* Teaser de l'annuaire des ligues */}
      <section id="tenants" className="mx-auto max-w-7xl px-4 pt-12 md:pt-16">
        <div className="flex items-end justify-between mb-4">
          <h2 className="text-xl md:text-2xl font-semibold tracking-tight">Ligues sur Elenem</h2>
          <a className="text-sm text-blue-600 dark:text-blue-400 hover:underline" href="/tenants">Parcourir l&apos;annuaire</a>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {tenants.map((t) => {
            const ROOT_DOMAIN = process.env.NODE_ENV === 'development' ? 
                        process.env.NEXT_PUBLIC_HOME_URL_LOCAL : process.env.NEXT_PUBLIC_HOME_URL;
            const protocol = process.env.NODE_ENV === 'development' ? 'http://' : 'https://';
            const tenantUrl = t.businessProfile.website || `${protocol}${t.slug}.${ROOT_DOMAIN}`;
            return <Link key={t.id} href={tenantUrl} className="block" >
              <Card className="rounded-2xl bg-white dark:bg-slate-900 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    {t.businessProfile.logoAsset?.url ? (
                      <div className="relative w-10 h-10 rounded-xl overflow-hidden">
                        <Image
                          src={t.businessProfile.logoAsset.url}
                          alt={`${t.name} logo`}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 to-amber-500" />
                    )}
                    <div>
                      <div className="font-medium leading-tight">{t.name}</div>
                      <div className="text-xs text-slate-500">
                        {countryNameToCode[t.country]} • {capitalizeFirst(t.sportType)}
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 text-xs text-slate-500 flex items-center">
                    <span>
                      {tenantUrl}
                    </span>
                    <ExternalLink className="ml-1 w-3.5 h-3.5" />
                  </div>
                </CardContent>
              </Card>
            </Link>
            })}
        </div>
      </section>
      {/* Bandeau des fonctionnalités du produit */}
      <section id="features" className="mx-auto max-w-7xl px-4 pt-12 md:pt-16">
        <div className="flex items-end justify-between mb-4">
          <h2 className="text-xl md:text-2xl font-semibold tracking-tight">Pourquoi les ligues nous choisissent</h2>
          <a className="text-sm text-blue-600 dark:text-blue-400 hover:underline" href="/features">Voir le produit</a>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f, i) => (
            <Card key={i} className="rounded-2xl bg-white dark:bg-slate-900">
              <CardContent className="p-4 flex gap-3">
                <div className="mt-1">{f.icon}</div>
                <div>
                  <div className="font-medium">{f.title}</div>
                  <div className="text-sm text-slate-500">{f.desc}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Teaser des tarifs */}
      <section id="pricing" className="mx-auto max-w-7xl px-4 pt-12 md:pt-16">
        <div className="rounded-3xl border border-blue-200 dark:border-slate-800 p-6 md:p-8 bg-gradient-to-br from-blue-50/50 to-amber-50/50 dark:from-slate-950 dark:to-amber-950/20">
          <div className="grid md:grid-cols-3 gap-6 items-center">
            <div className="md:col-span-2">
              <h3 className="text-lg md:text-xl font-semibold">Tarification simple et transparente</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 max-w-prose mt-1">
                Commencez gratuitement. Mettez à niveau lorsque vous avez besoin de domaines personnalisés, de flux de travail avancés ou de limites d&apos;API plus élevées. Réductions pour les fédérations et les programmes pour jeunes.
              </p>
            </div>
            <div className="flex md:justify-end gap-3">
              <Button className="rounded-2xl bg-blue-600 text-white hover:bg-blue-700" variant="primary">Comparer les plans</Button>
              <Button variant="outline" className="rounded-2xl bg-white/50 dark:bg-slate-900/50 border-slate-300 dark:border-slate-700">Parler aux ventes</Button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Développeur / Docs */}
      <section id="api" className="mx-auto max-w-7xl px-4 py-12 md:py-16">
        <Card className="rounded-3xl overflow-hidden bg-white dark:bg-slate-900">
          <CardContent className="p-6 md:p-8 grid md:grid-cols-2 gap-6 items-center">
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                <Terminal className="w-4 h-4 text-blue-500"/> API & Webhooks
              </div>
              <h3 className="text-lg md:text-xl font-semibold">Développez sur la plateforme Elenem</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 max-w-prose mt-1">
                Accédez aux rencontres, classements, joueurs et médias avec des API REST claires. Mises à jour en temps réel via webhooks. SDK pour TypeScript et Python.
              </p>
              <div className="mt-4 flex gap-3">
                <Button className="rounded-2xl bg-blue-600 text-white hover:bg-blue-700" variant="primary">Obtenir une clé API</Button>
                <Button variant="outline" className="rounded-2xl border-slate-300 dark:border-slate-700">
                  <Link href="#docs" className="flex items-center"><BookOpen className="mr-2 w-4 h-4"/> Lire la documentation</Link>
                </Button>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4 bg-slate-100/70 dark:bg-slate-900/70">
              <pre className="text-xs overflow-auto leading-relaxed text-slate-700 dark:text-slate-300">
                {`GET /v1/tenants/{tenantId}/games?date=today
                200 OK
                {
                "games": [
                    { "home": "Volcans", "away": "Cité du Lac", "startsAt": "2025-08-31T16:30:00Z" }
                ]
                }`}
              </pre>
            </div>
          </CardContent>
        </Card>
      </section>
      {/* Barre de navigation inférieure mobile */}
      <div className="fixed md:hidden bottom-3 left-0 right-0">
        <div className="mx-auto max-w-md px-4">
          <div className="rounded-2xl shadow-lg bg-white/80 dark:bg-slate-900/80 backdrop-blur border border-slate-200 dark:border-slate-800 flex justify-around py-2 text-xs">
            <Link href="/games" className="flex flex-col items-center gap-1 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"><CalendarDays className="w-4 h-4"/>Matchs</Link>
            <Link href="/tenants" className="flex flex-col items-center gap-1 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"><Users2 className="w-4 h-4"/>Ligues</Link>
            <Link href="/features" className="flex flex-col items-center gap-1 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"><ShieldCheck className="w-4 h-4"/>Fonctionnalités</Link>
            <Link href="/pricing" className="flex flex-col items-center gap-1 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"><Trophy className="w-4 h-4"/>Tarifs</Link>
          </div>
        </div>
      </div>
    </div>
  );
}