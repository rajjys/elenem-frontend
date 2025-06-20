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
export const RoleSchema = z.nativeEnum(Role);