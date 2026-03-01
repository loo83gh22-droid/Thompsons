"use server";

import { createAdminClient } from "@/src/lib/supabase/admin";
import { createClient } from "@/src/lib/supabase/server";

// ── Auth guard ────────────────────────────────────────────────────────────────

async function verifyAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL;
  if (!user || user.email !== adminEmail) {
    throw new Error("Unauthorized");
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function pathFromUrl(url: string | null | undefined, bucket: string): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    const match = u.pathname.match(
      new RegExp(`/storage/v1/object/public/${bucket}/(.+)$`)
    );
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

// ── Types ─────────────────────────────────────────────────────────────────────

export type MemberRow = {
  id: string;
  name: string;
  role: string;
  familyName: string;
  familyId: string;
};

export type LookupResult =
  | { found: false; error: string }
  | {
      found: true;
      authUserId: string;
      email: string;
      memberRows: MemberRow[];
      isOwnerAnywhere: boolean;
    };

export type ScrubResult = {
  success: boolean;
  message: string;
  details: string[];
};

// ── lookupUser ────────────────────────────────────────────────────────────────

export async function lookupUser(email: string): Promise<LookupResult> {
  await verifyAdmin();

  const admin = createAdminClient();

  // Paginate through auth users to find by email (Supabase has no email filter on listUsers)
  let authUserId: string | null = null;
  let authEmail: string | null = null;
  let page = 1;
  const perPage = 1000;

  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) return { found: false, error: error.message };

    const match = data.users.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase()
    );
    if (match) {
      authUserId = match.id;
      authEmail = match.email ?? email;
      break;
    }
    if (data.users.length < perPage) break; // last page
    page++;
  }

  if (!authUserId) {
    return { found: false, error: "No auth account found with that email." };
  }

  const { data: members } = await admin
    .from("family_members")
    .select("id, name, role, family_id, families(name)")
    .eq("user_id", authUserId);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const memberRows: MemberRow[] = (members ?? []).map((m: any) => ({
    id: m.id,
    name: m.name ?? "(unnamed)",
    role: m.role ?? "unknown",
    familyName: (m.families as { name: string } | null)?.name ?? "Unknown Family",
    familyId: m.family_id,
  }));

  return {
    found: true,
    authUserId,
    email: authEmail!,
    memberRows,
    isOwnerAnywhere: memberRows.some((m) => m.role === "owner"),
  };
}

// ── scrubUser ─────────────────────────────────────────────────────────────────

export async function scrubUser(email: string): Promise<ScrubResult> {
  await verifyAdmin();

  const admin = createAdminClient();
  const log: string[] = [];

  // ── Step 1: Find the auth user ─────────────────────────────────────────────
  let authUserId: string | null = null;
  let page = 1;
  const perPage = 1000;

  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) return { success: false, message: error.message, details: log };

    const match = data.users.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase()
    );
    if (match) {
      authUserId = match.id;
      break;
    }
    if (data.users.length < perPage) break;
    page++;
  }

  if (!authUserId) {
    return {
      success: false,
      message: "No auth account found with that email.",
      details: log,
    };
  }
  log.push(`Found auth user: ${authUserId}`);

  // ── Step 2: Get all family_member IDs ─────────────────────────────────────
  const { data: members } = await admin
    .from("family_members")
    .select("id, avatar_url, family_id")
    .eq("user_id", authUserId);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const memberIds: string[] = (members ?? []).map((m: any) => m.id);
  log.push(`Found ${memberIds.length} family member record(s)`);

  // ── Step 3: Collect storage paths before deleting rows ────────────────────
  const storageDeletes: Record<string, string[]> = {
    "member-photos": [],
    "voice-memos": [],
    "achievements": [],
    "artwork-photos": [],
    "journal-photos": [],
    "journal-videos": [],
  };

  // Avatar photos
  for (const m of members ?? []) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const p = pathFromUrl((m as any).avatar_url, "member-photos");
    if (p) storageDeletes["member-photos"].push(p);
  }

  if (memberIds.length > 0) {
    // Voice memos
    const { data: vms } = await admin
      .from("voice_memos")
      .select("audio_url")
      .in("family_member_id", memberIds);
    for (const vm of vms ?? []) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const p = pathFromUrl((vm as any).audio_url, "voice-memos");
      if (p) storageDeletes["voice-memos"].push(p);
    }

    // Achievements (attachment_url)
    const { data: achs } = await admin
      .from("achievements")
      .select("attachment_url")
      .in("family_member_id", memberIds);
    for (const a of achs ?? []) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const p = pathFromUrl((a as any).attachment_url, "achievements");
      if (p) storageDeletes["achievements"].push(p);
    }

    // Artwork photos (via artwork_pieces -> artwork_photos)
    const { data: artPieces } = await admin
      .from("artwork_pieces")
      .select("id")
      .in("family_member_id", memberIds);
    if (artPieces && artPieces.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pieceIds = (artPieces as any[]).map((p) => p.id);
      const { data: artPhotos } = await admin
        .from("artwork_photos")
        .select("url")
        .in("piece_id", pieceIds);
      for (const ap of artPhotos ?? []) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const p = pathFromUrl((ap as any).url, "artwork-photos");
        if (p) storageDeletes["artwork-photos"].push(p);
      }
    }

    // Journal photos (url column, uploaded_by)
    const { data: jPhotos } = await admin
      .from("journal_photos")
      .select("url")
      .in("uploaded_by", memberIds);
    for (const jp of jPhotos ?? []) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const p = pathFromUrl((jp as any).url, "journal-photos");
      if (p) storageDeletes["journal-photos"].push(p);
    }

    // Journal videos (url column, uploaded_by)
    const { data: jVideos } = await admin
      .from("journal_videos")
      .select("url")
      .in("uploaded_by", memberIds);
    for (const jv of jVideos ?? []) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const p = pathFromUrl((jv as any).url, "journal-videos");
      if (p) storageDeletes["journal-videos"].push(p);
    }
  }

  // ── Step 4: Delete storage files ──────────────────────────────────────────
  for (const [bucket, paths] of Object.entries(storageDeletes)) {
    if (paths.length > 0) {
      const { error } = await admin.storage.from(bucket).remove(paths);
      if (error) log.push(`Warning (storage ${bucket}): ${error.message}`);
      else log.push(`Deleted ${paths.length} file(s) from ${bucket}`);
    }
  }

  // ── Step 5: Delete DB rows in FK-safe order ────────────────────────────────
  if (memberIds.length > 0) {
    // Simple single-column deletes
    const singleColDeletes: Array<{ table: string; column: string }> = [
      { table: "notification_log", column: "family_member_id" },
      { table: "email_campaigns", column: "family_member_id" },
      { table: "family_message_reads", column: "family_member_id" },
      { table: "family_message_recipients", column: "family_member_id" },
      { table: "family_event_invitees", column: "family_member_id" },
      { table: "time_capsule_members", column: "family_member_id" },
      { table: "pet_owners", column: "member_id" },
      { table: "award_members", column: "family_member_id" },
      { table: "journal_perspectives", column: "family_member_id" },
      { table: "travel_locations", column: "family_member_id" },
      { table: "achievements", column: "family_member_id" },
      { table: "family_resumes", column: "family_member_id" },
    ];

    for (const { table, column } of singleColDeletes) {
      const { error } = await admin.from(table).delete().in(column, memberIds);
      if (error) log.push(`Warning (${table}.${column}): ${error.message}`);
    }

    // Artwork (photos first due to FK, then pieces)
    const { data: artPieceIds } = await admin
      .from("artwork_pieces")
      .select("id")
      .in("family_member_id", memberIds);
    if (artPieceIds && artPieceIds.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const ids = (artPieceIds as any[]).map((p) => p.id);
      await admin.from("artwork_photos").delete().in("piece_id", ids);
    }
    await admin.from("artwork_pieces").delete().in("family_member_id", memberIds);

    // Voice memos
    await admin.from("voice_memos").delete().in("family_member_id", memberIds);

    // Member aliases (dual-column)
    await admin.from("member_aliases").delete().in("viewer_member_id", memberIds);
    await admin.from("member_aliases").delete().in("target_member_id", memberIds);

    // Family relationships (dual-column)
    await admin.from("family_relationships").delete().in("member_id", memberIds);
    await admin.from("family_relationships").delete().in("related_id", memberIds);

    // Journal photos (uploaded_by)
    await admin.from("journal_photos").delete().in("uploaded_by", memberIds);

    // Journal videos (uploaded_by)
    await admin.from("journal_videos").delete().in("uploaded_by", memberIds);

    // Journal entries (dual-column; cascade cleans up orphaned photos/videos)
    await admin.from("journal_entries").delete().in("created_by", memberIds);
    await admin.from("journal_entries").delete().in("author_id", memberIds);

    // Family stories (dual-column)
    await admin.from("family_stories").delete().in("author_family_member_id", memberIds);
    await admin.from("family_stories").delete().in("created_by", memberIds);

    // Recipes (dual-column)
    await admin.from("recipes").delete().in("added_by", memberIds);
    await admin.from("recipes").delete().in("taught_by", memberIds);

    // Traditions, favourites, messages, events
    await admin.from("family_traditions").delete().in("added_by", memberIds);
    await admin.from("favourites").delete().in("added_by", memberIds);
    await admin.from("family_messages").delete().in("sender_id", memberIds);
    await admin.from("family_events").delete().in("created_by", memberIds);

    // Time capsules (dual-column)
    await admin.from("time_capsules").delete().in("from_family_member_id", memberIds);
    await admin.from("time_capsules").delete().in("to_family_member_id", memberIds);

    // Feedback
    await admin.from("feedback").delete().in("member_id", memberIds);

    log.push(`Deleted content rows for ${memberIds.length} member(s)`);
  }

  // ── Step 6: Auth user_id direct references ────────────────────────────────
  await admin.from("feedback").delete().eq("user_id", authUserId);
  await admin.from("nest_keepers").delete().eq("designated_by", authUserId);
  await admin.from("family_exports").delete().eq("requested_by", authUserId);

  // ── Step 7: Email-based references ────────────────────────────────────────
  await admin.from("notification_log").delete().eq("email_address", email);
  await admin.from("nest_keepers").delete().eq("email", email);

  // ── Step 8: Delete family_members ─────────────────────────────────────────
  await admin.from("family_members").delete().eq("user_id", authUserId);
  log.push("Deleted family_members records");

  // ── Step 9: Delete auth user ───────────────────────────────────────────────
  const { error: authErr } = await admin.auth.admin.deleteUser(authUserId);
  if (authErr) {
    return {
      success: false,
      message: `DB cleaned but auth deletion failed: ${authErr.message}`,
      details: log,
    };
  }
  log.push("Deleted auth.users record");

  return {
    success: true,
    message: `${email} has been fully scrubbed from the system.`,
    details: log,
  };
}
