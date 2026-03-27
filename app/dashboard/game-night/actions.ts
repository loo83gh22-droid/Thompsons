"use server";

import { createClient } from "@/src/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { getActiveFamilyId } from "@/src/lib/family";

type Result = { success: boolean; error?: string; id?: string };

export async function getOrCreateGame(name: string): Promise<string | null> {
  try {
    const supabase = await createClient();
    const { activeFamilyId } = await getActiveFamilyId(supabase);
    if (!activeFamilyId) return null;

    const trimmed = name.trim();
    if (!trimmed) return null;

    // Try existing
    const { data: existing } = await supabase
      .from("family_games")
      .select("id")
      .eq("family_id", activeFamilyId)
      .ilike("name", trimmed)
      .maybeSingle();

    if (existing) return existing.id;

    // Create new
    const { data } = await supabase
      .from("family_games")
      .insert({ family_id: activeFamilyId, name: trimmed })
      .select("id")
      .single();

    return data?.id ?? null;
  } catch {
    return null;
  }
}

export async function logSession(
  gameName: string,
  playedOn: string,
  winnerId: string,
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

    const gameId = gameName.trim() ? await getOrCreateGame(gameName) : null;

    const { data, error } = await supabase
      .from("game_night_sessions")
      .insert({
        family_id: activeFamilyId,
        game_id: gameId,
        played_on: playedOn || new Date().toISOString().slice(0, 10),
        winner_id: winnerId || null,
        notes: notes.trim() || null,
        created_by: myMember?.id ?? null,
      })
      .select("id")
      .single();

    if (error) return { success: false, error: error.message };
    revalidatePath("/dashboard/game-night");
    return { success: true, id: data.id };
  } catch {
    return { success: false, error: "Something went wrong." };
  }
}

export async function deleteSession(sessionId: string): Promise<Result> {
  try {
    const supabase = await createClient();
    const { activeFamilyId } = await getActiveFamilyId(supabase);
    if (!activeFamilyId) return { success: false, error: "No active family" };

    const { error } = await supabase
      .from("game_night_sessions")
      .delete()
      .eq("id", sessionId)
      .eq("family_id", activeFamilyId);

    if (error) return { success: false, error: error.message };
    revalidatePath("/dashboard/game-night");
    return { success: true };
  } catch {
    return { success: false, error: "Something went wrong." };
  }
}

export async function fetchGames(): Promise<{ id: string; name: string }[]> {
  try {
    const supabase = await createClient();
    const { activeFamilyId } = await getActiveFamilyId(supabase);
    if (!activeFamilyId) return [];
    const { data } = await supabase
      .from("family_games")
      .select("id, name")
      .eq("family_id", activeFamilyId)
      .order("name");
    return data ?? [];
  } catch {
    return [];
  }
}
