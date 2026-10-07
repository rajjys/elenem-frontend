'use client';

import Link from 'next/link';
import { format, isThisYear, isToday, isYesterday } from 'date-fns';
import { fr } from 'date-fns/locale';
import { TONE_RING } from '@/components/game/game-timeline';
import { useSurfaceLink } from '@/hooks/useSurfaceLink';
import type { JournalEntry } from '@/services/journal';
import { cn } from '@/utils';
import { describeJournalEntry } from './describe-entry';

/** « Aujourd’hui », « Hier », « Lundi 5 octobre » — the year only when it is not this one. */
function dayLabel(d: Date): string {
  if (isToday(d)) return 'Aujourd’hui';
  if (isYesterday(d)) return 'Hier';
  const s = format(d, isThisYear(d) ? 'EEEE d MMMM' : 'EEEE d MMMM yyyy', { locale: fr });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * Journal entries as sentences, grouped by day.
 *
 * The day is a heading rather than repeated on every line: the question is usually « qu’est-ce
 * qui s’est passé samedi », and a column of identical dates is noise between the reader and the
 * answer. Each line then says what happened, to what, by whom, and — quoted, because it is the
 * point — why.
 */
export function JournalList({
  entries,
  venues,
  usersBasePath,
  showOrganisation = false,
  ownerId,
}: {
  entries: JournalEntry[];
  venues: Record<string, string>;
  /** Where a person's record lives on this surface; their name links there. */
  usersBasePath?: string;
  /** A system administrator reads every organisation, so each line says which. */
  showOrganisation?: boolean;
  /**
   * On a person's own record their name on every line is noise — the page is already about them.
   * Lines about this account drop the subject; what they did to others keeps it.
   */
  ownerId?: string;
}) {
  const surfaceLink = useSurfaceLink();
  const venueName = (id: string | null) => (id ? (venues[id] ?? null) : null);

  const days: { key: string; label: string; entries: JournalEntry[] }[] = [];
  for (const e of entries) {
    const d = new Date(e.at);
    const key = format(d, 'yyyy-MM-dd');
    const last = days[days.length - 1];
    if (last?.key === key) last.entries.push(e);
    else days.push({ key, label: dayLabel(d), entries: [e] });
  }

  const subjectHref = (e: JournalEntry): string | null => {
    if (e.entityType === 'GAME') return surfaceLink(`/game/${e.entityId}`);
    if (e.entityType === 'USER' && usersBasePath && e.entityId !== 'ANONYMOUS') {
      return `${usersBasePath}/${e.entityId}`;
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {days.map((day) => (
        <section key={day.key}>
          <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-ink-subtle">{day.label}</h3>
          <ol className="divide-y divide-line rounded-xl border border-line bg-surface">
            {day.entries.map((e) => {
              const r = describeJournalEntry(e, venueName);
              const Icon = r.icon;
              const href = subjectHref(e);
              // Signing in, resetting one's own password: the person is the subject and the actor,
              // and naming them twice reads as two people.
              const self = e.entityType === 'USER' && e.by?.id === e.entityId;
              const meta = [
                format(new Date(e.at), 'HH:mm'),
                !self && e.by ? e.by.name : null,
                showOrganisation ? e.organisation : null,
              ].filter(Boolean);

              return (
                <li key={e.id} className="flex gap-3 px-4 py-3">
                  <span
                    className={cn(
                      'mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ring-1',
                      TONE_RING[r.tone ?? 'neutral'],
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-ink">
                      <span className="font-medium first-letter:uppercase">{r.title}</span>
                      {e.subject && !(e.entityType === 'USER' && e.entityId === ownerId) && (
                        <>
                          <span className="text-ink-subtle"> · </span>
                          {href ? (
                            <Link href={href} className="text-accent-text hover:underline hover:underline-offset-2">
                              {e.subject.label}
                            </Link>
                          ) : (
                            <span>{e.subject.label}</span>
                          )}
                          {e.subject.context && (
                            <span className="text-ink-subtle"> · {e.subject.context}</span>
                          )}
                        </>
                      )}
                    </p>
                    {r.detail && <p className="mt-0.5 text-sm text-ink-muted">{r.detail}</p>}
                    {e.reason && (
                      <p className="mt-1 border-l-2 border-line pl-2.5 text-sm italic text-ink-muted">
                        {e.reason}
                      </p>
                    )}
                    <p className="mt-1 text-xs tabular-nums text-ink-subtle">{meta.join(' · ')}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        </section>
      ))}
    </div>
  );
}
