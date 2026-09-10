'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { ListOrdered, ShieldAlert, Trophy } from 'lucide-react';
import { ContextRequired, PageHeader, PageShell } from '@/components/ui';
import { useScopeContext } from '@/hooks/useScopeContext';
import { useLeague } from '@/services/leagues';
import { IdentityPanel } from '@/components/league/settings/identity-panel';
import { RankingPanel } from '@/components/league/settings/ranking-panel';
import { DangerPanel } from '@/components/league/settings/danger-panel';
import { cn } from '@/utils';

/**
 * Everything a competition is configured by, in one place.
 *
 * It used to be two unrelated pages with no way between them. `/league/settings/general` was a
 * 398-line form written before the design system — « Parametres Generales » in a `shadow-md` box,
 * every field in one grid under one Save. `/league/settings/rules` was the best-considered screen
 * in the module and was reachable **only** from a link beneath the classement, so an organiser
 * looking for « où change-t-on ce qu'une victoire vaut » opened Paramètres, found a name and a
 * visibility dropdown, and concluded the product could not do it.
 *
 * **Tabs, not a second sidebar.** The app already spends 16rem on a left rail, and a nested one at
 * 1280px leaves the form about as wide as a phone. Tabs also match `/game/[gameId]`, which is the
 * only other screen in the product with sections of a single resource — one pattern for "different
 * views of the same thing", rather than a new one per screen.
 *
 * The tab is in the URL, so « Règles du classement » under the table can land on the right one and
 * so a link to it can be sent to somebody.
 */

const TABS = [
  { key: 'identite', label: 'Identité', icon: Trophy },
  { key: 'classement', label: 'Classement', icon: ListOrdered },
  { key: 'danger', label: 'Zone de danger', icon: ShieldAlert },
] as const;

type TabKey = (typeof TABS)[number]['key'];

export default function LeagueSettingsPage() {
  const router = useRouter();
  const params = useSearchParams();
  const ctx = useScopeContext();
  const leagueId = ctx.leagueId;

  const raw = params.get('tab');
  const tab: TabKey = TABS.some((t) => t.key === raw) ? (raw as TabKey) : 'identite';

  const { data: league } = useLeague(leagueId);

  const go = (next: TabKey) => {
    const q = new URLSearchParams(params.toString());
    q.set('tab', next);
    router.replace(`/league/settings?${q.toString()}`, { scroll: false });
  };

  if (ctx.isLoading) return null;
  if (!leagueId) return <ContextRequired what="ligue" />;

  return (
    <PageShell className="max-w-3xl">
      <PageHeader
        title="Paramètres"
        description={league?.name ?? 'Cette compétition et la façon dont son classement est calculé.'}
      >
        {/* Same tab strip as the match page: a quiet row of labels with an underline on the one you
            are reading, not buttons in boxes. */}
        <nav className="-mb-px flex flex-wrap gap-1 border-b border-line" aria-label="Sections">
          {TABS.map((t) => {
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => go(t.key)}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex items-center gap-2 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors',
                  active
                    ? t.key === 'danger'
                      ? 'border-negative text-negative'
                      : 'border-accent text-ink'
                    : 'border-transparent text-ink-muted hover:text-ink',
                )}
              >
                <t.icon className="h-4 w-4 shrink-0" aria-hidden />
                {t.label}
              </button>
            );
          })}
        </nav>
      </PageHeader>

      {tab === 'identite' && <IdentityPanel leagueId={leagueId} />}
      {tab === 'classement' && <RankingPanel leagueId={leagueId} />}
      {tab === 'danger' && <DangerPanel leagueId={leagueId} />}
    </PageShell>
  );
}
