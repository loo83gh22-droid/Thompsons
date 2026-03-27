"use server";

import { createClient } from "@/src/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { getActiveFamilyId } from "@/src/lib/family";

type Result = { success: boolean; error?: string; id?: string };

export async function addFilm(
  title: string,
  type: string,
  status: string,
  isFamilyPick: boolean,
  rating: number | null,
  notes: string
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

    const { data, error } = await supabase
      .from("family_films")
      .insert({
        family_id: activeFamilyId,
        title: title.trim(),
        type: ["movie", "series"].includes(type) ? type : "movie",
        status: ["want_to_watch", "watching", "watched"].includes(status) ? status : "want_to_watch",
        is_family_pick: isFamilyPick,
        rating: rating && rating >= 1 && rating <= 5 ? rating : null,
        notes: notes.trim() || null,
        added_by: myMember?.id ?? null,
      })
      .select("id")
      .single();

    if (error) return { success: false, error: error.message };
    revalidatePath("/dashboard/films");
    return { success: true, id: data.id };
  } catch {
    return { success: false, error: "Something went wrong." };
  }
}

export async function updateFilm(
  filmId: string,
  title: string,
  type: string,
  status: string,
  isFamilyPick: boolean,
  rating: number | null,
  notes: string
): Promise<Result> {
  try {
    const supabase = await createClient();
    const { activeFamilyId } = await getActiveFamilyId(supabase);
    if (!activeFamilyId) return { success: false, error: "No active family" };

    const { error } = await supabase
      .from("family_films")
      .update({
        title: title.trim(),
        type,
        status,
        is_family_pick: isFamilyPick,
        rating: rating && rating >= 1 && rating <= 5 ? rating : null,
        notes: notes.trim() || null,
      })
      .eq("id", filmId)
      .eq("family_id", activeFamilyId);

    if (error) return { success: false, error: error.message };
    revalidatePath("/dashboard/films");
    return { success: true };
  } catch {
    return { success: false, error: "Something went wrong." };
  }
}

export async function deleteFilm(filmId: string): Promise<Result> {
  try {
    const supabase = await createClient();
    const { activeFamilyId } = await getActiveFamilyId(supabase);
    if (!activeFamilyId) return { success: false, error: "No active family" };

    const { error } = await supabase
      .from("family_films")
      .delete()
      .eq("id", filmId)
      .eq("family_id", activeFamilyId);

    if (error) return { success: false, error: error.message };
    revalidatePath("/dashboard/films");
    return { success: true };
  } catch {
    return { success: false, error: "Something went wrong." };
  }
}
