import { createAdminClient } from "@/src/lib/supabase/admin";
import { NextResponse } from "next/server";

/**
 * POST /api/admin/repair-shared-photos
 * One-time repair: copies missing photos from a source journal entry to a
 * target journal entry (both in the journal-photos bucket via storage.copy).
 *
 * Protected by ADMIN_SECRET env var. Delete this route after use.
 */
export async function POST(request: Request) {
  const secret = request.headers.get("x-admin-secret");
  if (!secret || secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { sourceEntryId, targetEntryId } = await request.json() as {
    sourceEntryId: string;
    targetEntryId: string;
  };

  if (!sourceEntryId || !targetEntryId) {
    return NextResponse.json({ error: "sourceEntryId and targetEntryId required" }, { status: 400 });
  }

  const admin = createAdminClient();

  // Fetch source photos
  const { data: sourcePhotos, error: fetchError } = await admin
    .from("journal_photos")
    .select("url, caption, sort_order, file_size_bytes")
    .eq("entry_id", sourceEntryId)
    .order("sort_order");

  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 });

  // Get target entry's author (for uploaded_by)
  const { data: targetEntry } = await admin
    .from("journal_entries")
    .select("created_by, family_id")
    .eq("id", targetEntryId)
    .single();

  const results = [];
  for (const photo of sourcePhotos ?? []) {
    const storagePath = photo.url.replace("/api/storage/journal-photos/", "");
    if (!storagePath || storagePath === photo.url) {
      results.push({ url: photo.url, status: "skipped: unrecognised URL format" });
      continue;
    }

    const ext = storagePath.split(".").pop() ?? "jpg";
    const newPath = `${crypto.randomUUID()}.${ext}`;

    const { error: copyError } = await admin.storage
      .from("journal-photos")
      .copy(storagePath, newPath);

    if (copyError) {
      results.push({ url: photo.url, status: `copy error: ${copyError.message}` });
      continue;
    }

    const newProxyUrl = `/api/storage/journal-photos/${newPath}`;
    const { error: insertError } = await admin.from("journal_photos").insert({
      entry_id: targetEntryId,
      url: newProxyUrl,
      caption: photo.caption,
      sort_order: photo.sort_order ?? 0,
      uploaded_by: targetEntry?.created_by ?? null,
      file_size_bytes: photo.file_size_bytes ?? 0,
      family_id: targetEntry?.family_id ?? null,
    });

    results.push({
      url: photo.url,
      newUrl: newProxyUrl,
      status: insertError ? `insert error: ${insertError.message}` : "ok",
    });
  }

  return NextResponse.json({ results });
}
