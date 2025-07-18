// prisma/season-schemas.ts
import * as z from 'zod';

// Enum for Season Status
export enum SeasonStatus {
  PLANNING = 'PLANNING',   
  SCHEDULED = 'SCHEDULED',
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED',
  CANCELED = 'CANCELED',
  ARCHIVED = 'ARCHIVED',
}

// Zod schema for creating a new season
export const CreateSeasonSchema = z.object({
  name: z.string().min(2, 'Season name must be at least 2 characters long.'),
  startDate: z.string(),
  endDate: z.string(),
  isActive: z.boolean(),
  description: z.string().optional(),
  status: z.nativeEnum(SeasonStatus),
  leagueId: z.string().min(1, 'League is required.'),
  tenantId: z.string().min(1, 'Tenant is required.'), // This will be dynamic based on user role
}).refine((data) => data.endDate >= data.startDate, {
  message: "End date cannot be before start date.",
  path: ["endDate"],
});

// Zod schema for updating an existing season (all fields optional)
export const UpdateSeasonSchema = z.object({
  name: z.string().min(2, 'Season name must be at least 2 characters long.').optional(),
  startDate: z.string().refine((val) => !isNaN(new Date(val).getTime()), 'Invalid start date').transform((val) => new Date(val)).optional(),
  endDate: z.string().refine((val) => !isNaN(new Date(val).getTime()), 'Invalid end date').transform((val) => new Date(val)).optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
  status: z.nativeEnum(SeasonStatus).optional(),
  leagueId: z.string().min(1, 'League is required.').optional(),
  tenantId: z.string().min(1, 'Tenant is required.').optional(),
}).refine((data) => {
  if (data.startDate && data.endDate) {
    return data.endDate >= data.startDate;
  }
  return true; // No validation if only one date is present
}, {
  message: "End date cannot be before start date.",
  path: ["endDate"],
});

// Basic type for Season (for API responses)
export type SeasonBasic = {
  id: string;
  name: string;
  slug: string;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  description?: string;
  status: SeasonStatus;
  leagueId: string;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
  // Add other fields you might need for display
};
// Zod schema for Season filter parameters
export const SeasonFilterParamsSchema = z.object({
  page: z.number().int().min(1).default(1).optional(),
  pageSize: z.number().int().min(1).max(100).default(10).optional(),
  search: z.string().optional(),
  tenantId: z.string().optional().nullable(),
  leagueId: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
  status: z.nativeEnum(SeasonStatus).optional(),
  startDateAfter: z.string().optional(), // Filter seasons starting after this date
  startDateBefore: z.string().optional(), // Filter seasons starting before this date
  endDateAfter: z.string().optional(),   // Filter seasons ending after this date
  endDateBefore: z.string().optional(),   // Filter seasons ending before this date
  sortBy: z.enum(['name', 'startDate', 'endDate', 'status', 'createdAt', 'updatedAt', 'leagueName', 'tenantName']).default('createdAt').optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc').optional(),
}).partial(); // All fields are optional for filtering

export type SeasonFilterParams = z.infer<typeof SeasonFilterParamsSchema>;
export type CreateSeasonDto = z.infer<typeof CreateSeasonSchema>;
export type UpdateSeasonDto = z.infer<typeof UpdateSeasonSchema>;
export type SeasonSortableColumn = 'name' | "startDate" | "endDate" | "status" | "createdAt" | "updatedAt" | "leagueName" | "tenantName";

// Detailed Season DTO for API responses and table display
// This should match what your backend /seasons endpoint returns
export type SeasonResponseDto = {
  id: string;
  externalId: string;
  name: string;
  slug: string;
  startDate: string; // ISO string from backend
  endDate: string;   // ISO string from backend
  isActive: boolean;
  description?: string;
  status: SeasonStatus;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  leagueId: string;
  tenantId: string;
  // Include nested relations for display in the table
  league: {
    id: string;
    name: string;
    leagueCode: string;
    tenantId: string;
  };
  tenant: {
    id: string;
    name: string;
  };
  createdBy?: {
    id: string;
    username: string;
  };
  updatedBy?: {
    id: string;
    username: string;
  };
};

// Paginated response schema for seasons
export const PaginatedSeasonsResponseSchema = z.object({
  data: z.array(z.any()), // Will be cast to SeasonResponseDto[]
  totalItems: z.number(),
  totalPages: z.number(),
  currentPage: z.number(),
  pageSize: z.number(),
});

export type PaginatedSeasonsResponse = z.infer<typeof PaginatedSeasonsResponseSchema>;

