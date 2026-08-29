import { useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { api, getApiErrorMessage } from './api';
import { parseResponse } from './parse-response';
import { Gender, SeasonStatus } from '@/schemas';

/**
 * Creating the three things a league needs before it can publish anything: a competition, a
 * season, and the clubs playing in it.
 *
 * Each is the minimum the API actually requires. The forms these back replaced multi-step
 * wizards — 1,095 lines for a league, 727 for a team — sitting over endpoints that want a name
 * and a parent id. Address, branding and contact details moved to the settings pages that have
 * room for them.
 */

// --- league ---------------------------------------------------------------------------------

export const LeagueEssentialsSchema = z.object({
  name: z.string().trim().min(3, 'Nom de la ligue requis'),
  gender: z.nativeEnum(Gender),
  division: z.string().trim().max(8, '8 caractères au maximum').optional(),
});

export type LeagueEssentialsValues = z.infer<typeof LeagueEssentialsSchema>;

const CreatedLeagueSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string().optional(),
});

export function useCreateLeague() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: LeagueEssentialsValues & { tenantId: string }) => {
      const res = await api.post('/leagues', {
        name: values.name,
        tenantId: values.tenantId,
        gender: values.gender,
        division: values.division?.trim() || 'D1',
      });
      return parseResponse(CreatedLeagueSchema, res.data);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['leagues'] }),
  });
}

// --- season ---------------------------------------------------------------------------------

export const SeasonEssentialsSchema = z
  .object({
    name: z.string().trim().min(2, 'Nom de la saison requis'),
    startDate: z.string().min(1, 'Date de début requise'),
    endDate: z.string().min(1, 'Date de fin requise'),
  })
  .refine((v) => new Date(v.endDate) > new Date(v.startDate), {
    message: 'La fin doit suivre le début',
    path: ['endDate'],
  });

export type SeasonEssentialsValues = z.infer<typeof SeasonEssentialsSchema>;

const CreatedSeasonSchema = z.object({
  id: z.string(),
  name: z.string(),
});

export function useCreateSeason() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: SeasonEssentialsValues & { leagueId: string }) => {
      const res = await api.post('/seasons', {
        name: values.name,
        leagueId: values.leagueId,
        startDate: values.startDate,
        endDate: values.endDate,
        // A season whose start has passed is already running — which is the ordinary case for a
        // league adopting Elenem in February, and the one the onboarding has to survive.
        status:
          new Date(values.startDate) <= new Date() ? SeasonStatus.ACTIVE : SeasonStatus.SCHEDULED,
      });
      return parseResponse(CreatedSeasonSchema, res.data);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['seasons'] }),
  });
}

/** "Saison 2026-2027" for a season starting in the second half of the year, else "Saison 2026". */
export function suggestSeasonName(start: Date): string {
  const year = start.getFullYear();
  return start.getMonth() >= 6 ? `Saison ${year}-${year + 1}` : `Saison ${year}`;
}

// --- teams ----------------------------------------------------------------------------------

export interface TeamRow {
  name: string;
  shortCode?: string;
}

/**
 * Turns a pasted block into team rows.
 *
 * A league secretary has the clubs in a WhatsApp message or a column of a spreadsheet, not in
 * twenty-five separate forms. One per line; an optional code may follow a comma, a tab or a run
 * of spaces, and is derived server-side when absent.
 *
 *     BC Virunga
 *     AS Vita Club, VIT
 *     Chaux Sport    CHX
 */
export function parseTeamLines(block: string): TeamRow[] {
  const seen = new Set<string>();
  const rows: TeamRow[] = [];

  for (const raw of block.split('\n')) {
    const line = raw.trim();
    if (!line) continue;

    const parts = line.split(/[,;\t]+|\s{2,}/).map((f) => f.trim()).filter(Boolean);
    const name = parts[0];
    if (!name) continue;

    // A trailing field is a code only if it looks like one; "BC Virunga  Cadets" is a name.
    const tail = parts[1];
    const shortCode = tail && /^[A-Za-z0-9]{2,4}$/.test(tail) ? tail.toUpperCase() : undefined;

    const key = name.toLocaleLowerCase('fr');
    if (seen.has(key)) continue;
    seen.add(key);

    rows.push({ name, shortCode });
  }

  return rows;
}

export interface BulkTeamResult {
  created: { id: string; name: string; shortCode?: string }[];
  failed: { name: string; error: string }[];
}

/**
 * Creates the teams one request at a time, reporting each failure against its row.
 *
 * Sequential rather than a bulk endpoint, matching the roster importer: every team then passes
 * through the same scope, slug and uniqueness rules as one created by hand, and a single bad row
 * — a duplicate name, usually — is reported rather than aborting the other twenty-four.
 */
export function useCreateTeamsBulk() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      rows,
      leagueId,
      onProgress,
    }: {
      rows: TeamRow[];
      leagueId: string;
      onProgress?: (done: number, total: number) => void;
    }): Promise<BulkTeamResult> => {
      const created: BulkTeamResult['created'] = [];
      const failed: BulkTeamResult['failed'] = [];

      for (const [index, row] of rows.entries()) {
        try {
          const res = await api.post('/teams', {
            name: row.name,
            leagueId,
            ...(row.shortCode ? { shortCode: row.shortCode } : {}),
          });
          created.push({
            id: res.data?.id,
            name: res.data?.name ?? row.name,
            shortCode: res.data?.shortCode,
          });
        } catch (error) {
          failed.push({ name: row.name, error: getApiErrorMessage(error) });
        }
        onProgress?.(index + 1, rows.length);
      }

      return { created, failed };
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['teams'] }),
  });
}
