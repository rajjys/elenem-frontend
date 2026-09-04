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
  /** Which coloured band the row falls in, if the competition has declared any. */
  band: z.enum(['QUALIFICATION', 'RELEGATION']).nullable(),
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
  /** The federation. The bulletin signs off "Pour la LIPROBAKIN", not "pour la D1 Messieurs". */
  organisationName: z.string(),
  organisationLogoUrl: z.string().nullable(),
  organisationCity: z.string().nullable(),
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
    bands: z.object({
      qualification: z.object({ count: z.number(), label: z.string() }).nullable(),
      relegation: z.object({ count: z.number(), label: z.string() }).nullable(),
    }),
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

// --- the only editable thing on a standings screen --------------------------------------------

export interface StandingsRulesInput {
  leagueId: string;
  rankingMetric?: string;
  winPoints?: number;
  drawPoints?: number;
  lossPoints?: number;
  forfeitPoints?: number;
  tieBreakerOrder?: string[];
  qualificationCount?: number;
  qualificationLabel?: string;
  relegationCount?: number;
  relegationLabel?: string;
}

/**
 * Changes what a table is computed from: what a result is worth, how ties are broken, and which
 * clubs it colours.
 *
 * Saving does **not** recalculate. Changing the points for a win invalidates every row of every
 * season this competition has played, and quietly rewriting history because somebody opened a
 * settings screen is the kind of thing this product exists not to do. The screen says the table is
 * now stale and offers the button.
 */
export function useUpdateStandingsRules() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: StandingsRulesInput) => {
      const res = await api.put('/games/standings/rules', input);
      return parseResponse(StandingsViewSchema, res.data);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['standings'] }),
  });
}

/** Tie-breakers a league can pick from, in French, matching the server's own labels. */
export const TIE_BREAKERS: { value: string; label: string }[] = [
  { value: 'GOAL_DIFFERENCE', label: 'Différence de points' },
  { value: 'HEAD_TO_HEAD_POINTS', label: 'Confrontation directe — points' },
  { value: 'WINS', label: 'Nombre de victoires' },
  { value: 'GOALS_FOR', label: 'Points marqués' },
  { value: 'GOALS_AGAINST', label: 'Points encaissés' },
  { value: 'WIN_PERCENTAGE', label: 'Pourcentage de victoires' },
  { value: 'AWAY_WINS', label: 'Victoires à l’extérieur' },
  { value: 'FAIR_PLAY_POINTS', label: 'Fair-play' },
];

export const RANKING_METRICS: { value: string; label: string; hint: string }[] = [
  { value: 'POINTS', label: 'Points', hint: 'La convention du football. Correcte quand tout le monde a joué le même nombre de matchs.' },
  { value: 'WIN_PERCENTAGE', label: 'Pourcentage de victoires', hint: 'La convention FIBA. Reste juste quand les équipes n’ont pas joué autant de matchs.' },
  { value: 'POINTS_PER_GAME', label: 'Points par match', hint: 'Comme les points, mais insensible aux matchs en retard.' },
];

// --- the export --------------------------------------------------------------------------------

export interface StandingsExportFields {
  title?: string;
  subtitle?: string;
  matchday?: string;
  city?: string;
  date?: string;
  organisation?: string;
  signatoryRole?: string;
  signatoryName?: string;
  showBands?: boolean;
}

/**
 * The spreadsheet half of the export.
 *
 * A blob rather than a link, because the endpoint is authenticated: an `<a href>` sends no bearer
 * token, so the browser would be handed a 401 page named .xlsx. Same reasoning as the results
 * template download.
 */
export function useDownloadStandingsXlsx() {
  return useMutation({
    mutationFn: async ({
      leagueId,
      seasonId,
      ...fields
    }: StandingsExportFields & { leagueId: string; seasonId?: string }) => {
      const params: Record<string, string> = { leagueId };
      if (seasonId) params.seasonId = seasonId;
      for (const [k, v] of Object.entries(fields)) {
        if (v !== undefined && v !== '') params[k] = String(v);
      }
      const res = await api.get('/games/standings/export.xlsx', {
        params,
        responseType: 'blob',
      });

      const disposition = String(res.headers?.['content-disposition'] ?? '');
      const named = /filename="?([^"]+)"?/.exec(disposition)?.[1];

      const url = URL.createObjectURL(res.data as Blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = named ?? 'classement.xlsx';
      document.body.appendChild(link);
      link.click();
      link.remove();
      // Revoked on the next tick: releasing it synchronously cancels the download in Safari.
      setTimeout(() => URL.revokeObjectURL(url), 0);
    },
  });
}
