/**
 * Family member role system.
 *
 * Roles:
 *   owner  – created the family. Billing, Nest Keepers, member management.
 *   adult  – full access to create/edit content for self and children.
 *   teen   – 13-17. Can create own content, limited management.
 *   child  – under 13. No login. Adults post on their behalf.
 */

export type MemberRole = "owner" | "adult" | "teen" | "child";

export const ROLE_LABELS: Record<MemberRole, string> = {
  owner: "Account Owner",
  adult: "Adult",
  teen: "Teen",
  child: "Child",
};

export const ROLE_DESCRIPTIONS: Record<MemberRole, string> = {
  owner: "Full control — billing, members, settings, and all content",
  adult: "Can create and manage content for themselves and children",
  teen: "Can create their own content with limited management",
  child: "No login — adults create content on their behalf",
};

export const ROLE_COLORS: Record<MemberRole, string> = {
  owner: "text-[var(--accent)]",
  adult: "text-blue-400",
  teen: "text-emerald-400",
  child: "text-purple-400",
};

export const ROLE_BADGES: Record<MemberRole, { bg: string; text: string }> = {
  owner: { bg: "bg-[var(--accent)]/15", text: "text-[var(--accent)]" },
  adult: { bg: "bg-blue-500/15", text: "text-blue-400" },
  teen: { bg: "bg-emerald-500/15", text: "text-emerald-400" },
  child: { bg: "bg-purple-500/15", text: "text-purple-400" },
};

/**
 * Determine the appropriate role based on birth date.
 * Returns null if birth date is not provided (caller should default to 'adult').
 */
export function detectRoleFromBirthDate(birthDate: string | null | undefined): MemberRole | null {
  if (!birthDate) return null;

  const birth = new Date(birthDate + "T12:00:00");
  if (isNaN(birth.getTime())) return null;

  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }

  if (age < 13) return "child";
  if (age < 18) return "teen";
  return "adult";
}

/**
 * Calculate age from birth date.
 */
export function calculateAge(birthDate: string | null | undefined): number | null {
  if (!birthDate) return null;

  const birth = new Date(birthDate + "T12:00:00");
  if (isNaN(birth.getTime())) return null;

  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

/**
 * Check if a role can perform an action.
 */
export function canManageMembers(role: MemberRole): boolean {
  return role === "owner";
}

export function canDeleteContent(role: MemberRole, isOwnContent: boolean): boolean {
  if (role === "owner") return true;
  if (role === "adult") return isOwnContent;
  if (role === "teen") return isOwnContent;
  return false;
}

export function canCreateContent(role: MemberRole): boolean {
  return role !== "child"; // children can't log in
}

export function canEditSettings(role: MemberRole): boolean {
  return role === "owner";
}

export function canInviteMembers(role: MemberRole): boolean {
  return role === "owner" || role === "adult";
}

export function canManageBilling(role: MemberRole): boolean {
  return role === "owner";
}
