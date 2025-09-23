'use client'
import React, { useEffect } from "react";
import { motion } from "framer-motion";
import { Users2, CalendarDays, ShieldCheck, Smartphone, Globe2, Network, Layers, ChartBar, Phone } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { useAuthStore } from "@/store/auth.store";

// --------------------------------------------------
// Données de démonstration (à remplacer plus tard)
// --------------------------------------------------
const features = [
  { icon: <CalendarDays className="w-6 h-6"/>, title: "Planification intelligente", desc: "Calendrier automatique, gestion des conflits et disponibilité des terrains." },
  { icon: <Users2 className="w-6 h-6"/>, title: "Gestion des effectifs", desc: "Licences, transferts, suspensions et suivi des joueurs." },
  { icon: <ShieldCheck className="w-6 h-6"/>, title: "Fair-play et discipline", desc: "Désignation des arbitres, rapports de matchs et sanctions disciplinaires." },
  { icon: <Globe2 className="w-6 h-6"/>, title: "Sites dédiés par ligue", desc: "Chaque organisation obtient un sous-domaine personnalisé, avec possibilité de nom de domaine pro." },
  { icon: <Network className="w-6 h-6"/>, title: "API et intégrations", desc: "Accès aux données en temps réel via API et webhooks pour vos applications." },
  { icon: <Smartphone className="w-6 h-6"/>, title: "Expérience mobile", desc: "Une interface optimisée pour les supporters sur smartphones." },
  { icon: <Layers className="w-6 h-6"/>, title: "Multi-compétitions", desc: "Support de plusieurs ligues, divisions et saisons simultanément." },
  { icon: <ChartBar className="w-6 h-6"/>, title: "Statistiques avancées", desc: "Analyse des performances des équipes, joueurs et compétitions." },
];

// --------------------------------------------------
// Composant principal
// --------------------------------------------------
export default function FeaturesPage() {

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [Motion, setMotion] = React.useState<any>(null);
    const { user: userAuth } = useAuthStore()
    const getStartedCTALink = userAuth ? '/welcome' : '/register'
    useEffect(() => {
        import("framer-motion").then((mod) => setMotion(mod));
      }, []);
    if (!Motion) return null;  

  return (
    <div className="min-h-screen bg-white text-zinc-900 dark:bg-slate-900 dark:text-slate-100">
      {/* Hero section */}
      <section className="relative border-b border-slate-200 dark:border-slate-700">
        <div className="mx-auto max-w-7xl px-4 pt-12 pb-16 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-4xl md:text-5xl font-bold"
          >
            Fonctionnalités principales
          </motion.h1>
          <p className="mt-4 text-lg text-zinc-600 dark:text-slate-400 max-w-2xl mx-auto">
            Elenem est conçu pour simplifier la gestion des ligues et offrir une expérience moderne aux supporters.
          </p>
        </div>
      </section>
    
      {/* Features grid */}
      <section className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
            >
              <Card className="rounded-2xl h-full bg-white dark:bg-slate-800">
                <CardContent className="p-6 flex flex-col items-start gap-3">
                  <div className="p-3 rounded-xl bg-sky-50 text-sky-600 dark:bg-sky-900/30 dark:text-sky-300">
                    {f.icon}
                  </div>
                  <h3 className="font-semibold text-lg">{f.title}</h3>
                  <p className="text-sm text-zinc-600 dark:text-slate-400">{f.desc}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>
        
      {/* CTA section */}
      <section className="mx-auto max-w-7xl px-4 py-16 text-center">
        <h2 className="text-2xl md:text-3xl font-semibold">
          Prêt à gérer votre ligue avec intelligence ?
        </h2>
        <p className="mt-2 text-zinc-600 dark:text-slate-400 max-w-xl mx-auto">
          Découvrez comment Elenem peut transformer la gestion de votre organisation sportive.
        </p>
        <div className="mt-6 flex justify-center gap-4">
          <Link
            href={getStartedCTALink}
            className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-500 ease-in-out"
          >
            Commencer gratuitement
          </Link>
          <Link
            href="/contact-us"
            className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md text-blue-700 border border-blue-600 bg-transparent hover:bg-blue-50 dark:text-blue-300 dark:border-blue-500 dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-500 ease-in-out"
          >
            <Phone className="mr-2 w-4 h-4" />
            Parler avec l’équipe
          </Link>
        </div>
      </section>
    </div>
);

}
