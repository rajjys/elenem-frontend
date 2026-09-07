import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { api } from './api';
import { parseResponse } from './parse-response';

/**
 * Fixtures that hold a hall and an hour without yet having two teams.
 *
 * Their own resource rather than a flag on a game, because they are their own object: three of a
 * fixture's ten actions apply to them, and the one that matters — becoming a fixture — does not
 * exist on a fixture at all. See docs/STAGES_AND_PLAYOFFS.md §9.
 */

const PlannedFixtureSchema = z.object({
  id: z.string(),
  homeLabel: z.string(),
  awayLabel: z.string(),
  dateTime: z.string(),
  conditional: z.boolean(),
  round: z.number().nullable(),
  bracketSlot: z.number().nullable(),
  notes: z.string().nullable(),
  stageId: z.string(),
  seasonId: z.string(),
  leagueId: z.string(),
  homeVenueId: z.string().nullable(),
  courtId: z.string().nullable(),
});

export type PlannedFixture = z.infer<typeof PlannedFixtureSchema>;

export function usePlannedFixtures(stageId?: string) {
  return useQuery({
    queryKey: ['planned-fixtures', stageId],
    queryFn: async () => {
      const res = await api.get('/planned-fixtures', { params: { stageId } });
      return parseResponse(z.array(PlannedFixtureSchema), res.data);
    },
    enabled: !!stageId,
    staleTime: 30_000,
  });
}

function usePlannedMutation<V>(fn: (v: V) => Promise<unknown>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planned-fixtures'] });
      // They occupy the grid and reserve halls, so the calendar changes with them.
      queryClient.invalidateQueries({ queryKey: ['calendar'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export interface PlannedFixtureInput {
  stageId: string;
  homeLabel: string;
  awayLabel: string;
  dateTime: string;
  conditional?: boolean;
  homeVenueId?: string | null;
  courtId?: string | null;
  round?: number;
  bracketSlot?: number;
}

export function useCreatePlannedFixture() {
  return usePlannedMutation(async (v: PlannedFixtureInput) => (await api.post('/planned-fixtures', v)).data);
}

export function useUpdatePlannedFixture() {
  return usePlannedMutation(
    async ({ id, ...v }: Partial<PlannedFixtureInput> & { id: string; reason?: string }) =>
      (await api.put(`/planned-fixtures/${id}`, v)).data,
  );
}

export function useDeletePlannedFixture() {
  return usePlannedMutation(async (id: string) => (await api.delete(`/planned-fixtures/${id}`)).data);
}

/**
 * The teams are known, so it stops being a plan.
 *
 * Everything else it already has — the day, the hour, the hall — and it kept the hall reserved
 * precisely so this moment would not have to find a new one.
 */
export function usePromotePlannedFixture() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      homeTeamId,
      awayTeamId,
    }: {
      id: string;
      homeTeamId: string;
      awayTeamId: string;
    }) => (await api.post(`/planned-fixtures/${id}/promote`, { homeTeamId, awayTeamId })).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planned-fixtures'] });
      queryClient.invalidateQueries({ queryKey: ['calendar'] });
      queryClient.invalidateQueries({ queryKey: ['standings'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

const StageTieSchema = z.object({
  id: z.string(),
  dateTime: z.string(),
  status: z.string(),
  homeScore: z.number().nullable(),
  awayScore: z.number().nullable(),
  homeTeam: z.object({ id: z.string(), name: z.string(), shortCode: z.string().nullable() }),
  awayTeam: z.object({ id: z.string(), name: z.string(), shortCode: z.string().nullable() }),
});

export type StageTie = z.infer<typeof StageTieSchema>;

/**
 * The ties of one phase.
 *
 * A phase's fixtures, not a date window's — which is the question a bracket actually asks, and why
 * it cannot be read from the calendar: the calendar caps its range at 400 days because it is
 * answering "what is on this month", and a play-off spans whatever it spans.
 */
export function useStageTies(stageId?: string) {
  return useQuery({
    queryKey: ['games', 'stage', stageId],
    queryFn: async () => {
      const res = await api.get('/games', { params: { stageId, pageSize: 100, sortBy: 'dateTime', sortOrder: 'asc' } });
      return parseResponse(z.object({ data: z.array(StageTieSchema) }), res.data).data;
    },
    enabled: !!stageId,
    staleTime: 30_000,
  });
}
