"use server";

import { createClient } from "@/src/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { getActiveFamilyId } from "@/src/lib/family";
import { enforceStorageLimit, addStorageUsage, getFamilyPlan, canSharePublicly } from "@/src/lib/plans";
import crypto from "crypto";
import { Resend } from "resend";

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

export async function getOrCreateArtworkShareToken(pieceId: string): Promise<{ shareToken: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { activeFamilyId } = await getActiveFamilyId(supabase);
  if (activeFamilyId) {
    const plan = await getFamilyPlan(supabase, activeFamilyId);
    if (!canSharePublicly(plan.planType)) {
      throw new Error("Public sharing requires the Full Nest or Legacy plan.");
    }
  }

  const { data: piece } = await supabase
    .from("artwork_pieces")
    .select("id, share_token, family_member_id")
    .eq("id", pieceId)
    .single();

  if (!piece) throw new Error("Artwork not found");

  if (piece.share_token) return { shareToken: piece.share_token };

  const token = crypto.randomBytes(16).toString("hex");
  await supabase
    .from("artwork_pieces")
    .update({ is_public: true, share_token: token })
    .eq("id", pieceId);

  return { shareToken: token };
}

export async function toggleArtworkShare(pieceId: string): Promise<{ shareToken: string | null; isPublic: boolean }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { activeFamilyId } = await getActiveFamilyId(supabase);
  if (activeFamilyId) {
    const plan = await getFamilyPlan(supabase, activeFamilyId);
    if (!canSharePublicly(plan.planType)) {
      throw new Error("Public sharing requires the Full Nest or Legacy plan.");
    }
  }

  const { data: piece } = await supabase
    .from("artwork_pieces")
    .select("id, is_public, share_token, family_member_id")
    .eq("id", pieceId)
    .single();

  if (!piece) throw new Error("Artwork not found");

  if (piece.is_public) {
    await supabase
      .from("artwork_pieces")
      .update({ is_public: false, share_token: null })
      .eq("id", pieceId);

    revalidatePath(`/dashboard/artwork/${piece.family_member_id}/${pieceId}`);
    return { shareToken: null, isPublic: false };
  } else {
    const token = crypto.randomBytes(16).toString("hex");
    await supabase
      .from("artwork_pieces")
      .update({ is_public: true, share_token: token })
      .eq("id", pieceId);

    revalidatePath(`/dashboard/artwork/${piece.family_member_id}/${pieceId}`);
    return { shareToken: token, isPublic: true };
  }
}

export async function sendArtworkShareEmail(
  pieceId: string,
  recipientEmail: string
): Promise<{ success: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { success: false, error: "Email sending is not configured." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const { activeFamilyId } = await getActiveFamilyId(supabase);

  // Get or create the share token (ensures piece is public)
  let shareToken: string;
  try {
    const result = await getOrCreateArtworkShareToken(pieceId);
    shareToken = result.shareToken;
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Could not create share link." };
  }

  // Fetch piece details
  const { data: piece } = await supabase
    .from("artwork_pieces")
    .select("title, medium, age_when_created, family_member_id, family_id")
    .eq("id", pieceId)
    .single();

  if (!piece) return { success: false, error: "Artwork not found." };

  // Get artist name
  let artistName = "";
  if (piece.family_member_id) {
    const { data: member } = await supabase
      .from("family_members")
      .select("name, nickname")
      .eq("id", piece.family_member_id)
      .single();
    if (member) artistName = member.nickname?.trim() || member.name || "";
  }

  // Get family name
  let familyName = "A Family";
  if (activeFamilyId) {
    const { data: family } = await supabase
      .from("families")
      .select("name")
      .eq("id", activeFamilyId)
      .single();
    if (family?.name) familyName = family.name;
  }

  // Get sender name (current user's family member name)
  let senderName = familyName;
  if (activeFamilyId) {
    const { data: senderMember } = await supabase
      .from("family_members")
      .select("name, nickname")
      .eq("family_id", activeFamilyId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (senderMember) {
      senderName = senderMember.nickname?.trim() || senderMember.name || familyName;
    }
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://familynest.io");

  const shareUrl = `${baseUrl}/share/artwork/${shareToken}`;
  const from = process.env.RESEND_FROM_EMAIL || "Family Nest <onboarding@resend.dev>";

  const MEDIUM_LABELS: Record<string, string> = {
    drawing: "Drawing",
    painting: "Painting",
    craft: "Craft",
    sculpture: "Sculpture",
    digital: "Digital Art",
    other: "Artwork",
  };
  const mediumLabel = piece.medium ? (MEDIUM_LABELS[piece.medium] ?? "Artwork") : "Artwork";
  const subtitle = [
    artistName && `By ${artistName}`,
    piece.age_when_created != null && `Age ${piece.age_when_created}`,
    mediumLabel,
  ]
    .filter(Boolean)
    .join("  ·  ");

  const eName = (s: string) => s.replace(/</g, "&lt;").replace(/>/g, "&gt;");

  try {
    const resend = new Resend(apiKey);
    await resend.emails.send({
      from,
      to: recipientEmail.trim(),
      subject: `${eName(senderName)} shared "${eName(piece.title)}" with you`,
      html: `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f5f0ea;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#f5f0ea;">
<tr><td align="center" style="padding:40px 16px;">

<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:520px;">

  <!-- Logo -->
  <tr><td style="text-align:center;padding-bottom:28px;">
    <p style="margin:0;font-size:22px;font-weight:700;color:#c47c3a;letter-spacing:-0.3px;">🏡 Family Nest</p>
  </td></tr>

  <!-- Main card -->
  <tr><td style="background:#ffffff;border-radius:16px;border:1px solid #e8e2d8;overflow:hidden;">

    <div style="height:4px;background:linear-gradient(90deg,#c47c3a,#e8a855,#c47c3a);"></div>

    <div style="padding:32px 32px 36px;">

      <p style="margin:0 0 4px;font-size:14px;font-weight:600;color:#c47c3a;">
        From the ${eName(familyName)} Family
      </p>
      <h1 style="margin:0 0 6px;font-size:26px;font-weight:800;color:#2c2a25;line-height:1.2;">
        ${eName(piece.title)}
      </h1>
      ${subtitle ? `<p style="margin:0 0 28px;font-size:14px;color:#7a7567;">${eName(subtitle)}</p>` : '<div style="margin-bottom:28px;"></div>'}

      <p style="margin:0 0 28px;font-size:15px;color:#5a5248;line-height:1.6;">
        ${eName(senderName)} wanted to share this piece of artwork with you from Family Nest.
      </p>

      <!-- CTA button -->
      <table cellpadding="0" cellspacing="0" role="presentation" style="margin:0 auto 28px;">
        <tr><td style="border-radius:50px;background:#c47c3a;">
          <a href="${shareUrl}" target="_blank" style="display:inline-block;padding:14px 36px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:50px;">
            View Artwork →
          </a>
        </td></tr>
      </table>

      <p style="margin:0;font-size:12px;color:#9c8f7a;text-align:center;">
        Or copy this link: <a href="${shareUrl}" style="color:#c47c3a;">${shareUrl}</a>
      </p>

    </div>
  </td></tr>

  <!-- Footer -->
  <tr><td style="padding-top:24px;text-align:center;">
    <p style="margin:0;font-size:12px;color:#9c8f7a;">
      Shared via <a href="${baseUrl}" style="color:#c47c3a;text-decoration:none;">Family Nest</a> — a private space to preserve family memories.
    </p>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>`,
    });
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to send email." };
  }
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
