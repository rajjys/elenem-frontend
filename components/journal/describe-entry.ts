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
} from 'lucide-react';
import { describeGameAudit, type Rendered } from '@/components/game/game-timeline';
import type { JournalEntry } from '@/services/journal';

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
    return { icon: UserPlus, title: 'Joueur ajouté depuis une feuille de match' };
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

function fallback(action: string): Rendered {
  return { icon: Pencil, title: action.replaceAll('_', ' ').toLowerCase() };
}
