"use server";

import { createClient } from "@/src/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { Resend } from "resend";
import { getActiveFamilyId, getActiveFamilyName } from "@/src/lib/family";
import { ensureBirthdayEventForMember } from "@/app/dashboard/events/actions";

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

  const { error } = await supabase.from("family_members").delete().eq("id", id);

  if (error) throw error;
  revalidatePath("/dashboard/members");
  revalidatePath("/dashboard/our-family");
  revalidatePath("/dashboard");
}
