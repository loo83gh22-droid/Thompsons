"use server";

import { createClient } from "@/src/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { getActiveFamilyId } from "@/src/lib/family";

export type BookStatus = "reading" | "finished" | "want_to_read";

export type BookResult = { success: true; id: string } | { success: false; error: string };

export async function addBook(formData: FormData): Promise<BookResult> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Not authenticated" };

    const { activeFamilyId } = await getActiveFamilyId(supabase);
    if (!activeFamilyId) return { success: false, error: "No active family" };

    const { data: member } = await supabase
      .from("family_members")
      .select("id")
      .eq("family_id", activeFamilyId)
      .eq("user_id", user.id)
      .single();
    if (!member) return { success: false, error: "Member not found" };

    const title = (formData.get("title") as string)?.trim();
    if (!title) return { success: false, error: "Title is required" };

    const author = (formData.get("author") as string)?.trim() || null;
    const status = (formData.get("status") as BookStatus) || "want_to_read";
    const ratingStr = formData.get("rating") as string | null;
    const rating = ratingStr ? parseInt(ratingStr, 10) : null;
    const notes = (formData.get("notes") as string)?.trim() || null;

    const { data, error } = await supabase
      .from("book_club_books")
      .insert({
        family_id: activeFamilyId,
        member_id: member.id,
        title,
        author,
        status,
        rating: status === "finished" && rating ? rating : null,
        notes,
      })
      .select("id")
      .single();

    if (error || !data) return { success: false, error: error?.message ?? "Failed to save" };

    revalidatePath("/dashboard/book-club");
    return { success: true, id: data.id };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Something went wrong" };
  }
}

export async function updateBook(
  bookId: string,
  updates: { status?: BookStatus; rating?: number | null; notes?: string | null }
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Not authenticated" };

    const { activeFamilyId } = await getActiveFamilyId(supabase);
    if (!activeFamilyId) return { success: false, error: "No active family" };

    const { error } = await supabase
      .from("book_club_books")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", bookId)
      .eq("family_id", activeFamilyId);

    if (error) return { success: false, error: error.message };

    revalidatePath("/dashboard/book-club");
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Something went wrong" };
  }
}

export async function setFamilyPick(bookId: string | null): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Not authenticated" };

    const { activeFamilyId } = await getActiveFamilyId(supabase);
    if (!activeFamilyId) return { success: false, error: "No active family" };

    // Clear existing pick
    await supabase
      .from("book_club_books")
      .update({ is_family_pick: false })
      .eq("family_id", activeFamilyId)
      .eq("is_family_pick", true);

    // Set new pick
    if (bookId) {
      await supabase
        .from("book_club_books")
        .update({ is_family_pick: true })
        .eq("id", bookId)
        .eq("family_id", activeFamilyId);
    }

    revalidatePath("/dashboard/book-club");
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Something went wrong" };
  }
}

export async function deleteBook(bookId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Not authenticated" };

    const { activeFamilyId } = await getActiveFamilyId(supabase);
    if (!activeFamilyId) return { success: false, error: "No active family" };

    const { error } = await supabase
      .from("book_club_books")
      .delete()
      .eq("id", bookId)
      .eq("family_id", activeFamilyId);

    if (error) return { success: false, error: error.message };

    revalidatePath("/dashboard/book-club");
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Something went wrong" };
  }
}
