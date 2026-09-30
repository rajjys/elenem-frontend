import type { PublicSite } from './api';

/** Which icon a nav item draws; the client nav maps these to lucide icons. */
export type SiteNavIcon = 'home' | 'games' | 'standings' | 'teams' | 'stats' | 'playoffs' | 'news';

export interface SiteNavItem {
  href: string;
  label: string;
  /** The route segment under the league, for the active state; null is the home page. */
  segment: string | null;
  icon: SiteNavIcon;
}

/**
 * What a league site offers, decided by its data rather than a menu (PHASE5B_LEAGUE_SITES §4.5):
 * a section appears only when there is something in it, so a new league never shows a broken page.
 *
 * `primary` is the phone's bottom tab bar (at most five); `secondary` sits in the header menu on
 * a phone and beside the rest on a wide screen.
 */
export function siteNav(site: PublicSite): { primary: SiteNavItem[]; secondary: SiteNavItem[] } {
  if (site.competitions.length === 0) return { primary: [], secondary: [] };

  const primary: SiteNavItem[] = [
    { href: '/', label: 'Accueil', segment: null, icon: 'home' },
    { href: '/games', label: 'Matchs', segment: 'games', icon: 'games' },
    { href: '/standings', label: 'Classement', segment: 'standings', icon: 'standings' },
    { href: '/teams', label: 'Équipes', segment: 'teams', icon: 'teams' },
  ];
  // Only for a competition that has scoresheets *and* publishes its players (§4.9).
  if (site.competitions.some((c) => c.hasBoxScores && c.showsPlayers)) {
    primary.push({ href: '/stats', label: 'Marqueurs', segment: 'stats', icon: 'stats' });
  }

  const secondary: SiteNavItem[] = [];
  if (site.competitions.some((c) => c.hasKnockout)) {
    secondary.push({ href: '/playoffs', label: 'Phase finale', segment: 'playoffs', icon: 'playoffs' });
  }
  if (site.hasPosts) secondary.push({ href: '/news', label: 'Actualités', segment: 'news', icon: 'news' });

  return { primary, secondary };
}

/** Up to three initials for a league with no logo: « Ligue de démonstration » → « LD ». */
export function initialsOf(name: string): string {
  const words = name
    .split(/[\s'’-]+/)
    .filter((w) => w && !/^(de|du|des|la|le|les|d|l|et|of|the)$/i.test(w));
  return (words.slice(0, 3).map((w) => w[0]).join('') || name.slice(0, 2)).toUpperCase();
}

/**
 * Chip labels for a league's competitions: the words they all start with are dropped, so
 * « Championnat Provincial Kinshasa Dames » and « … Messieurs » read « Dames » and « Messieurs »
 * on a phone. When they share nothing, or a label would be left empty, the full names stay.
 */
export function shortCompetitionNames(names: string[]): string[] {
  if (names.length < 2) return names;
  const split = names.map((n) => n.split(/\s+/));
  let common = 0;
  while (split.every((w) => w.length > common + 1 && w[common] === split[0][common])) common++;
  return common === 0 ? names : split.map((w) => w.slice(common).join(' '));
}
