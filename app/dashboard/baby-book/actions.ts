"use server";

import { createClient } from "@/src/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { getActiveFamilyId } from "@/src/lib/family";
import { addStorageUsage, subtractStorageUsage } from "@/src/lib/plans";

type UploadedPhotoMeta = {
  url: string;
  storagePath: string;
  fileSize: number;
};

export type BabyBookResult = { success: true; id: string } | { success: false; error: string };

export async function createBabyBookYear(formData: FormData): Promise<BabyBookResult> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Not authenticated" };

    const { activeFamilyId } = await getActiveFamilyId(supabase);
    if (!activeFamilyId) return { success: false, error: "No active family" };

    const familyMemberId = formData.get("family_member_id") as string;
    const year = parseInt(formData.get("year") as string, 10);
    const note = (formData.get("note") as string)?.trim() || null;

    if (!familyMemberId) return { success: false, error: "Please select a family member." };
    if (!Number.isFinite(year) || year < 1900 || year > new Date().getFullYear()) {
      return { success: false, error: "Please select a valid year." };
    }

    // Check uniqueness
    const { count } = await supabase
      .from("baby_book_years")
      .select("id", { count: "exact", head: true })
      .eq("family_member_id", familyMemberId)
      .eq("year", year);
    if ((count ?? 0) > 0) return { success: false, error: `Year ${year} already exists for this child.` };

    const { data: entry, error: entryError } = await supabase
      .from("baby_book_years")
      .insert({
        family_id: activeFamilyId,
        family_member_id: familyMemberId,
        year,
        note,
      })
      .select("id")
      .single();

    if (entryError || !entry) return { success: false, error: entryError?.message ?? "Failed to save." };

    // Photos already uploaded client-side — just metadata
    const photosJson = formData.get("photos_meta") as string | null;
    const photosMeta: UploadedPhotoMeta[] = photosJson ? JSON.parse(photosJson) : [];

    for (let i = 0; i < Math.min(photosMeta.length, 5); i++) {
      const meta = photosMeta[i];
      const { error: photoErr } = await supabase.from("baby_book_photos").insert({
        family_id: activeFamilyId,
        year_id: entry.id,
        url: meta.url,
        sort_order: i,
        file_size_bytes: meta.fileSize,
      });
      if (photoErr) {
        await supabase.storage.from("baby-book-photos").remove([meta.storagePath]);
      } else {
        await addStorageUsage(supabase, activeFamilyId, meta.fileSize);
      }
    }

    revalidatePath("/dashboard/baby-book");
    revalidatePath(`/dashboard/baby-book/${familyMemberId}`);
    return { success: true, id: entry.id };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Something went wrong." };
  }
}

export async function updateBabyBookYear(
  yearId: string,
  formData: FormData
): Promise<BabyBookResult> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Not authenticated" };

    const { activeFamilyId } = await getActiveFamilyId(supabase);
    if (!activeFamilyId) return { success: false, error: "No active family" };

    const note = (formData.get("note") as string)?.trim() || null;

    const { error } = await supabase
      .from("baby_book_years")
      .update({ note, updated_at: new Date().toISOString() })
      .eq("id", yearId)
      .eq("family_id", activeFamilyId);

    if (error) return { success: false, error: error.message };

    // Add any new photos
    const photosJson = formData.get("photos_meta") as string | null;
    const photosMeta: UploadedPhotoMeta[] = photosJson ? JSON.parse(photosJson) : [];

    if (photosMeta.length > 0) {
      const { count } = await supabase
        .from("baby_book_photos")
        .select("id", { count: "exact", head: true })
        .eq("year_id", yearId);
      const existing = count ?? 0;
      const toAdd = Math.min(photosMeta.length, 5 - existing);

      for (let i = 0; i < toAdd; i++) {
        const meta = photosMeta[i];
        const { error: photoErr } = await supabase.from("baby_book_photos").insert({
          family_id: activeFamilyId,
          year_id: yearId,
          url: meta.url,
          sort_order: existing + i,
          file_size_bytes: meta.fileSize,
        });
        if (photoErr) {
          await supabase.storage.from("baby-book-photos").remove([meta.storagePath]);
        } else {
          await addStorageUsage(supabase, activeFamilyId, meta.fileSize);
        }
      }
    }

    // Get the member id for revalidation
    const { data: entry } = await supabase
      .from("baby_book_years")
      .select("family_member_id")
      .eq("id", yearId)
      .single();

    revalidatePath("/dashboard/baby-book");
    if (entry) revalidatePath(`/dashboard/baby-book/${entry.family_member_id}`);
    revalidatePath(`/dashboard/baby-book/${entry?.family_member_id}/${yearId}`);
    return { success: true, id: yearId };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Something went wrong." };
  }
}

export async function deleteBabyBookYear(yearId: string, memberId: string): Promise<{ error?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Not authenticated" };

    const { activeFamilyId } = await getActiveFamilyId(supabase);
    if (!activeFamilyId) return { error: "No active family" };

    // Fetch photos for storage cleanup
    const { data: photos } = await supabase
      .from("baby_book_photos")
      .select("url, file_size_bytes")
      .eq("year_id", yearId)
      .eq("family_id", activeFamilyId);

    const { error } = await supabase
      .from("baby_book_years")
      .delete()
      .eq("id", yearId)
      .eq("family_id", activeFamilyId);

    if (error) return { error: error.message };

    // Clean up storage
    for (const photo of photos ?? []) {
      if (photo.url) {
        const storagePath = photo.url.replace("/api/storage/baby-book-photos/", "");
        await supabase.storage.from("baby-book-photos").remove([storagePath]);
      }
      if (photo.file_size_bytes && photo.file_size_bytes > 0) {
        await subtractStorageUsage(supabase, activeFamilyId, photo.file_size_bytes);
      }
    }

    revalidatePath("/dashboard/baby-book");
    revalidatePath(`/dashboard/baby-book/${memberId}`);
    return {};
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Something went wrong" };
  }
}

export async function deleteBabyBookPhoto(
  photoId: string,
  yearId: string,
  memberId: string
): Promise<{ error?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Not authenticated" };

    const { activeFamilyId } = await getActiveFamilyId(supabase);
    if (!activeFamilyId) return { error: "No active family" };

    const { data: photo } = await supabase
      .from("baby_book_photos")
      .select("url, file_size_bytes")
      .eq("id", photoId)
      .eq("family_id", activeFamilyId)
      .single();

    const { error } = await supabase
      .from("baby_book_photos")
      .delete()
      .eq("id", photoId)
      .eq("family_id", activeFamilyId);

    if (error) return { error: error.message };

    if (photo?.url) {
      const storagePath = photo.url.replace("/api/storage/baby-book-photos/", "");
      await supabase.storage.from("baby-book-photos").remove([storagePath]);
    }
    if (photo?.file_size_bytes && photo.file_size_bytes > 0) {
      await subtractStorageUsage(supabase, activeFamilyId, photo.file_size_bytes);
    }

    revalidatePath(`/dashboard/baby-book/${memberId}/${yearId}`);
    revalidatePath(`/dashboard/baby-book/${memberId}`);
    return {};
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Something went wrong" };
  }
}
