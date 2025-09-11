// src/prisma/tenant-schemas.ts
import * as z from 'zod';
import { SportType, Roles, SportTypeSchema, TenantTypes, TenantTypeSchema, GameStatus, PublicBusinessProfileResponseDto } from './index'; // Assuming SportType and Role are defined in src/prisma/index.ts

export interface TenantBasic {
  id: string;
  externalId: string;
  name: string;
  tenantCode: string;
  tenantType: TenantTypes;
  slug: string;
  logoUrl?: string | null;
  isActive: boolean;
  sportType: SportType; // From the provided Tenant model
  country?: string | null;
  owner?: {
    id: string;
    username: string;
    firstName?: string | null;
    lastName?: string | null;
  } | null;
}
export interface TenantFilterParams {
  search?: string;
  isActive?: boolean;
  tenantType?: TenantTypes;
  sportType?: SportType;
  country?: string;
  page?: number;
  pageSize?: number;
  sortBy?: 'name' | 'tenantCode' | 'tenantType' | 'sportType' | 'country' | 'ownerUsername' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}

export const TenantBasicSchema = z.object({
  id: z.string().cuid(),
  externalId: z.string().uuid(),
  name: z.string(),
  tenantCode: z.string(),
  tenantType: TenantTypeSchema,
  slug: z.string(),
  logoUrl: z.string().url().nullable().optional(),
  isActive: z.boolean(),
  sportType: SportTypeSchema,
  country: z.string().optional(),
  owner: z.object({
    id: z.string(),
    username: z.string(),
    firstName: z.string().nullable().optional(),
    lastName: z.string().nullable().optional(),
  }).nullable().optional(), // Expanded owner details
});
export type TenantBasicDto = z.infer<typeof TenantBasicSchema>;

// Full Tenant Schema (for display/detail)
export const TenantDetailsSchema = z.object({
  id: z.string().cuid(),
  externalId: z.string().uuid(),
  name: z.string().min(1, "Tenant name is required").max(100),
  tenantCode: z.string().min(3, "Tenant code must be at least 3 characters").max(12, "Tenant code must be at most 12 characters").regex(/^[A-Z0-9]+$/, "Tenant code must be uppercase alphanumeric"),
  tenantType: TenantTypeSchema,
  sportType: SportTypeSchema,
  country: z.string().min(2, "Country is required"),//.max(2, "Country must be a 2-letter ISO code"), // ISO 2-letter code
  businessProfile: z.object({
    name: z.string().min(1, 'Business name is required.'),
    description: z.string().optional(),
    logoUrl: z.string().optional().nullable(), // Use a simple string as requested
    bannerImageUrl: z.string().optional().nullable(), // Use a simple string as requested
    website: z.string().optional().nullable(),
    //socialMediaLinks: z.record(z.string()).optional(),
    //establishedYear: z.number().int().min(1000).max(new Date().getFullYear()).optional(),
    physicalAddress: z.string().optional(),
    city: z.string().optional(),
    //state: z.string().optional(),
    region: z.string().optional(),
    //postalCode: z.string().optional(),
  }),
  isActive: z.boolean(),
  createdAt: z.preprocess((arg) => new Date(arg as string), z.date()),
  updatedAt: z.preprocess((arg) => new Date(arg as string), z.date()),
  ownerId: z.string().nullable().optional(), // Tenant owner, refers to User.id
  // Relationships (optional, for display purposes)
  owner: z.object({
    id: z.string(),
    username: z.string(),
    firstName: z.string().nullable().optional(),
    lastName: z.string().nullable().optional(),
  }).nullable().optional(), // Expanded owner details
  leagues: z.array(z.object({
    id: z.string().cuid(),
    name: z.string(),
    country: z.string().optional(),
    isActive: z.boolean(),
    createdAt: z.preprocess((arg) => new Date(arg as string), z.date()),
    updatedAt: z.preprocess((arg) => new Date(arg as string), z.date()),
    logoUrl: z.string().optional(),
  })).optional(), // Optional array of leagues associated with the tenant
  teams: z.array(z.object({
    id: z.string().cuid(),
    name: z.string(),
    isActive: z.boolean(),
    createdAt: z.preprocess((arg) => new Date(arg as string), z.date()),
    updatedAt: z.preprocess((arg) => new Date(arg as string), z.date()),
  })).optional(),
  players: z.array(z.object({
    id: z.string().cuid(),
    slug: z.string(),
    isActive: z.boolean(),
    createdAt: z.preprocess((arg) => new Date(arg as string), z.date()),
    updatedAt: z.preprocess((arg) => new Date(arg as string), z.date()),
  })).optional(),
  games: z.array(z.object({
    id: z.string().cuid(),
    slug: z.string(),
    status: z.nativeEnum(GameStatus),
    createdAt: z.preprocess((arg) => new Date(arg as string), z.date()),
    updatedAt: z.preprocess((arg) => new Date(arg as string), z.date()),
  })).optional(),
  seasons: z.array(z.object({
    id: z.string().cuid(),
    name: z.string(),
    isActive: z.boolean(),
    createdAt: z.preprocess((arg) => new Date(arg as string), z.date()),
    updatedAt: z.preprocess((arg) => new Date(arg as string), z.date()),
  })).optional(),
});

export type TenantDetails = z.infer<typeof TenantDetailsSchema>;

// Main Tenant Creation Schema
export const CreateTenantSchema = z.object({
  name: z.string().min(3, 'Tenant name must be at least 3 characters.').max(100),
  tenantCode: z.string().min(3, 'Tenant code must be atleast 3 characters.').toUpperCase(),
  tenantType: TenantTypeSchema,
  sportType: SportTypeSchema,
  country: z.string().min(1, 'Country is required.'),
  // The nested businessProfile object
  businessProfile: z.object({
    //id: z.string().cuid(),
    //name: z.string(),
    description: z.string().optional().nullable(),
    country: z.string().optional().nullable(),
    region: z.string().optional().nullable(),
    city: z.string().optional().nullable(),
    logoUrl: z.string().optional().nullable(),
    bannerImageUrl: z.string().optional().nullable(),
    logoAssetId: z.string().optional().nullable(),
    bannerAssetId: z.string().nullable().optional(),
    physicalAddress: z.string().optional().nullable(),
  }),
  // Optional ownerId for SYSTEM_ADMIN
  //isActive: z.boolean().optional().default(true),
  ownerId: z.string().cuid().optional(),
});

export type CreateTenantDto = z.infer<typeof CreateTenantSchema>;

// DTO for updating an existing tenant
// All fields are optional for update, as only changed fields are sent
export const UpdateTenantSchema = z.object({
  name: z.string().min(1, "Tenant name is required").max(100),
  description: z.string().nullable().optional(),
  tenantCode: z.string().min(3, "Tenant code must be at least 3 characters").max(12, "Tenant code must be at most 12 characters").regex(/^[A-Z0-9]+$/, "Tenant code must be uppercase alphanumeric").optional(),
  tenantType: TenantTypeSchema.optional(),
  sportType: SportTypeSchema.optional(),
  country: z.string().min(2, "Country is required").max(2, "Country must be a 2-letter ISO code").optional(),
  region: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  state: z.string().nullable().optional(),
  establishedYear: z.number().int().min(1900).max(new Date().getFullYear() + 5).nullable().optional(),
  logoUrl: z.string().url("Invalid URL format").nullable().optional(),
  bannerImageUrl: z.string().url("Invalid URL format").nullable().optional(),
  isActive: z.boolean().optional(),
  ownerId: z.string().nullable().optional(), // Allow updating owner
});

export type UpdateTenantDto = z.infer<typeof UpdateTenantSchema>;

// For fetching a list of users for owner selection
export const UserResponseDtoSchema = z.object({
  id: z.string(),
  username: z.string(),
  email: z.string().email(),
  firstName: z.string().nullable().optional(),
  lastName: z.string().nullable().optional(),
  role: z.nativeEnum(Roles), // Include role to filter for GENERAL_USER
});

export type UserResponseDto = z.infer<typeof UserResponseDtoSchema>;

export const PaginatedUserResponseDtoSchema = z.object({
  data: z.array(UserResponseDtoSchema),
  totalItems: z.number(),
  totalPages: z.number(),
  currentPage: z.number(),
  pageSize: z.number(),
});

export type PaginatedUserResponseDto = z.infer<typeof PaginatedUserResponseDtoSchema>;
// Extend or create a new Zod schema for fetching parameters if necessary for owner dropdown
export const GetUsersParamsSchema = z.object({
  page: z.number().int().min(1).optional(),
  pageSize: z.number().int().min(1).max(100).optional(),
  search: z.string().optional(),
  roles: z.array(z.nativeEnum(Roles)).optional(),
  tenantId: z.string().nullable().optional(),
  isActive: z.boolean().nullable().optional(),
  isVerified: z.boolean().optional(),
  gender: z.string().optional(),
  preferredLanguage: z.string().optional(),
  managingLeagueId: z.string().optional(),
  managingTeamId: z.string().optional(),
});
export type GetUsersParamsDto = z.infer<typeof GetUsersParamsSchema>;
// Paginated Response Schema for Leagues
export const PaginatedTenantsResponseSchema = z.object({
  data: z.array(TenantBasicSchema),
  totalItems: z.number().int().min(0),
  totalPages: z.number().int().min(0),
  currentPage: z.number().int().min(1),
  pageSize: z.number().int().min(1),
});

// The frontend representation of the PublicTenantResponseDto
export interface PublicTenantBasic {
  id: string;
  externalId: string;
  slug: string;
  name: string;
  country: string;
  tenantCode: string;
  sportType: SportType;
  businessProfile: PublicBusinessProfileResponseDto;
  _count: {
    leagues: number;
    teams: number;
  };
}

export type PaginatedTenantsResponseDto = z.infer<typeof PaginatedTenantsResponseSchema>;