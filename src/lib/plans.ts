import type { SupabaseClient } from "@supabase/supabase-js";

export type PlanType = "free" | "annual" | "legacy";

export interface FamilyPlan {
  planType: PlanType;
  storageUsedBytes: number;
  storageLimitBytes: number;
}

/* ── Plan limits ────────────────────────────────────────────── */

/** Whether the plan allows video uploads */
export function canUploadVideos(plan: PlanType): boolean {
  return plan === "annual" || plan === "legacy";
}

/** Whether the plan allows adding map locations (not just viewing) */
export function canEditMap(plan: PlanType): boolean {
  return plan === "annual" || plan === "legacy";
}

/** Whether the plan allows shareable public links */
export function canSharePublicly(plan: PlanType): boolean {
  return plan === "annual" || plan === "legacy";
}

/** Whether the plan allows Nest Keeper management */
export function canManageNestKeepers(plan: PlanType): boolean {
  return plan === "legacy";
}

/** Max journal entries for a given plan (null = unlimited) */
export function journalEntryLimit(plan: PlanType): number | null {
  return plan === "free" ? 10 : null;
}

/* ── Fetch plan info ────────────────────────────────────────── */

export async function getFamilyPlan(
  supabase: SupabaseClient,
  familyId: string
): Promise<FamilyPlan> {
  const { data } = await supabase
    .from("families")
    .select("plan_type, storage_used_bytes, storage_limit_bytes")
    .eq("id", familyId)
    .single();

  return {
    planType: (data?.plan_type as PlanType) ?? "free",
    storageUsedBytes: data?.storage_used_bytes ?? 0,
    storageLimitBytes: data?.storage_limit_bytes ?? 524288000,
  };
}

/* ── Storage tracking ───────────────────────────────────────── */

/** Check if adding `bytes` would exceed the storage limit. Throws if exceeded. */
export async function enforceStorageLimit(
  supabase: SupabaseClient,
  familyId: string,
  additionalBytes: number
): Promise<void> {
  const plan = await getFamilyPlan(supabase, familyId);
  if (plan.storageUsedBytes + additionalBytes > plan.storageLimitBytes) {
    const usedMB = (plan.storageUsedBytes / (1024 * 1024)).toFixed(0);
    const limitMB = (plan.storageLimitBytes / (1024 * 1024)).toFixed(0);
    throw new Error(
      `Storage limit reached (${usedMB} MB / ${limitMB} MB). Delete some files or upgrade your plan.`
    );
  }
}

/** Add bytes to the family's storage_used_bytes counter */
export async function addStorageUsage(
  supabase: SupabaseClient,
  familyId: string,
  bytes: number
): Promise<void> {
  // Use rpc or raw update; increment atomically
  await supabase.rpc("increment_storage_used", {
    fid: familyId,
    bytes_to_add: bytes,
  });
}

/** Subtract bytes from the family's storage_used_bytes counter */
export async function subtractStorageUsage(
  supabase: SupabaseClient,
  familyId: string,
  bytes: number
): Promise<void> {
  await supabase.rpc("decrement_storage_used", {
    fid: familyId,
    bytes_to_subtract: bytes,
  });
}
