// ----------------------------------------------------
// NEW: Tenant-related DTOs for Frontend
// ----------------------------------------------------

import z from "zod";
import { SportType, SportTypeSchema } from ".";

export interface TenantBasic {
  id: string;
  externalId: string;
  name: string;
  tenantCode: string;
  slug: string;
  logoUrl?: string | null;
  isActive: boolean;
  sportType: SportType; // From the provided Tenant model
}

export const TenantBasicSchema = z.object({
  id: z.string().cuid(),
  externalId: z.string().uuid(),
  name: z.string(),
  tenantCode: z.string(),
  slug: z.string(),
  logoUrl: z.string().url().nullable().optional(),
  isActive: z.boolean(),
  sportType: SportTypeSchema,
});


export interface TenantDetails extends TenantBasic {
  description?: string | null;
  localizedNames?: any; // JSON type
  localizedDescriptions?: any; // JSON type
  country?: string | null;
  region?: string | null;
  city?: string | null;
  state?: string | null;
  establishedYear?: number | null;
  bannerImageUrl?: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  // Relationships (simplified for frontend detail DTO, often just IDs or basic linked data)
  ownerId?: string | null;
  createdById?: string | null;
  updatedById?: string | null;
  deletedById?: string | null;
  // You might add specific nested details if needed, e.g., BasicUser for createdBy etc.
  // For simplicity here, relying on ID for now, can expand later if backend sends full User.
}

export const TenantDetailsSchema = TenantBasicSchema.extend({
  description: z.string().nullable().optional(),
  localizedNames: z.any().optional(), // Adjust with specific JSON schema if known
  localizedDescriptions: z.any().optional(),
  country: z.string().nullable().optional(),
  region: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  state: z.string().nullable().optional(),
  establishedYear: z.number().nullable().optional(),
  bannerImageUrl: z.string().url().nullable().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  deletedAt: z.string().datetime().nullable().optional(),
  ownerId: z.string().cuid().nullable().optional(),
  createdById: z.string().cuid().nullable().optional(),
  updatedById: z.string().cuid().nullable().optional(),
  deletedById: z.string().cuid().nullable().optional(),
});


export interface CreateTenantDto {
  name: string;
  description?: string | null;
  tenantCode: string;
  sportType: SportType;
  country?: string | null;
  region?: string | null;
  city?: string | null;
  state?: string | null;
  establishedYear?: number | null;
  logoUrl?: string | null;
  bannerImageUrl?: string | null;
  ownerId?: string | null; // Optional if System Admin assigns owner later
  isActive?: boolean;
  // localizedNames and localizedDescriptions can be added here if the form supports them
}

export const CreateTenantSchema = z.object({
  name: z.string().min(1, "Tenant name is required").max(100),
  description: z.string().max(500).nullable().optional(),
  tenantCode: z.string().min(3, "Tenant code is required").max(50),
  sportType: SportTypeSchema,
  country: z.string().max(2).nullable().optional(), // ISO 3166-1 alpha-2
  region: z.string().max(100).nullable().optional(),
  city: z.string().max(100).nullable().optional(),
  state: z.string().max(100).nullable().optional(),
  establishedYear: z.number().min(1900).max(new Date().getFullYear()).nullable().optional(),
  logoUrl: z.string().nullable().optional(),
  bannerImageUrl: z.string().nullable().optional(),///for type safety, we'll implement an S3 upload
  ownerId: z.string().cuid().nullable().optional(),
  isActive: z.boolean().optional().default(true),
});


export interface UpdateTenantDto {
  name?: string;
  description?: string | null;
  tenantCode?: string;
  sportType?: SportType;
  country?: string | null;
  region?: string | null;
  city?: string | null;
  state?: string | null;
  establishedYear?: number | null;
  logoUrl?: string | null;
  bannerImageUrl?: string | null;
  ownerId?: string | null;
  isActive?: boolean;
  // localizedNames and localizedDescriptions can be added here
}

export const UpdateTenantSchema = CreateTenantSchema.partial(); // All fields become optional

