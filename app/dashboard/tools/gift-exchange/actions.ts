"use server";

import { createClient } from "@/src/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/src/lib/requireRole";
import { getActiveFamilyId } from "@/src/lib/family";

const REVALIDATE_PATH = "/dashboard/tools/gift-exchange";

// ── Create a new gift exchange ─────────────────────────────────────
export async function createGiftExchange(data: {
  name: string;
  description?: string;
  budgetLimit?: number;
  exchangeDate?: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { familyId, memberId } = await requireRole(supabase, user.id, [
    "owner",
    "adult",
  ]);

  const { error } = await supabase.from("gift_exchanges").insert({
    family_id: familyId,
    name: data.name.trim(),
    description: data.description?.trim() || null,
    budget_limit: data.budgetLimit ?? null,
    exchange_date: data.exchangeDate || null,
    created_by: memberId,
  });

  if (error) throw error;
  revalidatePath(REVALIDATE_PATH);
}

// ── Update exchange details ────────────────────────────────────────
export async function updateGiftExchange(
  exchangeId: string,
  data: {
    name?: string;
    description?: string;
    budgetLimit?: number | null;
    exchangeDate?: string | null;
  }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  await requireRole(supabase, user.id, ["owner", "adult"]);

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (data.name !== undefined) updates.name = data.name.trim();
  if (data.description !== undefined)
    updates.description = data.description?.trim() || null;
  if (data.budgetLimit !== undefined) updates.budget_limit = data.budgetLimit;
  if (data.exchangeDate !== undefined) updates.exchange_date = data.exchangeDate;

  const { error } = await supabase
    .from("gift_exchanges")
    .update(updates)
    .eq("id", exchangeId);

  if (error) throw error;
  revalidatePath(REVALIDATE_PATH);
}

// ── Delete an exchange ─────────────────────────────────────────────
export async function deleteGiftExchange(exchangeId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  await requireRole(supabase, user.id, ["owner", "adult"]);

  const { error } = await supabase
    .from("gift_exchanges")
    .delete()
    .eq("id", exchangeId);

  if (error) throw error;
  revalidatePath(REVALIDATE_PATH);
}

// ── Mark as completed ──────────────────────────────────────────────
export async function markExchangeCompleted(exchangeId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  await requireRole(supabase, user.id, ["owner", "adult"]);

  const { error } = await supabase
    .from("gift_exchanges")
    .update({ status: "completed", updated_at: new Date().toISOString() })
    .eq("id", exchangeId);

  if (error) throw error;
  revalidatePath(REVALIDATE_PATH);
}

// ── Add participant ────────────────────────────────────────────────
export async function addParticipant(exchangeId: string, memberId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  await requireRole(supabase, user.id, ["owner", "adult"]);

  const { error } = await supabase.from("gift_exchange_participants").insert({
    exchange_id: exchangeId,
    member_id: memberId,
  });

  if (error) {
    if (error.code === "23505") return; // already a participant
    throw error;
  }
  revalidatePath(REVALIDATE_PATH);
}

// ── Remove participant ─────────────────────────────────────────────
export async function removeParticipant(exchangeId: string, memberId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  await requireRole(supabase, user.id, ["owner", "adult"]);

  const { error } = await supabase
    .from("gift_exchange_participants")
    .delete()
    .eq("exchange_id", exchangeId)
    .eq("member_id", memberId);

  if (error) throw error;
  revalidatePath(REVALIDATE_PATH);
}

// ── Draw names (Secret Santa) ──────────────────────────────────────
export async function drawNames(exchangeId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  await requireRole(supabase, user.id, ["owner", "adult"]);

  // Fetch participants
  const { data: participants, error: fetchErr } = await supabase
    .from("gift_exchange_participants")
    .select("id, member_id")
    .eq("exchange_id", exchangeId);

  if (fetchErr) throw fetchErr;
  if (!participants || participants.length < 3) {
    throw new Error("You need at least 3 participants to draw names.");
  }

  // Shuffle and create a derangement (no one gets themselves)
  const memberIds = participants.map((p) => p.member_id);
  const assignments = generateDerangement(memberIds);

  if (!assignments) {
    throw new Error("Could not generate valid assignments. Please try again.");
  }

  // Update each participant with their assignment
  for (let i = 0; i < participants.length; i++) {
    const { error: upErr } = await supabase
      .from("gift_exchange_participants")
      .update({ assigned_to: assignments[i] })
      .eq("id", participants[i].id);
    if (upErr) throw upErr;
  }

  // Mark exchange as drawn
  const { error: statusErr } = await supabase
    .from("gift_exchanges")
    .update({ status: "drawn", updated_at: new Date().toISOString() })
    .eq("id", exchangeId);

  if (statusErr) throw statusErr;
  revalidatePath(REVALIDATE_PATH);
}

/**
 * Generate a derangement: a permutation where no element maps to itself.
 * Uses the Sattolo algorithm variant.
 */
function generateDerangement(items: string[]): string[] | null {
  if (items.length < 2) return null;

  // Sattolo's algorithm guarantees a single-cycle permutation (always a derangement)
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * i); // 0 to i-1 (never i itself)
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// ── Wishlist: add item ─────────────────────────────────────────────
export async function addWishlistItem(data: {
  exchangeId: string;
  itemName: string;
  itemUrl?: string;
  notes?: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { activeFamilyId } = await getActiveFamilyId(supabase);
  if (!activeFamilyId) throw new Error("No active family");

  // Get the user's member ID
  const { data: member } = await supabase
    .from("family_members")
    .select("id")
    .eq("user_id", user.id)
    .eq("family_id", activeFamilyId)
    .single();

  if (!member) throw new Error("Not a member of this family");

  const { error } = await supabase.from("gift_exchange_wishlist_items").insert({
    exchange_id: data.exchangeId,
    member_id: member.id,
    item_name: data.itemName.trim(),
    item_url: data.itemUrl?.trim() || null,
    notes: data.notes?.trim() || null,
  });

  if (error) throw error;
  revalidatePath(REVALIDATE_PATH);
}

// ── Wishlist: remove item ──────────────────────────────────────────
export async function removeWishlistItem(itemId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // RLS ensures only the owner of the item can delete
  const { error } = await supabase
    .from("gift_exchange_wishlist_items")
    .delete()
    .eq("id", itemId);

  if (error) throw error;
  revalidatePath(REVALIDATE_PATH);
}
