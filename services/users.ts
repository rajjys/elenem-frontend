import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { api } from './api';
import type { ApiSchema } from '@/types/api-types';
import type { UserBasic, UserFilterParams } from '@/schemas/user-schemas';

// Types come from the generated OpenAPI contract (source of truth).
export type UserResponse = ApiSchema<'UserResponseDto'>;

export interface UsersPage {
  data: UserBasic[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

export const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  list: (params: UserFilterParams) => [...userKeys.lists(), params] as const,
  details: () => [...userKeys.all, 'detail'] as const,
  detail: (id: string) => [...userKeys.details(), id] as const,
};

function toQuery(params: UserFilterParams): string {
  const qs = new URLSearchParams();
  if (params.search) qs.append('search', params.search);
  params.roles?.forEach((r) => qs.append('roles', r));
  if (params.isActive !== undefined) qs.append('isActive', String(params.isActive));
  if (params.isEmailVerified !== undefined) qs.append('isEmailVerified', String(params.isEmailVerified));
  if (params.gender) qs.append('gender', params.gender);
  if (params.preferredLanguage) qs.append('preferredLanguage', params.preferredLanguage);
  if (params.tenantId) qs.append('tenantId', params.tenantId);
  if (params.managingLeagueId) qs.append('managingLeagueId', params.managingLeagueId);
  if (params.managingTeamId) qs.append('managingTeamId', params.managingTeamId);
  if (params.managingTeamId) qs.append('managingTeamId', params.managingTeamId);
  if (params.page) qs.append('page', String(params.page));
  if (params.pageSize) qs.append('pageSize', String(params.pageSize));
  if (params.sortBy) qs.append('sortBy', params.sortBy);
  if (params.sortOrder) qs.append('sortOrder', params.sortOrder);
  return qs.toString();
}

export async function fetchUsers(params: UserFilterParams): Promise<UsersPage> {
  const res = await api.get(`/users?${toQuery(params)}`);
  return res.data as UsersPage;
}

export function useUsers(params: UserFilterParams) {
  return useQuery({
    queryKey: userKeys.list(params),
    queryFn: () => fetchUsers(params),
    placeholderData: keepPreviousData,
  });
}

export async function fetchUser(id: string): Promise<UserResponse> {
  const res = await api.get(`/users/${id}`);
  return res.data as UserResponse;
}

export async function deleteUser(id: string): Promise<void> {
  await api.delete(`/users/${id}`);
}

export async function setUserEmailVerified(id: string, isEmailVerified: boolean): Promise<void> {
  await api.put(`/users/${id}`, { isEmailVerified });
}

export function useUser(id: string | undefined) {
  return useQuery({
    queryKey: userKeys.detail(id ?? ''),
    queryFn: () => fetchUser(id as string),
    enabled: !!id,
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteUser,
    onSuccess: () => qc.invalidateQueries({ queryKey: userKeys.lists() }),
  });
}

export function useSetUserEmailVerified() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, value }: { id: string; value: boolean }) => setUserEmailVerified(id, value),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: userKeys.detail(vars.id) });
      qc.invalidateQueries({ queryKey: userKeys.lists() });
    },
  });
}
