// src/prisma/user-schemas.ts
import * as z from 'zod';
import { GenderSchema, Role, RoleSchema, SupportedLanguage, SupportedLanguageSchema } from '.';// Assuming Role enum is exported from your main prisma.ts or similar

// --- Enums ---


// --- Base User Schemas ---

// Basic user details for lists/tables
export const UserBasicSchema = z.object({
  id: z.string().cuid(),
  externalId: z.string().optional(),
  username: z.string().min(1, 'Username is required'),
  email: z.string().email('Invalid email address'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  roles: z.array((RoleSchema)).default([Role.GENERAL_USER]), // User can have multiple roles
  isActive: z.boolean(),
  avatarUrl: z.string().url().optional().or(z.literal('')), // Allowing empty string for optional URL
  profileImageUrl: z.string().url().optional().or(z.literal('')), // Allowing empty string for optional URL
  createdAt: z.preprocess((arg) => (typeof arg === 'string' ? new Date(arg) : arg), z.date()),
  updatedAt: z.preprocess((arg) => (typeof arg === 'string' ? new Date(arg) : arg), z.date()),
});

export type UserBasic = z.infer<typeof UserBasicSchema>;

// Full user details for individual viewing/editing
export const UserDetailSchema = UserBasicSchema.extend({
  phone: z.string().optional().or(z.literal('')),
  dateOfBirth: z.preprocess((arg) => (typeof arg === 'string' ? new Date(arg) : arg), z.date()).optional().nullable(),
  nationality: z.string().optional().or(z.literal('')),
  gender: GenderSchema.optional().nullable(),
  bio: z.string().optional().or(z.literal('')),
  // avatarUrl is present in the model but profileImageUrl seems to be the primary for display
  preferredLanguage: SupportedLanguageSchema.optional().nullable(),
  timezone: z.string().optional().or(z.literal('')),
  // Note: For JSON fields, we typically receive/send them as objects, so z.any() or specific object schemas
  notificationPreferences: z.record(z.string(), z.any()).optional().nullable(), // For flexible JSON object
  profileVisibility: z.record(z.string(), z.any()).optional().nullable(), // For flexible JSON object

  isVerified: z.boolean(),
  lastLoginAt: z.preprocess((arg) => (typeof arg === 'string' ? new Date(arg) : arg), z.date()).optional().nullable(),

  // Audit fields, typically read-only on frontend forms
  createdById: z.string().cuid().optional().nullable(),
  updatedById: z.string().cuid().optional().nullable(),
  deletedAt: z.preprocess((arg) => (typeof arg === 'string' ? new Date(arg) : arg), z.date()).optional().nullable(),
  deletedById: z.string().cuid().optional().nullable(),

  // Security fields, also mostly read-only or managed via specific forms
  lastPasswordChange: z.preprocess((arg) => (typeof arg === 'string' ? new Date(arg) : arg), z.date()),
  failedLoginAttempts: z.number().int(),
  accountLocked: z.boolean(),
  accountLockedUntil: z.preprocess((arg) => (typeof arg === 'string' ? new Date(arg) : arg), z.date()).optional().nullable(),
  mfaSecret: z.string().optional().nullable(),
  emailVerified: z.boolean().optional().nullable(),
  // passwordHistory is a relation, not a direct field on User

  // Tenant, League, Team association IDs (nullable for filtering/selection)
  tenantId: z.string().cuid().optional().nullable(),
  managingLeagueId: z.string().cuid().optional().nullable(), // Unique for LEAGUE_ADMIN
  managingTeamId: z.string().cuid().optional().nullable(),
});

export type UserDetail = z.infer<typeof UserDetailSchema>;

// --- DTOs for API Interactions ---

// For creating a new user via System Admin or contextual forms
export const CreateUserSchema = z.object({
  username: z.string().min(3, 'Username is required and must be at least 3 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  profileImageUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  dateOfBirth: z.string().optional(), // Send as ISO date string if present
  nationality: z.string().optional().or(z.literal('')),
  gender: GenderSchema.optional(),
  bio: z.string().optional().or(z.literal('')),
  preferredLanguage: SupportedLanguageSchema.optional(),
  timezone: z.string().optional().or(z.literal('')),
  // roles are handled contextually or by separate API for System Admin
  roles: z.array(RoleSchema).optional(), // Only for System Admin direct creation
  isActive: z.boolean().default(true).optional(),
  isVerified: z.boolean().default(false).optional(),
  // No direct creation of managingLeagueId, tenantId here; these are set by association flows
});

export type CreateUserDto = z.infer<typeof CreateUserSchema>;

// For updating an existing user's profile (excluding password and roles)
export const UpdateUserSchema = z.object({
  username: z.string().min(3, 'Username is required and must be at least 3 characters').optional(),
  email: z.string().email('Invalid email address').optional(),
  firstName: z.string().min(1, 'First name is required').optional(),
  lastName: z.string().min(1, 'Last name is required').optional(),
  profileImageUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  dateOfBirth: z.string().optional(), // Send as ISO date string if present
  nationality: z.string().optional().or(z.literal('')),
  gender: GenderSchema.optional(),
  bio: z.string().optional().or(z.literal('')),
  preferredLanguage: SupportedLanguageSchema.optional(),
  timezone: z.string().optional().or(z.literal('')),
  isActive: z.boolean().optional(),
  isVerified: z.boolean().optional(),
});

export type UpdateUserDto = z.infer<typeof UpdateUserSchema>;

// For resetting or setting a new password (separate from UpdateUser)
export const UpdatePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required').optional(), // Optional for admin reset
  newPassword: z.string().min(8, 'New password must be at least 8 characters long'),
});

export type UpdatePasswordDto = z.infer<typeof UpdatePasswordSchema>;

// For promoting/demoting user roles (System Admin only)
export const UpdateUserRolesSchema = z.object({
  roles: z.array(RoleSchema).min(1, 'At least one role must be assigned.'),
  // For contextual roles like LEAGUE_ADMIN or TEAM_ADMIN, these IDs are sent alongside the role update
  managingLeagueId: z.string().cuid().optional().nullable(), // To set/unset the league managed by this user
  managingTeamId: z.string().cuid().optional().nullable(),   // To set/unset the team managed by this user
  tenantId: z.string().cuid().optional().nullable(), // To set/unset the tenant a GENERAL_USER belongs to
});

export type UpdateUserRolesDto = z.infer<typeof UpdateUserRolesSchema>;

// --- Filtering, Sorting, and Pagination Schemas ---

export const UserFilterSchema = z.object({
  search: z.string().optional(), // General search term (username, email, first/last name)
  roles: z.array(RoleSchema).optional(), // Filter by one or more roles
  isActive: z.boolean().optional(), // Filter by active status
  isVerified: z.boolean().optional(), // Filter by verification status
  tenantId: z.string().cuid().optional().nullable(), // Filter by association with a specific tenant (can be null for unassigned)
  managingLeagueId: z.string().cuid().optional().nullable(), // Filter by association as league admin (can be null for unassigned)
  managingTeamId: z.string().cuid().optional().nullable(), // Filter by association as team admin (can be null for unassigned)
  gender: GenderSchema.optional(),
  preferredLanguage: z.nativeEnum(SupportedLanguage).optional(),
  page: z.number().int().min(1).default(1).optional(),
  pageSize: z.number().int().min(1).max(50).default(10).optional(), // Max 50 per page is a reasonable default limit
  sortBy: z.enum(['firstName', 'lastName', 'email', 'username', 'createdAt', 'updatedAt', 'lastLoginAt']).default('createdAt').optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc').optional(),
});

export type UserFilterParams = z.infer<typeof UserFilterSchema>;

// Response structure for paginated user lists
export const PaginatedUsersResponseSchema = z.object({
  data: z.array(UserBasicSchema),
  totalItems: z.number().int().min(0),
  totalPages: z.number().int().min(0),
  currentPage: z.number().int().min(1),
  pageSize: z.number().int().min(1),
});

export type PaginatedUsersResponse = z.infer<typeof PaginatedUsersResponseSchema>;

// Schema for fetching "unassigned" users for selection as owners
// These are GENERAL_USERS who are not linked to any tenant, league, or team management role
export const UnassignedUserSchema = z.object({
  id: z.string().cuid(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().email(),
  username: z.string(),
});

export type UnassignedUser = z.infer<typeof UnassignedUserSchema>;

// Response for a list of unassigned users
export const UnassignedUsersResponseSchema = z.array(UnassignedUserSchema);
export type UnassignedUsersResponse = z.infer<typeof UnassignedUsersResponseSchema>;

