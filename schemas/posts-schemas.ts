// src/schemas/post.ts
import { z } from "zod";
import { PostStatusSchema, PostTypeSchema, PostTargetTypeSchema } from "./enums";

export const CreatePostSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  slug: z.string().optional(),
  excerpt: z.string().max(300).optional(),
  type: PostTypeSchema,
  status: PostStatusSchema,
  scheduledAt: z.string().optional(),
  content: z.string().min(10, "Content is required").optional(),
  heroImageId: z.string().optional(),
  targetType: PostTargetTypeSchema, // you might later move this to an enum too
  targetId: z.string().optional(),
});

export type CreatePostFormValues = z.infer<typeof CreatePostSchema>;

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
