"use client";
import { useEffect, useState } from "react";

type Locale = 'en' | 'fr';

const DEFAULT: Locale = 'en';

const translations: Record<Locale, Record<string, string | string[]>> = {
  en: {
    'nav.home': 'Home',
    'nav.games': 'Games',
    'nav.tenants': 'Organisations',
    'nav.features': 'Product',
    'nav.plans': 'Plans',
    'nav.api': 'API',
    'nav.docs': 'Docs',
    'header.login': 'Sign in',

    'hero.eyebrow': 'For league organisers',
    'hero.title': 'Run your sports league without chaos',
    'hero.desc': 'Replace WhatsApp, spreadsheets and paper with one official system for schedules, standings and disputes.',
    'hero.primary': 'Book a demo',
    'hero.secondary': 'Start your league',

    'pain.title': 'Operational pain we solve',
    'pain.items': [
      'Paper or PDF calendars',
      'Manual standings and spreadsheets',
      'Frequent disputes after matchdays',
      'Fans left uninformed',
      'Relying on Facebook / WhatsApp only'
    ],

    'solution.title': 'One official system for your league',
    'solution.desc': 'Elenem centralises scheduling, match reports, standings and communications so your organisers focus on the game, not the admin.',

    'how.title': 'How it works',
    'how.steps': [
      'Create your league and upload teams',
      'Automated schedule generation and conflict checks',
      'Publish official results and resolve disputes'
    ],

    'trust.title': 'Trusted by early leagues and admins',
    'pricing.title': 'Plans preview',
    'pricing.desc': 'Simple tiers: Basic, Pro, Federation. Start small and scale with custom domains and workflows.',

    'final.cta': 'Start your league — Book a demo',
  },
  fr: {
    'nav.home': 'Accueil',
    'nav.games': 'Matchs',
    'nav.tenants': 'Organisations',
    'nav.features': 'Logiciel',
    'nav.plans': 'Plans',
    'nav.api': 'API',
    'nav.docs': 'Docs',
    'header.login': 'Se connecter',

    'hero.eyebrow': 'Pour les organisateurs',
    'hero.title': 'Gérez votre ligue sans chaos',
    'hero.desc': "Remplacez WhatsApp, tableurs et papier par un système officiel pour calendriers, classements et litiges.",
    'hero.primary': 'Réserver une démo',
    'hero.secondary': 'Démarrer la ligue',

    'pain.title': 'Problèmes opérationnels que nous résolvons',
    'pain.items': [
      'Calendriers papier ou PDF',
      'Classements manuels et tableurs',
      'Litiges fréquents après les journées',
      'Supporters mal informés',
      'Dépendance à Facebook / WhatsApp'
    ],

    'solution.title': "Un système officiel pour votre ligue",
    'solution.desc': "Elenem centralise planning, rapports de match, classements et communications pour que les organisateurs se concentrent sur le jeu.",

    'how.title': 'Comment ça marche',
    'how.steps': [
      'Créez votre ligue et importez les équipes',
      'Génération automatique du calendrier et vérifications de conflit',
      'Publiez les résultats officiels et gérez les litiges'
    ],

    'trust.title': 'Adopté par des ligues pilotes et responsables',
    'pricing.title': 'Aperçu des plans',
    'pricing.desc': "Tiers simples : Basic, Pro, Federation. Commencez petit et montez en charge avec domaines et workflows personnalisés.",

    'final.cta': 'Démarrer la ligue — Réserver une démo',
  }
};

export function getBrowserLocale(): Locale {
  if (typeof navigator === 'undefined') return DEFAULT;
  const nav = navigator.language || (navigator as any).userLanguage || DEFAULT;
  if (nav.startsWith('fr')) return 'fr';
  return 'en';
}

export default function useI18n() {
  const [locale, setLocale] = useState<Locale>(DEFAULT);

  useEffect(() => {
    const stored = typeof localStorage !== 'undefined' ? localStorage.getItem('elenem_locale') as Locale | null : null;
    if (stored) setLocale(stored);
    else setLocale(getBrowserLocale());
  }, []);

  useEffect(() => {
    if (typeof localStorage !== 'undefined') localStorage.setItem('elenem_locale', locale);
  }, [locale]);

  const t = (key: string) => {
    const value = translations[locale]?.[key];
    if (typeof value === 'string') return value;
    // Fallback to default locale
    const fallback = translations[DEFAULT][key];
    if (typeof fallback === 'string') return fallback;
    return '';
  };

  const tList = (key: string) => {
    const value = translations[locale]?.[key];
    if (Array.isArray(value)) return value;
    const fallback = translations[DEFAULT][key];
    return Array.isArray(fallback) ? fallback : [];
  };

  return { locale, setLocale, t, tList };
}
