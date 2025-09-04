// schemas/game.schema.ts
import { z } from 'zod';
import { GameStatus } from '@/schemas/'; // Assuming Prisma enums are available

// --- Base Schemas for Relations ---
const TeamBasicSchema = z.object({
  id: z.string(),
  name: z.string(),
  shortCode: z.string(),
  slug: z.string(),
  rank: z.number().optional().nullable(),
  record: z.string().optional().nullable(),
  businessProfile: z.object({
    logoUrl: z.string().nullable().optional(),
    bannerImageUrl: z.string().nullable().optional(),
  })
});

const LeagueBasicSchema = z.object({
  id: z.string(),
  name: z.string(),
});
const TenantBasicSchema = z.object({
  id: z.string(),
  name: z.string(),
  tenantCode: z.string(),
  businessProfile: z.object({
    website: z.string().optional().nullable(),
  })
});

const SeasonBasicSchema = z.object({
  id: z.string(),
  name: z.string(),
});
const HomeVenueBasicSchema = z.object({
  id: z.string(),
  name: z.string()
})

// --- Main Game Details Schema ---
// This represents a single game object returned from the API
export const GameDetailsSchema = z.object({
  id: z.string().cuid(),
  slug: z.string(),
  dateTime: z.string().datetime(),
  week: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  status: z.nativeEnum(GameStatus),
  homeScore: z.number().int().nullable().optional(),
  awayScore: z.number().int().nullable().optional(),
  notes: z.string().nullable().optional(),
  round: z.string().nullable().optional(),
  bannerImageUrl: z.string().nullable().optional(),
  highlightsUrl: z.string().nullable().optional(),
  isActive: z.boolean(),
  // Relations
  homeTeamId: z.string(),
  awayTeamId: z.string(),
  homeVenueId: z.string().optional().nullable(),
  homeTeam: TeamBasicSchema,
  awayTeam: TeamBasicSchema,
  league: LeagueBasicSchema,
  season: SeasonBasicSchema,
  tenant: TenantBasicSchema,
  homeVenue: HomeVenueBasicSchema.nullable(),
  // IDs for filtering
  //leagueId: z.string().cuid(),
  //tenantId: z.string().cuid(),
  //seasonId: z.string().cuid().nullable(),
});

export type GameDetails = z.infer<typeof GameDetailsSchema>;

// --- Schema for API Filter Parameters ---
// This validates the query parameters for the GET /games endpoint
export const GameFilterParamsSchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(12), // Default to 12 for a nice grid
  search: z.string().optional(),
  tenantId: z.string().cuid().optional().nullable(),
  leagueId: z.string().cuid().optional().nullable(),
  seasonId: z.string().cuid().optional().nullable(),
  teamId: z.string().cuid().optional().nullable(),
  status: z.nativeEnum(GameStatus).optional(),
  date: z.string().optional(), // Expecting YYYY-MM-DD format
  isActive: z.boolean().optional(),
  sortBy: z.enum(['dateTime', 'createdAt']).default('dateTime').optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc').optional(),
});

export type GameFilterParams = z.infer<typeof GameFilterParamsSchema>;

// --- Schema for the Paginated API Response ---
export const PaginatedGamesResponseSchema = z.object({
  data: z.array(GameDetailsSchema),
  totalItems: z.number().int(),
  totalPages: z.number().int(),
  currentPage: z.number().int(),
  pageSize: z.number().int(),
});
