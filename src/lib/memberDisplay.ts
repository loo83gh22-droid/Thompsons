/**
 * Format for showing who created content: "[Nickname or Name] (Relationship)".
 * Use nickname when set, otherwise full name.
 */
export function memberDisplayLabel(member: {
  name: string;
  nickname?: string | null;
  relationship?: string | null;
}): string {
  const displayName = member.nickname?.trim() || member.name?.trim() || "Someone";
  const rel = member.relationship?.trim();
  return rel ? `${displayName} (${rel})` : displayName;
}
