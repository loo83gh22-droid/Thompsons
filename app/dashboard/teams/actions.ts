"use server";

import { createClient } from "@/src/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { getActiveFamilyId } from "@/src/lib/family";
import { findOrCreateLocationCluster } from "@/src/lib/locationClustering";
import { addStorageUsage, subtractStorageUsage } from "@/src/lib/plans";

export type TeamResult = { success: true; id: string } | { success: false; error: string };

type TeamMemberInput = { memberId: string; role: string };

// ── Create ────────────────────────────────────────────────────────────────────

export async function createTeam(formData: FormData): Promise<TeamResult> {
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

    const name = (formData.get("name") as string)?.trim();
    const sport_or_activity = (formData.get("sport_or_activity") as string)?.trim();
    if (!name) return { success: false, error: "Team name is required." };
    if (!sport_or_activity) return { success: false, error: "Sport or activity is required." };

    const season = (formData.get("season") as string)?.trim() || null;
    const yearRaw = (formData.get("year") as string)?.trim();
    const year = yearRaw ? parseInt(yearRaw, 10) : null;
    const city = (formData.get("city") as string)?.trim() || null;
    const description = (formData.get("description") as string)?.trim() || null;

    // Parse member assignments: JSON array [{memberId, role}]
    let teamMembers: TeamMemberInput[] = [];
    try {
      teamMembers = JSON.parse((formData.get("team_members") as string) || "[]");
    } catch { /* ignore */ }

    const { data: team, error: teamError } = await supabase
      .from("teams")
      .insert({
        family_id: activeFamilyId,
        name,
        sport_or_activity,
        season,
        year,
        city,
        description,
        created_by: myMember?.id || null,
      })
      .select("id")
      .single();

    if (teamError || !team?.id) {
      return { success: false, error: teamError?.message || "Failed to save team." };
    }

    // Insert member junction rows
    if (teamMembers.length > 0) {
      await supabase.from("team_members").insert(
        teamMembers.map(({ memberId, role }) => ({
          team_id: team.id,
          family_member_id: memberId,
          role: ["Player", "Coach", "Manager", "Supporter"].includes(role) ? role : "Player",
        }))
      );
    }

    // Geocode city → map pin
    if (city) {
      await _upsertMapPin(supabase, activeFamilyId, team.id, city, year, teamMembers);
    }

    revalidatePath("/dashboard/teams");
    revalidatePath("/dashboard/map");
    return { success: true, id: team.id };
  } catch (err) {
    console.error("[createTeam]", err);
    return { success: false, error: "Something went wrong." };
  }
}

// ── Register photo (called after client-side upload) ─────────────────────────

export async function registerTeamPhoto(
  teamId: string,
  storagePath: string,
  fileSize: number
): Promise<string | null> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { activeFamilyId } = await getActiveFamilyId(supabase);
    if (!activeFamilyId) return null;

    const { data: myMember } = await supabase
      .from("family_members")
      .select("id")
      .eq("user_id", user.id)
      .eq("family_id", activeFamilyId)
      .single();

    // Count existing photos to set sort_order
    const { count } = await supabase
      .from("team_photos")
      .select("id", { count: "exact", head: true })
      .eq("team_id", teamId);

    const url = `/api/storage/team-photos/${storagePath}`;
    const { data: photo, error } = await supabase
      .from("team_photos")
      .insert({
        team_id: teamId,
        family_id: activeFamilyId,
        url,
        sort_order: count ?? 0,
        file_size_bytes: fileSize,
        uploaded_by: myMember?.id || null,
      })
      .select("id")
      .single();

    if (error) {
      console.error("[registerTeamPhoto]", error.message);
      return null;
    }

    await addStorageUsage(supabase, activeFamilyId, fileSize);
    revalidatePath(`/dashboard/teams/${teamId}`);
    return photo?.id ?? null;
  } catch (err) {
    console.error("[registerTeamPhoto]", err);
    return null;
  }
}

// ── Set cover photo ───────────────────────────────────────────────────────────

export async function setTeamCoverPhoto(teamId: string, photoId: string): Promise<void> {
  try {
    const supabase = await createClient();
    await supabase.from("teams").update({ cover_photo_id: photoId }).eq("id", teamId);
    revalidatePath(`/dashboard/teams/${teamId}`);
    revalidatePath("/dashboard/teams");
  } catch (err) {
    console.error("[setTeamCoverPhoto]", err);
  }
}

// ── Update ────────────────────────────────────────────────────────────────────

export async function updateTeam(teamId: string, formData: FormData): Promise<TeamResult> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Not authenticated" };

    const { activeFamilyId } = await getActiveFamilyId(supabase);
    if (!activeFamilyId) return { success: false, error: "No active family" };

    const name = (formData.get("name") as string)?.trim();
    const sport_or_activity = (formData.get("sport_or_activity") as string)?.trim();
    if (!name) return { success: false, error: "Team name is required." };
    if (!sport_or_activity) return { success: false, error: "Sport or activity is required." };

    const season = (formData.get("season") as string)?.trim() || null;
    const yearRaw = (formData.get("year") as string)?.trim();
    const year = yearRaw ? parseInt(yearRaw, 10) : null;
    const city = (formData.get("city") as string)?.trim() || null;
    const description = (formData.get("description") as string)?.trim() || null;

    let teamMembers: TeamMemberInput[] = [];
    try {
      teamMembers = JSON.parse((formData.get("team_members") as string) || "[]");
    } catch { /* ignore */ }

    const { error: updateError } = await supabase
      .from("teams")
      .update({ name, sport_or_activity, season, year, city, description, updated_at: new Date().toISOString() })
      .eq("id", teamId)
      .eq("family_id", activeFamilyId);

    if (updateError) return { success: false, error: updateError.message };

    // Replace member assignments
    await supabase.from("team_members").delete().eq("team_id", teamId);
    if (teamMembers.length > 0) {
      await supabase.from("team_members").insert(
        teamMembers.map(({ memberId, role }) => ({
          team_id: teamId,
          family_member_id: memberId,
          role: ["Player", "Coach", "Manager", "Supporter"].includes(role) ? role : "Player",
        }))
      );
    }

    // Update map pin: remove old, add new if city provided
    await supabase.from("travel_locations").delete().eq("team_id", teamId).eq("family_id", activeFamilyId);
    if (city) {
      await _upsertMapPin(supabase, activeFamilyId, teamId, city, year, teamMembers);
    }

    revalidatePath("/dashboard/teams");
    revalidatePath(`/dashboard/teams/${teamId}`);
    revalidatePath("/dashboard/map");
    return { success: true, id: teamId };
  } catch (err) {
    console.error("[updateTeam]", err);
    return { success: false, error: "Something went wrong." };
  }
}

// ── Delete ────────────────────────────────────────────────────────────────────

export async function deleteTeam(teamId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Not authenticated" };

    const { activeFamilyId } = await getActiveFamilyId(supabase);
    if (!activeFamilyId) return { success: false, error: "No active family" };

    // Fetch photos to delete from storage + subtract storage
    const { data: photos } = await supabase
      .from("team_photos")
      .select("url, file_size_bytes")
      .eq("team_id", teamId);

    if (photos && photos.length > 0) {
      const paths = photos
        .map((p) => p.url.replace("/api/storage/team-photos/", ""))
        .filter(Boolean);
      if (paths.length > 0) {
        await supabase.storage.from("team-photos").remove(paths);
      }
      const totalBytes = photos.reduce((s, p) => s + (p.file_size_bytes ?? 0), 0);
      if (totalBytes > 0) await subtractStorageUsage(supabase, activeFamilyId, totalBytes);
    }

    // Remove map pin
    await supabase.from("travel_locations").delete().eq("team_id", teamId).eq("family_id", activeFamilyId);

    // Delete team (cascades to team_members, team_photos)
    const { error } = await supabase
      .from("teams")
      .delete()
      .eq("id", teamId)
      .eq("family_id", activeFamilyId);

    if (error) return { success: false, error: error.message };

    revalidatePath("/dashboard/teams");
    revalidatePath("/dashboard/map");
    return { success: true };
  } catch (err) {
    console.error("[deleteTeam]", err);
    return { success: false, error: "Something went wrong." };
  }
}

// ── Delete single photo ───────────────────────────────────────────────────────

export async function deleteTeamPhoto(
  photoId: string,
  teamId: string
): Promise<{ success: boolean }> {
  try {
    const supabase = await createClient();
    const { activeFamilyId } = await getActiveFamilyId(supabase);
    if (!activeFamilyId) return { success: false };

    const { data: photo } = await supabase
      .from("team_photos")
      .select("url, file_size_bytes, team_id")
      .eq("id", photoId)
      .single();

    if (!photo) return { success: false };

    const storagePath = photo.url.replace("/api/storage/team-photos/", "");
    await supabase.storage.from("team-photos").remove([storagePath]);
    await supabase.from("team_photos").delete().eq("id", photoId);

    if (photo.file_size_bytes) {
      await subtractStorageUsage(supabase, activeFamilyId, photo.file_size_bytes);
    }

    // If this was the cover photo, clear it
    const { data: team } = await supabase
      .from("teams")
      .select("cover_photo_id")
      .eq("id", teamId)
      .single();
    if (team?.cover_photo_id === photoId) {
      // Assign next available photo as cover
      const { data: nextPhoto } = await supabase
        .from("team_photos")
        .select("id")
        .eq("team_id", teamId)
        .neq("id", photoId)
        .order("sort_order")
        .limit(1)
        .single();
      await supabase
        .from("teams")
        .update({ cover_photo_id: nextPhoto?.id ?? null })
        .eq("id", teamId);
    }

    revalidatePath(`/dashboard/teams/${teamId}`);
    revalidatePath("/dashboard/teams");
    return { success: true };
  } catch (err) {
    console.error("[deleteTeamPhoto]", err);
    return { success: false };
  }
}

// ── Internal: geocode city and upsert map pin ─────────────────────────────────

async function _upsertMapPin(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  familyId: string,
  teamId: string,
  city: string,
  year: number | null,
  teamMembers: TeamMemberInput[]
) {
  try {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    let lat = 0;
    let lng = 0;
    let countryCode: string | null = null;

    let googleSucceeded = false;
    if (apiKey) {
      const geocodeRes = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(city)}&key=${apiKey}`
      );
      if (!geocodeRes.ok) throw new Error(`Google geocode HTTP ${geocodeRes.status}`);
      const geocode = await geocodeRes.json();
      if (geocode.status === "OK" && geocode.results?.[0]) {
        const result = geocode.results[0];
        lat = result.geometry.location.lat;
        lng = result.geometry.location.lng;
        const countryComp = result.address_components?.find((c: { types: string[] }) =>
          c.types.includes("country")
        );
        countryCode = countryComp?.short_name?.toUpperCase() ?? null;
        googleSucceeded = true;
      }
    }

    if (!googleSucceeded) {
      const geocodeRes = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&q=${encodeURIComponent(city)}&limit=1`,
        { headers: { "User-Agent": "FamilyNest/1.0" } }
      );
      if (!geocodeRes.ok) throw new Error(`Nominatim HTTP ${geocodeRes.status}`);
      const geocode = await geocodeRes.json();
      const result = geocode[0];
      lat = result?.lat ? parseFloat(result.lat) : 0;
      lng = result?.lon ? parseFloat(result.lon) : 0;
      countryCode = result?.address?.country_code?.toUpperCase() ?? null;
    }

    if (!lat || !lng) return;

    const date = year ? new Date(`${year}-01-01`) : new Date();
    const locationClusterId = await findOrCreateLocationCluster(supabase, familyId, {
      latitude: lat,
      longitude: lng,
      location_name: city,
      date,
    });

    const firstMemberId = teamMembers[0]?.memberId ?? null;
    const { data: travelLoc } = await supabase
      .from("travel_locations")
      .insert({
        family_id: familyId,
        family_member_id: firstMemberId,
        lat,
        lng,
        location_name: city,
        year_visited: year,
        country_code: countryCode,
        location_type: "memorable_event",
        location_cluster_id: locationClusterId,
        team_id: teamId,
      })
      .select("id")
      .single();

    if (travelLoc?.id && teamMembers.length > 0) {
      await supabase.from("travel_location_members").insert(
        teamMembers.map(({ memberId }) => ({
          travel_location_id: travelLoc.id,
          family_member_id: memberId,
        }))
      );
    }
  } catch (err) {
    console.error("[_upsertMapPin for team]", err);
    // Non-fatal — team is saved even if map pin fails
  }
}
