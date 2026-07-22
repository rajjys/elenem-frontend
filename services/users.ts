import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from './api';
import type { ApiSchema } from '@/types/api-types';

// Types come from the generated OpenAPI contract (source of truth).
export type UserResponse = ApiSchema<'UserResponseDto'>;

export const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  details: () => [...userKeys.all, 'detail'] as const,
  detail: (id: string) => [...userKeys.details(), id] as const,
};

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
