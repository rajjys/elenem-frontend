import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { api } from './api';
import { parseResponse } from './parse-response';

/**
 * The box score: who scored, and how.
 *
 * Shaped like the paper it is copied from. At LIPROBAKIN the officials fill in a FIBA scoresheet
 * during the game and the community manager types it up afterwards, usually from a photograph of
 * it — so what a row holds is baskets by kind, and nothing else. Assists, rebounds and minutes are
 * not on that sheet, and a field for a number nobody is holding is a field that gets left empty
 * or guessed at.
 *
 * Points are never sent. `3·three + 2·two + free` is computed on both sides from the same rule,
 * because a stored total is a number that can end up disagreeing with the shots it came from.
 */

const BoxScorePlayerSchema = z.object({
  playerId: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  jerseyNumber: z.number().nullable().optional(),
  position: z.string().nullable().optional(),
  threePointers: z.number(),
  twoPointers: z.number(),
  freeThrows: z.number(),
  points: z.number(),
});

const BoxScoreSideSchema = z.object({
  teamId: z.string(),
  name: z.string(),
  shortCode: z.string(),
  players: z.array(BoxScorePlayerSchema),
  total: z.number(),
  finalScore: z.number().nullable(),
});

const BoxScoreSchema = z.object({
  gameId: z.string(),
  status: z.string(),
  dateTime: z.string(),
  recorded: z.boolean(),
  home: BoxScoreSideSchema,
  away: BoxScoreSideSchema,
});

export type BoxScore = z.infer<typeof BoxScoreSchema>;
export type BoxScoreSide = z.infer<typeof BoxScoreSideSchema>;
export type BoxScorePlayer = z.infer<typeof BoxScorePlayerSchema>;

/** Points from baskets. The same rule the server applies, so the two can never disagree. */
export const pointsOf = (s: {
  threePointers: number;
  twoPointers: number;
  freeThrows: number;
}) => s.threePointers * 3 + s.twoPointers * 2 + s.freeThrows;

export function useBoxScore(gameId?: string, enabled = true) {
  return useQuery({
    queryKey: ['game', gameId, 'box-score'],
    queryFn: async () => {
      const res = await api.get(`/games/${gameId}/box-score`);
      return parseResponse(BoxScoreSchema, res.data);
    },
    enabled: !!gameId && enabled,
    // Re-read on open: the sheet is typed from paper, and a stale roster would offer names that
    // are no longer in the squad.
    staleTime: 0,
  });
}

export interface BoxScoreLine {
  playerId: string;
  threePointers: number;
  twoPointers: number;
  freeThrows: number;
}

export function useSaveBoxScore() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      gameId,
      lines,
      reason,
    }: {
      gameId: string;
      lines: BoxScoreLine[];
      reason?: string;
    }) => {
      const res = await api.put(`/games/${gameId}/box-score`, {
        lines,
        ...(reason ? { reason } : {}),
      });
      return parseResponse(BoxScoreSchema, res.data);
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['game', vars.gameId, 'box-score'] });
      queryClient.invalidateQueries({ queryKey: ['game'] });
    },
  });
}
