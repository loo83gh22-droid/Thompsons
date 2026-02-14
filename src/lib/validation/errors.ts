import { z } from "zod";

export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

/**
 * Format Zod validation errors into user-friendly message
 */
export function formatZodError(error: z.ZodError<any>): string {
  const issues = error.issues;
  if (!issues || issues.length === 0) return "Validation failed";

  const firstError = issues[0];
  const field = firstError.path.join(".");
  const message = firstError.message;

  return field ? `${field}: ${message}` : message;
}

/**
 * Safe parse with user-friendly error message
 */
export function validateSchema<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): ValidationResult<T> {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  return {
    success: false,
    error: formatZodError(result.error),
  };
}
