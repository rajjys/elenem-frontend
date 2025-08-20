import z from "zod";
import { Gender, SupportedLanguages } from "./";

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