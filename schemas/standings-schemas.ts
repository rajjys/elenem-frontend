import z from "zod";

export interface Standings {
    team: {
        id: string;
        name: string;
        shortCode: string;
        slug: string;
        businessProfile: {
            logoAsset?: {
                url: string;
            } | null;
        }
    };
    rank: number;
    points: number;
    form?: string | null;
    gamesPlayed: number;
    league: {
        id: string;
        name: string;
        slug: string;
    }
}

export const StandingsBasicSchema = z.object({
  team: z.object({
    id: z.string().cuid(),
    name: z.string(),
    shortCode: z.string(),
    slug: z.string(),
    logoUrl: z.string().nullable().optional(),
    businessProfile: z.object({
        logoAsset: z.object({
            url: z.string()
        }).nullable().optional()
    })
  }),

  rank: z.number().int().nonnegative(),
  points: z.number().int().nonnegative(),
  gamesPlayed: z.number().int().nonnegative(),
  wins: z.number().int().nonnegative(),
  losses: z.number().int().nonnegative(),
  draws: z.number().int().nonnegative(),
  forfeits: z.number().int().nonnegative(),
  goalsFor: z.number().int().nonnegative(),
  goalsAgainst: z.number().int().nonnegative(),
  goalDifference: z.number(), // can be negative
});

export type StandingsBasic = z.infer<typeof StandingsBasicSchema>;