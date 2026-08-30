import z from "zod";

//
export enum Roles {
  SYSTEM_ADMIN = "SYSTEM_ADMIN",
  TENANT_ADMIN = "TENANT_ADMIN",
  LEAGUE_ADMIN = "LEAGUE_ADMIN",
  TEAM_ADMIN = "TEAM_ADMIN",
  PLAYER = "PLAYER",
  REFEREE = "REFEREE",
  COACH = "COACH",
  GENERAL_USER = "GENERAL_USER",
}
export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  MIXED = 'MIXED',
  OTHER = 'OTHER',
}
// Must mirror the backend Prisma GameStatus enum exactly.
export enum GameStatus {
  DRAFT = 'DRAFT',
  SCHEDULED = 'SCHEDULED',
  CONFIRMED = 'CONFIRMED',
  LIVE = 'LIVE',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  POSTPONED = 'POSTPONED',
  RESCHEDULED = 'RESCHEDULED',
}
export enum SupportedLanguages {
  ENGLISH = 'ENGLISH',
  FRANCAIS = 'FRANCAIS',
}
// User Interface - Reflects the structure of the User object returned by your
// backend's `/auth/me` endpoint or contained within the JWT payload.
// Zod schema for Role enum (useful for runtime validation of API responses or form data)

export enum TenantTypes {
  COMMERCIAL = 'COMMERCIAL',
  NON_PROFIT = 'NON_PROFIT',
  GOVERNMENT = 'GOVERNMENT',
  EDUCATIONAL = 'EDUCATIONAL',
  OTHER = 'OTHER',
}

// Mirrors the Prisma SportType enum exactly. It did not: this carried AMERICAN_FOOTBALL, which
// the backend has never had, so choosing it in the sport picker sent a value @IsEnum rejected
// with a 400 — and it lacked SOCCER, so a tenant holding that value had no label to render.
//
// SOCCER is a legacy duplicate of FOOTBALL: it carries no entry in the backend's sport-rules
// dictionary, so a league created under it silently inherits football-shaped defaults anyway.
// Kept in the type so existing rows render; hidden from the picker by DEPRECATED_SPORTS below,
// because offering "Soccer" beside "Football" asks the organiser a question with no right answer.
export enum SportType {
  BASKETBALL = 'BASKETBALL',
  FOOTBALL = 'FOOTBALL',
  SOCCER = 'SOCCER',
  BASEBALL = 'BASEBALL',
  TENNIS = 'TENNIS',
  HOCKEY = 'HOCKEY',
  GOLF = 'GOLF',
  CRICKET = 'CRICKET',
  RUGBY = 'RUGBY',
  VOLLEYBALL = 'VOLLEYBALL',
  OTHER = 'OTHER',
}

/** Selectable everywhere except a new-organisation picker. */
export const DEPRECATED_SPORTS: SportType[] = [SportType.SOCCER];

export enum VisibilityLevel {
  PUBLIC = "PUBLIC",
  PRIVATE = "PRIVATE",// Requires invitation or approval to view
  ARCHIVED = "ARCHIVED" // Old entities, viewable but inactive for new operations
}
// Enum for Season Status
export enum SeasonStatus {
  UNKNOWN = 'UNKNOWN',
  PLANNING = 'PLANNING',   
  SCHEDULED = 'SCHEDULED',
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED',
  CANCELED = 'CANCELED',
  ARCHIVED = 'ARCHIVED',
}

// src/enums/posts.ts
export enum PostType {
  BLOG = "BLOG",
  STATUS = "STATUS",
  ANNOUNCEMENT = "ANNOUNCEMENT",
  MATCH_REPORT = "MATCH_REPORT",
}

export enum PostStatus {
  DRAFT = "DRAFT",
  PUBLISHED = "PUBLISHED",
  SCHEDULED = "SCHEDULED",
}
export enum PostTargetType {
  TEAM = "TEAM",
  LEAGUE = "LEAGUE",
  TENANT = "TENANT"
}

export const RoleSchema = z.nativeEnum(Roles);
export const SportTypeSchema = z.nativeEnum(SportType);
export const VisibilityLevelSchema = z.nativeEnum(VisibilityLevel);
export const TenantTypeSchema = z.nativeEnum(TenantTypes);
export const GenderSchema = z.nativeEnum(Gender);
export const SupportedLanguageSchema = z.nativeEnum(SupportedLanguages);
export const PostTypeSchema = z.nativeEnum(PostType);
export const PostStatusSchema = z.nativeEnum(PostStatus);
export const PostTargetTypeSchema = z.nativeEnum(PostTargetType);