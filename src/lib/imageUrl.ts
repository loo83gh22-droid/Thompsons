/**
 * Append Supabase image transform params to a Storage URL.
 *
 * Only modifies URLs that come from Supabase Storage (contain "supabase.co").
 * Passes through blob:, data:, and other origins unchanged — safe to call on
 * local preview URLs produced by URL.createObjectURL().
 *
 * @param url    Source URL (may be null/undefined)
 * @param width  Desired pixel width (use 2× the CSS size for retina)
 * @param quality JPEG quality 1–100 (default 75)
 */
export function thumbUrl(
  url: string | null | undefined,
  width: number,
  quality = 75
): string {
  if (!url) return "";
  // Already has transform params — don't double-apply
  if (url.includes("?width=")) return url;
  // Only Supabase Storage URLs support image transforms
  if (!url.includes("supabase.co")) return url;
  return `${url}?width=${width}&quality=${quality}&resize=cover`;
}
