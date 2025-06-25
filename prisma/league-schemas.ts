// src/schemas/league-schemas.ts (or a similar location for your Zod schemas)
import * as z from 'zod';
import { SportType, LeagueVisibility, Gender, Role, SportTypeSchema, LeagueVisibilitySchema } from '@/prisma/'; // Assuming these enums are available or you'll mock them

// Helper schemas for nested objects (similar to your DTOs)
export const TenantLiteResponseSchema = z.object({
  id: z.string().cuid(),
  name: z.string(),
  tenantCode: z.string(),
});
export type TenantLiteResponseDto = z.infer<typeof TenantLiteResponseSchema>;

const LeagueLiteResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  leagueCode: z.string(),
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

// League Response Schema
// This one needs special handling for the self-referencing `parentLeague`
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
  leagueCode: z.string(),
  slug: z.string(),
  country: z.string().nullable().optional(),
  region: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  state: z.string().nullable().optional(),
  establishedYear: z.number().int().nullable().optional(),
  description: z.string().nullable().optional(),
  logoUrl: z.string().nullable().optional(),
  bannerImageUrl: z.string().nullable().optional(),
  sportType: SportTypeSchema,

  status: z.boolean(),
  visibility: LeagueVisibilitySchema,

  createdAt: z.preprocess((arg) => new Date(arg as string), z.date()),
  updatedAt: z.preprocess((arg) => new Date(arg as string), z.date()),
  deletedAt: z.preprocess((arg) => arg ? new Date(arg as string) : null, z.date().nullable()).optional(),

  ownerId: z.string().cuid().nullable().optional(),
  owner: UserLiteResponseSchema.nullable().optional(),

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

export type PaginatedLeaguesResponse = z.infer<typeof PaginatedLeaguesResponseSchema>;

// You might also want Zod schemas for your request parameters (GetLeaguesDto)
// For frontend usage, you usually define your filter state type,
// but if you want Zod validation for client-side forms/inputs, you could do this:
export const LeagueFilterParamsSchema = z.object({
    page: z.number().int().min(1).optional(),
    pageSize: z.number().int().min(1).max(100).optional(),
    search: z.string().optional(),
    tenantIds: z.array(z.string().cuid()).optional(), // Assuming CUIDs
    leagueIds: z.array(z.string().cuid()).optional(), // Assuming CUIDs
    sportType: z.nativeEnum(SportType).optional(),
    country: z.string().optional(),
    visibility: z.nativeEnum(LeagueVisibility).optional(),
    status: z.boolean().optional(),
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
  status?: boolean; // Corresponds to `isActive` for filters
  gender?: Gender;
  parentLeagueId?: string;
  division?: string;
  establishedYear?: number;
  page?: number;
  pageSize?: number;
  sortBy?: 'name' | 'leagueCode' | 'sportType' | 'country' | 'ownerUsername' | 'createdAt' | 'updatedAt' | 'division' | 'establishedYear';
  sortOrder?: 'asc' | 'desc';
}
//export type GetLeaguesParams = z.infer<typeof LeagueFilterParamsSchema>;
