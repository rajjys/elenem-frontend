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
    ],
  },
];

// --- TENANT ADMIN (the organisation: a federation, a provincial league, …) ---
export const tenantNavItems: NavGroup[] = [
  {
    items: [
    { label: 'Tableau de bord', basePath: '/tenant/dashboard', icon: LayoutDashboard },
    ],
  },
  {
    label: 'Compétition',
    items: [
    { label: 'Ligues', basePath: '/tenant/leagues', icon: Trophy },
    { label: 'Équipes', basePath: '/tenant/teams', icon: Shield },
    { label: 'Joueurs', basePath: '/tenant/players', icon: UserSquare2 },
    { label: 'Calendrier', basePath: '/tenant/calendar', icon: CalendarDays },
    { label: 'Matchs', basePath: '/tenant/games', icon: ListOrdered },
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
    label: 'Compétition',
    items: [
    { label: 'Équipes', basePath: '/league/teams', icon: Shield },
    { label: 'Joueurs', basePath: '/league/players', icon: UserSquare2 },
    { label: 'Saisons', basePath: '/league/seasons', icon: CalendarDays },
    { label: 'Calendrier', basePath: '/league/calendar', icon: CalendarDays },
    { label: 'Matchs', basePath: '/league/games', icon: ListOrdered },
    { label: 'Classement', basePath: '/league/standings', icon: Trophy },
    ],
  },
  {
    label: 'Administration',
    items: [
    { label: 'Utilisateurs', basePath: '/league/users', icon: Users },
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
    label: 'Mon club',
    items: [
    { label: 'Effectif', basePath: '/team/roster', icon: UserSquare2 },
    { label: 'Utilisateurs', basePath: '/team/users', icon: Users },
    ],
  },
];

