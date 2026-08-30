import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { api, getApiErrorMessage } from './api';
import { parseResponse } from './parse-response';
import { Gender, SeasonStatus } from '@/schemas';
import { toProperName } from '@/utils';

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

/**
 * The scoring and tie-break rules a league will be created with.
 *
 * Seeded server-side from the organisation's sport, so a basketball league starts at 2 points a
 * win and 1 a loss — LIPROBAKIN's own convention — rather than football's 3/1/0. The organiser
 * never had to set it, which is right, but they also never got to SEE it, which is not: the
 * whole promise of the product is that the table is not disputed, and the rule producing that
 * table is the first thing a federation would want confirmed.
 */
const SportRulesSchema = z.object({
  sportType: z.string(),
  pointSystem: z.object({
    rules: z.array(z.object({ outcome: z.string(), points: z.number() })),
  }),
  tieBreakers: z.array(
    z.object({ order: z.number(), rule: z.string(), label: z.string().optional() }),
  ),
});

export type SportRules = z.infer<typeof SportRulesSchema>;

export function useSportRules(sportType?: string) {
  return useQuery({
    queryKey: ['sport-rules', sportType],
    enabled: !!sportType,
    // Constants per sport; refetching them on every focus would be noise.
    staleTime: Infinity,
    queryFn: async () => {
      const res = await api.get(`/sport-rules/${sportType}`);
      return parseResponse(SportRulesSchema, res.data);
    },
  });
}

/** The dictionary's tie-break names, in the product's language. */
export const TIE_BREAK_LABELS: Record<string, string> = {
  GOALS_DIFFERENCE: 'Différence de points',
  GOAL_DIFFERENCE: 'Différence de points',
  HEAD_TO_HEAD_POINTS: 'Confrontation directe',
  HEAD_TO_HEAD_GOAL_DIFFERENCE: 'Différence en confrontation directe',
  HEAD_TO_HEAD_GOALS_FOR: 'Points marqués en confrontation directe',
  HEAD_TO_HEAD_WIN_PERCENTAGE: 'Pourcentage en confrontation directe',
  GOALS_SCORED: 'Points marqués',
  GOALS_FOR: 'Points marqués',
  GOALS_AGAINST: 'Points encaissés',
  WINS: 'Nombre de victoires',
  MOST_WINS: 'Nombre de victoires',
  WIN_PERCENTAGE: 'Pourcentage de victoires',
  AWAY_WINS: 'Victoires à l\u2019extérieur',
  AWAY_GOALS: 'Points marqués à l\u2019extérieur',
  FAIR_PLAY_POINTS: 'Fair-play',
  DISCIPLINE: 'Fair-play',
};

export const OUTCOME_LABELS: Record<string, string> = {
  WIN: 'Victoire',
  DRAW: 'Match nul',
  LOSS: 'Défaite',
  FORFEIT_WIN: 'Victoire par forfait',
  FORFEIT_LOSS: 'Forfait',
};

/**
 * The organisation's existing competitions, used to suggest a division that is not already taken.
 *
 * Every league defaulted to D1, so a second one created without thinking about it produced two
 * "D1 Messieurs" in the same organisation — indistinguishable in the breadcrumb and meaningless
 * as a division.
 */
const ExistingLeaguesSchema = z.object({
  data: z.array(z.object({ id: z.string(), division: z.string().nullable().optional(), gender: z.string().nullable().optional() })),
});

export function useExistingLeagues(tenantId?: string) {
  return useQuery({
    queryKey: ['leagues', 'divisions', tenantId],
    enabled: !!tenantId,
    queryFn: async () => {
      const res = await api.get(`/leagues?pageSize=100&tenantId=${tenantId}`);
      return parseResponse(ExistingLeaguesSchema, res.data);
    },
  });
}

/**
 * The lowest division not already used for this category.
 *
 * Suggested, never imposed: two competitions genuinely can share a division, and the organiser
 * may simply be creating "Coupe" alongside "Championnat". It just should not happen by accident.
 */
export function suggestDivision(
  existing: { division?: string | null; gender?: string | null }[] | undefined,
  gender: string,
): string {
  const taken = new Set(
    (existing ?? [])
      .filter((l) => l.gender === gender)
      .map((l) => (l.division ?? '').toUpperCase()),
  );
  for (let n = 1; n <= 20; n++) {
    if (!taken.has(`D${n}`)) return `D${n}`;
  }
  return 'D1';
}

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

/**
 * Editing a league already created by this wizard.
 *
 * The steps write as they complete, so going back cannot mean "create it again". It means
 * amending what exists — which is also what an organiser expects from a Back button that sits
 * next to fields already filled in.
 */
export function useUpdateLeague() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...values }: LeagueEssentialsValues & { id: string }) => {
      const res = await api.put(`/leagues/${id}`, {
        name: values.name,
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

export function useUpdateSeason() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...values }: SeasonEssentialsValues & { id: string }) => {
      const res = await api.put(`/seasons/${id}`, {
        name: values.name,
        startDate: values.startDate,
        endDate: values.endDate,
      });
      return parseResponse(CreatedSeasonSchema, res.data);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['seasons'] }),
  });
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

    // Tidied here as well as in the field, so a club pasted in and a club typed in end up
    // spelled the same way — "VC MaNIta" pasted was reaching the database untouched.
    const tidied = toProperName(name);

    const key = tidied.toLocaleLowerCase('fr');
    if (seen.has(key)) continue;
    seen.add(key);

    rows.push({ name: tidied, shortCode });
  }

  return rows;
}

/**
 * The short code the server would derive, offered while the organiser types the name.
 *
 * Mirrors `TeamsService.deriveShortCode`: clubs here are "<prefix> <name>" — BC Virunga, AS Vita
 * — so the longest word carries the identity. Shown as a suggestion rather than imposed, because
 * a league that already publishes VIR, CHX and MAE has to be able to keep them.
 */
export function suggestShortCode(name: string): string {
  const words = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean);
  if (!words.length) return '';
  const distinctive = words.reduce((longest, w) => (w.length > longest.length ? w : longest));
  return distinctive.slice(0, 3).toUpperCase();
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
