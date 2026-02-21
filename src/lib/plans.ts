import type { SupabaseClient } from "@supabase/supabase-js";
import { PLAN_LIMITS, DEFAULT_STORAGE_LIMIT_BYTES, type PlanType } from "./constants";

export type { PlanType };

export interface FamilyPlan {
  planType: PlanType;
  storageUsedBytes: number;
  storageLimitBytes: number;
}

/* ── Feature instance limits ──────────────────────────────── */

type FeatureLimitKey =
  | "journalEntries"
  | "stories"
  | "recipes"
  | "timeCapsules"
  | "voiceMemos"
  | "traditions"
  | "events"
  | "mapLocations";

/** Get the instance limit for a feature on a given plan (null = unlimited) */
export function featureLimit(plan: PlanType, feature: FeatureLimitKey): number | null {
  return PLAN_LIMITS[plan][feature];
}

/** Max journal entries for a given plan (null = unlimited) */
export function journalEntryLimit(plan: PlanType): number | null {
  return PLAN_LIMITS[plan].journalEntries;
}

/** Max videos per journal entry for a given plan */
export function videosPerEntryLimit(plan: PlanType): number {
  return PLAN_LIMITS[plan].videosPerEntry;
}

/** Whether the plan allows Nest Keeper management */
export function canManageNestKeepers(plan: PlanType): boolean {
  return plan === "legacy" && PLAN_LIMITS.legacy.nestKeeperManagement === true;
}

/* ── Deprecated boolean gates (kept for backward compat, always return true) */

/** @deprecated All plans now allow video uploads (with per-entry limits). Use videosPerEntryLimit() instead. */
export function canUploadVideos(_plan: PlanType): boolean {
  return true;
}

/** @deprecated All plans now allow map editing (with instance limits). Use featureLimit(plan, 'mapLocations') instead. */
export function canEditMap(_plan: PlanType): boolean {
  return true;
}

/** @deprecated All plans now allow public sharing. */
export function canSharePublicly(_plan: PlanType): boolean {
  return true;
}

/* ── Reusable limit enforcement ───────────────────────────── */

const FEATURE_LABELS: Record<FeatureLimitKey, string> = {
  journalEntries: "journal entries",
  stories: "stories",
  recipes: "recipes",
  timeCapsules: "time capsules",
  voiceMemos: "voice memos",
  traditions: "traditions",
  events: "events",
  mapLocations: "map locations",
};

/**
 * Check if a family has reached the instance limit for a feature.
 * Returns null if under limit, or an error message string if at/over limit.
 */
export async function checkFeatureLimit(
  supabase: SupabaseClient,
  familyId: string,
  planType: PlanType,
  feature: FeatureLimitKey,
  table: string,
): Promise<string | null> {
  const limit = featureLimit(planType, feature);
  if (limit === null) return null; // unlimited

  const { count } = await supabase
    .from(table)
    .select("id", { count: "exact", head: true })
    .eq("family_id", familyId);

  if ((count ?? 0) >= limit) {
    const label = FEATURE_LABELS[feature];
    return `Free plan allows up to ${limit} ${label}. Upgrade to unlock unlimited ${label}.`;
  }
  return null;
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
    storageLimitBytes: data?.storage_limit_bytes ?? DEFAULT_STORAGE_LIMIT_BYTES,
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
