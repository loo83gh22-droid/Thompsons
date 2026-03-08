"use server";

import { createClient } from "@/src/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { getActiveFamilyId } from "@/src/lib/family";

export type BucketListScope = "family" | "personal";
export type BucketListStatus = "dream" | "planned" | "in_progress" | "completed";
export type BucketListCategory =
  | "travel" | "adventure" | "learning" | "food"
  | "creative" | "sports" | "together" | "milestone";

export async function addBucketListItem(data: {
  title: string;
  description?: string;
  scope: BucketListScope;
  isPrivate?: boolean;
  category?: BucketListCategory;
  targetDate?: string;
  addedBy: string; // family_member id
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { activeFamilyId } = await getActiveFamilyId(supabase);
  if (!activeFamilyId) throw new Error("No active family");

  const { error } = await supabase.from("bucket_list_items").insert({
    family_id: activeFamilyId,
    title: data.title.trim(),
    description: data.description?.trim() || null,
    scope: data.scope,
    is_private: data.scope === "personal" ? (data.isPrivate ?? false) : false,
    added_by: data.addedBy,
    status: "dream",
    category: data.category || null,
    target_date: data.targetDate || null,
  });

  if (error) throw error;
  revalidatePath("/dashboard/bucket-list");
}

export async function updateBucketListStatus(id: string, status: BucketListStatus, completedNote?: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const updates: Record<string, unknown> = { status };
  if (status === "completed") {
    updates.completed_at = new Date().toISOString();
    updates.completed_note = completedNote?.trim() || null;
  } else {
    updates.completed_at = null;
    updates.completed_note = null;
  }

  const { error } = await supabase
    .from("bucket_list_items")
    .update(updates)
    .eq("id", id);

  if (error) throw error;
  revalidatePath("/dashboard/bucket-list");
}

export async function updateBucketListItem(id: string, data: {
  title?: string;
  description?: string;
  category?: BucketListCategory | null;
  targetDate?: string | null;
  isPrivate?: boolean;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const updates: Record<string, unknown> = {};
  if (data.title !== undefined) updates.title = data.title.trim();
  if (data.description !== undefined) updates.description = data.description?.trim() || null;
  if (data.category !== undefined) updates.category = data.category;
  if (data.targetDate !== undefined) updates.target_date = data.targetDate || null;
  if (data.isPrivate !== undefined) updates.is_private = data.isPrivate;

  const { error } = await supabase
    .from("bucket_list_items")
    .update(updates)
    .eq("id", id);

  if (error) throw error;
  revalidatePath("/dashboard/bucket-list");
}

export async function deleteBucketListItem(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("bucket_list_items")
    .delete()
    .eq("id", id);

  if (error) throw error;
  revalidatePath("/dashboard/bucket-list");
}

export async function toggleCheer(itemId: string, memberId: string, currentlyCheered: boolean) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  if (currentlyCheered) {
    await supabase
      .from("bucket_list_cheers")
      .delete()
      .eq("item_id", itemId)
      .eq("member_id", memberId);
  } else {
    await supabase
      .from("bucket_list_cheers")
      .insert({ item_id: itemId, member_id: memberId });
  }

  revalidatePath("/dashboard/bucket-list");
}
