// schemas/team.schemas.ts (new file, or add to your existing prisma/index.ts for shared schemas)
import * as z from 'zod';
import { GenderSchema, SportTypeSchema, TeamVisibility, TeamVisibilitySchema } from './enums';

// Base schema for common team fields
export const BaseTeamSchema = z.object({
  name: z.string().min(2, "Team name must be at least 2 characters long."),
  shortCode: z.string().min(2, "Short code must be at least 2 characters long.").optional().or(z.literal('')),
  description: z.string().optional().or(z.literal('')),
  logoUrl: z.string().url("Invalid logo URL.").optional().or(z.literal('')),
  bannerImageUrl: z.string().url("Invalid banner image URL.").optional().or(z.literal('')),
  country: z.string().optional().or(z.literal('')),
  city: z.string().optional().or(z.literal('')),
  state: z.string().optional().or(z.literal('')),
  establishedYear: z.number().int().min(1900, "Year must be 1900 or later.").max(new Date().getFullYear(), "Year cannot be in the future.").optional(),
  teamProfile: z.record(z.any()).optional(), // For Prisma's Json type
});

// Schema for creating a team (used by SYSTEM_ADMIN, TENANT_ADMIN, LEAGUE_ADMIN)
export const CreateTeamFormSchema = BaseTeamSchema.extend({
  leagueId: z.string().min(1, "League is required."),
  tenantId: z.string().min(1, "Tenant is required."), // Only required for SYSTEM_ADMIN on form
  homeVenueId: z.string().optional().or(z.literal('')),
  visibility: TeamVisibilitySchema.default(TeamVisibility.PUBLIC),
  initialTeamAdminId: z.string().optional().or(z.literal('')),
  isActive: z.boolean().optional(),
  // This field is not required for creation, but can be set by SYSTEM_ADMIN or TENANT_ADMIN
});

// Schema for updating a team by League Admin (or higher roles)
export const UpdateTeamByLaFormSchema = BaseTeamSchema.extend({
  homeVenueId: z.string().nullable().optional(), // Can be null to unassign
  visibility: z.nativeEnum(TeamVisibility).optional(),
  isActive: z.boolean().optional(),
});

// Schema for updating a team profile by Team Admin (restricted fields)
export const UpdateTeamProfileByTaFormSchema = z.object({
  name: z.string().min(2, "Team name must be at least 2 characters long.").optional(),
  shortCode: z.string().min(2, "Short code must be at least 2 characters long.").optional().or(z.literal('')),
  description: z.string().optional().or(z.literal('')),
  logoUrl: z.string().url("Invalid logo URL.").optional().or(z.literal('')),
  bannerImageUrl: z.string().url("Invalid banner image URL.").optional().or(z.literal('')),
  country: z.string().optional().or(z.literal('')),
  city: z.string().optional().or(z.literal('')),
  state: z.string().optional().or(z.literal('')),
  establishedYear: z.number().int().min(1900, "Year must be 1900 or later.").max(new Date().getFullYear(), "Year cannot be in the future.").optional(),
  teamProfile: z.record(z.any()).optional(),
  // These fields are explicitly excluded or read-only for Team Admins
  // isActive: z.boolean().optional().refine(() => false, { message: "Not editable by Team Admin." }),
  // visibility: z.nativeEnum(TeamVisibility).optional().refine(() => false, { message: "Not editable by Team Admin." }),
  // homeVenueId: z.string().nullable().optional().refine(() => false, { message: "Not editable by Team Admin." }),
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
  visibility: z.nativeEnum(TeamVisibility).optional(),
  gender: GenderSchema.optional(), // Inherited from league
  division: z.string().optional(), // Inherited from league
  establishedYear: z.number().int().optional(),
  sortBy: z.enum(['name', 'shortCode', 'leagueName', 'tenantName', 'country', 'city', 'establishedYear', 'createdAt', 'updatedAt']).default('createdAt').optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc').optional(),
}).partial(); // All fields are optional for filtering

export type TeamFilterParams = z.infer<typeof TeamFilterParamsSchema>;
// Union type for form values (for react-hook-form typing)
export type TeamFormValues = z.infer<typeof CreateTeamFormSchema>

export const TeamDetailsSchema = BaseTeamSchema.extend({
  id: z.string().cuid(),
  externalId: z.string().uuid(),
  slug: z.string(),
  homeVenueId: z.string().nullable().optional(), // Can be null to unassign
  visibility: z.nativeEnum(TeamVisibility).optional(),
  isActive: z.boolean().optional(),
  leagueId: z.string().cuid(),
  tenantId: z.string().cuid(),
  league: z.object({
    id: z.string().cuid(),
    name: z.string(),
    leagueCode: z.string(),
    gender: GenderSchema,
    division: z.string()
  }),
  tenant: z.object({
    id: z.string().cuid(),
    name: z.string(),
    tenantCode: z.string(),
    sportType: SportTypeSchema,
  }),
  managers:z.array(z.object({
    id: z.string().cuid(),
    username: z.string(),
    firstName: z.string().optional(),
    lastName: z.string().optional()
  })),
  homeVenue : z.object({
    id: z.string().cuid(),
    name: z.string(),
  }),
});

export type TeamDetails = z.infer<typeof TeamDetailsSchema>;

// Paginated Response Schema for Leagues
export const PaginatedTeamsResponseSchema = z.object({
  data: z.array(TeamDetailsSchema),
  totalItems: z.number().int().min(0),
  totalPages: z.number().int().min(0),
  currentPage: z.number().int().min(1),
  pageSize: z.number().int().min(1),
});