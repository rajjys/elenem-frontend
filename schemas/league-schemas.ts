// src/schemas/league-schemas.ts (or a similar location for your Zod schemas)
import * as z from 'zod';
import { SportType, LeagueVisibility, Gender, SportTypeSchema, LeagueVisibilitySchema } from '@/schemas'; // Assuming these enums are available or you'll mock them
import { CreateBusinessProfileSchema } from './common-schemas'
// Helper schemas for nested objects (similar to your DTOs)
export const TenantLiteResponseSchema = z.object({
  id: z.string().cuid(),
  name: z.string(),
  tenantCode: z.string(),
  sportType: SportTypeSchema,
});
export type TenantLiteResponseDto = z.infer<typeof TenantLiteResponseSchema>;

const LeagueLiteResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string().optional(),
});
export type LeagueLiteResponseDto = z.infer<typeof LeagueLiteResponseSchema>;

export const UserLiteResponseSchema = z.object({
  id: z.string().cuid(),
  username: z.string(),
  email: z.string().email(),
  firstName: z.string().nullable().optional(),
  lastName: z.string().nullable().optional(),
});
export type UserLiteResponseDto = z.infer<typeof UserLiteResponseSchema>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const LeagueBasicSchema: z.ZodSchema<any> = z.lazy(() => z.object({
  id: z.string().cuid(),
  externalId: z.string().uuid(),
  tenantId: z.string().cuid(),
  tenant: TenantLiteResponseSchema.nullable(), // Nullable as per DTO
  parentLeagueId: z.string().cuid().nullable().optional(),
  // For parentLeague, we avoid deep recursion in the Zod schema for simplicity and performance.
  // We only expect basic identifying fields if included.
  parentLeague: LeagueLiteResponseSchema.nullable().optional(),
  division: z.string(),
  gender: z.nativeEnum(Gender).nullable().optional(),
  name: z.string(),
  slug: z.string().optional(),
  isActive: z.boolean(),
  visibility: LeagueVisibilitySchema,

  createdAt: z.preprocess((arg) => new Date(arg as string), z.date()),
  updatedAt: z.preprocess((arg) => new Date(arg as string), z.date()),
  deletedAt: z.preprocess((arg) => arg ? new Date(arg as string) : null, z.date().nullable()).optional(),

  ownerId: z.string().cuid().nullable().optional(),
  owner: UserLiteResponseSchema.nullable().optional(),
  managingUsers: z.array(UserLiteResponseSchema).optional(), // Array of users managing the league
  teams: z.array(z.object({
    id: z.string().cuid(),
    name: z.string(),
    logoUrl: z.string().nullable().optional(),
    shortCode: z.string().nullable().optional(),
    bannerImageUrl: z.string().nullable().optional(),
    isActive: z.boolean(),
    country: z.string().nullable().optional(),
    region: z.string().nullable().optional(),
    city: z.string().nullable().optional(),
    state: z.string().nullable().optional(),
  })).optional(),
  players: z.array(z.object({
    id: z.string().cuid(),
    firstName: z.string().nullable().optional(),
    lastName: z.string().nullable().optional(),
    email: z.string().email(),
    profilePictureUrl: z.string().nullable().optional(),
  }))
  // If you include createdBy, updatedBy, deletedBy in LeagueResponseDto, add them here:
  // createdById: z.string().cuid().nullable().optional(),
  // createdBy: UserLiteResponseSchema.nullable().optional(),
  // updatedById: z.string().cuid().nullable().optional(),
  // updatedBy: UserLiteResponseSchema.nullable().optional(),
  // deletedById: z.string().cuid().nullable().optional(),
  // deletedBy: UserLiteResponseSchema.nullable().optional(),
}));

export type LeagueBasic = z.infer<typeof LeagueBasicSchema>;


// Paginated Response Schema for Leagues
export const PaginatedLeaguesResponseSchema = z.object({
  data: z.array(LeagueBasicSchema),
  totalItems: z.number().int().min(0),
  totalPages: z.number().int().min(0),
  currentPage: z.number().int().min(1),
  pageSize: z.number().int().min(1),
});

export type PaginatedLeaguesResponseDto = z.infer<typeof PaginatedLeaguesResponseSchema>;

// You might also want Zod schemas for your request parameters (GetLeaguesDto)
// For frontend usage, you usually define your filter state type,
// but if you want Zod validation for client-side forms/inputs, you could do this:
export const LeagueFilterParamsSchema = z.object({
    page: z.number().int().min(1).optional(),
    pageSize: z.number().int().min(1).max(100).optional(),
    search: z.string().optional(),
    tenantIds: z.array(z.string().cuid()).optional(), // Assuming CUIDs
    leagueIds: z.array(z.string().cuid()).optional(), // Assuming CUIDs
    sportType: SportTypeSchema.optional(),
    country: z.string().optional(),
    visibility: z.nativeEnum(LeagueVisibility).optional(),
    isActive: z.boolean().optional(),
    gender: z.nativeEnum(Gender).optional(),
    parentLeagueId: z.string().cuid().optional(),
    division: z.string().optional(),
    establishedYear: z.number().int().optional(),
    sortBy: z.string().optional(),
    sortOrder: z.union([z.literal('asc'), z.literal('desc')]).optional(),
});
// Filter parameters for fetching leagues (derived from your GetLeaguesDto)
export interface LeagueFilterParams {
  search?: string;
  tenantIds?: string[]; // For SYSTEM_ADMIN to filter by multiple tenants
  leagueIds?: string[]; // For SYSTEM_ADMIN to filter by specific leagues
  sportType?: SportType;
  country?: string;
  visibility?: LeagueVisibility;
  isActive?: boolean; // Corresponds to `isActive` for filters
  gender?: Gender;
  parentLeagueId?: string;
  division?: string;
  establishedYear?: number;
  page: number;
  pageSize: number;
  sortBy?: 'name' | 'sportType' | 'country' | 'ownerUsername' | 'createdAt' | 'updatedAt' | 'division' | 'establishedYear';
  sortOrder?: 'asc' | 'desc';
}
//export type GetLeaguesParams = z.infer<typeof LeagueFilterParamsSchema>;
// NEW: Zod schemas for points system and tiebreakers
export const PointRuleSchema = z.object({
  outcome: z.string().min(1, "Outcome is required"), // e.g., "WIN", "DRAW", "WIN_3_0"
  points: z.number().int(),
  // Add other conditions if necessary, e.g., 'conditionType': 'SET_SCORE', 'value': '3_0'
});

export const BonusPointRuleSchema = z.object({
  condition: z.string().min(1, "Condition is required"), // e.g., "CLEAN_SHEET", "SCORED_3_GOALS"
  points: z.number().int(),
  outcome: z.string(),
});

export const PointSystemConfigSchema = z.object({
  rules: z.array(PointRuleSchema),
  bonusPoints: z.array(BonusPointRuleSchema).optional(),
  commonMetrics: z.record(z.string(), z.string()).optional(),
});

export const TieBreakerRuleSchema = z.object({
  order: z.number().int().min(1),
  rule: z.string().min(1, "rule is required"), // e.g., "HEAD_TO_HEAD_POINTS", "GOAL_DIFFERENCE"
  description: z.string().min(1, "Description is required"), // e.g., "Points in head-to-head matches"
  sort: z.enum(['asc', 'desc', 'random']),
});

export const TieBreakerConfigSchema = z.array(TieBreakerRuleSchema);


// Create League Schema
export const CreateLeagueSchema = z.object({
  name: z.string().min(3, { message: "League name must be at least 3 characters." }),
  tenantId: z.string().cuid({ message: "Invalid Tenant ID." }),
  parentLeagueId: z.string().cuid().optional().nullable(),
  division: z.string(),
  gender: z.nativeEnum(Gender),
  visibility: z.nativeEnum(LeagueVisibility).optional(),
  ownerId: z.string().cuid().optional().nullable(),
  isActive: z.boolean(),
  // The business profile is now a required sub-object
  businessProfile: z.object({
    //id: z.string().cuid(),
    //name: z.string().optional().null,
    //country: z.string().optional().nullable(),
    logoUrl: z.string().optional().nullable(),
    bannerImageUrl: z.string().optional().nullable(),
    physicalAddress: z.string().optional().nullable(),
    description: z.string().optional().nullable(),
    region: z.string().optional().nullable(),
    city: z.string().optional().nullable(),
  }),
  // Point system and tiebreakers are optional here as they are configured in a separate step
  pointSystemConfig: PointSystemConfigSchema.optional(),
  tieBreakerConfig: TieBreakerConfigSchema.optional(),
});
export type CreateLeagueDto = z.infer<typeof CreateLeagueSchema>;

// Update League Schema
export const UpdateLeagueSchema = CreateLeagueSchema.partial().extend({
  id: z.string().cuid(),
  businessProfile: CreateBusinessProfileSchema.partial().optional(),
});
export type UpdateLeagueDto = z.infer<typeof UpdateLeagueSchema>;

export const LeagueDetailsSchema = UpdateLeagueSchema.extend({
  id: z.string().cuid(),
  slug: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  tenant: TenantLiteResponseSchema,
  owner: UserLiteResponseSchema.optional().nullable(),
  parentLeague: z.object({
    id: z.string().cuid(),
    name: z.string(),
  }).optional().nullable(),
  businessProfile: z.object({
    id: z.string().cuid(),
    name: z.string(),
    country: z.string().optional().nullable(),
    region: z.string().optional().nullable(),
    city: z.string().optional().nullable(),
  }),
});

export type LeagueDetails = z.infer<typeof LeagueDetailsSchema>;
export type PointRule = z.infer<typeof PointRuleSchema>;
export type BonusPointRule = z.infer<typeof BonusPointRuleSchema>;
export type PointSystemConfig = z.infer<typeof PointSystemConfigSchema>;
export type TieBreakerRule = z.infer<typeof TieBreakerRuleSchema>;
export type TieBreakerConfig = z.infer<typeof TieBreakerConfigSchema>;

