//
export enum Role {
  SYSTEM_ADMIN = "SYSTEM_ADMIN",
  GENERAL_USER = "GENERAL_USER",
  LEAGUE_ADMIN = "LEAGUE_ADMIN",
  TEAM_ADMIN = "LEAGUE_MANAGER",
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