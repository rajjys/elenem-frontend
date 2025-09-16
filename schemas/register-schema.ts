import z from "zod";
import { Gender, PostStatus, PostType, SupportedLanguages } from "./";

export const RegisterFormSchema = z.object({
  username: z.string().min(1, { message: "Username is required" }),
  email: z.string().email({ message: "Invalid email address" }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters" }),
  firstName: z.string().min(1, { message: "First name is required" }),
  lastName: z.string().min(1, { message: "Last name is required" }),
  phone: z.string().optional().or(z.literal("")),
  dateOfBirth: z.string().optional().or(z.literal("")),
  gender: z.nativeEnum(Gender).optional().or(z.literal("")),
  nationality: z.string().optional().or(z.literal("")),
  profileImageUrl: z.string().url({ message: "Invalid URL" }).optional().or(z.literal("")),
  preferredLanguage: z.nativeEnum(SupportedLanguages).optional(),
  timezone: z.string().optional(),
  tenantId: z.string().optional().or(z.literal("")),
});

export interface BasicUserDto {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
}

export interface BasicTenantDto {
  id: string;
  name: string;
  slug: string;
  tenantCode: string;
}

export interface BasicLeagueDto {
  id: string;
  name: string;
  slug: string;
}

export interface BasicTeamDto {
  id: string;
  name: string;
  slug: string;
}

export interface BasicAssetDto {
  id: string;
  url: string;
  mimeType?: string;
  width?: number;
  height?: number;
}

export interface PostResponseDto {
  id: string;
  slug: string;
  title: string;
  excerpt?: string | null;
  content: string;

  type: PostType;
  status: PostStatus;

  heroImage?: BasicAssetDto | null;

  tenant: BasicTenantDto;
  league?: BasicLeagueDto | null;
  team?: BasicTeamDto | null;

  createdAt: string;
  updatedAt: string;
  publishedAt?: string | null;

  createdBy?: BasicUserDto | null;
}
