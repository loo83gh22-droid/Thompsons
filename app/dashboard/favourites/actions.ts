"use server";

import { createClient } from "@/src/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { getActiveFamilyId } from "@/src/lib/family";

type Result = { success: boolean; error?: string; id?: string };

// ── Lists ─────────────────────────────────────────────────────────────────────

export async function createList(name: string, emoji: string): Promise<Result> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Not authenticated" };

    const { activeFamilyId } = await getActiveFamilyId(supabase);
    if (!activeFamilyId) return { success: false, error: "No active family" };

    const { data: myMember } = await supabase
      .from("family_members")
      .select("id")
      .eq("user_id", user.id)
      .eq("family_id", activeFamilyId)
      .single();

    const { count } = await supabase
      .from("favourite_lists")
      .select("id", { count: "exact", head: true })
      .eq("family_id", activeFamilyId);

    const { data, error } = await supabase
      .from("favourite_lists")
      .insert({
        family_id: activeFamilyId,
        name: name.trim(),
        emoji: emoji.trim() || null,
        created_by: myMember?.id ?? null,
        sort_order: count ?? 0,
      })
      .select("id")
      .single();

    if (error) return { success: false, error: error.message };
    revalidatePath("/dashboard/favourites");
    return { success: true, id: data.id };
  } catch {
    return { success: false, error: "Something went wrong." };
  }
}

export async function updateList(listId: string, name: string, emoji: string): Promise<Result> {
  try {
    const supabase = await createClient();
    const { activeFamilyId } = await getActiveFamilyId(supabase);
    if (!activeFamilyId) return { success: false, error: "No active family" };

    const { error } = await supabase
      .from("favourite_lists")
      .update({ name: name.trim(), emoji: emoji.trim() || null })
      .eq("id", listId)
      .eq("family_id", activeFamilyId);

    if (error) return { success: false, error: error.message };
    revalidatePath("/dashboard/favourites");
    revalidatePath(`/dashboard/favourites/${listId}`);
    return { success: true };
  } catch {
    return { success: false, error: "Something went wrong." };
  }
}

export async function deleteList(listId: string): Promise<Result> {
  try {
    const supabase = await createClient();
    const { activeFamilyId } = await getActiveFamilyId(supabase);
    if (!activeFamilyId) return { success: false, error: "No active family" };

    const { error } = await supabase
      .from("favourite_lists")
      .delete()
      .eq("id", listId)
      .eq("family_id", activeFamilyId);

    if (error) return { success: false, error: error.message };
    revalidatePath("/dashboard/favourites");
    return { success: true };
  } catch {
    return { success: false, error: "Something went wrong." };
  }
}

// ── Items ─────────────────────────────────────────────────────────────────────

export async function addItem(
  listId: string,
  title: string,
  notes: string,
  url: string
): Promise<Result> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Not authenticated" };

    const { activeFamilyId } = await getActiveFamilyId(supabase);
    if (!activeFamilyId) return { success: false, error: "No active family" };

    const { data: myMember } = await supabase
      .from("family_members")
      .select("id")
      .eq("user_id", user.id)
      .eq("family_id", activeFamilyId)
      .single();

    const { data: list } = await supabase
      .from("favourite_lists")
      .select("id")
      .eq("id", listId)
      .eq("family_id", activeFamilyId)
      .single();
    if (!list) return { success: false, error: "List not found." };

    const { data, error } = await supabase
      .from("favourite_items")
      .insert({
        list_id: listId,
        family_id: activeFamilyId,
        title: title.trim(),
        notes: notes.trim() || null,
        url: url.trim() || null,
        added_by: myMember?.id ?? null,
      })
      .select("id")
      .single();

    if (error) return { success: false, error: error.message };
    revalidatePath(`/dashboard/favourites/${listId}`);
    revalidatePath("/dashboard/favourites");
    return { success: true, id: data.id };
  } catch {
    return { success: false, error: "Something went wrong." };
  }
}

export async function updateItem(
  itemId: string,
  listId: string,
  title: string,
  notes: string,
  url: string
): Promise<Result> {
  try {
    const supabase = await createClient();
    const { activeFamilyId } = await getActiveFamilyId(supabase);
    if (!activeFamilyId) return { success: false, error: "No active family" };

    const { error } = await supabase
      .from("favourite_items")
      .update({
        title: title.trim(),
        notes: notes.trim() || null,
        url: url.trim() || null,
      })
      .eq("id", itemId)
      .eq("family_id", activeFamilyId);

    if (error) return { success: false, error: error.message };
    revalidatePath(`/dashboard/favourites/${listId}`);
    return { success: true };
  } catch {
    return { success: false, error: "Something went wrong." };
  }
}

export async function removeItem(itemId: string, listId: string): Promise<Result> {
  try {
    const supabase = await createClient();
    const { activeFamilyId } = await getActiveFamilyId(supabase);
    if (!activeFamilyId) return { success: false, error: "No active family" };

    const { error } = await supabase
      .from("favourite_items")
      .update({ removed_at: new Date().toISOString() })
      .eq("id", itemId)
      .eq("family_id", activeFamilyId);

    if (error) return { success: false, error: error.message };
    revalidatePath(`/dashboard/favourites/${listId}`);
    revalidatePath("/dashboard/favourites");
    return { success: true };
  } catch {
    return { success: false, error: "Something went wrong." };
  }
}

export async function restoreItem(itemId: string, listId: string): Promise<Result> {
  try {
    const supabase = await createClient();
    const { activeFamilyId } = await getActiveFamilyId(supabase);
    if (!activeFamilyId) return { success: false, error: "No active family" };

    const { error } = await supabase
      .from("favourite_items")
      .update({ removed_at: null })
      .eq("id", itemId)
      .eq("family_id", activeFamilyId);

    if (error) return { success: false, error: error.message };
    revalidatePath(`/dashboard/favourites/${listId}`);
    return { success: true };
  } catch {
    return { success: false, error: "Something went wrong." };
  }
}
