'use client';

import {
  ArrowLeftRight,
  CalendarPlus,
  Clock,
  FileText,
  MapPin,
  Pencil,
  Trash2,
  TriangleAlert,
  Trophy,
} from 'lucide-react';
import { cn } from '@/utils';
import type { AuditEntry } from '@/services/games';

/**
 * What has happened to this fixture, as sentences.
 *
 * The trail existed as a collapsible inside the editor dialog, rendering `SCORE_CORRECTED` and a
 * JSON blob. That is a log, and a log is for us. The person who needs this is a secretary being
 * asked by a club why their match moved — so every line has to be a sentence they can repeat, with
 * **what it was and what it became** in it, and the name of whoever decided.
 *
 * The reason is the point of the whole feature and is given its own weight: "moved to the 22nd"
 * settles nothing without "the hall was double-booked".
 */

const WEEKDAYS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
const MONTHS = [
  'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
];

/**
 * An audit action as a short French headline.
 *
 * Exported because the fixture editor's own history list had a second, shorter copy of this map —
 * which is why it rendered `BOX_SCORE_CORRECTED` in capitals to a French-speaking secretary: the
 * box score arrived after that copy was written and nobody updated it. One map, and a new action
 * can only be missing from every screen at once rather than from an arbitrary one.
 */
export function auditTitle(action: string): string {
  if (action.startsWith('TRANSITION_')) {
    const to = action.slice('TRANSITION_'.length);
    return `Match ${STATUS_FR[to] ?? to.toLowerCase()}`;
  }
  return AUDIT_TITLES[action] ?? action.replaceAll('_', ' ').toLowerCase();
}

const AUDIT_TITLES: Record<string, string> = {
  CREATED: 'Match créé',
  MOVED: 'Match déplacé',
  UPDATED: 'Match modifié',
  INVERTED: 'Domicile et visiteur inversés',
  DELETED: 'Match supprimé',
  REORDERED: 'Horaire réattribué',
  SCORE_REPORTED: 'Score enregistré',
  SCORE_CORRECTED: 'Score corrigé',
  BOX_SCORE_RECORDED: 'Feuille de match saisie',
  BOX_SCORE_CORRECTED: 'Feuille de match corrigée',
};

const STATUS_FR: Record<string, string> = {
  SCHEDULED: 'programmé',
  CONFIRMED: 'confirmé',
  LIVE: 'en direct',
  COMPLETED: 'terminé',
  POSTPONED: 'reporté',
  CANCELLED: 'annulé',
  DRAFT: 'brouillon',
};

function slot(iso: string): string {
  const d = new Date(iso);
  return `${WEEKDAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]} à ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

type Side = Record<string, unknown> | null | undefined;
const num = (v: unknown) => (typeof v === 'number' ? v : null);
const str = (v: unknown) => (typeof v === 'string' ? v : null);

interface Rendered {
  icon: React.ElementType;
  /** The headline, e.g. "Match déplacé". */
  title: string;
  /** What changed, in words. Empty when the action says everything by itself. */
  detail?: string;
  tone?: 'neutral' | 'positive' | 'caution' | 'negative';
}

/**
 * One audit row as a sentence.
 *
 * Falls back to the raw action rather than hiding an entry it does not recognise: a trail with a
 * gap in it is worse than a trail with one ugly line, because the gap is invisible.
 */
function render(entry: AuditEntry, venueName: (id: string | null) => string | null): Rendered {
  const before = entry.before as Side;
  const after = entry.after as Side;
  const action = entry.action;

  if (action === 'CREATED') {
    const at = str(after?.dateTime);
    return {
      icon: CalendarPlus,
      title: auditTitle('CREATED'),
      detail: at ? `Programmé ${slot(at)}.` : undefined,
    };
  }

  if (action === 'MOVED' || action === 'UPDATED') {
    const wasAt = str(before?.dateTime);
    const nowAt = str(after?.dateTime);
    const wasVenue = str(before?.homeVenueId);
    const nowVenue = str(after?.homeVenueId);
    const parts: string[] = [];

    if (wasAt && nowAt && new Date(wasAt).getTime() !== new Date(nowAt).getTime()) {
      parts.push(`De ${slot(wasAt)} à ${slot(nowAt)}.`);
    }
    if (wasVenue !== nowVenue) {
      const from = venueName(wasVenue) ?? 'aucune salle';
      const to = venueName(nowVenue) ?? 'aucune salle';
      parts.push(`Salle : ${from} → ${to}.`);
    }
    return {
      icon: parts.length && wasVenue !== nowVenue && wasAt === nowAt ? MapPin : Clock,
      title: auditTitle(action),
      detail: parts.join(' ') || undefined,
    };
  }

  if (action === 'INVERTED') {
    return {
      icon: ArrowLeftRight,
      title: auditTitle('INVERTED'),
      detail: 'Le match était saisi dans le mauvais sens.',
    };
  }

  if (action === 'SCORE_REPORTED' || action === 'SCORE_CORRECTED') {
    const nh = num(after?.homeScore);
    const na = num(after?.awayScore);
    const bh = num(before?.homeScore);
    const ba = num(before?.awayScore);
    const correction = action === 'SCORE_CORRECTED';
    return {
      icon: Trophy,
      title: auditTitle(action),
      detail:
        correction && bh !== null && ba !== null && nh !== null && na !== null
          ? `De ${bh} – ${ba} à ${nh} – ${na}.`
          : nh !== null && na !== null
            ? `${nh} – ${na}.`
            : undefined,
      tone: correction ? 'caution' : 'positive',
    };
  }

  if (action.startsWith('TRANSITION_')) {
    const to = action.slice('TRANSITION_'.length);
    const from = str(before?.status);
    const tone =
      to === 'CANCELLED' ? 'negative' : to === 'POSTPONED' ? 'caution' : 'neutral';
    return {
      icon: to === 'CANCELLED' ? TriangleAlert : Clock,
      title: auditTitle(action),
      detail: from && STATUS_FR[from] ? `Auparavant ${STATUS_FR[from]}.` : undefined,
      tone,
    };
  }

  if (action === 'REORDERED') {
    return {
      icon: Clock,
      title: auditTitle('REORDERED'),
      detail: 'Les matchs de la journée ont été réordonnés dans cette salle.',
    };
  }

  if (action === 'BOX_SCORE_RECORDED' || action === 'BOX_SCORE_CORRECTED') {
    const lines = num(after?.lines);
    return {
      icon: FileText,
      title: auditTitle(action),
      detail: lines !== null ? `${lines} joueur${lines > 1 ? 's' : ''} sur la feuille.` : undefined,
    };
  }

  if (action === 'DELETED') {
    return { icon: Trash2, title: auditTitle('DELETED'), tone: 'negative' };
  }

  return { icon: Pencil, title: auditTitle(action) };
}

const TONE_RING: Record<NonNullable<Rendered['tone']>, string> = {
  neutral: 'bg-surface-sunk text-ink-subtle ring-line',
  positive: 'bg-positive-soft text-positive ring-positive/30',
  caution: 'bg-caution-soft text-caution ring-caution/30',
  negative: 'bg-negative-soft text-negative ring-negative/30',
};

export function GameTimeline({
  entries,
  venues,
}: {
  entries: AuditEntry[];
  /** Named so a change of hall reads as two halls rather than two identifiers. */
  venues: { id: string; name: string }[];
}) {
  const venueName = (id: string | null) => venues.find((v) => v.id === id)?.name ?? null;

  if (entries.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-line px-4 py-10 text-center text-sm text-ink-muted">
        Rien n&apos;a changé depuis la création de ce match.
      </p>
    );
  }

  return (
    <ol className="relative space-y-0">
      {entries.map((entry, i) => {
        const r = render(entry, venueName);
        const Icon = r.icon;
        const last = i === entries.length - 1;
        return (
          <li key={entry.id} className="relative flex gap-3 pb-5 last:pb-0">
            {/* The rail is what makes a list of changes read as a sequence rather than as rows. */}
            {!last && (
              <span
                className="absolute left-[13px] top-7 h-[calc(100%-1.25rem)] w-px bg-line"
                aria-hidden
              />
            )}
            <span
              className={cn(
                'relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ring-1',
                TONE_RING[r.tone ?? 'neutral'],
              )}
            >
              <Icon className="h-3.5 w-3.5" aria-hidden />
            </span>

            <div className="min-w-0 flex-1 pt-0.5">
              <div className="flex flex-wrap items-baseline gap-x-2">
                <p className="text-sm font-medium text-ink first-letter:uppercase">{r.title}</p>
                <p className="text-xs tabular-nums text-ink-subtle">
                  {new Date(entry.at).toLocaleString('fr-FR', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                  {entry.by ? ` · ${entry.by}` : ''}
                </p>
              </div>
              {r.detail && <p className="mt-0.5 text-sm text-ink-muted">{r.detail}</p>}
              {/* The reason is why the trail exists at all, so it is quoted rather than appended. */}
              {entry.reason && (
                <p className="mt-1 border-l-2 border-line pl-2.5 text-sm italic text-ink-muted">
                  {entry.reason}
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
