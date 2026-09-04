import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { api } from './api';
import { parseResponse } from './parse-response';

/**
 * The box score: who scored, and how.
 *
 * **The columns come from the server, not from here.** An earlier version of this file named
 * `threePointers`, `twoPointers` and `freeThrows` in its schema, its types and its dialog — which
 * was right for LIPROBAKIN and made the screen unusable for the football and volleyball leagues
 * the product is meant to serve. What a sheet holds is a property of the sport, so the sport
 * declares it (`sport-rules/utils/sport-stat-columns.ts`) and it arrives beside the rosters.
 * Nothing on this side of the wire knows what a three-pointer is.
 *
 * Totals are never sent and never stored: `Σ value × weight`, computed from the same column list
 * on both sides, because a persisted total is a number that can end up disagreeing with the shots
 * it came from.
 */

const StatColumnSchema = z.object({
  /** Stable key into a line's `stats` map. */
  code: z.string(),
  /** Short head that fits a table column. */
  abbr: z.string(),
  /** Full meaning, for the tooltip and the aria-label. */
  label: z.string(),
  /** Points one unit is worth. 0 records without scoring — fouls, cards, assists. */
  weight: z.number(),
  /** Ceiling for one player in one game: 5 fouls, not 99. */
  max: z.number(),
  group: z.enum(['SCORING', 'DISCIPLINE', 'OTHER']),
});

const BoxScorePlayerSchema = z.object({
  playerId: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  jerseyNumber: z.number().nullable().optional(),
  position: z.string().nullable().optional(),
  /** Whether this player appeared. The row's existence, not whether anything was scored. */
  played: z.boolean(),
  stats: z.record(z.string(), z.number()).default({}),
  total: z.number(),
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
  columns: z.array(StatColumnSchema),
  totalAbbr: z.string(),
  totalLabel: z.string(),
  /** False in volleyball, where the result is sets and the sheet can never equal it. */
  reconcilesWithFinalScore: z.boolean(),
  /** A sheet is typed up after the final whistle; before that there is nothing to copy. */
  editable: z.boolean(),
  notEditableReason: z.string().nullable(),
  /** How many players are marked as having appeared, across both teams. */
  appearances: z.number(),
  home: BoxScoreSideSchema,
  away: BoxScoreSideSchema,
});

export type StatColumn = z.infer<typeof StatColumnSchema>;
export type BoxScore = z.infer<typeof BoxScoreSchema>;
export type BoxScoreSide = z.infer<typeof BoxScoreSideSchema>;
export type BoxScorePlayer = z.infer<typeof BoxScorePlayerSchema>;

/**
 * A player's total from their line, by the sport's own weights. The same rule the server applies,
 * so the two can never disagree.
 */
export function totalOf(columns: StatColumn[], stats: Record<string, number>): number {
  return columns.reduce((sum, c) => sum + (stats[c.code] || 0) * c.weight, 0);
}

export function useBoxScore(gameId?: string, enabled = true) {
  return useQuery({
    queryKey: ['game', gameId, 'box-score'],
    queryFn: async () => {
      const res = await api.get(`/games/${gameId}/box-score`);
      return parseResponse(BoxScoreSchema, res.data);
    },
    enabled: !!gameId && enabled,
    // Re-read on open: the sheet is typed from paper, and a stale roster would offer names that
    // are no longer in the squad — or miss the one added ten minutes ago on another screen.
    staleTime: 0,
  });
}

export interface BoxScoreLine {
  playerId: string;
  /** Sent for everyone on the sheet; the server writes a row for those it is true for. */
  played: boolean;
  stats: Record<string, number>;
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

const AddedPlayerSchema = z.object({
  id: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  jerseyNumber: z.number().nullable().optional(),
  position: z.string().nullable().optional(),
});

/**
 * Adds a name to a roster without leaving the sheet.
 *
 * Rosters here are not finished when the season starts. Clubs are still recruiting in the opening
 * weeks, and in youth competitions the squad is known on the morning of the game — so a sheet that
 * can only name players registered in advance is a sheet that does not get typed up. Sending the
 * operator to the roster screen and back, for a name he is reading off a piece of paper, is where
 * the entry stops.
 *
 * The game supplies the league, the tenant and the sport; the endpoint bounds the team to the two
 * playing. All that is asked for is what the paper actually carries.
 */
export function useAddBoxScorePlayer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      gameId,
      teamId,
      lastName,
      firstName,
      jerseyNumber,
      position,
      force,
    }: {
      gameId: string;
      teamId: string;
      lastName: string;
      firstName?: string;
      jerseyNumber?: number;
      position?: string;
      /** Create anyway, after the operator has seen the existing players of the same name. */
      force?: boolean;
    }) => {
      const res = await api.post(`/games/${gameId}/box-score/players`, {
        teamId,
        lastName,
        ...(firstName ? { firstName } : {}),
        ...(jerseyNumber != null ? { jerseyNumber } : {}),
        ...(position ? { position } : {}),
        ...(force ? { force: true } : {}),
      });
      return parseResponse(AddedPlayerSchema, res.data);
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['game', vars.gameId, 'box-score'] });
      // The club's own roster screens are now out of date by one name.
      queryClient.invalidateQueries({ queryKey: ['players'] });
    },
  });
}

/**
 * Someone of this name is already in the organisation.
 *
 * Returned as a 409 body rather than swallowed, because the two cases that actually happen both
 * have a better answer than "create a second record": the player is already on this team and
 * somebody did not scroll, or they are on another team and have transferred without the product
 * being told. Forking a human into two records is how a roster quietly becomes unusable.
 */
export interface ExistingPlayerMatch {
  playerId: string;
  firstName: string;
  lastName: string;
  jerseyNumber: number | null;
  teamId: string | null;
  teamName: string | null;
  sameTeam: boolean;
  inThisGame: boolean;
}

export function existingPlayersFrom(error: unknown): ExistingPlayerMatch[] | null {
  const body = (error as { response?: { data?: { code?: string; existing?: ExistingPlayerMatch[] } } })
    ?.response?.data;
  if (body?.code !== 'PLAYER_EXISTS' || !Array.isArray(body.existing)) return null;
  return body.existing;
}

/** Moves an existing player onto one of the two teams, instead of creating them again. */
export function useTransferPlayer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ playerId, teamId }: { gameId: string; playerId: string; teamId: string }) => {
      await api.post('/players/assign-to-team', { playerId, teamId });
    },
    onSuccess: (_d, vars) => {
      queryClient.invalidateQueries({ queryKey: ['game', vars.gameId, 'box-score'] });
      queryClient.invalidateQueries({ queryKey: ['players'] });
    },
  });
}
