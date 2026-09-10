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

/**
 * Registers one club.
 *
 * **Name and competition, and that is all the server wants** — `CreateTeamDto` marks everything
 * else `@IsOptional()`, `shortCode` included. The four-step form this replaces asked besides for a
 * logo, a banner, a founding year, a contact e-mail, a website, a tax number and bank details, on
 * a screen an organiser opens to add a club that turned up in week three.
 *
 * Those are not lost, they are *later*: `/team/edit` is where a club's details are filled in once
 * the club exists, which is the only order in which anybody actually has them.
 */
export function useCreateTeam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (dto: { name: string; leagueId: string; shortCode?: string }) => {
      const res = await api.post('/teams', dto);
      return res.data as { id: string; name: string; shortCode?: string | null };
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: teamKeys.all }),
  });
}

export function useUpdateTeam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      dto,
    }: {
      id: string;
      dto: { name?: string; shortCode?: string | null };
    }) => {
      // PUT, not PATCH: `TeamsController` exposes `@Put(':teamId')`, and a PATCH to it 404s with
      // « Cannot PATCH /teams/… » — which is what every rename from the clubs list did.
      const res = await api.put(`/teams/${id}`, dto);
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: teamKeys.all }),
  });
}

/**
 * A short code from a club's name, the way a results table would write it.
 *
 * « BC Virunga » → VIR, « Nyiragongo BC » → NYI, « AS Goma » → ASG. The rule: drop the words a
 * basketball club's name is padded with — BC, AS, FC, CS — then take the first three letters of
 * what is left, or the initials when several words remain. It is a *suggestion*: the field stays
 * editable, because two clubs in one town can genuinely both shorten to KIV and only the organiser
 * knows which one gets it.
 */
const PADDING = new Set(['BC', 'AS', 'FC', 'CS', 'SC', 'AC', 'US', 'CF', 'ASD', 'BBC']);

export function suggestShortCode(name: string): string {
  const words = name
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
  const meaningful = words.filter((w) => !PADDING.has(w));
  const source = meaningful.length ? meaningful : words;
  if (!source.length) return '';
  if (source.length >= 3) return source.slice(0, 3).map((w) => w[0]).join('');
  if (source.length === 2) return (source[0].slice(0, 2) + source[1][0]).slice(0, 3);
  return source[0].slice(0, 3);
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
