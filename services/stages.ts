import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { api } from './api';
import { parseResponse } from './parse-response';

/**
 * A season's phases: « Saison régulière », « Phase de poules », « Play-offs », « Finale ».
 *
 * The unit a table belongs to. Their own bulletin publishes « le classement phase de 6 Version
 * masculine et général version féminine » — two competitions on one signed sheet, one publishing a
 * phase table and the other a season table. See docs/STAGES_AND_PLAYOFFS.md §1.
 */

export const StageFormat = {
  /** Everyone plays everyone. One table. */
  LEAGUE: 'LEAGUE',
  /** Several pools, round robin inside each. One table per pool. */
  GROUPS: 'GROUPS',
  /** A bracket. No table. */
  KNOCKOUT: 'KNOCKOUT',
} as const;
export type StageFormat = (typeof StageFormat)[keyof typeof StageFormat];

export const STAGE_FORMAT_LABEL: Record<StageFormat, string> = {
  LEAGUE: 'Championnat',
  GROUPS: 'Poules',
  KNOCKOUT: 'Élimination directe',
};

/** What each format produces, in the words the composer uses to explain itself. */
export const STAGE_FORMAT_HINT: Record<StageFormat, string> = {
  LEAGUE: 'Tout le monde rencontre tout le monde. Produit un classement.',
  GROUPS: 'Plusieurs poules, un mini-championnat dans chacune. Un classement par poule.',
  KNOCKOUT: 'Un tableau à élimination. Ne produit pas de classement.',
};

const StageSchema = z.object({
  id: z.string(),
  name: z.string(),
  order: z.number(),
  format: z.nativeEnum(StageFormat),
  legs: z.number(),
  advancing: z.number().nullable(),
  seasonId: z.string(),
  fixtureCount: z.number(),
  playedCount: z.number(),
  groups: z.array(
    z.object({ id: z.string(), name: z.string(), order: z.number(), teamIds: z.array(z.string()) }),
  ),
});

export type Stage = z.infer<typeof StageSchema>;

export const SeasonTemplate = {
  SIMPLE: 'SIMPLE',
  LEAGUE_PLAYOFFS: 'LEAGUE_PLAYOFFS',
  GROUPS_KNOCKOUT: 'GROUPS_KNOCKOUT',
} as const;
export type SeasonTemplate = (typeof SeasonTemplate)[keyof typeof SeasonTemplate];

export function useStages(seasonId?: string) {
  return useQuery({
    queryKey: ['stages', seasonId],
    queryFn: async () => {
      const res = await api.get(`/seasons/${seasonId}/stages`);
      return parseResponse(z.array(StageSchema), res.data);
    },
    enabled: !!seasonId,
    staleTime: 30_000,
  });
}

/** Everything that changes a season's shape invalidates the same things. */
function useStageMutation<V>(fn: (v: V) => Promise<unknown>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stages'] });
      queryClient.invalidateQueries({ queryKey: ['seasons'] });
      // A phase decides which table a result lands in, so the shape changing changes the tables.
      queryClient.invalidateQueries({ queryKey: ['standings'] });
    },
  });
}

export function useCreateStage(seasonId: string) {
  return useStageMutation(
    async (v: { name: string; format: StageFormat; legs?: number; advancing?: number | null; groupCount?: number }) =>
      (await api.post(`/seasons/${seasonId}/stages`, v)).data,
  );
}

export function useUpdateStage() {
  return useStageMutation(
    async ({ id, ...v }: { id: string; name?: string; format?: StageFormat; legs?: number; advancing?: number | null }) =>
      (await api.put(`/stages/${id}`, v)).data,
  );
}

export function useDeleteStage() {
  return useStageMutation(async (id: string) => (await api.delete(`/stages/${id}`)).data);
}

export function useReorderStages(seasonId: string) {
  return useStageMutation(
    async (stageIds: string[]) => (await api.put(`/seasons/${seasonId}/stages/order`, { stageIds })).data,
  );
}

export function useApplyTemplate(seasonId: string) {
  return useStageMutation(
    async (v: { template: SeasonTemplate; advancing?: number; groupCount?: number }) =>
      (await api.post(`/seasons/${seasonId}/stages/template`, v)).data,
  );
}

export function useSetGroupMembers() {
  return useStageMutation(
    async ({ groupId, teamIds }: { groupId: string; teamIds: string[] }) =>
      (await api.put(`/stage-groups/${groupId}/members`, { teamIds })).data,
  );
}

/**
 * A season's shape in one line: « Saison régulière → Play-offs ».
 *
 * A single phase returns null rather than its own name — a competition that has never composed a
 * second one has no shape to describe, and printing « Saison régulière » beside a season would be
 * saying the same thing twice.
 */
export function describeShape(stages: Pick<Stage, 'name'>[]): string | null {
  return stages.length > 1 ? stages.map((s) => s.name).join(' → ') : null;
}
