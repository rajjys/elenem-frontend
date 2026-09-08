import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { api } from './api';
import { parseResponse } from './parse-response';

/**
 * The players' side of the record: who scored, over a season — and one player's own games.
 *
 * **Nothing here is stored on the server either.** Every figure is `Σ value × weight` over the
 * scoresheets, computed per request. `PlayerSeasonStat` was a table read in seven places and
 * written in none; it is gone, and a leaderboard that cannot disagree with the sheets it came from
 * is the whole point (`docs/PLAYERS_AND_STATS.md` §0).
 *
 * **This file names no statistic.** `columns` arrives from the sport, exactly as it does for the
 * scoresheet, and the table renders whatever it is handed. That is what makes one screen answer
 * all four of the questions the owner asked for — best scorer, volume of threes, appearances,
 * average — as four sorts of one table, and what keeps it right the day a football league signs up.
 */

const StatColumnSchema = z.object({
  code: z.string(),
  abbr: z.string(),
  label: z.string(),
  /** Points one unit is worth. 0 records without scoring — fouls, cards, assists. */
  weight: z.number(),
  max: z.number(),
  group: z.enum(['SCORING', 'DISCIPLINE', 'OTHER']),
});

const StageOptionSchema = z.object({
  id: z.string(),
  name: z.string(),
  format: z.enum(['LEAGUE', 'GROUPS', 'KNOCKOUT']),
  order: z.number(),
});

const LeaderboardRowSchema = z.object({
  rank: z.number(),
  playerId: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  slug: z.string(),
  jerseyNumber: z.number().nullable(),
  position: z.string().nullable(),
  profileImageUrl: z.string().nullable(),
  teamId: z.string().nullable(),
  teamName: z.string().nullable(),
  teamShortCode: z.string().nullable(),
  /** They turned out for more than one club in this scope. One scorer, two shirts. */
  multipleTeams: z.boolean(),
  gamesPlayed: z.number(),
  stats: z.record(z.string(), z.number()),
  total: z.number(),
  average: z.number(),
});

const LeaderboardSchema = z.object({
  leagueId: z.string(),
  leagueName: z.string(),
  seasonId: z.string(),
  seasonName: z.string(),
  /** Null means the whole season, which is the default — see §1.2. */
  stageId: z.string().nullable(),
  stages: z.array(StageOptionSchema),
  columns: z.array(StatColumnSchema),
  totalAbbr: z.string(),
  totalLabel: z.string(),
  /**
   * How much of the record the list is derived from. A leaderboard's ordinary state here is
   * *incomplete* rather than wrong, and the two read very differently — the same statement the
   * standings screen makes about missing results.
   */
  gamesCompleted: z.number(),
  gamesWithSheet: z.number(),
  minGames: z.number(),
  belowMinimum: z.number(),
  rows: z.array(LeaderboardRowSchema),
});

const PlayerGameLineSchema = z.object({
  gameId: z.string(),
  dateTime: z.string(),
  stageName: z.string(),
  teamId: z.string(),
  teamName: z.string(),
  opponentName: z.string(),
  opponentShortCode: z.string().nullable(),
  isHome: z.boolean(),
  teamScore: z.number().nullable(),
  opponentScore: z.number().nullable(),
  outcome: z.enum(['WIN', 'LOSS', 'DRAW']).nullable(),
  stats: z.record(z.string(), z.number()),
  total: z.number(),
});

const PlayerStatsSchema = z.object({
  playerId: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  slug: z.string(),
  jerseyNumber: z.number().nullable(),
  position: z.string().nullable(),
  profileImageUrl: z.string().nullable(),
  dateOfBirth: z.string().nullable(),
  nationality: z.string().nullable(),
  teamId: z.string().nullable(),
  teamName: z.string().nullable(),
  leagueId: z.string(),
  leagueName: z.string(),
  tenantId: z.string(),
  tenantName: z.string(),
  seasonId: z.string(),
  seasonName: z.string(),
  seasons: z.array(z.object({ id: z.string(), name: z.string() })),
  stageId: z.string().nullable(),
  stages: z.array(StageOptionSchema),
  columns: z.array(StatColumnSchema),
  totalAbbr: z.string(),
  totalLabel: z.string(),
  gamesPlayed: z.number(),
  stats: z.record(z.string(), z.number()),
  total: z.number(),
  average: z.number(),
  games: z.array(PlayerGameLineSchema),
});

export type StatColumn = z.infer<typeof StatColumnSchema>;
export type StageOption = z.infer<typeof StageOptionSchema>;
export type LeaderboardRow = z.infer<typeof LeaderboardRowSchema>;
export type Leaderboard = z.infer<typeof LeaderboardSchema>;
export type PlayerGameLine = z.infer<typeof PlayerGameLineSchema>;
export type PlayerStats = z.infer<typeof PlayerStatsSchema>;

export interface LeaderboardParams {
  leagueId?: string;
  /** Omitted, the server answers with the competition's current season. */
  seasonId?: string;
  /** Omitted means the whole season. */
  stageId?: string;
  teamId?: string;
  minGames?: number;
}

/**
 * The scorers' list.
 *
 * `seasonId` is optional for the same reason it is on the table: a club administrator is refused
 * `GET /seasons`, so a screen that had to name one could not show them anything at all.
 */
export function usePlayerLeaderboard(params: LeaderboardParams) {
  const { leagueId, seasonId, stageId, teamId, minGames } = params;
  return useQuery({
    queryKey: [
      'player-leaderboard',
      leagueId,
      seasonId ?? 'current',
      stageId ?? 'season',
      teamId ?? 'all',
      minGames ?? 1,
    ],
    queryFn: async () => {
      const res = await api.get('/players/stats/leaderboard', {
        params: {
          leagueId,
          ...(seasonId ? { seasonId } : {}),
          ...(stageId ? { stageId } : {}),
          ...(teamId ? { teamId } : {}),
          ...(minGames && minGames > 1 ? { minGames } : {}),
        },
      });
      return parseResponse(LeaderboardSchema, res.data);
    },
    enabled: !!leagueId,
    staleTime: 60_000,
  });
}

/** One player's season line, and every game behind it. */
export function usePlayerStats(playerId?: string, seasonId?: string, stageId?: string) {
  return useQuery({
    queryKey: ['player-stats', playerId, seasonId ?? 'current', stageId ?? 'season'],
    queryFn: async () => {
      const res = await api.get(`/players/${playerId}/stats`, {
        params: {
          ...(seasonId ? { seasonId } : {}),
          ...(stageId ? { stageId } : {}),
        },
      });
      return parseResponse(PlayerStatsSchema, res.data);
    },
    enabled: !!playerId,
    staleTime: 60_000,
  });
}

/**
 * A total from a line, on the client, from the same weights the server used.
 *
 * Present so a screen can total a subset — a single phase's row, a filtered column — without a
 * round trip. It is not a second source of truth: it is the same arithmetic over the same numbers,
 * and it exists in exactly one place on each side of the wire.
 */
export function totalOf(columns: StatColumn[], stats: Record<string, number>): number {
  return columns.reduce((sum, c) => sum + (Number(stats[c.code]) || 0) * c.weight, 0);
}
