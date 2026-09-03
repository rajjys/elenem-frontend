import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { api } from './api';
import { parseResponse } from './parse-response';

/**
 * The league table.
 *
 * The screen this replaced fetched a bare array of standing rows and supplied everything else
 * itself: eight English column heads written into the JSX, no statement of when the numbers were
 * computed, and nothing at all about how the points were arrived at.
 *
 * That last gap is the one that matters. LIPROBAKIN's officials compute this table by hand and
 * send it to a designer, and the reason a hand-made table survives being replaced is that a
 * committee can check it. So the response carries the rule — `PTS = 2 × MG + MP` — in the table's
 * own column names, and the column names come from the sport rather than from this file.
 */

const StandingsColumnSchema = z.object({
  /** The field on a row this column displays. */
  key: z.enum([
    'gamesPlayed', 'wins', 'draws', 'losses', 'forfeits',
    'goalsFor', 'goalsAgainst', 'goalDifference', 'points',
  ]),
  abbr: z.string(),
  label: z.string(),
});

const StandingsRowSchema = z.object({
  rank: z.number(),
  teamId: z.string(),
  teamName: z.string(),
  shortCode: z.string().nullable(),
  logoUrl: z.string().nullable(),
  gamesPlayed: z.number(),
  wins: z.number(),
  draws: z.number(),
  losses: z.number(),
  forfeits: z.number(),
  goalsFor: z.number(),
  goalsAgainst: z.number(),
  goalDifference: z.number(),
  points: z.number(),
});

const StandingsViewSchema = z.object({
  leagueId: z.string(),
  leagueName: z.string(),
  seasonId: z.string(),
  seasonName: z.string(),
  lastCalculated: z.string().nullable(),
  gamesCounted: z.number(),
  /** Fixtures whose date has passed with no result entered. */
  pendingResults: z.number(),
  columns: z.array(StandingsColumnSchema),
  rules: z.object({
    rankingMetric: z.string(),
    winPoints: z.number(),
    drawPoints: z.number(),
    lossPoints: z.number(),
    forfeitPoints: z.number(),
    tieBreakers: z.array(z.string()),
    formula: z.string(),
  }),
  rows: z.array(StandingsRowSchema),
});

export type StandingsView = z.infer<typeof StandingsViewSchema>;
export type StandingsRow = z.infer<typeof StandingsRowSchema>;
export type StandingsColumn = z.infer<typeof StandingsColumnSchema>;

/**
 * The table. `seasonId` is optional — omitted, the server answers with the competition's current
 * season, which is what every caller means unless they are offering a season picker.
 *
 * That matters for a club administrator: `GET /seasons` refuses them (they administer a team, not
 * a competition), so a screen that had to name a season could not show them the table their own
 * club is in.
 */
export function useStandings(leagueId?: string, seasonId?: string) {
  return useQuery({
    queryKey: ['standings', leagueId, seasonId ?? 'current'],
    queryFn: async () => {
      const res = await api.get('/games/standings/view', {
        params: { leagueId, ...(seasonId ? { seasonId } : {}) },
      });
      return parseResponse(StandingsViewSchema, res.data);
    },
    enabled: !!leagueId,
    staleTime: 60_000,
  });
}

/**
 * Rebuilds the table from the games.
 *
 * Deliberately not a prominent control. Results already recompute rather than accumulate, so this
 * is never the fix for a table that looks wrong — the fix for that is the result that is wrong.
 * It exists for the one case the engine cannot notice: the point system or the tie-break order
 * changed, and every row is now computed under a rule nobody is using.
 */
export function useRecalculateStandings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ leagueId, seasonId }: { leagueId: string; seasonId: string }) => {
      const res = await api.post('/games/standings/recalculate', { leagueId, seasonId });
      return parseResponse(StandingsViewSchema, res.data);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['standings'] }),
  });
}

// --- the competitions and seasons a table can be asked for ------------------------------------

const LeagueOptionSchema = z.object({
  id: z.string(),
  name: z.string(),
  division: z.string().nullable().optional(),
  gender: z.string().nullable().optional(),
  currentSeasonId: z.string().nullable().optional(),
});

const LeaguesSchema = z.object({ data: z.array(LeagueOptionSchema) });

export type LeagueOption = z.infer<typeof LeagueOptionSchema>;

/**
 * Every competition the reader may see a table for.
 *
 * A tenant admin gets all of theirs; a league admin gets the one they run — the backend scopes it,
 * so the same call serves both and no screen has to know which case it is in.
 */
export function useStandingsLeagues(enabled = true) {
  return useQuery({
    queryKey: ['standings', 'leagues'],
    queryFn: async () => {
      // Ordered the way the calendar orders its competition chips — division first — rather than
      // by creation date, which is the endpoint's default and puts the newest competition at the
      // top. A federation creates its flagship first and its second division later, so "newest"
      // is reliably the least interesting table to open on.
      const res = await api.get('/leagues', {
        params: { pageSize: 50, sortBy: 'division', sortOrder: 'asc' },
      });
      return parseResponse(LeaguesSchema, res.data);
    },
    enabled,
    staleTime: 5 * 60_000,
    // A club administrator is refused this list outright. That is not an error to report — they
    // are not choosing a competition, they are in one — so it fails quietly and the selector
    // simply does not appear.
    retry: false,
  });
}

const SeasonOptionSchema = z.object({
  id: z.string(),
  name: z.string(),
  leagueId: z.string(),
  startDate: z.union([z.string(), z.date()]).nullable().optional(),
});

const SeasonsSchema = z.object({ data: z.array(SeasonOptionSchema) });

export type SeasonOption = z.infer<typeof SeasonOptionSchema>;

export function useStandingsSeasons(leagueId?: string) {
  return useQuery({
    queryKey: ['standings', 'seasons', leagueId],
    queryFn: async () => {
      const res = await api.get('/seasons', { params: { pageSize: 50, leagueId } });
      return parseResponse(SeasonsSchema, res.data);
    },
    enabled: !!leagueId,
    staleTime: 5 * 60_000,
    // Same as the competition list: refused for a club administrator, and the season picker is
    // not something they were going to be offered anyway.
    retry: false,
  });
}
