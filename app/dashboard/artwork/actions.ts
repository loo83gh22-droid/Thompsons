"use server";

import { createClient } from "@/src/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { getActiveFamilyId } from "@/src/lib/family";
import { enforceStorageLimit, addStorageUsage } from "@/src/lib/plans";

export type ArtworkPieceResult = { success: true; id: string } | { success: false; error: string };

export async function createArtworkPiece(formData: FormData): Promise<ArtworkPieceResult> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Not authenticated" };

    const { activeFamilyId } = await getActiveFamilyId(supabase);
    if (!activeFamilyId) return { success: false, error: "No active family" };

    const familyMemberId = formData.get("family_member_id") as string;
    const title = (formData.get("title") as string)?.trim();
    const description = (formData.get("description") as string)?.trim() || null;
    const medium = (formData.get("medium") as string) || null;
    const dateCreated = (formData.get("date_created") as string) || null;
    const ageWhenCreated = formData.get("age_when_created")
      ? parseInt(formData.get("age_when_created") as string, 10)
      : null;

    if (!familyMemberId) return { success: false, error: "Please select a family member." };
    if (!title) return { success: false, error: "Title is required." };

    const { data: piece, error: pieceError } = await supabase
      .from("artwork_pieces")
      .insert({
        family_id: activeFamilyId,
        family_member_id: familyMemberId,
        title,
        description,
        medium: medium || null,
        date_created: dateCreated || null,
        age_when_created: Number.isFinite(ageWhenCreated) ? ageWhenCreated : null,
      })
      .select("id")
      .single();

    if (pieceError || !piece) return { success: false, error: pieceError?.message ?? "Failed to save." };

    // Upload photos (up to 5)
    const allPhotos = formData.getAll("photos") as File[];
    const photos = allPhotos.filter((f) => f.size > 0).slice(0, 5);

    const totalBytes = photos.reduce((s, f) => s + f.size, 0);
    if (totalBytes > 0) {
      try { await enforceStorageLimit(supabase, activeFamilyId, totalBytes); } catch { /* skip photos, don't fail */ }
    }

    for (let i = 0; i < photos.length; i++) {
      const file = photos[i];
      try {
        const ext = file.name.split(".").pop() || "jpg";
        const path = `${piece.id}/${crypto.randomUUID()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("artwork-photos")
          .upload(path, file, { upsert: true });
        if (uploadError) continue;
        await addStorageUsage(supabase, activeFamilyId, file.size);
        await supabase.from("artwork_photos").insert({
          family_id: activeFamilyId,
          piece_id: piece.id,
          url: `/api/storage/artwork-photos/${path}`,
          sort_order: i,
        });
      } catch { /* skip bad photos */ }
    }

    revalidatePath("/dashboard/artwork");
    revalidatePath(`/dashboard/artwork/${familyMemberId}`);
    return { success: true, id: piece.id };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Something went wrong." };
  }
}

export async function updateArtworkPiece(
  pieceId: string,
  formData: FormData
): Promise<ArtworkPieceResult> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Not authenticated" };

    const { activeFamilyId } = await getActiveFamilyId(supabase);
    if (!activeFamilyId) return { success: false, error: "No active family" };

    const title = (formData.get("title") as string)?.trim();
    const description = (formData.get("description") as string)?.trim() || null;
    const medium = (formData.get("medium") as string) || null;
    const dateCreated = (formData.get("date_created") as string) || null;
    const ageWhenCreated = formData.get("age_when_created")
      ? parseInt(formData.get("age_when_created") as string, 10)
      : null;

    if (!title) return { success: false, error: "Title is required." };

    const { error } = await supabase
      .from("artwork_pieces")
      .update({
        title,
        description,
        medium: medium || null,
        date_created: dateCreated || null,
        age_when_created: Number.isFinite(ageWhenCreated) ? ageWhenCreated : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", pieceId)
      .eq("family_id", activeFamilyId);

    if (error) return { success: false, error: error.message };

    // Add any new photos
    const allPhotos = formData.getAll("photos") as File[];
    const photos = allPhotos.filter((f) => f.size > 0).slice(0, 5);

    if (photos.length > 0) {
      const { count } = await supabase
        .from("artwork_photos")
        .select("id", { count: "exact", head: true })
        .eq("piece_id", pieceId);
      const existing = count ?? 0;
      const toAdd = Math.min(photos.length, 5 - existing);

      for (let i = 0; i < toAdd; i++) {
        const file = photos[i];
        try {
          const ext = file.name.split(".").pop() || "jpg";
          const path = `${pieceId}/${crypto.randomUUID()}.${ext}`;
          const { error: uploadError } = await supabase.storage
            .from("artwork-photos")
            .upload(path, file, { upsert: true });
          if (uploadError) continue;
          await addStorageUsage(supabase, activeFamilyId, file.size);
          await supabase.from("artwork_photos").insert({
            family_id: activeFamilyId,
            piece_id: pieceId,
            url: `/api/storage/artwork-photos/${path}`,
            sort_order: existing + i,
          });
        } catch { /* skip */ }
      }
    }

    // Get the piece's member id for revalidation
    const { data: piece } = await supabase
      .from("artwork_pieces")
      .select("family_member_id")
      .eq("id", pieceId)
      .single();

    revalidatePath("/dashboard/artwork");
    if (piece) revalidatePath(`/dashboard/artwork/${piece.family_member_id}`);
    revalidatePath(`/dashboard/artwork/${piece?.family_member_id}/${pieceId}`);
    return { success: true, id: pieceId };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Something went wrong." };
  }
}

export async function deleteArtworkPiece(pieceId: string, memberId: string): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { activeFamilyId } = await getActiveFamilyId(supabase);
  if (!activeFamilyId) throw new Error("No active family");

  const { error } = await supabase
    .from("artwork_pieces")
    .delete()
    .eq("id", pieceId)
    .eq("family_id", activeFamilyId);

  if (error) throw error;

  revalidatePath("/dashboard/artwork");
  revalidatePath(`/dashboard/artwork/${memberId}`);
}

export async function deleteArtworkPhoto(photoId: string, pieceId: string, memberId: string): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { activeFamilyId } = await getActiveFamilyId(supabase);
  if (!activeFamilyId) throw new Error("No active family");

  const { error } = await supabase
    .from("artwork_photos")
    .delete()
    .eq("id", photoId)
    .eq("family_id", activeFamilyId);

  if (error) throw error;

  revalidatePath(`/dashboard/artwork/${memberId}/${pieceId}`);
}
