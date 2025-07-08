// app/(admin)/users/page.tsx
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { api } from '@/services/api';
import { UserBasic, PaginatedUsersResponseSchema, UserFilterParams } from '@/schemas/user-schemas';
import { UsersTable, UserFilters } from '@/components/users';
import { Pagination } from '@/components/ui/'; // Assuming you have a pagination component
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner'; // Assuming you use a toast notification library like Sonner

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<UserBasic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState<UserFilterParams>({
    page: 1,
    pageSize: 10,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      // Append filters to URLSearchParams
      if (filters.search) params.append('search', filters.search);
      if (filters.roles && filters.roles.length > 0) {
        filters.roles.forEach(role => params.append('roles', role));
      }
      if (filters.isActive !== undefined) params.append('isActive', String(filters.isActive));
      if (filters.isVerified !== undefined) params.append('isVerified', String(filters.isVerified));
      if (filters.gender) params.append('gender', filters.gender);
      if (filters.preferredLanguage) params.append('preferredLanguage', filters.preferredLanguage);
      if (filters.tenantId) params.append('tenantId', filters.tenantId);
      if (filters.managingLeagueId) params.append('managingLeagueId', filters.managingLeagueId);
      if (filters.managingTeamId) params.append('managingTeamId', filters.managingTeamId);
      if (filters.page) params.append('page', String(filters.page));
      if (filters.pageSize) params.append('pageSize', String(filters.pageSize));
      if (filters.sortBy) params.append('sortBy', filters.sortBy);
      if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);
      console.log("param: ", params.toString());
      const response = await api.get(`/users?${params.toString()}`);
      const validatedData = PaginatedUsersResponseSchema.parse(response.data);

      setUsers(validatedData.data);
      setTotalItems(validatedData.totalItems);
      setTotalPages(validatedData.totalPages);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch users.';
      setError(errorMessage);
      toast.error('Error fetching users', { description: errorMessage });
      console.error('Fetch users error:', err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleFilterChange = (newFilters: UserFilterParams) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters,
      page: 1, // Reset to first page on any filter change
    }));
  };

  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  const handlePageSizeChange = (newSize: number) => {
    setFilters(prev => ({ ...prev, pageSize: newSize, page: 1 })); // Reset page to 1
  };
type SortableColumn = "firstName" | "lastName" | "username" | "email" | "createdAt" | "updatedAt" | "lastLoginAt";
  const handleSort = (column: SortableColumn) => {
    setFilters(prev => ({
      ...prev,
      sortBy: column,
      sortOrder: prev.sortBy === column && prev.sortOrder === 'asc' ? 'desc' : 'asc',
      page: 1, // Reset to first page on sort change
    }));
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }
    try {
      await api.delete(`/users/${userId}`); // Assuming DELETE /admin/users/:id endpoint
      toast.success('User deleted successfully.');
      fetchUsers(); // Re-fetch users to update the list
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to delete user.';
      toast.error('Error deleting user', { description: errorMessage });
      console.error('Delete user error:', err);
    }
  };

  const handleManageRoles = (userId: string) => {
    // Navigate to a dedicated page or open a modal for role management
    // For now, let's assume a dedicated page (e.g., /admin/users/:id/roles)
    router.push(`/admin/users/${userId}/roles`);
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-4">
        <UserFilters
          filters={filters}
          onFilterChange={handleFilterChange}
          onPageSizeChange={handlePageSizeChange}
        />
        <Link href="/admin/users/create" passHref>
          <Button variant='primary' className='whitespace-nowrap'>Create New User</Button>
        </Link>
      </div>



      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <p className="text-red-500 text-center mt-8">Error: {error}</p>
      ) : (
        <>
          <UsersTable
            users={users}
            onSort={handleSort}
            sortBy={filters.sortBy || 'createdAt'}
            sortOrder={filters.sortOrder || 'desc'}
            onDelete={handleDeleteUser}
            onManageRoles={handleManageRoles}
          />
          <Pagination
            currentPage={filters.page || 1}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </>
      )}
    </div>
  );
}
