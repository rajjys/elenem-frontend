import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { api } from './api';
import { parseResponse } from './parse-response';
import { SeasonStatus } from '@/schemas';

/**
 * A competition's seasons — its *editions*, which is the customer's own word: their published
 * calendar is headed « CALENDRIER DU CHAMPIONNAT LOCAL EUBAGO 2026 / PLAYOFFS · 31ème ÉDITION ».
 *
 * The screen this serves is the only place in the product that shows more than one season at once,
 * which is why the acts on a season live there rather than on a page of their own: `/season` and
 * `/season/[seasonId]/dashboard` were stubs rendering their own names, and every job a season
 * screen might have held already has a better home — fixtures on the calendar, the table on the
 * standings screen, the points rule in the competition's settings. See
 * docs/SEASON_AND_DASHBOARDS.md §4.
 */

const SeasonRowSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string().optional(),
  description: z.string().nullable().optional(),
  status: z.nativeEnum(SeasonStatus),
  startDate: z.string(),
  endDate: z.string(),
  leagueId: z.string(),
  tenantId: z.string(),
  /** Fixtures on record, cancelled ones excluded. */
  fixtureCount: z.number(),
  /** How many of them have a result. */
  playedCount: z.number(),
  league: z
    .object({ id: z.string(), name: z.string(), slug: z.string().optional() })
    .nullable()
    .optional(),
  tenant: z
    .object({ id: z.string(), name: z.string(), tenantCode: z.string().optional() })
    .nullable()
    .optional(),
});

const SeasonsPageSchema = z.object({
  data: z.array(SeasonRowSchema),
  totalItems: z.number(),
  totalPages: z.number(),
  currentPage: z.number(),
  pageSize: z.number(),
});

export type SeasonRow = z.infer<typeof SeasonRowSchema>;

export interface SeasonsQuery {
  /** Omit on the platform-wide list; supply it on a competition's own screen. */
  leagueId?: string;
  tenantId?: string;
  status?: SeasonStatus;
  q?: string;
  page?: number;
  pageSize?: number;
}

export function useSeasons(query: SeasonsQuery, enabled = true) {
  return useQuery({
    queryKey: ['seasons', query],
    queryFn: async () => {
      const res = await api.get('/seasons', {
        params: {
          ...query,
          // Editions are read newest first: a league opens this screen to act on the season it is
          // in, not to browse its history.
          sortBy: 'startDate',
          sortOrder: 'desc',
          pageSize: query.pageSize ?? 20,
        },
      });
      return parseResponse(SeasonsPageSchema, res.data);
    },
    enabled,
    staleTime: 30_000,
  });
}

export interface SeasonEssentials {
  name: string;
  startDate: string;
  endDate: string;
  description?: string;
}

/**
 * A season is created in preparation, always.
 *
 * There is no `status` to send: the server refuses one outright rather than ignoring it, and the
 * one transition that happens on its own — a season opening on its first result — is the state
 * machine's, not a caller's guess from a start date.
 */
export function useCreateSeason() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: SeasonEssentials & { leagueId: string }) => {
      const res = await api.post('/seasons', values);
      return parseResponse(SeasonRowSchema.partial({ fixtureCount: true, playedCount: true }), res.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seasons'] });
      // The pointer may have moved to this season, and that decides where the next fixture lands
      // and which table the standings show.
      queryClient.invalidateQueries({ queryKey: ['standings'] });
    },
  });
}

export function useUpdateSeason() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...values }: Partial<SeasonEssentials> & { id: string }) => {
      const res = await api.put(`/seasons/${id}`, values);
      return parseResponse(SeasonRowSchema.partial({ fixtureCount: true, playedCount: true }), res.data);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['seasons'] }),
  });
}

/**
 * Move a season.
 *
 * `reason` is required for every move except opening one — the others stop a result being
 * recorded, void a table, or change a classification the competition has already published, and
 * the server refuses them without it. The client offers the verbs; the server is the authority on
 * which are legal, and refuses the rest in French naming both states.
 */
export function useTransitionSeason() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      status,
      reason,
    }: {
      id: string;
      status: SeasonStatus;
      reason?: string;
    }) => {
      const res = await api.post(`/seasons/${id}/transitions`, { status, reason });
      return parseResponse(SeasonRowSchema.partial({ fixtureCount: true, playedCount: true }), res.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seasons'] });
      // Closing or opening a season hands `League.currentSeasonId` over, which decides where new
      // fixtures land and whose table the standings screen shows.
      queryClient.invalidateQueries({ queryKey: ['standings'] });
      queryClient.invalidateQueries({ queryKey: ['calendar'] });
    },
  });
}

export function useDeleteSeason() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/seasons/${id}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['seasons'] }),
  });
}

/** "Saison 2026-2027" for a season starting in the second half of the year, else "Saison 2026". */
export function suggestSeasonName(start: Date): string {
  const year = start.getFullYear();
  return start.getMonth() >= 6 ? `Saison ${year}-${year + 1}` : `Saison ${year}`;
}
