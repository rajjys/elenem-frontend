import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { api } from './api';
import { parseResponse } from './parse-response';

const TeamOptionSchema = z.object({
  id: z.string(),
  name: z.string(),
  shortCode: z.string().nullable().optional().transform((v) => v ?? null),
});

const TeamsPageSchema = z.object({ data: z.array(TeamOptionSchema) });

export type TeamOption = z.infer<typeof TeamOptionSchema>;

/**
 * A competition's clubs, as names and codes.
 *
 * Everything the pool composer needs and nothing else: the full team list carries business
 * profiles, logos and season stats, and a screen that only draws chips should not pull them.
 */
export function useLeagueTeams(leagueId?: string) {
  return useQuery({
    queryKey: ['teams', 'options', leagueId],
    queryFn: async () => {
      const res = await api.get('/teams', { params: { leagueId, pageSize: 100 } });
      return parseResponse(TeamsPageSchema, res.data).data;
    },
    enabled: !!leagueId,
    staleTime: 60_000,
  });
}
