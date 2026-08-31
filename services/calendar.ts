import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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

/** The seasons the organiser could download a results sheet for. */
const SeasonsSchema = z.object({
  data: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      leagueId: z.string(),
      league: z.object({ id: z.string(), name: z.string() }).optional(),
    }),
  ),
});

export function useSeasonsForDownload(leagueId?: string) {
  return useQuery({
    queryKey: ['seasons', 'download', leagueId ?? 'all'],
    queryFn: async () => {
      const res = await api.get('/seasons', {
        params: { pageSize: 50, ...(leagueId ? { leagueId } : {}) },
      });
      return parseResponse(SeasonsSchema, res.data);
    },
    staleTime: 5 * 60_000,
  });
}

/**
 * Downloads the season's results sheet.
 *
 * A blob rather than a link, because the endpoint is authenticated: an <a href> sends no bearer
 * token, so the browser would be handed a 401 page named .xlsx.
 */
export function useDownloadResultsSheet() {
  return useMutation({
    mutationFn: async (seasonId: string) => {
      const res = await api.get(`/calendar/template/${seasonId}`, { responseType: 'blob' });

      const disposition = String(res.headers?.['content-disposition'] ?? '');
      const named = /filename="?([^"]+)"?/.exec(disposition)?.[1];

      const url = URL.createObjectURL(res.data as Blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = named ?? 'elenem-calendrier.xlsx';
      document.body.appendChild(link);
      link.click();
      link.remove();
      // Revoked on the next tick: releasing it synchronously can cancel the download in Safari.
      setTimeout(() => URL.revokeObjectURL(url), 0);
    },
  });
}

// --- reading a filled-in sheet back ---------------------------------------------------------

const ImportRowSchema = z.object({
  line: z.number(),
  outcome: z.enum(['score', 'unchanged', 'create', 'error']),
  home: z.string(),
  away: z.string(),
  date: z.string().optional(),
  homeScore: z.number().nullable().optional(),
  awayScore: z.number().nullable().optional(),
  gameId: z.string().optional(),
  message: z.string().optional(),
});

const ImportReportSchema = z.object({
  dryRun: z.boolean(),
  seasonId: z.string(),
  totals: z.object({
    score: z.number(),
    unchanged: z.number(),
    create: z.number(),
    error: z.number(),
  }),
  rows: z.array(ImportRowSchema),
});

export type ImportReport = z.infer<typeof ImportReportSchema>;
export type ImportRow = z.infer<typeof ImportRowSchema>;

/**
 * Sends the sheet back.
 *
 * Always previewed first from the UI. A spreadsheet somebody else filled in is the one input an
 * organiser cannot check by eye, so seeing what it will do — and that the preview matches what
 * the apply then does — is the whole point.
 */
export function useImportResults() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      seasonId,
      file,
      dryRun,
    }: {
      seasonId: string;
      file: File;
      dryRun: boolean;
    }) => {
      const body = new FormData();
      body.append('file', file);
      body.append('dryRun', String(dryRun));
      // The shared instance defaults to application/json. Leaving that on a FormData body sends
      // multipart without its boundary, and the server sees no file at all — which is exactly
      // what it reported. Undefined lets the browser set the header, boundary included.
      const res = await api.post(`/calendar/import/${seasonId}`, body, {
        headers: { 'Content-Type': undefined },
      });
      return parseResponse(ImportReportSchema, res.data);
    },
    onSuccess: (report) => {
      if (!report.dryRun) {
        queryClient.invalidateQueries({ queryKey: ['calendar'] });
        queryClient.invalidateQueries({ queryKey: ['standings'] });
      }
    },
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
