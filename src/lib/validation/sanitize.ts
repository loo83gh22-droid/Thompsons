/**
 * Truncate text safely without breaking words
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;

  const truncated = text.slice(0, maxLength);
  const lastSpace = truncated.lastIndexOf(" ");

  return lastSpace > maxLength * 0.8
    ? truncated.slice(0, lastSpace) + "..."
    : truncated + "...";
}

/**
 * Create safe snippet from content for search results
 * Removes markdown syntax for cleaner snippets
 */
export function createSafeSnippet(
  content: string | null,
  query: string,
  maxLength: number = 80
): string {
  if (!content) return "";

  // Remove markdown syntax for cleaner snippets
  const plainText = content
    .replace(/#{1,6}\s/g, "") // Headers
    .replace(/\*\*(.+?)\*\*/g, "$1") // Bold
    .replace(/\*(.+?)\*/g, "$1") // Italic
    .replace(/\[(.+?)\]\(.+?\)/g, "$1") // Links
    .replace(/`(.+?)`/g, "$1") // Code
    .trim();

  const lower = plainText.toLowerCase();
  const queryLower = query.toLowerCase();
  const idx = lower.indexOf(queryLower);

  if (idx === -1) {
    return truncateText(plainText, maxLength);
  }

  // Show context around match
  const start = Math.max(0, idx - 30);
  const end = Math.min(plainText.length, idx + query.length + 50);

  let snippet = plainText.slice(start, end);
  if (start > 0) snippet = "..." + snippet;
  if (end < plainText.length) snippet = snippet + "...";

  return snippet;
}
