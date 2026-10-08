'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ScrollText, X } from 'lucide-react';
import { ListPage, ListToolbar, SelectField } from '@/components/ui';
import { useJournal, type JournalCategory } from '@/services/journal';
import { useUser } from '@/services/users';
import { useTenants } from '@/services/tenants';
import { useIsSystemAdmin } from '@/hooks';
import { de } from '@/utils/french';
import { JournalList } from './journal-list';

const PAGE_SIZE = 30;


const CATEGORY_OPTIONS: { value: JournalCategory; label: string }[] = [
  { value: 'CALENDAR', label: 'Matchs et calendrier' },
  { value: 'SEASONS', label: 'Compétitions et saisons' },
  { value: 'CLUBS', label: 'Clubs et salles' },
  { value: 'PLAYERS', label: 'Joueurs' },
  { value: 'NEWS', label: 'Actualités' },
  { value: 'ORGANISATION', label: 'Organisation' },
  { value: 'ACCOUNTS', label: 'Comptes' },
];

/**
 * The journal: what happened, by whom, and why.
 *
 * Until 2026-10-07 the audit log could be read one match at a time, from that match's history
 * tab, and nothing else. « Qui a corrigé ce score ? », « pourquoi ce compte est-il bloqué ? » had
 * no screen; the second one took a database session to answer.
 *
 * A system administrator reads the whole platform and may narrow to one organisation; an
 * organisation's administrator reads their own. The API enforces that — this page only narrows.
 * `?userId=` narrows to one person, which is how « Tout voir » on a user's record arrives here.
 *
 * Sign-ins are off by default: they are already a tenth of the log and grow with every visit, and
 * a journal that is mostly « Connexion » buries the changes it exists for.
 */
export function JournalView({ usersBasePath }: { usersBasePath: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const userId = useSearchParams().get('userId') ?? undefined;
  const isSystemAdmin = useIsSystemAdmin();

  const [page, setPage] = useState(1);
  const [category, setCategory] = useState('');
  const [includeSignIns, setIncludeSignIns] = useState(false);
  const [tenantId, setTenantId] = useState('');

  useEffect(() => setPage(1), [category, includeSignIns, tenantId, userId]);

  const { data, isLoading, isError, refetch } = useJournal({
    page,
    pageSize: PAGE_SIZE,
    userId,
    category: (category || undefined) as JournalCategory | undefined,
    // Looking at one person, their sign-ins are the point: it is where a lock-out shows.
    includeSignIns: includeSignIns || !!userId,
    tenantId: tenantId || undefined,
  });
  const { data: person } = useUser(userId);

  const entries = data?.data ?? [];
  const total = data?.totalItems ?? 0;
  const personName = person
    ? [person.firstName, person.lastName].filter(Boolean).join(' ') || person.username
    : null;
  const narrowed = !!(category || tenantId || userId);

  return (
    <ListPage
      title="Journal"
      description={`Ce qui a changé, qui l’a fait, et pourquoi · ${total} ${total === 1 ? 'entrée' : 'entrées'}`}
      filters={
        <div className="space-y-3">
          {userId && (
            <div className="inline-flex items-center gap-2 rounded-full border border-accent-line bg-accent-soft py-1 pl-3 pr-1 text-sm text-accent-text">
              {personName ? `Activité ${de(personName)}` : 'Activité d’une personne'}
              <button
                type="button"
                onClick={() => router.replace(pathname)}
                className="rounded-full p-1 hover:bg-accent-line/40"
                aria-label="Voir tout le journal"
              >
                <X className="h-3.5 w-3.5" aria-hidden />
              </button>
            </div>
          )}
          <ListToolbar>
            {isSystemAdmin && <OrganisationFilter value={tenantId} onChange={setTenantId} />}
            <SelectField
              label="Type"
              placeholder="Tout"
              value={category}
              onChange={setCategory}
              className="w-56"
              options={CATEGORY_OPTIONS}
            />
            {!userId && (
              <label className="inline-flex h-9 cursor-pointer select-none items-center gap-2 rounded-md border border-line bg-surface px-3 text-sm text-ink-muted hover:text-ink">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-accent"
                  checked={includeSignIns}
                  onChange={(e) => setIncludeSignIns(e.target.checked)}
                />
                Afficher les connexions
              </label>
            )}
          </ListToolbar>
        </div>
      }
      isLoading={isLoading}
      isError={isError}
      onRetry={() => refetch()}
      isEmpty={entries.length === 0}
      empty={
        <div className="rounded-lg border border-dashed border-line bg-surface py-16 text-center">
          <ScrollText className="mx-auto mb-3 h-8 w-8 text-ink-subtle" aria-hidden />
          <p className="font-medium text-ink">
            {narrowed ? 'Rien à afficher pour ce filtre' : 'Rien n’a encore été enregistré'}
          </p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-ink-muted">
            {narrowed
              ? 'Essayez un autre type, ou retirez le filtre.'
              : 'Chaque match programmé, score saisi ou compte débloqué apparaîtra ici.'}
          </p>
        </div>
      }
      page={page}
      totalPages={data?.totalPages ?? 1}
      onPageChange={setPage}
    >
      <JournalList
        entries={entries}
        venues={data?.venues ?? {}}
        usersBasePath={usersBasePath}
        showOrganisation={isSystemAdmin && !tenantId}
      />
    </ListPage>
  );
}

/** Its own component so only a system administrator ever asks for the list of organisations. */
function OrganisationFilter({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const { data: tenants } = useTenants({ pageSize: 100, sortBy: 'name', sortOrder: 'asc' });
  return (
    <SelectField
      label="Organisation"
      placeholder="Toutes les organisations"
      value={value}
      onChange={onChange}
      className="w-60"
      options={(tenants?.data ?? []).map((t) => ({ value: t.id, label: t.name }))}
    />
  );
}
