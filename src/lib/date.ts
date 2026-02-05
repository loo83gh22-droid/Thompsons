/**
 * Format a date-only string (YYYY-MM-DD) for display.
 * Avoids timezone shift: new Date("2024-09-15") parses as midnight UTC,
 * which can display as the previous day in western timezones.
 */
export function formatDateOnly(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-").map(Number);
  if (isNaN(y) || isNaN(m) || isNaN(d)) return dateStr;
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
