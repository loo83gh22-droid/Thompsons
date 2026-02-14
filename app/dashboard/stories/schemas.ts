import { z } from "zod";
import { titleSchema, longContentSchema, uuidSchema } from "@/src/lib/validation/schemas";

export const storyCategories = [
  "family_history",
  "advice_wisdom",
  "memorable_moments",
  "traditions",
  "recipes_food",
  "other",
] as const;

export const createStorySchema = z.object({
  title: titleSchema,
  content: longContentSchema(100), // 100KB max for stories
  category: z.enum(storyCategories).default("memorable_moments"),
  published: z.boolean().default(true),
  cover_url: z.string().url().max(500).optional().nullable(),
  author_family_member_id: uuidSchema.optional().nullable(),
});

export const updateStorySchema = createStorySchema.partial();

export type CreateStoryInput = z.infer<typeof createStorySchema>;
export type UpdateStoryInput = z.infer<typeof updateStorySchema>;
