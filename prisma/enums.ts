import z from "zod";

//
export enum Role {
  SYSTEM_ADMIN = "SYSTEM_ADMIN",
  TENANT_ADMIN = "TENANT_ADMIN",
  LEAGUE_ADMIN = "LEAGUE_ADMIN",
  TEAM_ADMIN = "TEAM_ADMIN",
  PLAYER = "PLAYER",
  REFEREE = "REFEREE",
  COACH = "COACH",
  GENERAL_USER = "GENERAL_USER",
}

// User Interface - Reflects the structure of the User object returned by your
// backend's `/auth/me` endpoint or contained within the JWT payload.
// Zod schema for Role enum (useful for runtime validation of API responses or form data)

export enum TenantType {
  COMMERCIAL = 'COMMERCIAL',
  NON_PROFIT = 'NON_PROFIT',
  GOVERNMENT = 'GOVERNMENT',
  EDUCATIONAL = 'EDUCATIONAL',
  OTHER = 'OTHER',
}

export enum SportType {
  SOCCER = 'SOCCER',
  BASKETBALL = 'BASKETBALL',
  FOOTBALL = 'FOOTBALL',
  BASEBALL = 'BASEBALL',
  TENNIS = 'TENNIS',
  HOCKEY = 'HOCKEY',
  GOLF = 'GOLF',
  CRICKET = 'CRICKET',
  RUGBY = 'RUGBY',
  VOLLEYBALL = 'VOLLEYBALL',
  OTHER = 'OTHER',
}

export enum LeagueVisibility {
  PUBLIC = "PUBLIC",
  PRIVATE = "PRIVATE",// Requires invitation or approval to view
  ARCHIVED = "ARCHIVED" // Old leagues, viewable but inactive for new operations
}
export const RoleSchema = z.nativeEnum(Role);
export const SportTypeSchema = z.nativeEnum(SportType);
export const LeagueVisibilitySchema = z.nativeEnum(LeagueVisibility);
export const TenantTypeSchema = z.nativeEnum(TenantType);
