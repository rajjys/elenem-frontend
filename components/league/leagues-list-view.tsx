'use client';

import { useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Trophy } from 'lucide-react';
import { Button, ConfirmDialog, LeagueCard, ListPage } from '@/components/ui';
import { useScopeContext } from '@/hooks/useScopeContext';
import { useAuthStore } from '@/store/auth.store';
import { Roles, type LeagueDetails } from '@/schemas';
import { useLeagues, useDeleteLeague } from '@/services/leagues';
import { toastApiError } from '@/utils';

/**
 * The organisation's competitions.
 *
 * **No search, no filters, and that is the decision.** A federation runs two or three of these —
 * LIPROBAKIN a men's and a women's championship, LIBAGO those plus a D2 — so the whole list is on
 * the screen before anybody could finish typing. A search box over four cards is a control that
 * costs more to read than the reading it saves, and every list that grows one "for consistency"
 * teaches the reader that the controls up there are furniture.
 *
 * Cards rather than a table, kept from the page this replaces: a competition is a thing you *enter*
 * — its season, its calendar, its table all hang off it — not a row you compare against its
 * neighbours. Clubs and players are rows; competitions are doors.
 *
 * What it gains is the header every other list has. The page had none, so you arrived at a stack of
 * cards and worked out what they were from the sidebar.
 */
export function LeaguesListView() {
  const ctx = useScopeContext();
  const user = useAuthStore((s) => s.user);
  const roles = user?.roles ?? [];
  const canManage = roles.some((r) => r === Roles.SYSTEM_ADMIN || r === Roles.TENANT_ADMIN);

  const tenantId = ctx.tenantId ?? user?.tenantId ?? undefined;
  const [toDelete, setToDelete] = useState<LeagueDetails | null>(null);

  const { data, isLoading, isError, refetch } = useLeagues(tenantId, !!tenantId);
  const del = useDeleteLeague();

  const leagues = data?.data ?? [];

  const confirmDelete = () => {
    if (!toDelete) return;
    del.mutate(toDelete.id, {
      onSuccess: () => toast.success(`${toDelete.name} supprimée.`),
      onError: (e) => toastApiError(e),
    });
    setToDelete(null);
  };

  return (
    <ListPage
      title="Compétitions"
      description={
        leagues.length
          ? `${leagues.length} ${leagues.length === 1 ? 'compétition' : 'compétitions'}`
          : undefined
      }
      // The guided path, not a form.
      //
      // A competition is useless on its own: it needs a season before it can hold a fixture and
      // clubs before it can hold a calendar, and `SetupWizard` already sequences exactly that —
      // writing at each step, so a competition that exists is useful even if the organiser stops
      // there. It was built for onboarding and its own comment says it is meant to be reachable
      // again « for an organiser who is adding a second competition »; nothing linked to it. The
      // 970-line four-step form that this CTA used to open is gone.
      action={canManage ? { label: 'Nouvelle compétition', href: '/onboarding' } : undefined}
      isLoading={isLoading}
      isError={isError}
      onRetry={() => refetch()}
      isEmpty={leagues.length === 0}
      empty={
        <div className="rounded-lg border border-dashed border-line bg-surface py-16 text-center">
          <Trophy className="mx-auto mb-3 h-8 w-8 text-ink-subtle" aria-hidden />
          <p className="font-medium text-ink">Aucune compétition pour le moment</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-ink-muted">
            Une compétition porte les saisons, et une saison porte le calendrier et le classement.
            C’est par là que tout commence.
          </p>
          {canManage && (
            <Button variant="primary" className="mt-4" asChild>
              <Link href="/onboarding">Créer une compétition</Link>
            </Button>
          )}
        </div>
      }
    >
      <>
        <div>
          {leagues.map((league) => (
            <LeagueCard
              key={league.id}
              league={league}
              onDeleteLeague={() => setToDelete(league)}
            />
          ))}
        </div>

        <ConfirmDialog
          open={!!toDelete}
          onOpenChange={(o) => !o && setToDelete(null)}
          title="Supprimer cette compétition ?"
          description={
            toDelete
              ? `${toDelete.name}, ses saisons, ses phases et son calendrier seront supprimés. Cette action est irréversible.`
              : undefined
          }
          confirmLabel="Supprimer"
          onConfirm={confirmDelete}
        />
      </>
    </ListPage>
  );
}
