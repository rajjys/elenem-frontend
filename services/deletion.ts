import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { api } from './api';
import { parseResponse } from './parse-response';

/**
 * Deleting anything, the one way (`docs/RESOURCE_DELETION.md` §8, R2).
 *
 * Every deletable resource answers `GET …/:id/deletion` with what deleting it would do — what
 * blocks it, what goes with it, what to do instead, whether a reason or the typed name is needed —
 * and its DELETE refuses in the same words (backend `src/common/deletion`). `DeleteDialog` reads the
 * one and sends the other, so no screen has to know the rules.
 */

export type DeletableResource =
  | 'tenant' | 'league' | 'season' | 'stage' | 'team' | 'player' | 'game' | 'user' | 'post';

const PATHS: Record<DeletableResource, string> = {
  tenant: '/tenants',
  league: '/leagues',
  season: '/seasons',
  stage: '/stages',
  team: '/teams',
  player: '/players',
  game: '/games',
  user: '/users',
  post: '/posts',
};

const DeletionReportSchema = z.object({
  allowed: z.boolean(),
  name: z.string(),
  blockers: z.array(z.object({ code: z.string(), message: z.string() })),
  consequences: z.array(z.object({ message: z.string(), count: z.number().optional() })),
  alternative: z.enum(['archive', 'cancel', 'deactivate', 'move']).nullable(),
  requires: z.object({ reason: z.boolean(), typedName: z.boolean() }),
});

export type DeletionReport = z.infer<typeof DeletionReportSchema>;
export type DeletionAlternative = NonNullable<DeletionReport['alternative']>;

export const deletionKeys = {
  report: (resource: DeletableResource, id: string) => ['deletion', resource, id] as const,
};

/** Asked every time the dialog opens: what was true a minute ago may not be any more. */
export function useDeletionReport(resource: DeletableResource, id: string | null | undefined, enabled: boolean) {
  return useQuery({
    queryKey: deletionKeys.report(resource, id ?? ''),
    queryFn: async () =>
      parseResponse(DeletionReportSchema, (await api.get(`${PATHS[resource]}/${id}/deletion`)).data),
    enabled: enabled && !!id,
    staleTime: 0,
    gcTime: 0,
    retry: false,
  });
}

/**
 * The delete. On success every cached query is marked stale and the ones on screen refetch.
 *
 * Not a list of keys per resource: a deleted club is in the clubs list, the competition's counts,
 * the fixture picker, the calendar, the table, the dashboard and the scope switcher, and every list
 * written by hand missed one (§5). Deletes are rare; refetching what is on screen is cheap.
 */
export function useDeleteResource(resource: DeletableResource) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason?: string }) =>
      api.delete(`${PATHS[resource]}/${id}`, { params: reason?.trim() ? { reason: reason.trim() } : undefined }),
    onSuccess: (_data, { id }) => {
      qc.removeQueries({ queryKey: deletionKeys.report(resource, id) });
      qc.invalidateQueries();
    },
  });
}
