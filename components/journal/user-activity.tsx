'use client';

import Link from 'next/link';
import { ArrowRight, Loader2 } from 'lucide-react';
import { useJournal } from '@/services/journal';
import { JournalList } from './journal-list';

const SHOWN = 10;

/**
 * A person's recent activity, on their record: what they did, and what happened to their account.
 *
 * Sign-ins included, because this is where « il n’arrive pas à se connecter » is asked. On
 * 2026-10-07 the answer — five wrong passwords at 11:04, one more at 13:11 — was in the log the
 * whole time, with no screen to read it on.
 */
export function UserActivity({ userId, journalHref }: { userId: string; journalHref: string }) {
  const { data, isPending, isError } = useJournal({ userId, includeSignIns: true, pageSize: SHOWN });
  const entries = data?.data ?? [];
  const more = (data?.totalItems ?? 0) > entries.length;

  return (
    <section>
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h2 className="text-lg font-semibold text-ink">Activité</h2>
        {more && (
          <Link
            href={`${journalHref}?userId=${userId}`}
            className="inline-flex items-center gap-1 text-sm text-accent-text hover:underline hover:underline-offset-2"
          >
            Tout voir dans le journal
            <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        )}
      </div>
      {isPending ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-ink-subtle" aria-hidden />
        </div>
      ) : isError ? (
        <p className="text-sm text-ink-muted">Impossible de charger l’activité de ce compte.</p>
      ) : entries.length === 0 ? (
        <p className="rounded-lg border border-dashed border-line px-4 py-8 text-center text-sm text-ink-muted">
          Rien d’enregistré pour ce compte pour l’instant.
        </p>
      ) : (
        <JournalList entries={entries} venues={data?.venues ?? {}} ownerId={userId} />
      )}
    </section>
  );
}
