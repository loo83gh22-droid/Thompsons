import { z } from "zod";

// Common field schemas
export const titleSchema = z
  .string()
  .trim()
  .min(1, "Title is required")
  .max(200, "Title must be under 200 characters");

export const shortTextSchema = z
  .string()
  .trim()
  .max(500, "Text must be under 500 characters")
  .optional()
  .nullable()
  .transform((val) => val || null);

export const longContentSchema = (maxKB: number) =>
  z
    .string()
    .trim()
    .max(maxKB * 1024, `Content must be under ${maxKB}KB`)
    .optional()
    .nullable()
    .transform((val) => val || null);

export const emailSchema = z
  .string()
  .trim()
  .email("Invalid email address")
  .max(254, "Email too long");

export const dateStringSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)")
  .refine((date) => !isNaN(Date.parse(date)), "Invalid date");

export const optionalDateStringSchema = dateStringSchema.optional().nullable();

export const coordinateSchema = z
  .number()
  .or(z.string().transform(Number))
  .refine((val) => !isNaN(val) && isFinite(val), "Invalid coordinate");

export const latitudeSchema = coordinateSchema.refine(
  (val) => val >= -90 && val <= 90,
  "Latitude must be between -90 and 90"
);

export const longitudeSchema = coordinateSchema.refine(
  (val) => val >= -180 && val <= 180,
  "Longitude must be between -180 and 180"
);

export const uuidSchema = z.string().uuid("Invalid ID format");

export const locationNameSchema = z
  .string()
  .trim()
  .max(200, "Location name must be under 200 characters")
  .optional()
  .nullable()
  .transform((val) => val || null);

// Helper: Parse FormData field safely
export function getFormString(formData: FormData, key: string): string {
  const value = formData.get(key);
  if (value === null) return "";
  if (typeof value === "string") return value;
  return ""; // File objects become empty string
}

export function getFormFile(formData: FormData, key: string): File | null {
  const value = formData.get(key);
  if (value instanceof File && value.size > 0) return value;
  return null;
}
