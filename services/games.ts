import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { api } from './api';
import { parseResponse } from './parse-response';

/**
 * Writing to a fixture, from wherever the organiser is standing.
 *
 * The operations here are grouped the way the domain groups them, not the way the columns do.
 * Six editable things — day, time, hall, court, state, score — collapse into three, on the axis
 * that actually matters: *what else has to be true for the change to be legal, and what it
 * invalidates downstream.*
 *
 *  1. **The slot** — day, time, hall and court are one edit. You never move a fixture to Tuesday
 *     without choosing an hour, and you never change hall without re-checking the hour. They
 *     share exactly one constraint (the venue and team conflict window) and invalidate nothing
 *     downstream. Splitting them would be an artefact of the form, not of the domain — and a slot
 *     is precisely what a drag gesture expresses.
 *  2. **The state** — verbs from a machine, never a field. The server holds an explicit
 *     transition map, so the UI offers the two or three moves legal from where the fixture is
 *     now, and the destructive ones carry a reason.
 *  3. **The result** — terminal, and it rebuilds the table. Its own call, its own confirmation.
 *
 * The pairing is in none of them: it is the fixture's identity. The slug is built from it, every
 * shared link carries it, and once a score exists the two numbers hang off it. Changing who plays
 * is a cancelled fixture and a new one. Inverting home and away is the one exception, because
 * that is not a different match — it is the same match typed the wrong way round.
 */

// --- reading ------------------------------------------------------------------------------------

const TeamOptionSchema = z.object({
  id: z.string(),
  name: z.string(),
  shortCode: z.string().nullable().optional(),
  leagueId: z.string().optional(),
});

const TeamsSchema = z.object({ data: z.array(TeamOptionSchema) });

export type TeamOption = z.infer<typeof TeamOptionSchema>;

/** The clubs that can be drawn against each other — always narrowed to one competition. */
export function useTeamOptions(leagueId?: string) {
  return useQuery({
    queryKey: ['teams', 'options', leagueId ?? 'none'],
    queryFn: async () => {
      const res = await api.get('/teams', { params: { pageSize: 100, leagueId } });
      return parseResponse(TeamsSchema, res.data);
    },
    enabled: !!leagueId,
    staleTime: 5 * 60_000,
  });
}

const AuditEntrySchema = z.object({
  id: z.string(),
  action: z.string(),
  reason: z.string().nullable().optional(),
  before: z.unknown().nullable().optional(),
  after: z.unknown().nullable().optional(),
  at: z.string(),
  by: z.string().nullable().optional(),
});

export type AuditEntry = z.infer<typeof AuditEntrySchema>;

/**
 * What happened to this fixture, and why.
 *
 * Fetched only when the organiser opens the history, because most of the time they are looking
 * at a fixture to read it rather than to interrogate it.
 */
export function useGameAudit(gameId?: string, enabled = false) {
  return useQuery({
    queryKey: ['game', gameId, 'audit'],
    queryFn: async () => {
      const res = await api.get(`/games/${gameId}/audit`);
      return parseResponse(z.array(AuditEntrySchema), res.data);
    },
    enabled: !!gameId && enabled,
    staleTime: 30_000,
  });
}

// --- writing ------------------------------------------------------------------------------------

/** Everything that has to be refreshed when a fixture changes. One place, so none is forgotten. */
function useFixtureInvalidation() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ['calendar'] });
    queryClient.invalidateQueries({ queryKey: ['games'] });
    queryClient.invalidateQueries({ queryKey: ['standings'] });
    queryClient.invalidateQueries({ queryKey: ['game'] });
  };
}

export interface CreateGameInput {
  leagueId: string;
  tenantId: string;
  homeTeamId: string;
  awayTeamId: string;
  /** ISO instant. Built from the day the organiser clicked and the time they chose. */
  dateTime: string;
  homeVenueId?: string;
  courtId?: string;
  notes?: string;
}

export function useCreateGame() {
  const invalidate = useFixtureInvalidation();
  return useMutation({
    mutationFn: async (input: CreateGameInput) => {
      const res = await api.post('/games', input);
      return res.data as { id: string; slug: string };
    },
    onSuccess: invalidate,
  });
}

export interface MoveGameInput {
  gameId: string;
  /** ISO instant. Omitted when only the hall is changing. */
  dateTime?: string;
  /** `null` clears the hall — a fixture with a date and no room is still worth publishing. */
  homeVenueId?: string | null;
  courtId?: string | null;
  reason?: string;
}

/**
 * Moves a fixture to a different slot.
 *
 * One mutation for day, time, hall and court because they are one decision. The reason travels
 * with it and is written to the audit trail rather than onto the game: "moved to the 22nd"
 * settles nothing without "the hall was double-booked", and it is the second half that the club
 * turning up on the wrong day is owed.
 */
export function useMoveGame() {
  const invalidate = useFixtureInvalidation();
  return useMutation({
    mutationFn: async ({ gameId, ...changes }: MoveGameInput) => {
      const res = await api.put(`/games/${gameId}`, changes);
      return res.data;
    },
    onSuccess: invalidate,
  });
}

/**
 * The state verbs.
 *
 * `POSTPONED` and `CANCELLED` demand a reason server-side, which is right: those are the two that
 * cost somebody a journey.
 */
export type StateVerb = 'confirm' | 'postpone' | 'cancel' | 'schedule';

export function useGameStateChange() {
  const invalidate = useFixtureInvalidation();
  return useMutation({
    mutationFn: async ({
      gameId,
      verb,
      reason,
    }: {
      gameId: string;
      verb: StateVerb;
      reason?: string;
    }) => {
      const res = await api.post(`/games/${gameId}/${verb}`, reason ? { reason } : {});
      return res.data;
    },
    onSuccess: invalidate,
  });
}

/**
 * Records or corrects the final score.
 *
 * The same call does both, deliberately. A correction is not a rarer, more serious act than an
 * entry — it is the same act done twice, and the second time is the one that makes the table
 * right. Until now the server refused it outright, which left a mistyped score authoritative for
 * ever.
 */
export function useReportScore() {
  const invalidate = useFixtureInvalidation();
  return useMutation({
    mutationFn: async ({
      gameId,
      homeScore,
      awayScore,
      isForfeit,
      reason,
    }: {
      gameId: string;
      homeScore: number;
      awayScore: number;
      isForfeit?: boolean;
      reason?: string;
    }) => {
      const res = await api.put(`/games/${gameId}/final-score`, {
        homeScore,
        awayScore,
        ...(isForfeit !== undefined ? { isForfeit } : {}),
        ...(reason ? { reason } : {}),
      });
      return res.data;
    },
    onSuccess: invalidate,
  });
}

/** Swaps which club is at home. Refused server-side once a score exists. */
export function useInvertGame() {
  const invalidate = useFixtureInvalidation();
  return useMutation({
    mutationFn: async ({ gameId, reason }: { gameId: string; reason?: string }) => {
      const res = await api.post(`/games/${gameId}/invert`, reason ? { reason } : {});
      return res.data;
    },
    onSuccess: invalidate,
  });
}

export function useDeleteGame() {
  const invalidate = useFixtureInvalidation();
  return useMutation({
    mutationFn: async ({ gameId, reason }: { gameId: string; reason?: string }) => {
      await api.delete(`/games/${gameId}`, { params: reason ? { reason } : {} });
    },
    onSuccess: invalidate,
  });
}
