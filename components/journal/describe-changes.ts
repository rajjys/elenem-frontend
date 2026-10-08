import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { meaningfulRoles, roleLabel } from '@/utils/role-labels';

/**
 * What changed in an edit, as lines a person reads: « Nom : Vipers → Vipers BC ».
 *
 * The API records only the fields that changed (audit-fields.ts), so every line here is a real
 * change. Values too long or too structured to quote — a description, the colours, the points
 * table — and personal fields, whose values are never recorded, are named together on one line
 * instead: « Aussi modifié : couleurs, date de naissance ».
 */

const LABELS: Record<string, string> = {
  firstName: 'Prénom',
  lastName: 'Nom',
  name: 'Nom',
  email: 'Adresse e-mail',
  username: 'Identifiant',
  roles: 'Rôles',
  league: 'Compétition gérée',
  team: 'Club',
  isEmailVerified: 'Adresse vérifiée',
  tenantCode: 'Code',
  country: 'Pays',
  isActive: 'Actif',
  visibility: 'Visibilité',
  contactEmail: 'E-mail de contact',
  phone: 'Téléphone',
  website: 'Site web',
  city: 'Ville',
  timezone: 'Fuseau horaire',
  division: 'Division',
  gender: 'Catégorie',
  parentLeague: 'Compétition parente',
  shortCode: 'Sigle',
  homeVenue: 'Salle',
  jerseyNumber: 'Numéro',
  position: 'Poste',
  title: 'Titre',
  status: 'Statut',
  type: 'Type',
  scheduledAt: 'Publication prévue',
  publishedAt: 'Publiée le',
  address: 'Adresse',
  capacity: 'Capacité',
  startDate: 'Début',
  endDate: 'Fin',
  publicPlayerIdentity: 'Joueurs nommés sur le site public',
  maintenanceMode: 'Site en maintenance',
};

/** Named, never quoted: long, structured, or personal. Lower case — they follow « Aussi modifié : ». */
const NAMED_ONLY: Record<string, string> = {
  description: 'description',
  brandingTheme: 'couleurs',
  socialLinks: 'réseaux sociaux',
  leagueType: 'format',
  competitionType: 'type de compétition',
  rules: 'règlement',
  features: 'fonctionnalités',
  dateOfBirth: 'date de naissance',
  nationalIdNumber: 'numéro d’identité',
  nationality: 'nationalité',
};

const ENUMS: Record<string, string> = {
  MALE: 'Masculin',
  FEMALE: 'Féminin',
  MIXED: 'Mixte',
  OTHER: 'Autre',
  PUBLIC: 'Publique',
  PRIVATE: 'Privée',
  HIDDEN: 'Masquée',
  ARCHIVED: 'Archivée',
  RESERVED: 'Réservée',
  DRAFT: 'Brouillon',
  PUBLISHED: 'Publiée',
  SCHEDULED: 'Programmée',
  BLOG: 'Article',
  STATUS: 'Statut',
  ANNOUNCEMENT: 'Annonce',
  MATCH_REPORT: 'Compte rendu de match',
};

const ISO = /^\d{4}-\d{2}-\d{2}T/;

function show(field: string, v: unknown): string {
  if (v === null || v === undefined || v === '') return '—';
  if (typeof v === 'boolean') return v ? 'Oui' : 'Non';
  if (field === 'roles' && Array.isArray(v)) {
    const roles = meaningfulRoles(v as string[]);
    return roles.length ? roles.map(roleLabel).join(', ') : '—';
  }
  if (typeof v === 'string' && ISO.test(v)) {
    const d = new Date(v);
    // A season starts on a day; a post is published at a time.
    return format(d, field === 'scheduledAt' || field === 'publishedAt' ? 'd MMM yyyy à HH:mm' : 'd MMM yyyy', { locale: fr });
  }
  if (typeof v === 'string') return ENUMS[v] ?? v;
  if (typeof v === 'number') return String(v);
  return '…';
}

/** « Nom : A → B » per simple field, then one line naming the rest. Empty when nothing to say. */
export function describeChanges(
  before: Record<string, unknown> | null | undefined,
  after: Record<string, unknown> | null | undefined,
): string | undefined {
  const b = before ?? {};
  const a = after ?? {};
  const lines: string[] = [];
  const named: string[] = [];

  for (const field of Object.keys({ ...b, ...a })) {
    if (field === 'changed') continue;
    if (NAMED_ONLY[field]) {
      named.push(NAMED_ONLY[field]);
      continue;
    }
    const label = LABELS[field];
    if (!label) continue;
    lines.push(`${label} : ${show(field, b[field])} → ${show(field, a[field])}`);
  }
  // Personal fields arrive as names only: the values were never recorded.
  if (Array.isArray(a.changed)) {
    for (const f of a.changed as string[]) named.push(NAMED_ONLY[f] ?? LABELS[f]?.toLowerCase() ?? f);
  }
  if (named.length) lines.push(`${lines.length ? 'Aussi modifié' : 'Modifié'} : ${[...new Set(named)].join(', ')}`);
  return lines.length ? lines.join('\n') : undefined;
}

/** One value on its own, for a creation: « Club : Vipers ». */
export function describeValue(field: string, v: unknown): string {
  // « Rôle : Membre », « Rôles : Membre, Responsable de club ».
  const label =
    field === 'roles' && Array.isArray(v) && meaningfulRoles(v as string[]).length === 1 ? 'Rôle' : (LABELS[field] ?? field);
  return `${label} : ${show(field, v)}`;
}

export function formatDay(iso: unknown): string | null {
  return typeof iso === 'string' && ISO.test(iso) ? format(new Date(iso), 'd MMM yyyy', { locale: fr }) : null;
}
