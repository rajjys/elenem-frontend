import {
  CalendarClock,
  CalendarPlus,
  CalendarX,
  KeyRound,
  Layers,
  LogIn,
  LogOut,
  MailCheck,
  Pencil,
  ShieldAlert,
  ShieldCheck,
  SlidersHorizontal,
  Trophy,
  UserCheck,
  UserPlus,
  UserX,
  Users,
  ArrowRightLeft,
} from 'lucide-react';
import {
  Building2,
  ImageMinus,
  ImagePlus,
  MapPin,
  Newspaper,
  Shield,
  Trash2,
} from 'lucide-react';
import { describeGameAudit, type Rendered } from '@/components/game/game-timeline';
import type { JournalEntry } from '@/services/journal';
import { describeChanges, describeValue, formatDay } from './describe-changes';
import { roleLabel } from '@/utils/role-labels';
import { de } from '@/utils/french';

/**
 * One journal entry as a sentence: an icon, a headline, and what changed.
 *
 * Matches are told in the words of their own history tab (`describeGameAudit`), so a score
 * correction reads the same in the journal as on the match. Everything else is here.
 *
 * Like the match history, an action this file does not know still shows, as its raw name: a
 * journal with a gap in it is worse than one with an ugly line, because the gap is invisible.
 */
export function describeJournalEntry(
  entry: JournalEntry,
  venueName: (id: string | null) => string | null,
): Rendered {
  const { action } = entry;
  const after = (entry.after ?? {}) as Record<string, unknown>;

  if (entry.entityType === 'GAME') return describeGameAudit(entry, venueName);

  // An image, on whatever it belongs to: a club's logo, a player's photo.
  if (/^(LOGO|PHOTO)_(CHANGED|REMOVED)$/.test(action)) {
    const removed = action.endsWith('REMOVED');
    const logo = action.startsWith('LOGO');
    return {
      icon: removed ? ImageMinus : ImagePlus,
      title: logo ? (removed ? 'Logo retiré' : 'Logo changé') : removed ? 'Photo retirée' : 'Photo changée',
    };
  }

  // Created, edited, deleted — the same three for every kind, worded for each.
  const kind = KINDS[entry.entityType];
  const lifecycle = action.match(/^[A-Z]+_(CREATED|UPDATED|DELETED)$/);
  if (kind && lifecycle && action.startsWith(entry.entityType)) {
    const before = (entry.before ?? {}) as Record<string, unknown>;
    return describeLifecycle(entry.entityType, kind, lifecycle[1] as Lifecycle, before, after);
  }

  if (entry.entityType === 'PLANNED_FIXTURE') {
    if (action === 'PLANNED_FIXTURE_MOVED') {
      // A slot moves exactly as a match does: same fields, same sentence.
      return { ...describeGameAudit({ ...entry, action: 'MOVED' }, venueName), title: 'Créneau déplacé' };
    }
    return (
      {
        PLANNED_FIXTURE_CREATED: { icon: CalendarPlus, title: 'Créneau réservé, équipes à désigner' },
        PLANNED_FIXTURE_DELETED: { icon: CalendarX, title: 'Créneau supprimé', tone: 'negative' as const },
        PLANNED_FIXTURE_PROMOTED: { icon: Users, title: 'Équipes désignées pour le créneau' },
      }[action] ?? fallback(action)
    );
  }

  if (entry.entityType === 'STAGE') {
    return (
      {
        STAGE_CREATED: { icon: Layers, title: 'Phase créée' },
        STAGE_UPDATED: { icon: Layers, title: 'Phase modifiée' },
        STAGE_DELETED: { icon: Layers, title: 'Phase supprimée', tone: 'negative' as const },
        STAGES_REORDERED: { icon: Layers, title: 'Ordre des phases changé' },
      }[action] ?? fallback(action)
    );
  }

  if (action === 'LEAGUE_SETTINGS_UPDATED') {
    return {
      icon: SlidersHorizontal,
      title: 'Règles de la compétition modifiées',
      detail: describeChanges(entry.before, entry.after),
      tone: 'caution',
    };
  }

  // « Nomination », « Fin de fonction »: the role is named, the person's gender is not assumed.
  if (action === 'LEAGUE_ADMIN_ASSIGNED' || action === 'TEAM_ADMIN_ASSIGNED') {
    const person = str(after.person);
    const role = roleLabel(action === 'LEAGUE_ADMIN_ASSIGNED' ? 'LEAGUE_ADMIN' : 'TEAM_ADMIN');
    return {
      icon: UserPlus,
      title: 'Nomination',
      detail: person ? `${role} : ${person}${after.invited ? ' (invitation envoyée)' : ''}.` : undefined,
    };
  }
  if (action === 'LEAGUE_ADMIN_REMOVED' || action === 'TEAM_ADMIN_REMOVED') {
    const person = str((entry.before as Record<string, unknown> | null)?.person);
    const role = roleLabel(action === 'LEAGUE_ADMIN_REMOVED' ? 'LEAGUE_ADMIN' : 'TEAM_ADMIN');
    return { icon: UserX, title: 'Fin de fonction', detail: person ? `${role} : ${person}.` : undefined };
  }

  if (entry.entityType === 'VENUE') {
    const before = (entry.before ?? {}) as Record<string, unknown>;
    const court = str(after.court) ?? str(before.court);
    const from = formatDay(after.from ?? before.from);
    const to = formatDay(after.to ?? before.to);
    const period = from && to ? (from === to ? `Le ${from}.` : `Du ${from} au ${to}.`) : undefined;
    const venue: Record<string, Rendered> = {
      VENUE_COURT_ADDED: { icon: MapPin, title: 'Terrain ajouté', detail: court ? `${court}.` : undefined },
      VENUE_COURT_REMOVED: { icon: MapPin, title: 'Terrain retiré', detail: court ? `${court}.` : undefined },
      VENUE_BLACKOUT_ADDED: { icon: CalendarX, title: 'Salle indisponible', detail: period, tone: 'caution' },
      VENUE_BLACKOUT_REMOVED: { icon: CalendarClock, title: 'Indisponibilité levée', detail: period },
    };
    if (venue[action]) return venue[action];
  }

  if (entry.entityType === 'SEASON' && action.startsWith('SEASON_')) {
    const to = action.slice('SEASON_'.length);
    return (
      {
        ACTIVE: { icon: Trophy, title: 'Saison lancée', tone: 'positive' as const },
        COMPLETED: { icon: Trophy, title: 'Saison terminée' },
        CANCELED: { icon: CalendarX, title: 'Saison annulée', tone: 'negative' as const },
        PLANNING: { icon: CalendarClock, title: 'Saison remise en préparation', tone: 'caution' as const },
      }[to] ?? fallback(action)
    );
  }

  if (action === 'STANDINGS_RULES_UPDATED') {
    return { icon: SlidersHorizontal, title: 'Règles du classement modifiées', tone: 'caution' };
  }

  if (action === 'PLAYER_ADDED_FROM_BOX_SCORE') {
    return { icon: UserPlus, title: 'Ajout à l’effectif depuis une feuille de match' };
  }

  if (entry.entityType === 'USER') return describeAccount(entry, after);

  return fallback(action);
}

function describeAccount(entry: JournalEntry, after: Record<string, unknown>): Rendered {
  switch (entry.action) {
    case 'LOGIN_SUCCESS':
      return { icon: LogIn, title: 'Connexion' };
    case 'LOGOUT':
      return { icon: LogOut, title: 'Déconnexion' };
    case 'LOGIN_FAILED': {
      const why = after.reason;
      if (why === 'User not found') {
        const typed = typeof after.usernameOrEmail === 'string' ? after.usernameOrEmail : null;
        return {
          icon: ShieldAlert,
          title: 'Connexion refusée : compte inexistant',
          detail: typed ? `Saisi : « ${typed} ».` : undefined,
          tone: 'caution',
        };
      }
      if (why === 'Account deactivated') {
        return { icon: UserX, title: 'Connexion refusée : compte désactivé', tone: 'caution' };
      }
      if (why === 'Tenant inactive') {
        return { icon: ShieldAlert, title: 'Connexion refusée : organisation inactive', tone: 'caution' };
      }
      const attempts = typeof after.attempts === 'number' ? after.attempts : null;
      return {
        icon: ShieldAlert,
        title: 'Mot de passe erroné',
        detail: after.lockout
          ? 'Connexion bloquée 30 minutes.'
          : attempts
            ? `${attempts}${attempts === 1 ? 're' : 'e'} erreur d’affilée.`
            : undefined,
        tone: after.lockout ? 'negative' : 'caution',
      };
    }
    case 'PASSWORD_RESET':
      return { icon: KeyRound, title: 'Mot de passe réinitialisé', detail: 'Avec un code reçu par e-mail.' };
    case 'PASSWORD_CHANGED':
      return { icon: KeyRound, title: 'Mot de passe changé' };
    case 'PASSWORD_SET_BY_ADMIN':
      return { icon: KeyRound, title: 'Mot de passe défini par un administrateur', tone: 'caution' };
    case 'PASSWORD_RESET_SENT':
      return { icon: KeyRound, title: 'Code de réinitialisation envoyé' };
    case 'EMAIL_VERIFIED':
      return { icon: MailCheck, title: 'Adresse e-mail vérifiée' };
    case 'USER_REGISTERED':
      return { icon: UserPlus, title: 'Compte créé' };
    case 'USER_DEACTIVATED':
      return { icon: UserX, title: 'Compte désactivé', tone: 'negative' };
    case 'USER_REACTIVATED':
      return { icon: UserCheck, title: 'Compte réactivé', tone: 'positive' };
    case 'USER_LOCKED':
      return { icon: ShieldAlert, title: 'Compte verrouillé par un administrateur', tone: 'negative' };
    case 'USER_UNLOCKED':
      return { icon: ShieldCheck, title: 'Connexion débloquée', tone: 'positive' };
    default:
      return fallback(entry.action);
  }
}

const str = (v: unknown) => (typeof v === 'string' && v ? v : null);

type Lifecycle = 'CREATED' | 'UPDATED' | 'DELETED';

/** How each kind is named, and with which article: French agrees, and « Club créée » would not do. */
const KINDS: Record<string, { icon: Rendered['icon']; noun: string; feminine: boolean }> = {
  USER: { icon: UserPlus, noun: 'Compte', feminine: false },
  TENANT: { icon: Building2, noun: 'Organisation', feminine: true },
  LEAGUE: { icon: Trophy, noun: 'Compétition', feminine: true },
  SEASON: { icon: CalendarClock, noun: 'Saison', feminine: true },
  TEAM: { icon: Shield, noun: 'Club', feminine: false },
  // « Fiche », not « Joueur »: half the competitions are women's, and the line cannot know.
  PLAYER: { icon: UserPlus, noun: 'Fiche', feminine: true },
  POST: { icon: Newspaper, noun: 'Actualité', feminine: true },
  VENUE: { icon: MapPin, noun: 'Salle', feminine: true },
};

function describeLifecycle(
  type: string,
  kind: (typeof KINDS)[string],
  event: Lifecycle,
  before: Record<string, unknown>,
  after: Record<string, unknown>,
): Rendered {
  const e = kind.feminine ? 'e' : '';

  if (event === 'DELETED') {
    return { icon: Trash2, title: `${kind.noun} supprimé${e}`, tone: 'negative' };
  }

  if (event === 'CREATED') {
    // Some kinds have a better word than « créé ».
    const title =
      type === 'USER'
        ? after.invited ? 'Invitation envoyée' : 'Compte créé'
        : type === 'PLAYER'
          ? 'Ajout à l’effectif'
          : type === 'VENUE'
            ? 'Salle ajoutée'
            : `${kind.noun} créé${e}`;
    const details = [
      type === 'USER' && Array.isArray(after.roles) ? describeValue('roles', after.roles) : null,
      type === 'PLAYER' && after.team ? describeValue('team', after.team) : null,
      type === 'POST' && after.status ? describeValue('status', after.status) : null,
    ].filter(Boolean);
    return { icon: kind.icon, title, detail: details.length ? details.join('\n') : undefined, tone: 'positive' };
  }

  // Edited. A few edits are better told as what they are than as a list of fields.
  const changed = Object.keys(after).filter((k) => k !== 'changed');
  if (type === 'PLAYER' && changed.length === 1 && changed[0] === 'team') {
    const from = str(before.team);
    const to = str(after.team);
    return {
      icon: ArrowRightLeft,
      title: from && to ? 'Transfert' : to ? 'Arrivée dans un club' : 'Départ du club',
      detail: from && to ? `${de(from, true)} à ${to}.` : `${to ?? from}.`,
    };
  }
  if (type === 'POST' && after.status === 'PUBLISHED' && before.status !== 'PUBLISHED') {
    return { icon: Newspaper, title: 'Actualité publiée', tone: 'positive', detail: describeChanges(withoutStatus(before), withoutStatus(after)) };
  }
  const title =
    type === 'USER' && changed.includes('roles')
      ? 'Rôle changé'
      : type === 'TENANT'
        ? 'Paramètres de l’organisation modifiés'
        : `${kind.noun} modifié${e}`;
  return { icon: Pencil, title, detail: describeChanges(before, after) };
}

function withoutStatus(o: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(o).filter(([k]) => k !== 'status'));
}

function fallback(action: string): Rendered {
  return { icon: Pencil, title: action.replaceAll('_', ' ').toLowerCase() };
}
