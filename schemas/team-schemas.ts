// schemas/team.schemas.ts (new file, or add to your existing prisma/index.ts for shared schemas)
import * as z from 'zod';
import { GenderSchema, SportTypeSchema, VisibilityLevel, VisibilityLevelSchema } from './enums';
import { BusinessProfileSchema } from './common-schemas';

// 2) Base team: drop description/logo/banner from here
export const BaseTeamSchema = z.object({
  name: z.string().min(2, "Team name must be at least 2 characters long."),
  shortCode: z.string().min(2, "Short code must be at least 2 characters long.").optional().or(z.literal("")),
});

// 3) Create schema: businessProfile moved in; owner/homeVenue live here (step 2)
export const CreateTeamFormSchema = BaseTeamSchema.extend({
  // role-scoped; see UI rules below for who picks what
  leagueId: z.string().min(1, "League is required."),
  // Only for SYS ADMIN UI filtering; not required by backend create (derived from league)
  tenantId: z.string().optional().or(z.literal("")),
  businessProfile: BusinessProfileSchema,
  ownerId: z.string().optional().nullable().or(z.literal("")),
  homeVenueId: z.string().nullable().optional().or(z.literal("")),
  visibility: VisibilityLevelSchema,
  isActive: z.boolean().optional(),
});

// 4) Update-by-LA schema (unchanged except it no longer carries desc/logo/banner)
export const UpdateTeamByLaFormSchema = BaseTeamSchema.extend({
  homeVenueId: z.string().nullable().optional(),
  visibility: VisibilityLevelSchema.optional(),
  isActive: z.boolean().optional(),
});

// 5) Update-by-TA schema: remove desc/logo/banner here too (those belong to business profile flows)
export const UpdateTeamProfileByTaFormSchema = z.object({
  name: z.string().min(2, "Team name must be at least 2 characters long.").optional(),
  shortCode: z.string().min(2, "Short code must be at least 2 characters long.").optional().or(z.literal("")),
  country: z.string().optional().or(z.literal("")),
  city: z.string().optional().or(z.literal("")),
  state: z.string().optional().or(z.literal("")),
  establishedYear: z.number().int().min(1900).max(new Date().getFullYear()).optional(),
  teamProfile: z.record(z.any()).optional(),
});

// 6) Details schema now includes businessProfile object explicitly
export const TeamDetailsSchema = BaseTeamSchema.extend({
  id: z.string().cuid(),
  externalId: z.string().uuid(),
  slug: z.string(),
  homeVenueId: z.string().nullable().optional(),
  visibility: VisibilityLevelSchema.optional(),
  isActive: z.boolean().optional(),
  leagueId: z.string().cuid(),
  tenantId: z.string().cuid(),
  businessProfile: BusinessProfileSchema,
  league: z.object({
    id: z.string().cuid(),
    name: z.string(),
    slug: z.string(),
    gender: z.any(),
    division: z.string(),
  }),
  tenant: z.object({
    id: z.string().cuid(),
    name: z.string(),
    tenantCode: z.string(),
    sportType: z.any(),
    slug: z.string()
  }),
  managers: z.array(z.object({
    id: z.string().cuid(),
    username: z.string(),
    firstName: z.string().optional(),
    lastName: z.string().optional()
  })),
  homeVenue: z.object({
    id: z.string().cuid(),
    name: z.string(),
  }).optional(),
});

export type SortableColumn = 'name'| 'shortCode'| 'leagueName'| 'tenantName'| 'country'| 'city'| 'establishedYear'| 'createdAt'| 'updatedAt';
export const TeamFilterParamsSchema = z.object({
  page: z.number().int().min(1).default(1).optional(),
  pageSize: z.number().int().min(1).max(100).default(10).optional(),
  search: z.string().optional(),
  tenantId: z.string().nullable().optional(), // Specific tenant ID (for Tenant Admin, or SA filter)
  leagueId: z.string().nullable().optional(), // Specific league ID (for League Admin, or SA/TA filter)
  sportType: SportTypeSchema.optional(), // Inherited from league, but good to filter by
  country: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  isActive: z.boolean().optional(),
  visibility: z.nativeEnum(VisibilityLevel).optional(),
  gender: GenderSchema.optional(), // Inherited from league
  division: z.string().optional(), // Inherited from league
  establishedYear: z.number().int().optional(),
  sortBy: z.enum(['name', 'shortCode', 'leagueName', 'tenantName', 'country', 'city', 'establishedYear', 'createdAt', 'updatedAt']).default('createdAt').optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc').optional(),
}).partial(); // All fields are optional for filtering

export type TeamFilterParams = z.infer<typeof TeamFilterParamsSchema>;
// Union type for form values (for react-hook-form typing)
export type TeamFormValues = z.infer<typeof CreateTeamFormSchema>

export type TeamDetails = z.infer<typeof TeamDetailsSchema>;

// Paginated Response Schema for Leagues
export const PaginatedTeamsResponseSchema = z.object({
  data: z.array(TeamDetailsSchema),
  totalItems: z.number().int().min(0),
  totalPages: z.number().int().min(0),
  currentPage: z.number().int().min(1),
  pageSize: z.number().int().min(1),
});