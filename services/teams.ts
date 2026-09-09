import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { api } from './api';
import { parseResponse } from './parse-response';
import type { TeamFilterParams } from '@/schemas';

/**
 * What `GET /teams` actually returns, as far as a list needs it.
 *
 * Deliberately **not** `TeamDetailsSchema`. That one is the shape a *form* works with — it requires
 * `externalId` as a uuid, a full `businessProfile`, `managers` — and the list endpoint does not
 * send `externalId` at all. The old page never noticed because it validated its own *request*
 * params and passed the response through unchecked; the first screen to actually parse it went
 * blank.
 *
 * So the list validates what the list renders. A field that appears here is a field on screen, and
 * a field that stops arriving breaks loudly in one place rather than quietly in five.
 */
const TeamListItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string().optional(),
  shortCode: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
  tenantId: z.string(),
  leagueId: z.string(),
  league: z
    .object({ id: z.string(), name: z.string(), division: z.string().nullable().optional() })
    .nullable()
    .optional(),
  businessProfile: z
    .object({ city: z.string().nullable().optional(), logoUrl: z.string().nullable().optional() })
    .nullable()
    .optional(),
});

const PaginatedTeamsSchema = z.object({
  data: z.array(TeamListItemSchema),
  totalItems: z.number(),
  totalPages: z.number(),
  currentPage: z.number(),
  pageSize: z.number(),
});

export type TeamListItem = z.infer<typeof TeamListItemSchema>;

/**
 * Clubs.
 *
 * `/tenant/teams` and `/league/teams` were two near-identical 190-line pages written before Phase 2
 * — `useState` + `useEffect` + a bare `api.get`, their own loading flags, their own error strings,
 * no cache, and a `window.confirm` for deletion. They are one component now, and the data access
 * had to come here first.
 */

export const teamKeys = {
  all: ['teams'] as const,
  lists: () => [...teamKeys.all, 'list'] as const,
  list: (params: TeamFilterParams) => [...teamKeys.lists(), params] as const,
};

function toQuery(params: TeamFilterParams): string {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    qs.append(key, String(value));
  }
  return qs.toString();
}

export async function fetchTeams(params: TeamFilterParams) {
  const res = await api.get(`/teams?${toQuery(params)}`);
  return parseResponse(PaginatedTeamsSchema, res.data);
}

/** `enabled` stays false until the scope is known, so no call goes out unscoped. */
export function useTeams(params: TeamFilterParams, enabled = true) {
  return useQuery({
    queryKey: teamKeys.list(params),
    queryFn: () => fetchTeams(params),
    placeholderData: keepPreviousData,
    enabled,
  });
}

export function useDeleteTeam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (teamId: string) => {
      await api.delete(`/teams/${teamId}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: teamKeys.lists() }),
  });
}
