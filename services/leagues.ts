import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './api';
import { parseResponse } from './parse-response';
import { PaginatedLeaguesResponseSchema } from '@/schemas';

/**
 * Competitions.
 *
 * A federation runs two or three of these — LIPROBAKIN run a men's and a women's championship;
 * LIBAGO add a D2. There is no pagination worth speaking of and nothing to search: the whole list
 * fits on the screen, and a search box over four cards is a control that costs more to read than
 * the reading it saves.
 */

export const leagueKeys = {
  all: ['leagues'] as const,
  list: (tenantId?: string) => [...leagueKeys.all, 'list', tenantId ?? 'scoped'] as const,
};

export function useLeagues(tenantId?: string, enabled = true) {
  return useQuery({
    queryKey: leagueKeys.list(tenantId),
    queryFn: async () => {
      // Ordered by division, the way the calendar orders its competition chips: a federation
      // creates its flagship first and its second division later, so "newest" — the endpoint's
      // default — reliably puts the least interesting competition at the top.
      const res = await api.get('/leagues', {
        params: {
          pageSize: 100,
          sortBy: 'division',
          sortOrder: 'asc',
          ...(tenantId ? { tenantId } : {}),
        },
      });
      return parseResponse(PaginatedLeaguesResponseSchema, res.data);
    },
    enabled,
    staleTime: 60_000,
  });
}

export function useDeleteLeague() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (leagueId: string) => {
      await api.delete(`/leagues/${leagueId}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: leagueKeys.all }),
  });
}
