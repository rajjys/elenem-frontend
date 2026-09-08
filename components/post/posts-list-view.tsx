'use client';

import { useCallback, useMemo, useState } from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { ConfirmDialog, ListPage } from '@/components/ui';
import { useContextualLink } from '@/hooks';
import { useScopeContext } from '@/hooks/useScopeContext';
import { useAuthStore } from '@/store/auth.store';
import { PostTargetType, Roles, type PostFilterParams, type PostResponseDto } from '@/schemas';
import { usePosts, useDeletePost } from '@/services/posts';
import { toastApiError } from '@/utils';
import { PostsFilters } from './posts-filters';
import { PostsTable } from './posts-table';

type SortableColumn =
  | 'title' | 'type' | 'status' | 'tenantName' | 'leagueName' | 'teamName'
  | 'createdAt' | 'publishedAt';

/**
 * Publications, on whichever surface the reader administers.
 *
 * One component for four scopes, the way `StandingsView` and `PlayerStatsView` are one component
 * for three. It replaces a list that existed only for the organisation, alongside three routes that
 * rendered « En developpement. Revenez plus tard » — and `/post/create` **redirects to those three
 * on success**, so a league or club administrator who published a post landed on a page telling
 * them the feature did not exist.
 *
 * The scope is a filter the reader cannot edit: a club administrator looking at their club's
 * publications should not be able to filter their way out of them. `GET /posts` is scoped by the
 * caller's role on the server as well, so this decides what is *asked for*, not what is permitted.
 */
export function PostsListView({
  scope,
}: {
  scope: 'platform' | 'tenant' | 'league' | 'team';
}) {
  const { user } = useAuthStore();
  const ctx = useScopeContext();
  const { buildLink } = useContextualLink();
  const roles = useMemo(() => user?.roles ?? [], [user?.roles]);

  // A system administrator has no organisation of their own, so their list is the platform's —
  // every post on it — and the tenant filter stays theirs to set.
  const tenantId = scope === 'platform' ? undefined : (ctx.tenantId ?? user?.tenantId ?? undefined);
  const targetId =
    scope === 'league' ? ctx.leagueId : scope === 'team' ? (user?.managingTeamId ?? ctx.teamId) : undefined;

  const pinned: PostFilterParams = useMemo(
    () => ({
      ...(tenantId ? { tenantId } : {}),
      ...(scope === 'league' && targetId ? { targetType: PostTargetType.LEAGUE, targetId } : {}),
      ...(scope === 'team' && targetId ? { targetType: PostTargetType.TEAM, targetId } : {}),
    }),
    [tenantId, scope, targetId],
  );

  const [filters, setFilters] = useState<PostFilterParams>({
    page: 1,
    pageSize: 10,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });
  const [toDelete, setToDelete] = useState<PostResponseDto | null>(null);

  const query = useMemo(() => ({ ...filters, ...pinned }), [filters, pinned]);

  // Nothing goes out until the scope is known, or a league's list would spend its first render
  // asking for every publication in the organisation.
  const ready = scope === 'platform' || (!!tenantId && (scope === 'tenant' || !!targetId));
  const { data, isLoading, isError, refetch } = usePosts(query, ready);
  const del = useDeletePost();

  const posts = data?.data ?? [];
  const totalItems = data?.totalItems ?? 0;

  const handleFilterChange = useCallback(
    (next: PostFilterParams) => setFilters((prev) => ({ ...prev, ...next, page: 1 })),
    [],
  );

  const handleSort = useCallback(
    (column: SortableColumn) =>
      setFilters((prev) => ({
        ...prev,
        sortBy: column,
        sortOrder: prev.sortBy === column && prev.sortOrder === 'asc' ? 'desc' : 'asc',
        page: 1,
      })),
    [],
  );

  const confirmDelete = () => {
    if (!toDelete) return;
    del.mutate(toDelete.id, {
      onSuccess: () => toast.success(`« ${toDelete.title} » supprimée.`),
      onError: (e) => toastApiError(e),
    });
    setToDelete(null);
  };

  const canPublish = roles.some(
    (r) =>
      r === Roles.SYSTEM_ADMIN ||
      r === Roles.TENANT_ADMIN ||
      r === Roles.LEAGUE_ADMIN ||
      r === Roles.TEAM_ADMIN,
  );

  return (
    <ListPage
      title="Actualités"
      description={`${totalItems} ${totalItems === 1 ? 'publication' : 'publications'}`}
      filters={
        <PostsFilters
          filters={filters}
          onFilterChange={handleFilterChange}
          onPageSizeChange={(size) => setFilters((p) => ({ ...p, pageSize: size, page: 1 }))}
          fixedTenantId={tenantId ?? null}
        />
      }
      isLoading={isLoading}
      isError={isError}
      onRetry={() => refetch()}
      isEmpty={posts.length === 0}
      empty={
        <div className="rounded-lg border border-dashed border-line bg-surface py-16 text-center">
          <p className="font-medium text-ink">Aucune publication pour le moment</p>
          {canPublish && (
            <Link
              href={buildLink('/post/create')}
              className="mt-4 inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm soft-theme-gradient"
            >
              <Plus className="h-4 w-4" aria-hidden />
              Nouvelle publication
            </Link>
          )}
        </div>
      }
      page={filters.page ?? 1}
      totalPages={data?.totalPages ?? 1}
      onPageChange={(page) => setFilters((p) => ({ ...p, page }))}
      action={
        canPublish
          ? { label: 'Nouvelle publication', href: buildLink('/post/create') }
          : undefined
      }
    >
      <>
        <PostsTable
          posts={posts}
          onSort={handleSort}
          sortBy={filters.sortBy ?? 'createdAt'}
          sortOrder={filters.sortOrder ?? 'desc'}
          onDelete={(id) => setToDelete(posts.find((p) => p.id === id) ?? null)}
          currentUserRoles={roles}
          currentTenantId={tenantId ?? null}
        />

        {/* The old page asked with `window.confirm`, which is the browser's dialog rather than the
            product's and cannot say what is being deleted in the product's own words. */}
        <ConfirmDialog
          open={!!toDelete}
          onOpenChange={(o) => !o && setToDelete(null)}
          title="Supprimer cette publication ?"
          description={
            toDelete ? `« ${toDelete.title} » sera définitivement supprimée.` : undefined
          }
          confirmLabel="Supprimer"
          onConfirm={confirmDelete}
        />
      </>
    </ListPage>
  );
}
