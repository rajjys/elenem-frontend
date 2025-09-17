import { z } from 'zod';

// Define a separate schema for the social links and other JSON fields for better type safety
const SocialLinksSchema = z.record(z.string().url()).optional().nullable();

// The main schema for creating or updating a business profile
export const CreateBusinessProfileSchema = z.object({
  // Core Business Metadata
  //name: z.string().min(1, 'Business name is required.'),
  legalName: z.string().optional().nullable(),
  type: z.enum(['TENANT', 'LEAGUE', 'TEAM']).optional(), // Assuming you have a BusinessProfileType enum
  establishedYear: z.number().int().min(1000).max(new Date().getFullYear()).optional().nullable(),
  description: z.string().optional().nullable(),
  nationalIdNumber: z.string().optional().nullable(),
  leagueRegistrationId: z.string().optional().nullable(),

  // Contact Information
  contactEmail: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  businessPhone: z.string().optional().nullable(),
  supportEmail: z.string().email().optional().nullable(),
  website: z.string().url().optional().nullable(),
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
  logoUrl: z.string().url().optional().nullable(),
  bannerImageUrl: z.string().url().optional().nullable(),
  brandingTheme: z.any().optional().nullable(),

  // Relations to MediaAsset
  logoAssetId: z.string().optional().nullable(),
  bannerAssetId: z.string().optional().nullable(),
});

export type CreateBusinessProfileDto = z.infer<typeof CreateBusinessProfileSchema>