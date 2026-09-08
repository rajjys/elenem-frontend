import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './api';
import type { PostFilterParams, PostResponseDto } from '@/schemas';

/**
 * Publications.
 *
 * The list existed on exactly one surface — the organisation's — and was built the way the product
 * was built before Phase 2: `useState` + `useEffect` + a bare `api.get`, with its own loading flag,
 * its own error string and no cache. `/post/create` redirects to a competition's or a club's list
 * on success, and those two routes rendered « En developpement. Revenez plus tard » — so publishing
 * a post as anyone but a tenant admin ended on a page that said the feature did not exist.
 *
 * Rebuilding all four on one component meant the data access had to come here first: React Query,
 * one key, one invalidation on delete. Spreading the old shape to three more routes would have been
 * the wrong way to fix a broken flow.
 */

export const postKeys = {
  all: ['posts'] as const,
  lists: () => [...postKeys.all, 'list'] as const,
  list: (params: PostFilterParams) => [...postKeys.lists(), params] as const,
};

interface PaginatedPosts {
  data: PostResponseDto[];
  totalItems: number;
  totalPages: number;
}

function toQuery(params: PostFilterParams): string {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    if (Array.isArray(value)) value.forEach((v) => qs.append(key, String(v)));
    else qs.append(key, String(value));
  }
  return qs.toString();
}

export async function fetchPosts(params: PostFilterParams): Promise<PaginatedPosts> {
  const res = await api.get(`/posts?${toQuery(params)}`);
  // Deliberately not `parseResponse`: `PostResponseDto` is an interface rather than a zod schema —
  // rich Lexical content is `any` by design — so there is nothing to validate against. When the
  // post module gets its schema this becomes one line, like every other service here.
  return {
    data: res.data?.data ?? [],
    totalItems: res.data?.totalItems ?? 0,
    totalPages: res.data?.totalPages ?? 1,
  };
}

/** `enabled` is false until the scope is resolved, so no call goes out unscoped. */
export function usePosts(params: PostFilterParams, enabled = true) {
  return useQuery({
    queryKey: postKeys.list(params),
    queryFn: () => fetchPosts(params),
    placeholderData: keepPreviousData,
    enabled,
  });
}

export function useDeletePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (postId: string) => {
      await api.delete(`/posts/${postId}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: postKeys.lists() }),
  });
}
