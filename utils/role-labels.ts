import { Roles } from '@/schemas/enums';

/**
 * What each role is called, on screen.
 *
 * `GENERAL_USER, LEAGUE_ADMIN` was being printed straight out of the enum, in a column too narrow
 * to finish the word — so the one screen whose job is to say *what someone may do* said it in
 * SHOUTING_SNAKE_CASE and then ran out of room. These are the words a federation uses.
 *
 * **A role is a job, not a permission.** « Administrateur de compétition » says what the person is
 * for; `LEAGUE_ADMIN` says how it is stored. The stored value never changes — only what is read.
 */
export const ROLE_LABELS: Record<string, string> = {
  [Roles.SYSTEM_ADMIN]: 'Administrateur plateforme',
  [Roles.TENANT_ADMIN]: 'Administrateur de l’organisation',
  [Roles.LEAGUE_ADMIN]: 'Administrateur de compétition',
  [Roles.TEAM_ADMIN]: 'Responsable de club',
  [Roles.COACH]: 'Entraîneur',
  [Roles.REFEREE]: 'Arbitre',
  [Roles.PLAYER]: 'Joueur',
  [Roles.GENERAL_USER]: 'Membre',
};

/** One line of what this role is actually allowed to do, for the screen that assigns it. */
export const ROLE_HINTS: Record<string, string> = {
  [Roles.SYSTEM_ADMIN]: 'Accès à toutes les organisations de la plateforme.',
  [Roles.TENANT_ADMIN]:
    'Gère les compétitions, les clubs, le calendrier et les utilisateurs de l’organisation.',
  [Roles.LEAGUE_ADMIN]:
    'Gère une compétition : ses clubs, ses saisons, son calendrier et son classement.',
  [Roles.TEAM_ADMIN]: 'Consulte son club, corrige la fiche de ses joueurs.',
  [Roles.COACH]: 'Aucun accès d’administration pour le moment.',
  [Roles.REFEREE]: 'Aucun accès d’administration pour le moment.',
  [Roles.PLAYER]: 'Accède à sa propre fiche.',
  [Roles.GENERAL_USER]: 'Consulte ce qui est public. Le rôle de départ de tout compte.',
};

export function roleLabel(role: string): string {
  return ROLE_LABELS[role] ?? role;
}

/**
 * The one role worth showing when there is room for one.
 *
 * Almost everybody carries `GENERAL_USER` alongside whatever they actually do, so a list that
 * prints every role prints that word on every row and buries the one that distinguishes them.
 * Ordered by reach, most first.
 */
const BY_REACH = [
  Roles.SYSTEM_ADMIN,
  Roles.TENANT_ADMIN,
  Roles.LEAGUE_ADMIN,
  Roles.TEAM_ADMIN,
  Roles.COACH,
  Roles.REFEREE,
  Roles.PLAYER,
  Roles.GENERAL_USER,
] as const;

export function primaryRole(roles: readonly string[]): string | null {
  for (const r of BY_REACH) if (roles.includes(r)) return r;
  return roles[0] ?? null;
}

/** Every role except the one everybody has, for the rows that list them all. */
export function meaningfulRoles(roles: readonly string[]): string[] {
  const rest = roles.filter((r) => r !== Roles.GENERAL_USER);
  return rest.length ? rest : roles.slice();
}
