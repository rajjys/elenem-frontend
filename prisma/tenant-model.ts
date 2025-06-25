// src/prisma/tenant-schemas.ts
import * as z from 'zod';
import { SportType, Role, SportTypeSchema, TenantType, TenantTypeSchema } from './index'; // Assuming SportType and Role are defined in src/prisma/index.ts

export interface TenantBasic {
  id: string;
  externalId: string;
  name: string;
  tenantCode: string;
  tenantType: TenantType;
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
  tenantType?: TenantType;
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
// Full Tenant Schema (for display/detail)
export const TenantDetailsSchema = z.object({
  id: z.string().cuid(),
  externalId: z.string().uuid(),
  name: z.string().min(1, "Tenant name is required").max(100),
  description: z.string().nullable().optional(),
  tenantCode: z.string().min(3, "Tenant code must be at least 3 characters").max(7, "Tenant code must be at most 7 characters").regex(/^[A-Z0-9]+$/, "Tenant code must be uppercase alphanumeric"),
  TenantType: TenantTypeSchema,
  sportType: SportTypeSchema,
  country: z.string().min(2, "Country is required").max(2, "Country must be a 2-letter ISO code"), // ISO 2-letter code
  region: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  state: z.string().nullable().optional(), // Could be province/department depending on country
  establishedYear: z.number().int().min(1900).max(new Date().getFullYear() + 5).nullable().optional(), // Max 5 years into future for new leagues
  logoUrl: z.string().url("Invalid URL format").nullable().optional(),
  bannerImageUrl: z.string().url("Invalid URL format").nullable().optional(),
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
});

export type TenantDetails = z.infer<typeof TenantDetailsSchema>;

// DTO for creating a new tenant
export const CreateTenantSchema = z.object({
  name: z.string().min(1, "Tenant name is required").max(100),
  description: z.string().nullable().optional(),
  tenantCode: z.string().min(3, "Tenant code must be at least 3 characters").max(7, "Tenant code must be at most 7 characters").regex(/^[A-Z0-9]+$/, "Tenant code must be uppercase alphanumeric"),
  TenantType: TenantTypeSchema,
  sportType: z.nativeEnum(SportType),
  country: z.string().min(2, "Country is required").max(2, "Country must be a 2-letter ISO code"),
  region: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  state: z.string().nullable().optional(),
  establishedYear: z.number().int().min(1900).max(new Date().getFullYear() + 5).nullable().optional(),
  logoUrl: z.string().url("Invalid URL format").nullable().optional(),
  bannerImageUrl: z.string().url("Invalid URL format").nullable().optional(),
  isActive: z.boolean().default(true).optional(), // Optional for creation, defaults to true
  ownerId: z.string().nullable().optional(), // Allow assigning an owner during creation
});

export type CreateTenantDto = z.infer<typeof CreateTenantSchema>;

// DTO for updating an existing tenant
// All fields are optional for update, as only changed fields are sent
export const UpdateTenantSchema = z.object({
  name: z.string().min(1, "Tenant name is required").max(100),
  description: z.string().nullable().optional(),
  tenantCode: z.string().min(3, "Tenant code must be at least 3 characters").max(7, "Tenant code must be at most 7 characters").regex(/^[A-Z0-9]+$/, "Tenant code must be uppercase alphanumeric").optional(),
  TenantType: TenantTypeSchema.optional(),
  sportType: z.nativeEnum(SportType).optional(),
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
  role: z.nativeEnum(Role), // Include role to filter for GENERAL_USER
});

export type UserResponseDto = z.infer<typeof UserResponseDtoSchema>;

export const PaginatedUserResponseDtoSchema = z.object({
  data: z.array(UserResponseDtoSchema),
  totalItems: z.number(),
  totalPages: z.number(),
  currentPage: z.number(),
  pageSize: z.number(),
});

export type PaginatedResponseDto = z.infer<typeof PaginatedUserResponseDtoSchema>;
// Extend or create a new Zod schema for fetching parameters if necessary for owner dropdown
export const GetUsersParamsSchema = z.object({
  page: z.number().int().min(1).optional(),
  pageSize: z.number().int().min(1).max(100).optional(),
  search: z.string().optional(),
  roles: z.array(z.nativeEnum(Role)).optional(),
  tenantId: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
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

export type PaginatedTenantsResponse = z.infer<typeof PaginatedTenantsResponseSchema>;