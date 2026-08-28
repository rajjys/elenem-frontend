import { z } from 'zod';
import { Gender } from './enums';

// GET /players returns an offset envelope ({ items, total, skip, take }), not the
// { data, totalPages, currentPage } envelope the other list endpoints use. Kept faithful
// to the API here rather than reshaped, so drift is visible instead of silently absorbed.

export const PlayerVisibility = {
  PUBLIC: 'PUBLIC',
  PRIVATE: 'PRIVATE',
  RESERVED: 'RESERVED',
} as const;
export type PlayerVisibility = (typeof PlayerVisibility)[keyof typeof PlayerVisibility];

const RefSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string().optional().nullable(),
  logoUrl: z.string().optional().nullable(),
});

export const PlayerSchema = z.object({
  id: z.string(),
  externalId: z.string().optional().nullable(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().optional().nullable(),
  slug: z.string(),
  profileImageUrl: z.string().optional().nullable(),
  gender: z.nativeEnum(Gender).optional().nullable(),
  jerseyNumber: z.number().optional().nullable(),
  position: z.string().optional().nullable(),
  bio: z.string().optional().nullable(),
  dateOfBirth: z.union([z.string(), z.date()]).optional().nullable(),
  nationality: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
  visibility: z.string().optional().nullable(),
  tenantId: z.string().optional().nullable(),
  currentTeam: RefSchema.optional().nullable(),
  primaryLeague: RefSchema.optional().nullable(),
  userId: z.string().optional().nullable(),
  createdAt: z.union([z.string(), z.date()]).optional(),
  updatedAt: z.union([z.string(), z.date()]).optional(),
});

export const PaginatedPlayersSchema = z.object({
  items: z.array(PlayerSchema),
  total: z.number(),
  skip: z.number(),
  take: z.number(),
});

export type Player = z.infer<typeof PlayerSchema>;
export type PaginatedPlayers = z.infer<typeof PaginatedPlayersSchema>;

export interface PlayerFilterParams {
  q?: string;
  leagueId?: string;
  teamId?: string;
  tenantId?: string;
  page?: number;
  pageSize?: number;
}

export interface CreatePlayerDto {
  firstName: string;
  lastName: string;
  /** Optional on purpose — a player is a roster entry, not an account. */
  email?: string;
  tenantId: string;
  leagueId: string;
  teamId?: string;
  jerseyNumber?: number;
  position?: string;
  gender?: Gender;
  dateOfBirth?: string;
  nationality?: string;
  bio?: string;
  sportType: string;
}

export interface UpdatePlayerDto {
  firstName?: string;
  lastName?: string;
  email?: string;
  teamId?: string | null;
  jerseyNumber?: number | null;
  position?: string | null;
  gender?: Gender;
  dateOfBirth?: string | null;
  nationality?: string | null;
  bio?: string | null;
  isActive?: boolean;
}
