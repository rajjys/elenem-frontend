import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { api } from './api';
import { parseResponse } from './parse-response';

/**
 * The organisation's calendar: every competition on one grid.
 *
 * Read-only. This is the slice that serves the operator we actually have on day one — a community
 * manager who does not decide the fixture list and cannot change it, but has to see it and
 * publish from it.
 */

const CalendarSideSchema = z.object({
  id: z.string(),
  name: z.string(),
  shortCode: z.string(),
});

const CalendarEntrySchema = z.object({
  id: z.string(),
  dateTime: z.string(),
  durationMinutes: z.number(),
  status: z.string(),
  leagueId: z.string(),
  venueId: z.string().nullable().optional(),
  courtId: z.string().nullable().optional(),
  home: CalendarSideSchema,
  away: CalendarSideSchema,
  homeScore: z.number().nullable().optional(),
  awayScore: z.number().nullable().optional(),
});

const CalendarSchema = z.object({
  from: z.string(),
  to: z.string(),
  competitions: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      division: z.string().nullable().optional(),
      gender: z.string().nullable().optional(),
      shortLabel: z.string(),
    }),
  ),
  venues: z.array(
    z.object({ id: z.string(), name: z.string(), city: z.string().nullable().optional() }),
  ),
  entries: z.array(CalendarEntrySchema),
  blackouts: z.array(
    z.object({
      venueId: z.string(),
      start: z.string(),
      end: z.string(),
      reason: z.string().nullable().optional(),
    }),
  ),
});

export type Calendar = z.infer<typeof CalendarSchema>;
export type CalendarEntry = z.infer<typeof CalendarEntrySchema>;
export type CalendarCompetition = Calendar['competitions'][number];
export type CalendarVenue = Calendar['venues'][number];

export function useCalendar(params: { from: string; to: string; leagueIds?: string[] }) {
  const leagueIds = params.leagueIds?.length ? params.leagueIds.join(',') : undefined;

  return useQuery({
    queryKey: ['calendar', params.from, params.to, leagueIds ?? 'all'],
    queryFn: async () => {
      const res = await api.get('/calendar', {
        params: { from: params.from, to: params.to, ...(leagueIds ? { leagueIds } : {}) },
      });
      return parseResponse(CalendarSchema, res.data);
    },
    // A month of fixtures does not change while you look at it, and this is read on a connection
    // that pays for every request.
    staleTime: 60_000,
  });
}

/** yyyy-mm-dd in the viewer's own day — not UTC, which reports yesterday east of Greenwich. */
export function isoDay(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Every day a blackout covers, so the grid can mark them without re-deriving ranges per cell. */
export function blackoutDays(blackouts: Calendar['blackouts']): Map<string, string[]> {
  const days = new Map<string, string[]>();
  for (const b of blackouts) {
    const cursor = new Date(b.start);
    const end = new Date(b.end);
    while (cursor <= end) {
      const key = isoDay(cursor);
      days.set(key, [...(days.get(key) ?? []), b.reason || 'Salle indisponible']);
      cursor.setDate(cursor.getDate() + 1);
    }
  }
  return days;
}
