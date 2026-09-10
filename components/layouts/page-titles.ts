/**
 * What each route segment is called, in one place.
 *
 * The breadcrumb has always needed this. The back links on `/game/[gameId]` and
 * `/player/[playerId]` need it too, and a second copy would be a second thing to forget when a
 * route is renamed — `analytics` and `tickets` were still in the first copy months after their
 * screens were deleted.
 */
export const PAGE_TITLES: Record<string, string> = {
  dashboard: 'Tableau de bord',
  leagues: 'Compétitions',
  teams: 'Équipes',
  players: 'Joueurs',
  roster: 'Effectif',
  users: 'Utilisateurs',
  games: 'Matchs',
  calendar: 'Calendrier',
  generate: 'Génération',
  seasons: 'Saisons',
  format: 'Format',
  standings: 'Classement',
  stats: 'Statistiques',
  posts: 'Actualités',
  post: 'Actualité',
  settings: 'Paramètres',
  rules: 'Règles',
  tenants: 'Organisations',
  general: 'Paramètres',
  profile: 'Mon profil',
  security: 'Sécurité',
  account: 'Mon compte',
  onboarding: 'Configuration',
  game: 'Match',
  player: 'Joueur',
  team: 'Équipe',
  league: 'Compétition',
  tenant: 'Organisation',
  admin: 'Plateforme',
  create: 'Nouveau',
  edit: 'Modifier',
  manage: 'Gestion',
};

/**
 * The same screens, as the tail of « Retour … ».
 *
 * A title is a noun and a back link is a sentence, and French will not let one become the other by
 * concatenation: *« Retour Effectif »* is not a phrase, and picking between *au*, *à la*, *aux* and
 * *à l'* needs the gender and number of each word. So the phrase is written out rather than
 * assembled, which also leaves room for the one that is not a straight translation of its title —
 * a club's roster is « l'effectif », not « les joueurs », even though `/team/roster` and
 * `/league/players` are the same screen underneath.
 *
 * A segment missing here simply gets no back link, which is the right failure: better nothing than
 * a phrase that reads as though nobody speaks the language.
 */
export const BACK_PHRASES: Record<string, string> = {
  calendar: 'au calendrier',
  players: 'aux joueurs',
  roster: 'à l’effectif',
  stats: 'aux statistiques',
  standings: 'au classement',
  teams: 'aux équipes',
  leagues: 'aux compétitions',
  seasons: 'aux saisons',
  dashboard: 'au tableau de bord',
  posts: 'aux actualités',
  users: 'aux utilisateurs',
  settings: 'aux paramètres',
};
