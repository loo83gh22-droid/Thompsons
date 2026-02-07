import { cookies } from "next/headers";
import type { SupabaseClient } from "@supabase/supabase-js";

export type Family = { id: string; name: string };

/** Get families the current user belongs to (via their family_members) */
export async function getUserFamilies(
  supabase: SupabaseClient
): Promise<Family[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: members } = await supabase
    .from("family_members")
    .select("family_id, families(id, name)")
    .eq("user_id", user.id);

  if (!members?.length) return [];

  const seen = new Set<string>();
  const families: Family[] = [];
  for (const m of members) {
    const raw = m.families as { id: string; name: string } | { id: string; name: string }[] | null;
    const f = Array.isArray(raw) ? raw[0] : raw;
    if (f && !seen.has(f.id)) {
      seen.add(f.id);
      families.push({ id: f.id, name: f.name });
    }
  }
  return families;
}

/** Get active family ID from cookie or default to first family. Returns null if user has no families. */
export async function getActiveFamilyId(
  supabase: SupabaseClient
): Promise<{ activeFamilyId: string | null; families: Family[] }> {
  const families = await getUserFamilies(supabase);
  if (families.length === 0) {
    return { activeFamilyId: null, families: [] };
  }

  const cookieStore = await cookies();
  const activeFromCookie = cookieStore.get("active_family_id")?.value;

  const activeFamilyId =
    activeFromCookie && families.some((f) => f.id === activeFromCookie)
      ? activeFromCookie
      : families[0]!.id;

  return { activeFamilyId, families };
}

/** Get family display name for the active family */
export async function getActiveFamilyName(
  supabase: SupabaseClient
): Promise<string> {
  const { activeFamilyId } = await getActiveFamilyId(supabase);
  if (!activeFamilyId) return "Our Family";

  const { data } = await supabase
    .from("families")
    .select("name")
    .eq("id", activeFamilyId)
    .single();

  return data?.name?.trim() || "Our Family";
}
