import z from "zod";

// Schema for the nested BusinessProfile
export const CreateBusinessProfileSchema = z.object({
  //name: z.string().min(1, 'Business name is required.'),
  description: z.string().nullable().optional(),
  logoUrl: z.string().nullable().optional(), // Use a simple string as requested
  bannerImageUrl: z.string().nullable().optional(), // Use a simple string as requested
  //website: z.string().url().optional(),
  //socialMediaLinks: z.record(z.string()).optional(),
  //establishedYear: z.number().int().min(1000).max(new Date().getFullYear()).optional(),
  physicalAddress: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  //state: z.string().optional(),
  region: z.string().nullable().optional(),
  //postalCode: z.string().optional(),
});