import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { api } from './api';
import { parseResponse } from './parse-response';

/**
 * Fixture generation as a draft.
 *
 * The rule this module exists to keep is `CALENDAR_MODULE.md` §3: nothing reaches the calendar
 * until Publish. That is why there are two endpoints rather than one with a `dryRun` flag — a
 * flag is a thing you can forget to set, and the consequence of forgetting it is 132 games
 * written to a league's season.
 *
 * The other rule is §2.6: existing games are inputs. The draft is computed against everything
 * already on record, so a league that adopted Elenem in February gets its remaining fixtures and
 * not a second copy of the ones it has already played.
 */

const DraftFixtureSchema = z.object({
  matchday: z.number(),
  dateTime: z.string().nullable(),
  homeTeamId: z.string(),
  homeTeamName: z.string(),
  homeTeamShortCode: z.string(),
  awayTeamId: z.string(),
  awayTeamName: z.string(),
  awayTeamShortCode: z.string(),
  venueId: z.string().nullable(),
});

const DraftInsightSchema = z.object({
  kind: z.enum(['short-fixtures', 'existing-pairing', 'unplaced', 'blackout', 'no-venue', 'ok']),
  severity: z.enum(['info', 'caution', 'problem']),
  message: z.string(),
  gameId: z.string().optional(),
  teamId: z.string().optional(),
});

const FixtureDraftSchema = z.object({
  seasonId: z.string(),
  seasonName: z.string(),
  leagueId: z.string(),
  leagueName: z.string(),
  gameDurationMinutes: z.number(),
  teamCount: z.number(),
  requiredFixtureCount: z.number(),
  existingFixtureCount: z.number(),
  fixtures: z.array(DraftFixtureSchema),
  unplaced: z.array(DraftFixtureSchema),
  freeSlotCount: z.number(),
  insights: z.array(DraftInsightSchema),
});

export type FixtureDraft = z.infer<typeof FixtureDraftSchema>;
export type DraftFixture = z.infer<typeof DraftFixtureSchema>;
export type DraftInsight = z.infer<typeof DraftInsightSchema>;

export interface DraftParams {
  seasonId: string;
  legs: 1 | 2;
  from: string;
  to: string;
  daysOfWeek: number[];
  openingTime: string;
  gameDurationMinutes?: number;
  slotsPerDay: number;
  homeVenueId?: string;
}

export function useDraftFixtures() {
  return useMutation({
    mutationFn: async (params: DraftParams) => {
      const res = await api.post('/calendar/draft', {
        ...params,
        // The organiser types their own clock. Sent explicitly because the server has no way to
        // know it: without this "13:30" is read as UTC and a Goma draft comes back at 14:30,
        // which is an hour nobody chose and the first thing they would notice.
        utcOffsetMinutes: -new Date().getTimezoneOffset(),
      });
      return parseResponse(FixtureDraftSchema, res.data);
    },
  });
}

const PublishSchema = z.object({
  createdCount: z.number(),
  skippedCount: z.number(),
  results: z.array(
    z.object({
      dateTime: z.string(),
      homeTeamId: z.string(),
      awayTeamId: z.string(),
      gameId: z.string().optional(),
      error: z.string().optional(),
    }),
  ),
});

export type PublishReport = z.infer<typeof PublishSchema>;

/**
 * Writes the draft the organiser studied.
 *
 * The fixtures are sent back rather than regenerated server-side. Regenerating would be less
 * code and would be wrong: the world moves while a draft is being read, and a second run against
 * a moved world is a different fixture list. Publishing something other than what was on screen
 * is the one thing this module may never do.
 */
export function usePublishDraft() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ seasonId, fixtures }: { seasonId: string; fixtures: DraftFixture[] }) => {
      const res = await api.post('/calendar/publish', {
        seasonId,
        fixtures: fixtures
          .filter((f) => f.dateTime)
          .map((f) => ({
            dateTime: f.dateTime,
            homeTeamId: f.homeTeamId,
            awayTeamId: f.awayTeamId,
            venueId: f.venueId,
          })),
      });
      return parseResponse(PublishSchema, res.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar'] });
      queryClient.invalidateQueries({ queryKey: ['games'] });
      queryClient.invalidateQueries({ queryKey: ['standings'] });
    },
  });
}

/**
 * The halls a draft can be placed in.
 *
 * Read from `/venues` rather than from the calendar payload, because the calendar only knows the
 * halls that appear in the period being looked at — and the whole point of choosing one here is
 * that it may be a hall nothing is booked into yet.
 */
const VenueOptionsSchema = z.object({
  data: z.array(z.object({ id: z.string(), name: z.string() })),
});

export function useVenueOptions() {
  return useQuery({
    queryKey: ['venues', 'options'],
    queryFn: async () => {
      const res = await api.get('/venues', { params: { pageSize: 100 } });
      return parseResponse(VenueOptionsSchema, res.data);
    },
    staleTime: 5 * 60_000,
  });
}
