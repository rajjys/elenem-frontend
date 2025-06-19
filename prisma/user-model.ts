/// User Model frontend DTO

import z from "zod";
import { Role, RoleSchema } from ".";

// Basic Tenant type for nested relations in User
interface BasicTenant {
  id: string;
  externalId: string;
  name: string;
}

// Basic League type for nested relations in User
interface BasicLeague {
  id: string;
  externalId: string;
  name: string;
}

// Basic Team type for nested relations in User
interface BasicTeam {
  id: string;
  externalId: string;
  name: string;
}

/**
 * Interface representing the full User object returned by your backend's
 * `/auth/login` and `/auth/me` endpoints.
 * This is what you store in your Zustand auth store.
 */
export interface User {
  id: string;
  externalId: string; // Added from backend response
  username: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null; // Added from backend response
  avatarUrl?: string | null; // Renamed from profilePictureUrl to match backend
  roles: Role[]; // Array of roles

  tenantId?: string | null; // The ID of the tenant the user belongs to
  tenant?: BasicTenant | null; // Nested tenant object

  managingLeagueId?: string | null; // The ID of the league they manage
  managingLeague?: BasicLeague | null; // Nested league object

  managingTeamId?: string | null; // The ID of the team they manage
  managingTeam?: BasicTeam | null; // Nested team object

  dateOfBirth?: string | null; // ISO 8601 string, as it's often sent as string from backend
  nationality?: string | null; // ISO 3166-1 alpha-2 code
  gender?: string | null; // Assuming string or specific enum for gender
  bio?: string | null;
  preferredLanguage?: string | null;
  timezone?: string | null;
  isActive: boolean;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string | null; // Added from backend response
}

// Zod schema for User Interface (for runtime validation of API responses)
export const UserSchema = z.object({
  id: z.string().cuid(),
  externalId: z.string().uuid(), // Validate UUID format for externalId
  username: z.string().min(1, "Username is required"),
  email: z.string().email("Invalid email address"),
  firstName: z.string().nullable().optional(),
  lastName: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  avatarUrl: z.string().url().nullable().optional(), // Ensure it's a valid URL if present
  //roles: z.array(RoleSchema), // Validate that roles is an array of valid Role enums

  tenantId: z.string().cuid().nullable().optional(),
  tenant: z.object({
    id: z.string().cuid(),
    externalId: z.string().uuid(),
    name: z.string(),
  }).nullable().optional(),

  managingLeagueId: z.string().cuid().nullable().optional(),
  managingLeague: z.object({
    id: z.string().cuid(),
    externalId: z.string().uuid(),
    name: z.string(),
  }).nullable().optional(),

  managingTeamId: z.string().cuid().nullable().optional(),
  managingTeam: z.object({
    id: z.string().cuid(),
    externalId: z.string().uuid(),
    name: z.string(),
  }).nullable().optional(),

  dateOfBirth: z.string().datetime().nullable().optional(), // Expects ISO 8601 date string
  nationality: z.string().nullable().optional(),
  gender: z.string().nullable().optional(), // Adjust if you have a Gender enum here
  bio: z.string().nullable().optional(),
  preferredLanguage: z.string().nullable().optional(),
  timezone: z.string().nullable().optional(),
  isActive: z.boolean(),
  isVerified: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  lastLoginAt: z.string().datetime().nullable().optional(),
});