import { createClient } from "@/src/lib/supabase/server";
import { getActiveFamilyId } from "@/src/lib/family";
import { TEXT_LIMITS, TIME_CONSTANTS } from "@/src/lib/constants";
import { NextResponse } from "next/server";
import JSZip from "jszip";
import { checkHttpRateLimit, strictLimiter } from "@/src/lib/httpRateLimit";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function sanitize(name: string): string {
  return name.replace(/[^a-zA-Z0-9_\- ]/g, "").trim() || "untitled";
}

function memberName(
  members: Map<string, string>,
  id: string | null
): string {
  if (!id) return "Unknown";
  return members.get(id) ?? "Unknown";
}

function formatDate(d: string | null): string {
  if (!d) return "";
  try {
    return new Date(d).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return d;
  }
}

/** Try to fetch a file from a URL. Returns ArrayBuffer or null. */
async function fetchFile(url: string): Promise<ArrayBuffer | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) return null;
    return await res.arrayBuffer();
  } catch {
    return null;
  }
}

function fileExtFromUrl(url: string): string {
  try {
    const pathname = new URL(url).pathname;
    const ext = pathname.split(".").pop()?.toLowerCase();
    if (ext && ext.length <= 5) return `.${ext}`;
  } catch {
    /* ignore */
  }
  return "";
}

// ---------------------------------------------------------------------------
// GET — check export status / get download link
// ---------------------------------------------------------------------------

export async function GET(request: Request) {
  const limited = await checkHttpRateLimit(request, strictLimiter);
  if (limited) return limited;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const { activeFamilyId } = await getActiveFamilyId(supabase);
    if (!activeFamilyId)
      return NextResponse.json({ error: "No active family" }, { status: 400 });

    // Get latest export for this family
    const { data: exportJob } = await supabase
      .from("family_exports")
      .select("*")
      .eq("family_id", activeFamilyId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!exportJob) {
      return NextResponse.json({ export: null });
    }

    // If completed and not expired, generate signed URL
    if (
      exportJob.status === "completed" &&
      exportJob.file_path &&
      exportJob.expires_at &&
      new Date(exportJob.expires_at) > new Date()
    ) {
      const { data: signedUrl } = await supabase.storage
        .from("exports")
        .createSignedUrl(exportJob.file_path, 3600); // 1-hour link

      return NextResponse.json({
        export: {
          ...exportJob,
          download_url: signedUrl?.signedUrl ?? null,
        },
      });
    }

    return NextResponse.json({ export: exportJob });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------------------------
// POST — trigger a new export
// ---------------------------------------------------------------------------

export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const { activeFamilyId } = await getActiveFamilyId(supabase);
    if (!activeFamilyId)
      return NextResponse.json({ error: "No active family" }, { status: 400 });

    // Verify Legacy plan
    const { data: family } = await supabase
      .from("families")
      .select("name, plan_type")
      .eq("id", activeFamilyId)
      .single();

    if (family?.plan_type !== "legacy") {
      return NextResponse.json(
        { error: "Data export is only available on the Legacy plan." },
        { status: 403 }
      );
    }

    // Check for an in-progress export
    const { data: inProgress } = await supabase
      .from("family_exports")
      .select("id, status")
      .eq("family_id", activeFamilyId)
      .in("status", ["pending", "processing"])
      .limit(1)
      .maybeSingle();

    if (inProgress) {
      return NextResponse.json(
        { error: "An export is already in progress." },
        { status: 409 }
      );
    }

    // Create job record
    const { data: job, error: jobErr } = await supabase
      .from("family_exports")
      .insert({
        family_id: activeFamilyId,
        requested_by: user.id,
        status: "processing",
      })
      .select()
      .single();

    if (jobErr || !job)
      return NextResponse.json(
        { error: "Failed to create export job" },
        { status: 500 }
      );

    // --- Build the archive ---
    try {
      const zip = new JSZip();
      const familyName = sanitize(family?.name ?? "family");
      const fid = activeFamilyId;

      // ------ Fetch all data in parallel ------
      const [
        membersRes,
        journalsRes,
        photosRes,
        jVideosRes,
        voiceRes,
        storiesRes,
        recipesRes,
        traditionsRes,
        capsulesRes,
        locationsRes,
      ] = await Promise.all([
        supabase
          .from("family_members")
          .select("id, name, nickname, relationship, birth_date, birth_place, color, contact_email")
          .eq("family_id", fid),
        supabase
          .from("journal_entries")
          .select("id, title, content, location, trip_date, trip_date_end, created_at, updated_at, author_id")
          .eq("family_id", fid)
          .order("created_at", { ascending: true }),
        supabase
          .from("journal_photos")
          .select("id, entry_id, url, caption, sort_order")
          .eq("family_id", fid)
          .order("sort_order", { ascending: true }),
        supabase
          .from("journal_videos")
          .select("id, entry_id, url, duration_seconds, file_size_bytes, sort_order")
          .eq("family_id", fid)
          .order("sort_order", { ascending: true }),
        supabase
          .from("voice_memos")
          .select("id, title, description, audio_url, duration_seconds, recorded_date, family_member_id, recorded_for_id, created_at")
          .eq("family_id", fid)
          .order("created_at", { ascending: true }),
        supabase
          .from("family_stories")
          .select("id, title, content, cover_url, category, published, author_family_member_id, created_at, updated_at")
          .eq("family_id", fid)
          .order("created_at", { ascending: true }),
        supabase
          .from("recipes")
          .select("id, title, story, occasions, ingredients, instructions, taught_by, added_by, created_at")
          .eq("family_id", fid)
          .order("created_at", { ascending: true }),
        supabase
          .from("family_traditions")
          .select("id, title, description, when_it_happens, added_by, sort_order, created_at")
          .eq("family_id", fid)
          .order("sort_order", { ascending: true }),
        supabase
          .from("time_capsules")
          .select("id, title, content, unlock_date, from_family_member_id, to_family_member_id, created_at")
          .eq("family_id", fid)
          .order("created_at", { ascending: true }),
        supabase
          .from("travel_locations")
          .select("id, family_member_id, lat, lng, location_name, country_code, year_visited, trip_date, trip_date_end, notes, is_birth_place, is_place_lived, location_type, location_label, created_at")
          .eq("family_id", fid)
          .order("created_at", { ascending: true }),
      ]);

      const members = membersRes.data ?? [];
      const journals = journalsRes.data ?? [];
      const photos = photosRes.data ?? [];
      const jVideos = jVideosRes.data ?? [];
      const voiceMemos = voiceRes.data ?? [];
      const stories = storiesRes.data ?? [];
      const recipes = recipesRes.data ?? [];
      const traditions = traditionsRes.data ?? [];
      const capsules = capsulesRes.data ?? [];
      const locations = locationsRes.data ?? [];

      // Member lookup map
      const memberMap = new Map<string, string>();
      for (const m of members) memberMap.set(m.id, m.name);

      // Photo lookup by journal entry
      const photosByEntry = new Map<string, typeof photos>();
      for (const p of photos) {
        const list = photosByEntry.get(p.entry_id) ?? [];
        list.push(p);
        photosByEntry.set(p.entry_id, list);
      }

      // Video lookup by journal entry
      const videosByEntry = new Map<string, typeof jVideos>();
      for (const v of jVideos) {
        const list = videosByEntry.get(v.entry_id) ?? [];
        list.push(v);
        videosByEntry.set(v.entry_id, list);
      }

      // ------ README.txt ------
      zip.file(
        "README.txt",
        `${familyName} Nest — Full Data Export
${"=".repeat(40)}

Exported on: ${new Date().toUTCString()}

Archive Structure
-----------------
/journals/          — Journal entries as markdown files
/photos/            — Photos from journal entries (originals)
/videos/            — Videos from journal entries
/voice-memos/       — Voice memo audio files
/stories/           — Family stories as markdown
/recipes/           — Family recipes as markdown
/traditions/        — Family traditions as markdown
/time-capsules/     — Time capsules as markdown (with seal status)
family-tree.json    — Family member data
family-map.json     — All map locations with coordinates
README.txt          — This file

Notes
-----
- Photos are named by journal entry for easy cross-reference.
- Voice memos are named by title and date.
- Time capsules marked as "SEALED" have not yet reached their unlock date.
- This archive was generated from your Family Nest Legacy plan.
- If you have questions, contact support.
`
      );

      // ------ Family Tree JSON ------
      zip.file(
        "family-tree.json",
        JSON.stringify(
          {
            exported_at: new Date().toISOString(),
            family_name: family?.name,
            members: members.map((m) => ({
              id: m.id,
              name: m.name,
              nickname: m.nickname,
              relationship: m.relationship,
              birth_date: m.birth_date,
              birth_place: m.birth_place,
              color: m.color,
              contact_email: m.contact_email,
            })),
          },
          null,
          2
        )
      );

      // ------ Family Map JSON ------
      zip.file(
        "family-map.json",
        JSON.stringify(
          {
            exported_at: new Date().toISOString(),
            locations: locations.map((loc) => ({
              id: loc.id,
              member: memberName(memberMap, loc.family_member_id),
              location_name: loc.location_name,
              lat: loc.lat,
              lng: loc.lng,
              country_code: loc.country_code,
              year_visited: loc.year_visited,
              trip_date: loc.trip_date,
              trip_date_end: loc.trip_date_end,
              notes: loc.notes,
              is_birth_place: loc.is_birth_place,
              is_place_lived: loc.is_place_lived,
              location_type: loc.location_type,
              location_label: loc.location_label,
            })),
          },
          null,
          2
        )
      );

      // ------ Journal entries as markdown + photos ------
      const journalsFolder = zip.folder("journals")!;
      const photosFolder = zip.folder("photos")!;
      const videosFolder = zip.folder("videos")!;
      let photoIndex = 0;
      let videoIndex = 0;

      for (const entry of journals) {
        const author = memberName(memberMap, entry.author_id);
        const dateStr = entry.trip_date
          ? formatDate(entry.trip_date)
          : formatDate(entry.created_at);
        const entryPhotos = photosByEntry.get(entry.id) ?? [];

        let md = `# ${entry.title}\n\n`;
        md += `**Author:** ${author}\n`;
        if (entry.trip_date) md += `**Date:** ${formatDate(entry.trip_date)}`;
        if (entry.trip_date_end)
          md += ` — ${formatDate(entry.trip_date_end)}`;
        md += "\n";
        if (entry.location) md += `**Location:** ${entry.location}\n`;
        md += `**Created:** ${formatDate(entry.created_at)}\n\n`;
        md += `---\n\n`;
        md += entry.content ?? "";
        md += "\n";

        if (entryPhotos.length > 0) {
          md += `\n---\n\n## Photos\n\n`;
          for (const photo of entryPhotos) {
            photoIndex++;
            const ext = fileExtFromUrl(photo.url) || ".jpg";
            const photoFilename = `photo_${String(photoIndex).padStart(4, "0")}${ext}`;

            md += `- ${photoFilename}`;
            if (photo.caption) md += ` — ${photo.caption}`;
            md += "\n";

            // Download photo
            const fileData = await fetchFile(photo.url);
            if (fileData) {
              photosFolder.file(photoFilename, fileData);
            } else {
              // Fallback: include URL reference
              md += `  (Original URL: ${photo.url})\n`;
            }
          }
        }

        // Videos for this entry
        const entryVideos = videosByEntry.get(entry.id) ?? [];
        if (entryVideos.length > 0) {
          md += `\n## Videos\n\n`;
          for (const video of entryVideos) {
            videoIndex++;
            const ext = fileExtFromUrl(video.url) || ".mp4";
            const videoFilename = `video_${String(videoIndex).padStart(4, "0")}${ext}`;
            md += `- ${videoFilename}`;
            if (video.duration_seconds) md += ` (${Math.floor(video.duration_seconds / 60)}:${String(video.duration_seconds % 60).padStart(2, "0")})`;
            md += "\n";

            const fileData = await fetchFile(video.url);
            if (fileData) {
              videosFolder.file(videoFilename, fileData);
            } else {
              md += `  (Original URL: ${video.url})\n`;
            }
          }
        }

        const safeName = sanitize(entry.title).slice(0, TEXT_LIMITS.entryTitle);
        const safeDate = entry.trip_date ?? entry.created_at?.slice(0, 10) ?? "undated";
        journalsFolder.file(`${safeDate}_${safeName}.md`, md);
      }

      // ------ Voice memos ------
      const voiceFolder = zip.folder("voice-memos")!;
      let memoIndex = 0;

      for (const memo of voiceMemos) {
        memoIndex++;
        const ext = fileExtFromUrl(memo.audio_url) || ".webm";
        const recorder = memberName(memberMap, memo.family_member_id);
        const dateStr = memo.recorded_date ?? memo.created_at?.slice(0, 10) ?? "undated";
        const safeName = sanitize(memo.title).slice(0, 50);
        const filename = `${dateStr}_${safeName}${ext}`;

        // Download audio
        const audioData = await fetchFile(memo.audio_url);
        if (audioData) {
          voiceFolder.file(filename, audioData);
        }

        // Also create a sidecar metadata file
        let meta = `# ${memo.title}\n\n`;
        meta += `**Recorded by:** ${recorder}\n`;
        if (memo.recorded_for_id)
          meta += `**For:** ${memberName(memberMap, memo.recorded_for_id)}\n`;
        if (memo.duration_seconds)
          meta += `**Duration:** ${Math.floor(memo.duration_seconds / 60)}:${String(memo.duration_seconds % 60).padStart(2, "0")}\n`;
        meta += `**Date:** ${formatDate(memo.recorded_date ?? memo.created_at)}\n`;
        if (memo.description) meta += `\n${memo.description}\n`;
        if (!audioData) meta += `\n_Audio file URL:_ ${memo.audio_url}\n`;

        voiceFolder.file(`${dateStr}_${safeName}.md`, meta);
      }

      // ------ Stories ------
      const storiesFolder = zip.folder("stories")!;

      for (const story of stories) {
        const author = memberName(memberMap, story.author_family_member_id);
        let md = `# ${story.title}\n\n`;
        md += `**Author:** ${author}\n`;
        md += `**Category:** ${story.category?.replace(/_/g, " ") ?? "—"}\n`;
        md += `**Published:** ${story.published ? "Yes" : "Draft"}\n`;
        md += `**Created:** ${formatDate(story.created_at)}\n`;
        if (story.updated_at !== story.created_at)
          md += `**Updated:** ${formatDate(story.updated_at)}\n`;
        md += `\n---\n\n`;
        md += story.content ?? "";
        md += "\n";

        const safeName = sanitize(story.title).slice(0, TEXT_LIMITS.entryTitle);
        const safeDate = story.created_at?.slice(0, 10) ?? "undated";
        storiesFolder.file(`${safeDate}_${safeName}.md`, md);
      }

      // ------ Recipes ------
      const recipesFolder = zip.folder("recipes")!;

      for (const recipe of recipes) {
        let md = `# ${recipe.title}\n\n`;
        if (recipe.taught_by)
          md += `**Taught by:** ${memberName(memberMap, recipe.taught_by)}\n`;
        if (recipe.added_by)
          md += `**Added by:** ${memberName(memberMap, recipe.added_by)}\n`;
        if (recipe.occasions) md += `**Occasions:** ${recipe.occasions}\n`;
        md += `**Created:** ${formatDate(recipe.created_at)}\n`;

        if (recipe.story) {
          md += `\n## Story\n\n${recipe.story}\n`;
        }
        if (recipe.ingredients) {
          md += `\n## Ingredients\n\n${recipe.ingredients}\n`;
        }
        if (recipe.instructions) {
          md += `\n## Instructions\n\n${recipe.instructions}\n`;
        }

        const safeName = sanitize(recipe.title).slice(0, TEXT_LIMITS.entryTitle);
        recipesFolder.file(`${safeName}.md`, md);
      }

      // ------ Traditions ------
      const traditionsFolder = zip.folder("traditions")!;

      for (const trad of traditions) {
        let md = `# ${trad.title}\n\n`;
        if (trad.when_it_happens)
          md += `**When:** ${trad.when_it_happens}\n`;
        if (trad.added_by)
          md += `**Added by:** ${memberName(memberMap, trad.added_by)}\n`;
        md += `\n---\n\n`;
        md += trad.description ?? "";
        md += "\n";

        const safeName = sanitize(trad.title).slice(0, TEXT_LIMITS.entryTitle);
        traditionsFolder.file(`${safeName}.md`, md);
      }

      // ------ Time Capsules ------
      const capsulesFolder = zip.folder("time-capsules")!;

      for (const cap of capsules) {
        const isSealed = new Date(cap.unlock_date) > new Date();
        const from = memberName(memberMap, cap.from_family_member_id);
        const to = memberName(memberMap, cap.to_family_member_id);

        let md = `# ${cap.title}\n\n`;
        md += `**Status:** ${isSealed ? "SEALED" : "OPENED"}\n`;
        md += `**From:** ${from}\n`;
        md += `**To:** ${to}\n`;
        md += `**Unlock Date:** ${formatDate(cap.unlock_date)}\n`;
        md += `**Created:** ${formatDate(cap.created_at)}\n`;
        md += `\n---\n\n`;

        if (isSealed) {
          md += `_This time capsule is sealed until ${formatDate(cap.unlock_date)}. Contents are included below for archival purposes._\n\n`;
        }
        md += cap.content ?? "";
        md += "\n";

        const safeName = sanitize(cap.title).slice(0, TEXT_LIMITS.entryTitle);
        const status = isSealed ? "sealed" : "opened";
        capsulesFolder.file(`${status}_${safeName}.md`, md);
      }

      // ------ Generate ZIP ------
      const zipBuffer = await zip.generateAsync({
        type: "arraybuffer",
        compression: "DEFLATE",
        compressionOptions: { level: 6 },
      });

      // ------ Upload to Supabase storage ------
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, "-");
      const exportPath = `${activeFamilyId}/${timestamp}_${familyName}.zip`;

      const { error: uploadErr } = await supabase.storage
        .from("exports")
        .upload(exportPath, zipBuffer, {
          contentType: "application/zip",
          upsert: false,
        });

      if (uploadErr) throw new Error(`Upload failed: ${uploadErr.message}`);

      // ------ Update job record ------
      const expiresAt = new Date(Date.now() + TIME_CONSTANTS.exportLinkExpirationMs).toISOString();

      await supabase
        .from("family_exports")
        .update({
          status: "completed",
          file_path: exportPath,
          file_size_bytes: zipBuffer.byteLength,
          expires_at: expiresAt,
          completed_at: new Date().toISOString(),
        })
        .eq("id", job.id);

      // Generate signed download URL
      const { data: signedUrl } = await supabase.storage
        .from("exports")
        .createSignedUrl(exportPath, 3600);

      return NextResponse.json({
        export: {
          id: job.id,
          status: "completed",
          file_size_bytes: zipBuffer.byteLength,
          expires_at: expiresAt,
          download_url: signedUrl?.signedUrl ?? null,
        },
      });
    } catch (buildErr) {
      // Mark job as failed
      await supabase
        .from("family_exports")
        .update({
          status: "failed",
          error_message:
            buildErr instanceof Error ? buildErr.message : "Unknown error",
        })
        .eq("id", job.id);

      return NextResponse.json(
        {
          error:
            buildErr instanceof Error
              ? buildErr.message
              : "Export generation failed",
        },
        { status: 500 }
      );
    }
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
