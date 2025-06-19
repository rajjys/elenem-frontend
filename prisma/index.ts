
export * from './user-model';
export * from './roles-enum';
export * from './sport-types-enum';
export * from './tenant-model';











import z from "zod";
import { User } from './user-model';
import { SportType } from './sport-types-enum';

export interface League {
  id: string;
  name: string;
  leagueCode: string;
  ownerId?: string; // Optional, if league has an owner
  description?: string; //Optional description of the league
  sportType: SportType;
  createdById?: string;
  updatedById?: string;
  deletedById?: string;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null; // Soft delete
  createdBy?: User | null;
  updatedBy?: User | null;
  deletedBy?: User | null;
  status?: boolean; // Active or inactive
  // Add other fields as needed
  owner?: User; // Include owner relation if needed
  //Add other relations as needed
  // e.g. teams, games, etc.
  //teams?: Team[]; // If you have a Team model
  ///games?: Game[]; // If you have a Game model
  pointssystem?: JSON;
  tiebreakerRules?: JSON;
}




// For MyLeagueDetailsDto used in frontend state and forms
// This should mirror the structure returned by your backend '/leagues/my-league' endpoint.
interface LeagueAdminUserDto {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
}

export interface MyLeagueDetailsDto {
  id: string;
  name: string;
  leagueCode: string;
  description?: string | null;
  logoUrl?: string | null;
  bannerImageUrl?: string | null;
  sportType: SportType; // Make sure SportType is available or define it
  status: boolean;
  leagueProfile?: any;
  owner?: LeagueAdminUserDto | null;
  pointsSystem?: any;
  tiebreakerRules?: any; // string[] if that's what backend sends
  admins?: LeagueAdminUserDto[];
  createdAt: string; // Date as string
  updatedAt: string; // Date as string
}
export interface LeaguePublicDetailsDto {
  id: string;
  name: string;
  leagueCode: string;
  description?: string | null;
  logoUrl?: string | null;
  bannerImageUrl?: string | null;
  sportType: SportType; // Make sure SportType is available or define it
  status: boolean;
  pointsSystem?: any; // Adjust type based on your backend response
  tiebreakerRules?: any; // Adjust type based on your backend response
}
// Simplified User DTO for managers list
export interface TeamManagerFrontendDto {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
}

// For LA/TA viewing detailed team info
export interface TeamDetailsFrontendDto {
  id: string;
  name: string;
  logoUrl?: string | null;
  bannerImageUrl?: string | null;
  description?: string | null;
  homeVenue?: string | null;
  leagueId: string;
  createdAt: string; // Dates will be strings from JSON
  updatedAt: string;
  managers?: TeamManagerFrontendDto[];
  // players?: any[]; // Add if you fetch players
}

// For public team views
export interface TeamPublicFrontendDto {
  id: string;
  name: string;
  logoUrl?: string | null;
  bannerImageUrl?: string | null;
  description?: string | null;
  homeVenue?: string | null;
  leagueId: string;
  // leagueName?: string; // Could be useful to include
}

// For League Admin creating a team (matches CreateTeamDto backend)
export interface CreateTeamFrontendDto {
  name: string;
  logoUrl?: string;
  bannerImageUrl?: string;
  description?: string;
  homeVenue?: string;
}

// For League Admin updating a team (matches UpdateTeamByLaDto backend)
export interface UpdateTeamByLaFrontendDto {
  name?: string;
  logoUrl?: string;
  bannerImageUrl?: string;
  description?: string;
  homeVenue?: string;
}

// For Team Admin updating their team's profile (matches UpdateTeamProfileByTaDto backend)
export interface UpdateTeamProfileByTaFrontendDto {
  logoUrl?: string;
  bannerImageUrl?: string;
  description?: string;
  homeVenue?: string;
}

// For assigning a team admin
export interface AssignTeamAdminFrontendDto {
    userId: string;
}

// User type for listing users to assign as TA
export interface UserForAssignmentDto {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string; // Prisma Role enum as string
    teamManagingId?: string | null;
}

// player-public.dto.ts

/**
 * @interface PlayerPublicDto
 * @description Represents a public-facing view of a player for the frontend.
 * Contains essential, non-sensitive player information.
 */
export interface PlayerPublicDto {
  /**
   * @property {string} id - The public-facing, immutable identifier for the player (UUID).
   * This is derived from the 'externalId' in the backend model.
   */
  id: string;
  /**
   * @property {string} firstName - The player's first name.
   */
  firstName: string;

  /**
   * @property {string} lastName - The player's last name.
   */
  lastName: string;

  /**
   * @property {string} fullName - A computed property for the player's full name.
   */
  fullName: string; // Often useful for display purposes

  /**
   * @property {string} [profileImageUrl] - Optional URL to the player's profile picture.
   */
  profileImageUrl?: string;

  /**
   * @property {number} [jerseyNumber] - Optional jersey number of the player.
   */
  jerseyNumber?: number;

  /**
   * @property {string} [position] - Optional player's primary position (e.g., "Point Guard", "Setter").
   */
  position?: string;

  /**
   * @property {string} [nationality] - Optional player's nationality (e.g., "USA", "Brazil").
   */
  nationality?: string;

  /**
   * @property {string} [bio] - Optional short biography of the player.
   */
  bio?: string;

  /**
   * @property {boolean} isActive - Indicates if the player is currently active.
   */
  isActive: boolean;

  /**
   * @property {Date} [dateOfBirth] - Optional date of birth.
   * Consider formatting this as a string for display in the DTO,
   * e.g., 'YYYY-MM-DD' or 'MM/DD/YYYY'.
   * Keeping it as Date here implies it will be serialized properly.
   */
  dateOfBirth?: Date; // Or string, depending on frontend date handling strategy

  team?: TeamPublicFrontendDto | null; // Optional team information is applicable

  league: LeaguePublicDetailsDto

  // --- Potentially useful additions, depending on frontend needs ---

  /**
   * @property {string} [gender] - Optional gender of the player.
   */
  gender?: string;

  /**
   * @property {string} [preferredFoot] - Optional preferred foot (e.g., "left", "right").
   * May be null for sports where it's not applicable.
   */
  preferredFoot?: string;

  // No internal IDs (like cuid()), no audit fields (createdAt, updatedBy),
  // no sensitive IDs (nationalIdNumber, leagueRegistrationId unless explicitly needed and secured),
  // no direct user IDs, no deletedAt.
}

export interface PlayerDetailsDto {
  /**
   * @property {string} id - The public-facing, immutable identifier for the player (UUID).
   * This maps to the 'externalId' of the backend Player model.
   */
  id: string;

  /**
   * @property {string} firstName - The player's first name.
   */
  firstName: string;

  /**
   * @property {string} lastName - The player's last name.
   */
  lastName: string;

  /**
   * @property {string} fullName - A computed property for the player's full name.
   */
  fullName: string; // Computed for display

  /**
   * @property {Date | string | null} [dateOfBirth] - Optional date of birth.
   * Can be a Date object for display/internal use or a string (e.g., 'YYYY-MM-DD') for form inputs.
   * The backend should handle conversion.
   */
  dateOfBirth?: Date | string | null;

  /**
   * @property {number | null} [jerseyNumber] - Optional jersey number of the player.
   */
  jerseyNumber?: number | null;

  /**
   * @property {string | null} [position] - Optional player's primary position (e.g., "Point Guard", "Setter").
   */
  position?: string | null;

  /**
   * @property {string | null} [profileImageUrl] - Optional URL to the player's profile picture.
   */
  profileImageUrl?: string | null;

  /**
   * @property {string | null} [bio] - Optional short biography of the player.
   */
  bio?: string | null;

  /**
   * @property {boolean} isActive - Indicates if the player is currently active.
   */
  isActive: boolean;

  /**
   * @property {string | null} [gender] - Optional gender of the player.
   */
  gender?: string | null;

  /**
   * @property {string | null} [nationality] - Optional player's nationality.
   */
  nationality?: string | null;

  /**
   * @property {string | null} [preferredFoot] - Optional preferred foot.
   */
  preferredFoot?: string | null;

  /**
   * @property {string | null} [nationalIdNumber] - Optional national ID number.
   * Only expose if authorized and necessary for the frontend view (e.g., for LA).
   * Ensure it's never exposed publicly.
   */
  nationalIdNumber?: string | null;

  /**
   * @property {string | null} [leagueRegistrationId] - Optional unique ID assigned by a specific league.
   * Only expose if authorized and necessary for the frontend view.
   */
  leagueRegistrationId?: string | null;

  // --- Relationships with nested DTOs for display/selection ---

  /**
   * @property {string | null} [teamId] - The public-facing ID of the current team the player is assigned to.
   * Maps to the 'externalId' of the Team model.
   */
  teamId?: string | null;

  /**
   * @property {TeamDetailsFrontendDto | null} [team] - Details of the player's current team.
   * Required for displaying team name in lists/details.
   */
  team?: TeamDetailsFrontendDto | null; // For displaying team name in table/form

  /**
   * @property {string} leagueId - The public-facing ID of the league the player belongs to.
   * Maps to the 'externalId' of the League model.
   */
  leagueId: string;

  /**
   * @property {TeamDetailsFrontendDto} league - Details of the player's league.
   * Note: Using TeamDetailsFrontendDto structure for League for simplicity as it only needs id and name.
   * Consider a separate LeagueDetailsDto if more league fields are needed.
   */
  league: TeamDetailsFrontendDto; // For displaying league name in table/form (using TeamDetails structure for brevity)
  // --- Audit Fields (for administrative views) ---
  /**
   * @property {Date} createdAt - Timestamp when the player record was created.
   */
  createdAt: Date;
  /**
   * @property {Date} updatedAt - Timestamp when the player record was last updated.
   */
  updatedAt: Date;
  /**
   * @property {UserDetailsDto | null} [createdBy] - User who created this player record.
   */
  createdBy?: User | null;
  /**
   * @property {UserDetailsDto | null} [updatedBy] - User who last updated this player record.
   */
  updatedBy?: User | null;
  /**
   * @property {Date | null} [deletedAt] - Timestamp if the player record was soft-deleted.
   */
  deletedAt?: Date | null;

  /**
   * @property {UserDetailsDto | null} [deletedBy] - User who soft-deleted this player record.
   */
  deletedBy?: User | null;

  // Additional fields (e.g., stats, events) would be separate DTOs or fetched via separate API calls
  // to keep this DTO focused on core player details.
}

export const PlayerFormSchema = z.object({
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
  // dateOfBirth comes as string from HTML date input
  dateOfBirth: z.string().optional().nullable().transform(e => (e === "" ? null : e)),
  position: z.string().optional().nullable().transform(e => (e === "" ? null : e)),
  profileImageUrl: z.string().url("Must be a valid URL").optional().or(z.literal('')).nullable().transform(e => (e === "" ? null : e)),
  bio: z.string().optional().nullable().transform(e => (e === "" ? null : e)),
  jerseyNumber: z.coerce.number().optional().nullable(),
  isActive: z.boolean().optional(),
  // Add other fields you want to be editable via this form
  gender: z.string().optional().nullable().transform(e => (e === "" ? null : e)),
  nationality: z.string().optional().nullable().transform(e => (e === "" ? null : e)),
  preferredFoot: z.string().optional().nullable().transform(e => (e === "" ? null : e)),
  nationalIdNumber: z.string().optional().nullable().transform(e => (e === "" ? null : e)),
  leagueRegistrationId: z.string().optional().nullable().transform(e => (e === "" ? null : e)),
});

// The type for the form values, inferred from the schema
export type PlayerFormValues = z.infer<typeof PlayerFormSchema>;