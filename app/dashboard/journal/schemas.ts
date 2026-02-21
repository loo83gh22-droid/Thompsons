import { z } from "zod";
import {
  titleSchema,
  longContentSchema,
  locationNameSchema,
  optionalDateStringSchema,
  uuidSchema,
} from "@/src/lib/validation/schemas";

export const createJournalEntrySchema = z
  .object({
    family_member_id: uuidSchema.optional().nullable(),
    member_ids: z.array(uuidSchema).min(1, "Select at least one family member"),
    title: titleSchema,
    content: longContentSchema(50), // 50KB max
    location: locationNameSchema,
    trip_date: optionalDateStringSchema,
    trip_date_end: optionalDateStringSchema,
    location_lat: z
      .string()
      .optional()
      .nullable()
      .transform((val) => {
        if (!val) return null;
        const num = Number(val);
        if (isNaN(num) || !isFinite(num)) return null;
        if (num < -90 || num > 90) return null;
        return num;
      }),
    location_lng: z
      .string()
      .optional()
      .nullable()
      .transform((val) => {
        if (!val) return null;
        const num = Number(val);
        if (isNaN(num) || !isFinite(num)) return null;
        if (num < -180 || num > 180) return null;
        return num;
      }),
    location_type: z
      .enum(["vacation", "memorable", "home"])
      .optional()
      .nullable(),
  })
  .refine(
    (data) => {
      // If end date provided, must be >= start date
      if (data.trip_date && data.trip_date_end) {
        return new Date(data.trip_date_end) >= new Date(data.trip_date);
      }
      return true;
    },
    {
      message: "End date must be after start date",
      path: ["trip_date_end"],
    }
  );

export type CreateJournalEntryInput = z.infer<
  typeof createJournalEntrySchema
>;
