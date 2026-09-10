import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
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

/**
 * One competition, in full.
 *
 * A lean row schema like the list's would be wrong here: the settings screen is where every field
 * a competition has is edited, so it needs them all, and a field arriving `null` is a field the
 * form shows empty rather than one that breaks the parse.
 */
const LeagueDetailSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string().optional(),
  division: z.string().nullable().optional(),
  gender: z.string().nullable().optional(),
  visibility: z.string().nullable().optional(),
  isActive: z.boolean().nullable().optional(),
  leagueType: z.string().nullable().optional(),
  competitionType: z.string().nullable().optional(),
  tenantId: z.string(),
  currentSeasonId: z.string().nullable().optional(),
  currentSeason: z
    .object({ id: z.string(), name: z.string() })
    .nullable()
    .optional(),
  teams: z.array(z.unknown()).nullable().optional(),
  players: z.array(z.unknown()).nullable().optional(),
  businessProfile: z
    .object({
      description: z.string().nullable().optional(),
      city: z.string().nullable().optional(),
      logoUrl: z.string().nullable().optional(),
    })
    .nullable()
    .optional(),
});

export type LeagueDetail = z.infer<typeof LeagueDetailSchema>;

export function useLeague(leagueId?: string) {
  return useQuery({
    queryKey: [...leagueKeys.all, 'detail', leagueId],
    queryFn: async () => {
      const res = await api.get(`/leagues/${leagueId}`);
      return parseResponse(LeagueDetailSchema, res.data);
    },
    enabled: !!leagueId,
    staleTime: 60_000,
  });
}

/**
 * Its identity.
 *
 * Deliberately separate from `services/setup.ts#useUpdateLeague`, which sends the three fields the
 * wizard collects and is right to. This is the settings form, and sends what the settings form has.
 */
export function useUpdateLeague() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...dto
    }: {
      id: string;
      name?: string;
      division?: string;
      gender?: string;
      visibility?: string;
      isActive?: boolean;
    }) => {
      const res = await api.put(`/leagues/${id}`, dto);
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: leagueKeys.all }),
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
