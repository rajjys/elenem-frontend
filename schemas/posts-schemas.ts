// src/schemas/post.ts
import { z } from "zod";
import { PostStatusSchema, PostTypeSchema, PostTargetTypeSchema, PostType, PostStatus, PostTargetType } from "./enums";

const ContentShape = z.object({
  content: z.string().optional(),
  richContent: z.any().optional(),
});

// plain ZodObject base that supports .partial()
const CreatePostBase = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(60, "Title must be less than 60 characters"),
  slug: z.string().optional().nullable(),
  excerpt: z.string().max(300),
  type: PostTypeSchema,
  status: PostStatusSchema,
  scheduledAt: z.string().optional(),
  heroImageId: z.string().optional().nullable(),
  targetType: PostTargetTypeSchema,
  targetId: z.string().optional(),
}).merge(ContentShape);

// refined schema for creation
export const CreatePostSchema = CreatePostBase.refine(
  data =>
    (data.content && data.content.length > 10) ||
    (data.richContent && JSON.stringify(data.richContent).length > 10),
  {
    message: "Content (either rich or legacy) is required and must be substantial.",
    path: ["richContent"],
  }
);

export type CreatePostFormValues = z.infer<typeof CreatePostSchema>;

// derive update schema from the plain base (makes fields optional)
export const UpdatePostSchema = CreatePostBase.partial();

export type UpdatePostFormValues = z.infer<typeof UpdatePostSchema>;

export const PostFilterParamsSchema = z.object({
  page: z.number().int().min(1).default(1).optional(),
  pageSize: z.number().int().min(1).max(100).default(10).optional(),
  search: z.string().optional(),
  sortBy: z.enum(['title' , 'type' , 'status' , 'tenantName' , 'leagueName' , 'teamName' , 'createdAt' , 'publishedAt']).default('createdAt').optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc').optional(),
  targetType: PostTargetTypeSchema.optional(),
  targetId: z.string().nullable().optional(),
  type: PostTypeSchema.optional(),
  status: PostStatusSchema.optional(),
  tenantId: z.string().nullable().optional()
}).partial(); // All fields are optional for filtering

export type PostFilterParams = z.infer<typeof PostFilterParamsSchema>;

// Interface for initial data coming from the API (includes post ID and asset details)
export interface PostResponseDto {
    id: string;
    title: string;
    slug: string;
    excerpt?: string;
    content: string; // Legacy markdown
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    richContent?: any; // Lexical JSON
    type: PostType;
    status: PostStatus;
    scheduledAt?: string;
    heroImageId?: string;
    heroImage?: { url: string }; // Assuming this is how the image asset comes back
    targetType: PostTargetType;
    targetId?: string;
    tenant: { id: string; name: string; slug: string, tenantCode: string, businessProfile: { logoAsset: { url: string }} };
    league?: { id: string; name: string; slug: string };
    team?: { id: string; name: string; slug: string };
    createdAt: string;
    publishedAt?: string;
    createdBy?: { id: string; username: string };
    updatedAt: string;
    // ... other fields
}