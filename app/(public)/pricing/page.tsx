import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check } from "lucide-react";

const plans = [
  {
    name: "Gratuit",
    price: "0 $",
    tagline: "Commencer gratuitement",
    features: [
      "Site web PWA (sous-domaine .elenem.app)",
      "Calendrier et matchs de base",
      "Pages équipes, joueurs, résultats",
      "Bandeau 'Propulsé par Elenem'",
      "Jusqu’à 10 équipes / 1 saison active"
    ],
    cta: "Commencer",
    highlight: false,
  },
  {
    name: "Pro",
    price: "50 $ / mois",
    tagline: "Pour ligues régionales et semi-pro",
    features: [
      "Nom de domaine personnalisé (SSL inclus)",
      "Branding (logo et couleurs)",
      "PWA complète avec notifications push",
      "Gestion avancée (effectifs, suspensions, transferts)",
      "Support standard par email"
    ],
    cta: "Démarrer l’essai",
    highlight: true,
  },
  {
    name: "Élite",
    price: "250 $ / mois",
    tagline: "Pour divisions nationales",
    features: [
      "Accès à l’application mobile Elenem (multi-ligues)",
      "Statistiques avancées et rapports d’arbitrage",
      "Gestion multi-saisons et divisions",
      "Support prioritaire (48h SLA)",
      "Toutes les fonctionnalités Pro incluses"
    ],
    cta: "Contactez-nous",
    highlight: false,
  },
  {
    name: "Fédération",
    price: "Sur devis",
    tagline: "Pour fédérations nationales et grandes ligues",
    features: [
      "Application mobile marque blanche (App Store / Play Store)",
      "Hébergement et infrastructure dédiée",
      "API illimitée et intégrations avancées",
      "Support premium avec compte dédié",
      "Formation staff incluse"
    ],
    cta: "Parler aux ventes",
    highlight: false,
  }
];

const faqs = [
  {
    q: "Puis-je vraiment commencer gratuitement ?",
    a: "Oui, le plan gratuit permet de tester la plateforme sans frais, limité à une petite ligue. Idéal pour démarrer et découvrir Elenem."
  },
  {
    q: "Puis-je utiliser mon propre nom de domaine ?",
    a: "À partir du plan Pro, vous pouvez connecter votre domaine personnalisé avec certificat SSL inclus."
  },
  {
    q: "Les applications mobiles sont-elles incluses ?",
    a: "Les notifications push sont incluses dans Pro. L’application Elenem globale est incluse dans Élite. La version marque blanche est disponible au plan Fédération."
  },
  {
    q: "Comment fonctionne le support technique ?",
    a: "Support email inclus pour Pro, support prioritaire pour Élite, et support premium dédié pour Fédération."
  },
  {
    q: "Y a-t-il des frais cachés ?",
    a: "Non, la tarification est transparente. Seuls les frais liés aux intégrations tierces éventuelles (paiements, vidéo) peuvent s’ajouter."
  }
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-white text-zinc-900">
      {/* Hero */}
      <section className="mx-auto max-w-5xl px-4 pt-12 md:pt-20 text-center">
        <h1 className="text-3xl md:text-5xl font-semibold tracking-tight leading-tight">
          Tarifs simples et transparents
        </h1>
        <p className="mt-4 text-zinc-600 max-w-2xl mx-auto">
          Commencez gratuitement, puis évoluez vers les plans Pro, Élite ou Fédération selon vos besoins. Conçu pour les ligues de toutes tailles.
        </p>
      </section>

      {/* Pricing grid */}
      <section className="mx-auto max-w-6xl px-4 pt-12 md:pt-16 pb-20">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan, i) => (
            <Card key={i} className={`rounded-3xl flex flex-col ${plan.highlight ? "border-2 border-indigo-500" : ""}`}>
              <CardHeader>
                <CardTitle className="text-lg font-semibold">{plan.name}</CardTitle>
                <div className="text-2xl font-bold mt-2">{plan.price}</div>
                <p className="text-sm text-zinc-500 mt-1">{plan.tagline}</p>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col justify-between">
                <ul className="space-y-2 mb-6 text-sm">
                  {plan.features.map((f, j) => (
                    <li key={j} className="flex gap-2 items-start">
                      <Check className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Button className="rounded-full w-full">{plan.cta}</Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-4xl px-4 pt-12 md:pt-16 pb-20">
        <h2 className="text-2xl font-semibold text-center mb-8">Questions fréquentes</h2>
        <div className="space-y-6">
          {faqs.map((f, i) => (
            <div key={i} className="border-b border-gray-200 pb-4">
              <h3 className="font-medium">{f.q}</h3>
              <p className="text-sm text-zinc-600 mt-1">{f.a}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
