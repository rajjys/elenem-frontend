'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Check, ChevronDown, Search } from 'lucide-react';
import { api } from '@/services/api';
import { cn } from '@/utils/cn';

/**
 * The current breadcrumb entity, as a dropdown of its siblings.
 *
 * Only the *current* level is a switcher; everything above it stays a plain link. Managing a team
 * is not the moment to change organisation, so `LIBAGO > D1 M > VIR` offers a team list on VIR and
 * nothing on the two ancestors. That keeps exactly one dropdown on screen and makes "switch to the
 * next team" a single click instead of a walk back up and down the tree.
 *
 * Switching lands on the new subject's dashboard. Picking a different team is not "same task,
 * different row" — you are picking up a different thing, and it also avoids landing on a page that
 * made sense for the old subject and not the new one.
 *
 * The list scales in three steps, because a 5-team league and a 25-team league want different
 * things: show everything up to 5; show 5 and a "show all" for 6–10; add a search box past 10.
 */

export type ScopeKind = 'tenant' | 'league' | 'team';

interface Sibling {
  id: string;
  name: string;
  short: string;
}

const PARAM: Record<ScopeKind, string> = {
  tenant: 'ctxTenantId',
  league: 'ctxLeagueId',
  team: 'ctxTeamId',
};

/** Where a switch lands. */
const HOME: Record<ScopeKind, string> = {
  tenant: '/tenant/dashboard',
  league: '/league/dashboard',
  team: '/team/dashboard',
};

const INITIAL_VISIBLE = 5;
const SEARCH_THRESHOLD = 10;

export function ScopeSwitcher({
  kind,
  current,
  parentId,
  enabled = true,
}: {
  kind: ScopeKind;
  current: { id: string; name: string; short: string };
  /** tenantId for leagues, leagueId for teams. Tenants have no parent. */
  parentId?: string;
  enabled?: boolean;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [open, setOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['siblings', kind, parentId],
    queryFn: async (): Promise<Sibling[]> => {
      if (kind === 'tenant') {
        const r = await api.get('/tenants?pageSize=100');
        return (r.data?.data ?? []).map((t: any) => ({
          id: t.id,
          name: t.name,
          short: t.tenantCode ?? t.name,
        }));
      }
      if (kind === 'league') {
        const r = await api.get(`/leagues?pageSize=100${parentId ? `&tenantId=${parentId}` : ''}`);
        type LeagueRow = { id: string; name: string; division?: string | null; gender?: string | null };
        const leagues: LeagueRow[] = r.data?.data ?? [];

        // "D1 M" is a good short label right up until a second D1 Messieurs exists, at which
        // point the breadcrumb names two different competitions identically and the switcher
        // offers you a choice between two things that look the same. So the abbreviation is used
        // only while it still distinguishes; otherwise the league's own name is.
        const abbrev = (l: LeagueRow) =>
          l.division && l.gender ? `${l.division} ${l.gender === 'FEMALE' ? 'F' : 'M'}` : null;
        const counts = new Map<string, number>();
        for (const l of leagues) {
          const a = abbrev(l);
          if (a) counts.set(a, (counts.get(a) ?? 0) + 1);
        }

        return leagues.map((l) => {
          const a = abbrev(l);
          return {
            id: l.id,
            name: l.name,
            short: a && counts.get(a) === 1 ? a : l.name,
          };
        });
      }
      const r = await api.get(`/teams?pageSize=100${parentId ? `&leagueId=${parentId}` : ''}`);
      return (r.data?.data ?? []).map((t: any) => ({
        id: t.id,
        name: t.name,
        short: t.shortCode ?? t.name,
      }));
    },
    // Only pay for the list once someone actually opens the menu.
    enabled: enabled && open,
    staleTime: 5 * 60 * 1000,
  });

  const siblings = useMemo(() => data ?? [], [data]);
  const needsSearch = siblings.length > SEARCH_THRESHOLD;

  const filtered = useMemo(() => {
    if (!query.trim()) return siblings;
    const q = query.trim().toLowerCase();
    return siblings.filter(
      (s) => s.name.toLowerCase().includes(q) || s.short.toLowerCase().includes(q),
    );
  }, [siblings, query]);

  const visible =
    needsSearch || showAll || filtered.length <= INITIAL_VISIBLE
      ? filtered
      : filtered.slice(0, INITIAL_VISIBLE);
  const hiddenCount = filtered.length - visible.length;

  useEffect(() => {
    if (!open) {
      setQuery('');
      setShowAll(false);
      return;
    }
    const onPointer = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const switchTo = (id: string) => {
    const next = new URLSearchParams(params.toString());
    next.set(PARAM[kind], id);
    // Changing the subject drops anything scoped beneath it.
    if (kind === 'tenant') {
      next.delete('ctxLeagueId');
      next.delete('ctxTeamId');
    }
    if (kind === 'league') next.delete('ctxTeamId');
    next.delete('ctxGameId');
    setOpen(false);
    // Land on the new subject's dashboard rather than the equivalent sub-page. Switching team is
    // not "same task, different row" — you are picking up a different thing, and the dashboard is
    // where you get your bearings. It also avoids landing on a page that made sense for the old
    // subject and not the new one.
    router.push(`${HOME[kind]}?${next.toString()}`);
  };

  if (!enabled) {
    return (
      <span title={current.name} className="px-1 font-medium text-ink-muted">
        {current.short}
      </span>
    );
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        title={current.name}
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1 rounded px-1 py-0.5 font-medium text-ink transition-colors hover:bg-surface-sunk focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent"
      >
        {current.short}
        <ChevronDown className={cn('h-3.5 w-3.5 text-ink-subtle transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute left-0 top-full z-50 mt-1.5 w-64 overflow-hidden rounded-lg border border-line bg-elevated py-1 shadow-e2"
        >
          {needsSearch && (
            <div className="border-b border-line p-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-subtle" />
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Rechercher…"
                  className="w-full rounded-md border border-line bg-surface py-1.5 pl-8 pr-2 text-sm text-ink placeholder:text-ink-subtle focus:border-accent focus:outline-none"
                />
              </div>
            </div>
          )}

          <div className="max-h-72 overflow-y-auto py-1">
            {isLoading && <p className="px-3 py-2 text-sm text-ink-muted">Chargement…</p>}
            {!isLoading && filtered.length === 0 && (
              <p className="px-3 py-2 text-sm text-ink-muted">Aucun résultat.</p>
            )}
            {visible.map((s) => {
              const active = s.id === current.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  role="option"
                  aria-selected={active}
                  onClick={() => switchTo(s.id)}
                  className={cn(
                    'flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors',
                    active ? 'bg-accent-soft text-accent-text' : 'text-ink-muted hover:bg-surface-sunk hover:text-ink',
                  )}
                >
                  <span className="w-10 shrink-0 font-mono text-xs text-ink-subtle">{s.short}</span>
                  <span className="min-w-0 flex-1 truncate">{s.name}</span>
                  {active && <Check className="h-3.5 w-3.5 shrink-0" />}
                </button>
              );
            })}
          </div>

          {hiddenCount > 0 && (
            <button
              type="button"
              onClick={() => setShowAll(true)}
              className="w-full border-t border-line px-3 py-2 text-left text-sm text-accent-text transition-colors hover:bg-surface-sunk"
            >
              Afficher les {hiddenCount} autres
            </button>
          )}
        </div>
      )}
    </div>
  );
}
