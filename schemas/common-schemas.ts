import { z } from 'zod';

// Define a separate schema for the social links and other JSON fields for better type safety
const SocialLinksSchema = z.record(z.string().url()).optional().nullable();

// The main schema for creating or updating a business profile
export const CreateBusinessProfileSchema = z.object({
  // Core Business Metadata
  //name: z.string().min(1, 'Business name is required.'),
  legalName: z.string().optional().nullable(),
  type: z.enum(['TENANT', 'LEAGUE', 'TEAM']).optional(), // Assuming you have a BusinessProfileType enum
  establishedYear: z.coerce.number() 
    .int("L'année doit être un nombre entier.") 
    // Handle empty string/null input gracefully by allowing 0, then checking bounds
    .transform((v) => (v === 0 ? null : v)) 
    .nullable()
    .optional()
    // The checks remain the same, but they run AFTER coercion
    .refine((val) => val === null || val && (val >= 1000), "L'année doit être après 999.")
    .refine((val) => val === null || val && (val <= new Date().getFullYear()), "L'année ne peut pas être dans le futur."),
  description: z.string().optional().nullable(),
  nationalIdNumber: z.string().optional().nullable(),
  leagueRegistrationId: z.string().optional().nullable(),

  // Contact Information
  contactEmail: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  businessPhone: z.string().optional().nullable(),
  supportEmail: z.string().email().optional().nullable(),
  website: z.string().optional().nullable(),
  socialLinks: SocialLinksSchema.optional().nullable(),

  // Financial/Administrative
  taxNumber: z.string().optional().nullable(),
  // For JSON fields, Zod's `z.any()` or a more specific schema can be used
  bankInfo: z.any().optional().nullable(),
  mobileMoneyInfo: z.any().optional().nullable(),

  // Location Details
  region: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  physicalAddress: z.string().optional().nullable(),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  timezone: z.string().optional().nullable(),

  // Brand Identity
  brandingTheme: z.any().optional().nullable(),

  // Relations to MediaAsset
  logoAssetId: z.string().optional().nullable(),
  bannerAssetId: z.string().optional().nullable(),
});

export const BusinessProfileSchema = CreateBusinessProfileSchema.extend({
  //id: z.string().optional().nullable(),
  logoAsset: z.object({
    url: z.string()
  }).optional().nullable(),
  bannerAsset: z.object({
    url: z.string()
  }).optional().nullable(),
})

export type CreateBusinessProfileDto = z.infer<typeof CreateBusinessProfileSchema>;
export type BusinessProfileDto = z.infer<typeof BusinessProfileSchema>;