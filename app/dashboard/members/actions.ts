"use server";

import { createClient } from "@/src/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { Resend } from "resend";
import { getActiveFamilyId, getActiveFamilyName } from "@/src/lib/family";
import { ensureBirthdayEventForMember } from "@/app/dashboard/events/actions";
import { detectRoleFromBirthDate, type MemberRole } from "@/src/lib/roles";
import crypto from "crypto";

/** Send invite email (server-only; no public API). */
async function sendInviteEmail(to: string, name: string, familyName: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;
  const resend = new Resend(apiKey);
  const from = process.env.RESEND_FROM_EMAIL || "Thompsons <onboarding@resend.dev>";
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    (typeof process.env.VERCEL_URL === "string" ? `https://${process.env.VERCEL_URL}` : null);
  const signupUrl = baseUrl ? `${baseUrl}/login` : null;
  const safeName = (name || "").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const safeFamily = (familyName || "Our Family").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  await resend.emails.send({
    from,
    to: to.trim(),
    subject: `You've been added to ${safeFamily}!`,
    html: `
      <h2>You've been added to ${safeFamily}</h2>
      <p>Hi${safeName ? ` ${safeName}` : ""},</p>
      <p>Someone has added you to their family on Our Family Nest. Sign up to join and see photos, memories, and more.</p>
      ${signupUrl ? `<p><a href="${signupUrl}" style="display: inline-block; background: #333; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px;">Sign up to join</a></p>` : ""}
      <p style="margin-top: 24px; color: #888; font-size: 12px;">If you didn't expect this, you can ignore this email.</p>
    `,
  });
}

export async function addFamilyMember(
  name: string,
  relationship: string,
  email: string,
  birthDate: string,
  birthPlace: string,
  nickname: string | null = null,
  avatarUrl: string | null = null
): Promise<{ id?: string; birthdayEventAdded?: boolean }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { activeFamilyId } = await getActiveFamilyId(supabase);
  if (!activeFamilyId) throw new Error("No active family");

  // Auto-detect role from birth date
  const detectedRole = detectRoleFromBirthDate(birthDate?.trim() || null);
  const role = detectedRole ?? "adult";

  const { data: member, error } = await supabase
    .from("family_members")
    .insert({
      family_id: activeFamilyId,
      name: name.trim(),
      relationship: relationship.trim() || null,
      contact_email: email.trim() || null,
      birth_date: birthDate?.trim() || null,
      birth_place: birthPlace?.trim() || null,
      nickname: nickname?.trim() || null,
      avatar_url: avatarUrl?.trim() || null,
      role,
    })
    .select("id")
    .single();

  if (error) {
    const msg = error.message || "";
    if (msg.includes("birth_date") || msg.includes("birth_place") || msg.includes("nickname") || msg.includes("column") || msg.includes("does not exist"))
      throw new Error("Run migrations 022 and 039 in Supabase SQL Editor (birth date/place and nickname support).");
    throw error;
  }

  if (member && birthPlace?.trim()) {
    try {
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
      let lat = 0;
      let lng = 0;
      let countryCode: string | null = null;

      if (apiKey) {
        const geocodeRes = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(birthPlace.trim())}&key=${apiKey}`
        );
        const geocode = await geocodeRes.json();
        if (geocode.status === "OK" && geocode.results?.[0]) {
          const result = geocode.results[0];
          lat = result.geometry.location.lat;
          lng = result.geometry.location.lng;
          const countryComp = result.address_components?.find((c: { types: string[] }) =>
            c.types.includes("country")
          );
          countryCode = countryComp?.short_name?.toUpperCase() ?? null;
        }
      } else {
        const geocodeRes = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&q=${encodeURIComponent(birthPlace.trim())}&limit=1`,
          { headers: { "User-Agent": "Thompsons-Family-Site/1.0" } }
        );
        const geocode = await geocodeRes.json();
        const result = geocode[0];
        lat = result?.lat ? parseFloat(result.lat) : 0;
        lng = result?.lon ? parseFloat(result.lon) : 0;
        countryCode = result?.address?.country_code?.toUpperCase() ?? null;
      }

      if (lat && lng) {
        const yearVisited = birthDate ? new Date(birthDate + "T12:00:00").getFullYear() : null;
        await supabase.from("travel_locations").insert({
          family_id: activeFamilyId,
          family_member_id: member.id,
          lat,
          lng,
          location_name: birthPlace.trim(),
          year_visited: yearVisited,
          trip_date: birthDate || null,
          notes: "Birth place",
          country_code: countryCode,
          is_birth_place: true,
        });
      }
    } catch {
      // Geocoding failed
    }
  }

  // Send invite email when adding a member with an email (server-only, no public API)
  const trimmedEmail = email?.trim();
  if (trimmedEmail) {
    try {
      const familyName = await getActiveFamilyName(supabase);
      await sendInviteEmail(trimmedEmail, name.trim(), familyName);
    } catch {
      // Non-blocking
    }
  }

  let birthdayEventAdded = false;
  if (member && birthDate?.trim()) {
    const { added } = await ensureBirthdayEventForMember(
      member.id,
      name.trim(),
      birthDate.trim()
    );
    birthdayEventAdded = added;
  }

  revalidatePath("/dashboard/members");
  revalidatePath("/dashboard/our-family");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/map");
  return { id: member?.id, birthdayEventAdded };
}

export async function updateFamilyMember(
  id: string,
  name: string,
  relationship: string,
  email: string,
  birthDate: string,
  birthPlace: string,
  nickname: string | null = null,
  avatarUrl: string | null = null
): Promise<{ birthdayEventAdded?: boolean }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("family_members")
    .update({
      name: name.trim(),
      relationship: relationship.trim() || null,
      contact_email: email.trim() || null,
      birth_date: birthDate?.trim() || null,
      birth_place: birthPlace?.trim() || null,
      nickname: nickname?.trim() || null,
      avatar_url: avatarUrl?.trim() || null,
    })
    .eq("id", id);

  if (error) {
    const msg = error.message || "";
    if (msg.includes("birth_date") || msg.includes("birth_place") || msg.includes("nickname") || msg.includes("column") || msg.includes("does not exist"))
      throw new Error("Run migrations 022 and 039 in Supabase SQL Editor (birth date/place and nickname support).");
    throw error;
  }

  // Update map pin for birth place
  await supabase
    .from("travel_locations")
    .delete()
    .eq("family_member_id", id)
    .eq("is_birth_place", true);

  if (birthPlace?.trim()) {
    try {
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
      let lat = 0;
      let lng = 0;
      let countryCode: string | null = null;

      if (apiKey) {
        const geocodeRes = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(birthPlace.trim())}&key=${apiKey}`
        );
        const geocode = await geocodeRes.json();
        if (geocode.status === "OK" && geocode.results?.[0]) {
          const result = geocode.results[0];
          lat = result.geometry.location.lat;
          lng = result.geometry.location.lng;
          const countryComp = result.address_components?.find((c: { types: string[] }) =>
            c.types.includes("country")
          );
          countryCode = countryComp?.short_name?.toUpperCase() ?? null;
        }
      } else {
        const geocodeRes = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&q=${encodeURIComponent(birthPlace.trim())}&limit=1`,
          { headers: { "User-Agent": "Thompsons-Family-Site/1.0" } }
        );
        const geocode = await geocodeRes.json();
        const result = geocode[0];
        lat = result?.lat ? parseFloat(result.lat) : 0;
        lng = result?.lon ? parseFloat(result.lon) : 0;
        countryCode = result?.address?.country_code?.toUpperCase() ?? null;
      }

      if (lat && lng) {
        const yearVisited = birthDate ? new Date(birthDate + "T12:00:00").getFullYear() : null;
        const { activeFamilyId } = await getActiveFamilyId(supabase);
        await supabase.from("travel_locations").insert({
          family_id: activeFamilyId ?? undefined,
          family_member_id: id,
          lat,
          lng,
          location_name: birthPlace.trim(),
          year_visited: yearVisited,
          trip_date: birthDate || null,
          notes: "Birth place",
          country_code: countryCode,
          is_birth_place: true,
        });
      }
    } catch {
      // Geocoding failed - birth place saved on member, just no map pin
    }
  }

  // Send invite email when adding/updating email on a member who hasn't signed up yet
  const trimmedEmail = email?.trim();
  if (trimmedEmail) {
    const { data: memberRow } = await supabase
      .from("family_members")
      .select("user_id")
      .eq("id", id)
      .single();
    if (memberRow && !memberRow.user_id) {
      try {
        const familyName = await getActiveFamilyName(supabase);
        await sendInviteEmail(trimmedEmail, name.trim(), familyName);
      } catch {
        // Non-blocking
      }
    }
  }

  let birthdayEventAdded = false;
  if (!error && birthDate?.trim()) {
    const { added } = await ensureBirthdayEventForMember(
      id,
      name.trim(),
      birthDate.trim()
    );
    birthdayEventAdded = added;
  }

  revalidatePath("/dashboard/members");
  revalidatePath("/dashboard/our-family");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/map");
  return { birthdayEventAdded };
}

export async function deleteFamilyMember(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Prevent deleting the family owner
  const { data: target } = await supabase
    .from("family_members")
    .select("role")
    .eq("id", id)
    .single();
  if (target?.role === "owner") throw new Error("Cannot remove the account owner.");

  // Only owner can delete members
  const { activeFamilyId } = await getActiveFamilyId(supabase);
  const { data: currentMember } = await supabase
    .from("family_members")
    .select("role")
    .eq("user_id", user.id)
    .eq("family_id", activeFamilyId)
    .single();
  if (currentMember?.role !== "owner") throw new Error("Only the account owner can remove members.");

  const { error } = await supabase.from("family_members").delete().eq("id", id);

  if (error) throw error;
  revalidatePath("/dashboard/members");
  revalidatePath("/dashboard/our-family");
  revalidatePath("/dashboard");
}

/** Change a family member's role. Only the owner can do this. */
export async function changeMemberRole(
  memberId: string,
  newRole: MemberRole
): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { activeFamilyId } = await getActiveFamilyId(supabase);
  if (!activeFamilyId) throw new Error("No active family");

  // Verify current user is owner
  const { data: currentMember } = await supabase
    .from("family_members")
    .select("role")
    .eq("user_id", user.id)
    .eq("family_id", activeFamilyId)
    .single();
  if (currentMember?.role !== "owner") throw new Error("Only the account owner can change roles.");

  // Can't change the owner's role (except transferring ownership, which is separate)
  const { data: target } = await supabase
    .from("family_members")
    .select("role")
    .eq("id", memberId)
    .single();
  if (target?.role === "owner") throw new Error("Cannot change the owner's role. Use ownership transfer instead.");

  const { error } = await supabase
    .from("family_members")
    .update({ role: newRole })
    .eq("id", memberId);

  if (error) throw error;
  revalidatePath("/dashboard/our-family");
  revalidatePath("/dashboard/members");
}

/** Generate a kid access link for a child member. Only owner/adults can do this. */
export async function generateKidLink(
  memberId: string
): Promise<{ token: string; expiresAt: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { activeFamilyId } = await getActiveFamilyId(supabase);
  if (!activeFamilyId) throw new Error("No active family");

  // Verify current user is owner or adult
  const { data: currentMember } = await supabase
    .from("family_members")
    .select("role")
    .eq("user_id", user.id)
    .eq("family_id", activeFamilyId)
    .single();
  if (!currentMember || !["owner", "adult"].includes(currentMember.role)) {
    throw new Error("Only adults can generate kid links.");
  }

  // Verify target is a child or teen
  const { data: target } = await supabase
    .from("family_members")
    .select("role")
    .eq("id", memberId)
    .single();
  if (!target || !["child", "teen"].includes(target.role)) {
    throw new Error("Kid links can only be generated for children and teens.");
  }

  // Generate a secure token, expires in 30 days
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  const { error } = await supabase
    .from("family_members")
    .update({
      kid_access_token: token,
      kid_token_expires_at: expiresAt,
    })
    .eq("id", memberId);

  if (error) throw error;
  revalidatePath("/dashboard/our-family");
  return { token, expiresAt };
}

/** Revoke a kid access link. */
export async function revokeKidLink(memberId: string): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("family_members")
    .update({
      kid_access_token: null,
      kid_token_expires_at: null,
    })
    .eq("id", memberId);

  if (error) throw error;
  revalidatePath("/dashboard/our-family");
}

/**
 * Check for members who have aged into a new role bracket.
 * Returns members whose birth_date puts them in a different role than their current one.
 */
export async function checkAgeTransitions(): Promise<
  Array<{
    id: string;
    name: string;
    currentRole: MemberRole;
    suggestedRole: MemberRole;
    age: number;
  }>
> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { activeFamilyId } = await getActiveFamilyId(supabase);
  if (!activeFamilyId) return [];

  const { data: members } = await supabase
    .from("family_members")
    .select("id, name, role, birth_date")
    .eq("family_id", activeFamilyId)
    .not("birth_date", "is", null)
    .neq("role", "owner");

  if (!members) return [];

  const transitions: Array<{
    id: string;
    name: string;
    currentRole: MemberRole;
    suggestedRole: MemberRole;
    age: number;
  }> = [];

  for (const m of members) {
    const suggested = detectRoleFromBirthDate(m.birth_date);
    if (!suggested) continue;

    const currentRole = m.role as MemberRole;
    // Only flag upgrades (child→teen, teen→adult), not downgrades
    const roleOrder: Record<MemberRole, number> = { child: 0, teen: 1, adult: 2, owner: 3 };
    if (roleOrder[suggested] > roleOrder[currentRole]) {
      const birth = new Date(m.birth_date + "T12:00:00");
      const today = new Date();
      let age = today.getFullYear() - birth.getFullYear();
      const monthDiff = today.getMonth() - birth.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) age--;

      transitions.push({
        id: m.id,
        name: m.name,
        currentRole,
        suggestedRole: suggested,
        age,
      });
    }
  }

  return transitions;
}
