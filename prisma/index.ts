//
export enum Role {
  SYSTEM_ADMIN = "SYSTEM_ADMIN",
  GENERAL_USER = "GENERAL_USER",
  LEAGUE_ADMIN = "LEAGUE_ADMIN",
  TEAM_ADMIN = "TEAM_ADMIN",
  PLAYER = "PLAYER",
  REFEREE = "REFEREE"
}
export enum SportType {
  FOOTBALL = "SOCCER",
  BASKETBALL = "BASKETBALL",
  VOLLEYBALL = "VOLLEYBALL",
  /*
  BASEBALL = "BASEBALL",
  AMERICAN_FOOTBALL = "AMERICAN_FOOTBALL",
  HOCKEY = "HOCKEY",
  TENNIS = "TENNIS",
  RUGBY = "RUGBY",
  CRICKET = "CRICKET",
  OTHER = "OTHER"*/
}
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

export interface User {
  id: string;
  username: string;
  email: string;
  role: Role;
  leagueId?: string | null; // League ID can be null if the user is not assigned to a league
  league?: League | null;
  teamManagingId?: string | null; // Team ID can be null if the user is not managing a team
  firstName?: string;
  lastName?: string;
  emailVerified?: boolean;
  profileImageUrl?: string;
  createdById?: string;
  updatedById?: string;
  deletedById?: string;
  createdAt?: Date | null;
  updatedAt?: Date | null;
  deletedAt?: Date | null; // Soft delete
  createdBy?: User | null;
  updatedBy?: User | null;
  deletedBy?: User | null;
  lastLogin?: Date | null // Last login timestamp
  accountLocked?: boolean; // Account lock status
  accountLockedUntil?: Date | null; // Optional lock duration
  failedLoginAttempts?: number;
  isActive?: boolean; // Optional field to indicate if the user is active
  // Add any other fields you need
  phone?: string;
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
