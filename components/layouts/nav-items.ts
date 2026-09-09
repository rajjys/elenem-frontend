// Single source of truth for admin-side sidebar navigation.
//
// RULE: an entry may only exist here if its destination is a page that actually
// renders real content today. No placeholders, no "coming soon", no links to
// routes that 404. Features that are planned but not built live in
// docs/BACKLOG.md, not in the sidebar — a nav item is a promise to the user.
//
// Because every user-facing label lives in this one file, translating the
// admin shell later is a single-file change (see docs/ANALYSIS_2026-08.md §5).
import {
  BarChart3,
  CalendarRange,
  LayoutDashboard,
  Users,
  Shield,
  Trophy,
  CalendarDays,
  ListOrdered,
  Newspaper,
  Settings,
  Building2,
  UserSquare2,
} from 'lucide-react';

type IconType = React.ComponentType<React.SVGProps<SVGSVGElement>>;

export interface NavLinkItem {
  label: string;
  basePath: string;
  icon: IconType;
  onClick?: () => void;
}

/**
 * A silent group: a hairline and a quiet caption, never a collapsible.
 *
 * Dropdowns hid the current page behind a closed parent and cost a click for nothing. But a flat
 * run of nine links reads as one undifferentiated pile, so the grouping stays — it just stops
 * being interactive. Omit `label` for the first group, which needs no caption.
 */
export interface NavGroup {
  label?: string;
  items: NavLinkItem[];
}

/**
 * Single accent for the whole product. Previously each role area set its own
 * (`admin`=indigo, `tenant`=blue, `league`=purple, `team`=emerald), which meant
 * the app changed colour as you navigated and had no identity of its own.
 */
export const APP_THEME_COLOR = 'blue';

// --- SYSTEM ADMIN (platform operator) ---------------------------------------
export const adminNavItems: NavGroup[] = [
  {
    items: [
    { label: 'Overview', basePath: '/admin/dashboard', icon: LayoutDashboard },
    ],
  },
  {
    label: 'Platform',
    items: [
    { label: 'Organisations', basePath: '/admin/tenants', icon: Building2 },
    { label: 'Users', basePath: '/admin/users', icon: Users },
    ],
  },
  {
    label: 'Competitions',
    items: [
    { label: 'Leagues', basePath: '/admin/leagues', icon: Trophy },
    { label: 'Seasons', basePath: '/admin/seasons', icon: CalendarDays },
    { label: 'Teams', basePath: '/admin/teams', icon: Shield },
    { label: 'Games', basePath: '/admin/games', icon: ListOrdered },
    { label: 'Posts', basePath: '/admin/posts', icon: Newspaper },
    ],
  },
];

/**
 * Two groups, and the line between them is time.
 *
 * The **register** — competitions, clubs, players, and halls when they arrive — is what the
 * organisation *has*. It survives every season: the same clubs turn up next year, the same players
 * are on the same sheets, the hall is the same hall.
 *
 * The **competition** — the season, its calendar, its table, its scorers — is what is *happening*.
 * All of it is derived from, or scoped to, the season, which is why a season sits at the top of
 * that group rather than beside the clubs: it is not another record you keep, it is the thing the
 * other three hang off.
 *
 * A club's sidebar takes the same split: what is mine, then where I stand.
 */
// --- TENANT ADMIN (the organisation: a federation, a provincial league, …) ---
export const tenantNavItems: NavGroup[] = [
  {
    items: [
    { label: 'Tableau de bord', basePath: '/tenant/dashboard', icon: LayoutDashboard },
    ],
  },
  {
    label: 'Répertoire',
    items: [
    { label: 'Ligues', basePath: '/tenant/leagues', icon: Trophy },
    { label: 'Équipes', basePath: '/tenant/teams', icon: Shield },
    { label: 'Joueurs', basePath: '/tenant/players', icon: UserSquare2 },
    // Venues belong here — same shape, same lifetime — and get an entry the day they render
    // something. A nav item is a promise; see the rule at the top of this file.
    ],
  },
  {
    label: 'Compétition',
    items: [
    { label: 'Calendrier', basePath: '/tenant/calendar', icon: CalendarDays },
    // The table is what the organisation publishes every matchday, and it had no entry point
    // here at all — it lived under /league and was reachable only by drilling into a competition
    // first. At LIPROBAKIN the person who publishes it is the tenant's community manager.
    { label: 'Classement', basePath: '/tenant/standings', icon: ListOrdered },
    // Leagues track scorers, and until Phase 4 the product held every scoresheet and surfaced
    // none of it. One sortable table answers all four of the questions asked of it — meilleur
    // marqueur, moyenne, volume de trois points, matchs joués — because the columns are the
    // sport's rather than this file's.
    { label: 'Statistiques', basePath: '/tenant/stats', icon: BarChart3 },
    ],
  },
  {
    label: 'Organisation',
    items: [
    { label: 'Utilisateurs', basePath: '/tenant/users', icon: Users },
    { label: 'Actualités', basePath: '/tenant/posts', icon: Newspaper },
    { label: 'Paramètres', basePath: '/tenant/settings', icon: Settings },
    ],
  },
];

// --- LEAGUE ADMIN (runs one competition) ------------------------------------
export const leagueNavItems: NavGroup[] = [
  {
    items: [
    { label: 'Tableau de bord', basePath: '/league/dashboard', icon: LayoutDashboard },
    ],
  },
  {
    label: 'Répertoire',
    items: [
    { label: 'Équipes', basePath: '/league/teams', icon: Shield },
    { label: 'Joueurs', basePath: '/league/players', icon: UserSquare2 },
    ],
  },
  {
    label: 'Compétition',
    items: [
    // First, because the three below it are all a season's: the calendar is its fixtures, the
    // table is its phases', the scorers are its sheets'.
    { label: 'Saisons', basePath: '/league/seasons', icon: CalendarRange },
    { label: 'Calendrier', basePath: '/league/calendar', icon: CalendarDays },
    { label: 'Classement', basePath: '/league/standings', icon: ListOrdered },
    { label: 'Statistiques', basePath: '/league/stats', icon: BarChart3 },
    ],
  },
  {
    label: 'Administration',
    items: [
    { label: 'Utilisateurs', basePath: '/league/users', icon: Users },
    // Added with the page itself. `/post/create` has redirected here on success since it was
    // written, and there was no way to reach the list any other way.
    { label: 'Actualités', basePath: '/league/posts', icon: Newspaper },
    { label: 'Paramètres', basePath: '/league/settings/general', icon: Settings },
    ],
  },
];

// --- TEAM ADMIN (runs one club) ---------------------------------------------
export const teamNavItems: NavGroup[] = [
  {
    items: [
    { label: 'Tableau de bord', basePath: '/team/dashboard', icon: LayoutDashboard },
    ],
  },
  {
    // What is the club's own, and what it can change. Six links in one undifferentiated pile is
    // what this was, and a club's two questions — « qui est dans mon effectif » and « où en
    // sommes-nous » — are not the same question.
    label: 'Mon club',
    items: [
    { label: 'Effectif', basePath: '/team/roster', icon: UserSquare2 },
    { label: 'Actualités', basePath: '/team/posts', icon: Newspaper },
    { label: 'Utilisateurs', basePath: '/team/users', icon: Users },
    { label: 'Informations', basePath: '/team/edit', icon: Settings },
    ],
  },
  {
    // Where the club stands and when it plays: the two facts a club opens the product for, and
    // neither of them anything the club decides.
    label: 'Compétition',
    items: [
    { label: 'Calendrier', basePath: '/team/calendar', icon: CalendarDays },
    { label: 'Classement', basePath: '/team/standings', icon: ListOrdered },
    { label: 'Statistiques', basePath: '/team/stats', icon: BarChart3 },
    ],
  },
];

