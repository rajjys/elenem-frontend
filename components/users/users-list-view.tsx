'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { UserFilters } from './user-filters';
import { UsersTable } from './users-table';
import { Pagination, LoadingSpinner, Button } from '@/components/ui';
import { useUsers, useDeleteUser } from '@/services/users';
import { toastApiError } from '@/utils';
import type { UserFilterParams } from '@/schemas/user-schemas';

// Reusable, scope-agnostic users list. The backend already scopes GET /users by
// the caller's role, so admin/tenant/league/team all mount this with just a
// different basePath (detail route) and optional create link.
type SortableColumn = 'firstName' | 'lastName' | 'username' | 'email' | 'createdAt' | 'updatedAt' | 'lastLoginAt';

export function UsersListView({ basePath, createHref }: { basePath: string; createHref?: string }) {
  const router = useRouter();
  const [filters, setFilters] = useState<UserFilterParams>({
    page: 1,
    pageSize: 10,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });
  const { data, isLoading, isError } = useUsers(filters);
  const del = useDeleteUser();

  const users = data?.data ?? [];
  const totalPages = data?.totalPages ?? 1;

  const handleFilterChange = (nf: UserFilterParams) => setFilters((p) => ({ ...p, ...nf, page: 1 }));
  const handlePageChange = (page: number) => setFilters((p) => ({ ...p, page }));
  const handlePageSizeChange = (pageSize: number) => setFilters((p) => ({ ...p, pageSize, page: 1 }));
  const handleSort = (col: SortableColumn) =>
    setFilters((p) => ({
      ...p,
      sortBy: col,
      sortOrder: p.sortBy === col && p.sortOrder === 'asc' ? 'desc' : 'asc',
      page: 1,
    }));
  const handleDelete = (id: string) => {
    if (!window.confirm('Supprimer cet utilisateur ?')) return;
    del.mutate(id, { onSuccess: () => toast.success('Utilisateur supprimé.'), onError: (e) => toastApiError(e) });
  };
  const handleManageRoles = (id: string) => router.push(`${basePath}/${id}`);

  return (
    <div className="container mx-auto p-6">
      {isError && <p className="pb-2 text-red-400">Erreur lors du chargement des utilisateurs.</p>}
      <div className="mb-4 flex items-center justify-between gap-3">
        <UserFilters filters={filters} onFilterChange={handleFilterChange} onPageSizeChange={handlePageSizeChange} />
        {createHref && (
          <Link href={createHref}>
            <Button variant="primary" className="whitespace-nowrap">Nouvel utilisateur</Button>
          </Link>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><LoadingSpinner /></div>
      ) : (
        <>
          <UsersTable
            users={users}
            onSort={handleSort}
            sortBy={filters.sortBy || 'createdAt'}
            sortOrder={filters.sortOrder || 'desc'}
            onDelete={handleDelete}
            onManageRoles={handleManageRoles}
            basePath={basePath}
          />
          <Pagination currentPage={filters.page || 1} totalPages={totalPages} onPageChange={handlePageChange} />
        </>
      )}
    </div>
  );
}
