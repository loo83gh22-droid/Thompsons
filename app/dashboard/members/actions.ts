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
  const from = process.env.RESEND_FROM_EMAIL || "Family Nest <onboarding@resend.dev>";
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    (typeof process.env.VERCEL_URL === "string" ? `https://${process.env.VERCEL_URL}` : null);
  const eName = (s: string) => s.replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const safeName = eName(name || "");
  const safeFamily = eName(familyName || "Our Family");

  // Build invite URL with context so the login page shows a tailored "join" flow
  const inviteUrl = baseUrl
    ? `${baseUrl}/login?mode=invited&email=${encodeURIComponent(to.trim())}&family=${encodeURIComponent(familyName || "Our Family")}&name=${encodeURIComponent(name || "")}`
    : null;

  await resend.emails.send({
    from,
    to: to.trim(),
    subject: `You've been invited to ${safeFamily}'s Family Nest`,
    html: `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#0a0e1a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#0a0e1a;">
<tr><td align="center" style="padding:40px 16px;">

<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:520px;">

  <!-- Logo -->
  <tr><td style="text-align:center;padding-bottom:32px;">
    <div style="display:inline-block;background:linear-gradient(135deg,#D4A843,#b8912e);width:56px;height:56px;border-radius:16px;line-height:56px;font-size:28px;text-align:center;">&#127969;</div>
    <p style="margin:12px 0 0;font-size:24px;font-weight:700;color:#D4A843;letter-spacing:-0.5px;">Family Nest</p>
  </td></tr>

  <!-- Main card -->
  <tr><td style="background:#141927;border-radius:16px;border:1px solid #1e2640;overflow:hidden;">

    <!-- Gold bar -->
    <div style="height:4px;background:linear-gradient(90deg,#D4A843,#e8c56d,#D4A843);"></div>

    <div style="padding:32px 32px 36px;">

      <h1 style="margin:0 0 8px;font-size:24px;color:#f0f2f8;font-weight:700;line-height:1.3;">
        You&apos;ve been invited${safeName ? `, ${safeName}` : ""}! &#127881;
      </h1>
      <p style="margin:0 0 24px;color:#8b93a8;font-size:15px;line-height:1.6;">
        The <strong style="color:#D4A843;">${safeFamily}</strong> family has added you to their private Family Nest &mdash;
        a shared space for memories, photos, stories, and more that only your family can see.
      </p>

      <!-- Steps -->
      <div style="background:#0d111e;border-radius:12px;padding:20px 24px;margin:0 0 28px;border:1px solid #1a2038;">
        <p style="margin:0 0 16px;font-size:13px;font-weight:600;color:#D4A843;text-transform:uppercase;letter-spacing:1px;">
          3 steps to get in
        </p>
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
          <tr>
            <td width="32" valign="top">
              <div style="width:26px;height:26px;border-radius:50%;background:#D4A843;color:#0a0e1a;font-weight:700;font-size:13px;text-align:center;line-height:26px;">1</div>
            </td>
            <td style="padding-left:10px;color:#c8cdd8;font-size:14px;line-height:1.6;padding-bottom:12px;">
              <strong style="color:#f0f2f8;">Click the button below</strong><br>
              Your email is already pre-filled &mdash; you&apos;re recognised as a ${safeFamily} family member
            </td>
          </tr>
          <tr>
            <td width="32" valign="top">
              <div style="width:26px;height:26px;border-radius:50%;background:#D4A843;color:#0a0e1a;font-weight:700;font-size:13px;text-align:center;line-height:26px;">2</div>
            </td>
            <td style="padding-left:10px;color:#c8cdd8;font-size:14px;line-height:1.6;padding-bottom:12px;">
              <strong style="color:#f0f2f8;">Create your password</strong><br>
              That&apos;s the only thing you need to set up
            </td>
          </tr>
          <tr>
            <td width="32" valign="top">
              <div style="width:26px;height:26px;border-radius:50%;background:#D4A843;color:#0a0e1a;font-weight:700;font-size:13px;text-align:center;line-height:26px;">3</div>
            </td>
            <td style="padding-left:10px;color:#c8cdd8;font-size:14px;line-height:1.6;">
              <strong style="color:#f0f2f8;">Access your family&apos;s Nest</strong><br>
              You&apos;re in &mdash; explore everything the family has already shared
            </td>
          </tr>
        </table>
      </div>

      ${inviteUrl ? `
      <div style="text-align:center;">
        <a href="${inviteUrl}" style="display:inline-block;background:linear-gradient(135deg,#D4A843,#c49b38);color:#0a0e1a;padding:16px 36px;border-radius:12px;text-decoration:none;font-weight:700;font-size:16px;letter-spacing:0.3px;box-shadow:0 4px 16px rgba(212,168,67,0.3);">
          Join ${safeFamily}&apos;s Nest &rarr;
        </a>
        <p style="margin:12px 0 0;color:#64748b;font-size:13px;">
          Takes 30 seconds. Your profile is already set up.
        </p>
      </div>
      ` : ""}

    </div>
  </td></tr>

  <!-- Footer -->
  <tr><td style="text-align:center;padding-top:24px;">
    <p style="color:#4a5068;font-size:12px;margin:0;">Family Nest &mdash; Private family memories, preserved forever.</p>
    <p style="color:#3d4560;font-size:11px;margin:8px 0 0;">If you didn&apos;t expect this, you can safely ignore this email.</p>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>`,
  });
}

/** Resend an invitation email to a pending member. Returns { success, error? }. */
export async function resendInviteEmail(
  memberId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const { activeFamilyId } = await getActiveFamilyId(supabase);
  if (!activeFamilyId) return { success: false, error: "No active family" };

  const { data: member } = await supabase
    .from("family_members")
    .select("name, contact_email, user_id")
    .eq("id", memberId)
    .eq("family_id", activeFamilyId)
    .single();

  if (!member) return { success: false, error: "Member not found" };
  if (member.user_id) return { success: false, error: "This member has already joined." };
  if (!member.contact_email?.trim()) return { success: false, error: "No email address on file for this member." };

  try {
    const familyName = await getActiveFamilyName(supabase);
    await sendInviteEmail(member.contact_email.trim(), member.name, familyName);
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to send email." };
  }
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
          { headers: { "User-Agent": "FamilyNest/1.0" } }
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

  const { activeFamilyId } = await getActiveFamilyId(supabase);
  if (!activeFamilyId) throw new Error("No active family");

  // Only owners and adults can edit member profiles
  const { data: caller } = await supabase
    .from("family_members")
    .select("role")
    .eq("user_id", user.id)
    .eq("family_id", activeFamilyId)
    .single();
  if (!caller || !["owner", "adult"].includes(caller.role)) {
    throw new Error("Only adults and owners can edit member profiles.");
  }

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
    .eq("id", id)
    .eq("family_id", activeFamilyId);

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
          { headers: { "User-Agent": "FamilyNest/1.0" } }
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

  // Send invite email ONLY when a new email is being added to a member who hasn't signed up yet
  // (i.e., the email field is changing from blank/different to a new value)
  const trimmedEmail = email?.trim();
  if (trimmedEmail) {
    const { data: memberRow } = await supabase
      .from("family_members")
      .select("user_id, contact_email")
      .eq("id", id)
      .single();
    const emailChanged = memberRow && memberRow.contact_email?.trim() !== trimmedEmail;
    if (emailChanged && !memberRow.user_id) {
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

  const { activeFamilyId } = await getActiveFamilyId(supabase);
  if (!activeFamilyId) throw new Error("No active family");

  // Only owners and adults can revoke kid links
  const { data: currentMember } = await supabase
    .from("family_members")
    .select("role")
    .eq("user_id", user.id)
    .eq("family_id", activeFamilyId)
    .single();
  if (!currentMember || !["owner", "adult"].includes(currentMember.role)) {
    throw new Error("Only adults can revoke kid links.");
  }

  // Ensure the target member belongs to the active family
  const { error } = await supabase
    .from("family_members")
    .update({
      kid_access_token: null,
      kid_token_expires_at: null,
    })
    .eq("id", memberId)
    .eq("family_id", activeFamilyId);

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
