import { z } from "zod";
import { titleSchema, longContentSchema, uuidSchema } from "@/src/lib/validation/schemas";

export const createRecipeSchema = z.object({
  title: titleSchema,
  story: longContentSchema(20).optional().nullable(), // 20KB story
  taught_by_id: uuidSchema.optional().nullable(),
  occasions: z.string().trim().max(200).optional().nullable(),
  ingredients: z
    .string()
    .trim()
    .max(10 * 1024, "Ingredients must be under 10KB")
    .optional()
    .nullable(),
  instructions: longContentSchema(20).optional().nullable(), // 20KB instructions
  added_by_id: uuidSchema.optional().nullable(),
  photo_ids: z.array(uuidSchema).max(20, "Maximum 20 photos per recipe").default([]),
});

export type CreateRecipeInput = z.infer<typeof createRecipeSchema>;
