import { z } from 'zod';

const createContentZodSchema = z.object({
  body: z.object({
    campaignName: z.string({ required_error: 'Campaign name is required' }).min(2),
    audience: z.enum(['Public', 'Private', 'Internal']).default('Public'),
    title: z.string({ required_error: 'Title is required' }).min(2),
    description: z.string().optional(),
    videoUrl: z.string({ required_error: 'Video URL is required' }),
    thumbnailUrl: z.string().optional(),
    createdBy: z.string().optional(),
    status: z.enum(['Draft', 'Published', 'Archived']).default('Draft'),
    views: z.number().optional(),
    likes: z.number().optional(),
  }),
});

const updateContentZodSchema = z.object({
  body: z.object({
    campaignName: z.string().optional(),
    audience: z.enum(['Public', 'Private', 'Internal']).optional(),
    title: z.string().optional(),
    description: z.string().optional(),
    videoUrl: z.string().optional(),
    thumbnailUrl: z.string().optional(),
    createdBy: z.string().optional(),
    status: z.enum(['Draft', 'Published', 'Archived']).optional(),
    views: z.number().optional(),
    likes: z.number().optional(),
  }),
});

export const ContentValidation = {
  createContentZodSchema,
  updateContentZodSchema,
};
