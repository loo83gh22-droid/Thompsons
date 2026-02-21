/**
 * Notification cron endpoint.
 * Call via Vercel Cron or external scheduler: GET /api/notifications?key=SECRET
 *
 * Handles:
 *   1. Birthday reminders (3 days before)
 *   2. Time capsule unlock notifications (on unlock date)
 *   3. Activation drip campaigns (Day 1, 3, 5, 14, 30)
 *   4. Weekly digest (Sundays)
 */

import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { NextResponse } from "next/server";
import { birthdayEmailHtml } from "@/app/api/emails/templates/birthday";
import { capsuleEmailHtml } from "@/app/api/emails/templates/capsule";
import { digestEmailHtml } from "@/app/api/emails/templates/digest";
import {
  day1ActivationEmailHtml,
  day3DiscoveryEmailHtml,
  day5InviteEmailHtml,
  day14UpgradeEmailHtml,
  day30ReengagementEmailHtml,
} from "@/app/api/emails/templates/drip";
import { esc } from "@/app/api/emails/templates/shared";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const resendKey = process.env.RESEND_API_KEY;
const cronSecret = process.env.CRON_SECRET;
const fromEmail = process.env.RESEND_FROM_EMAIL || "Family Nest <notifications@resend.dev>";

/** Minimal shape of a family_member row as returned by the drip campaign queries. */
interface DripMember {
  id: string;
  name: string;
  contact_email: string | null;
  user_id: string | null;
}

/** Family row with nested members (from Supabase inner join). */
interface FamilyWithMembers {
  id: string;
  name: string;
  family_members: DripMember[];
}

export async function GET(request: Request) {
  // Auth check — always require CRON_SECRET
  const { searchParams } = new URL(request.url);
  const key = searchParams.get("key");
  if (!cronSecret || key !== cronSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!resendKey) {
    return NextResponse.json({ error: "RESEND_API_KEY not configured" }, { status: 500 });
  }
  if (!supabaseServiceKey) {
    return NextResponse.json({ error: "SUPABASE_SERVICE_ROLE_KEY not configured" }, { status: 500 });
  }

  const resend = new Resend(resendKey);
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const dayOfWeek = today.getDay(); // 0 = Sunday
  const threeDaysOut = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const results = {
    birthdayReminders: 0,
    capsuleUnlocks: 0,
    weeklyDigests: 0,
    day1Nudges: 0,
    day3Discovery: 0,
    day5Invites: 0,
    day14Upgrades: 0,
    day30Reengagement: 0,
    errors: [] as string[],
  };

  // ── 1. Birthday reminders (3 days before) ──
  try {
    const { data: allMembers } = await supabase
      .from("family_members")
      .select("id, name, nickname, birth_date, family_id")
      .not("birth_date", "is", null);

    const birthdayMembers = (allMembers ?? []).filter((m) => {
      if (!m.birth_date) return false;
      return m.birth_date.slice(5) === threeDaysOut.slice(5); // MM-DD match
    });

    for (const bm of birthdayMembers) {
      const { data: familyMembers } = await supabase
        .from("family_members")
        .select("contact_email, name")
        .eq("family_id", bm.family_id)
        .eq("email_notifications", true)
        .not("contact_email", "is", null)
        .neq("id", bm.id);

      const displayName = bm.nickname?.trim() || bm.name;
      const birthYear = bm.birth_date
        ? new Date(bm.birth_date + "T12:00:00").getFullYear()
        : null;
      const turningAge = birthYear
        ? today.getFullYear() - birthYear + (threeDaysOut.slice(5) < todayStr.slice(5) ? 1 : 0)
        : null;
      const ageText = turningAge ? ` (turning ${turningAge})` : "";

      for (const fm of familyMembers ?? []) {
        if (!fm.contact_email) continue;
        try {
          await resend.emails.send({
            from: fromEmail,
            to: fm.contact_email,
            subject: `🎂 ${esc(displayName)}'s birthday is in 3 days!`,
            html: birthdayEmailHtml(displayName, ageText, fm.name),
          });
          results.birthdayReminders++;
        } catch (err) {
          results.errors.push(`Birthday email to ${fm.contact_email}: ${err}`);
        }
      }
    }
  } catch (err) {
    results.errors.push(`Birthday check: ${err}`);
  }

  // ── 2. Time capsule unlock notifications ──
  try {
    const { data: capsules } = await supabase
      .from("time_capsules")
      .select("id, title, family_id, to_family_member_id, from_family_member_id, unlock_date")
      .eq("unlock_date", todayStr);

    for (const cap of capsules ?? []) {
      const { data: recipient } = await supabase
        .from("family_members")
        .select("name, nickname, contact_email")
        .eq("id", cap.to_family_member_id)
        .single();

      if (!recipient?.contact_email) continue;

      let senderName = "Someone in your family";
      if (cap.from_family_member_id) {
        const { data: sender } = await supabase
          .from("family_members")
          .select("name, nickname")
          .eq("id", cap.from_family_member_id)
          .single();
        if (sender) senderName = sender.nickname?.trim() || sender.name;
      }

      try {
        await resend.emails.send({
          from: fromEmail,
          to: recipient.contact_email,
          subject: `💌 A time capsule has been unlocked for you!`,
          html: capsuleEmailHtml(
            recipient.nickname?.trim() || recipient.name,
            senderName,
            cap.title
          ),
        });
        results.capsuleUnlocks++;
      } catch (err) {
        results.errors.push(`Capsule email to ${recipient.contact_email}: ${err}`);
      }
    }
  } catch (err) {
    results.errors.push(`Capsule check: ${err}`);
  }

  // ── 3. Activation Drip Campaigns ──

  // Day 1: Activation Nudge for users with 0 photos
  try {
    const oneDayAgo = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString();
    const oneDayAgoEnd = new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString();

    const { data: newFamilies } = await supabase
      .from("families")
      .select("id, name, family_members!inner(id, name, contact_email, user_id)")
      .gte("created_at", oneDayAgo)
      .lte("created_at", oneDayAgoEnd);

    for (const family of (newFamilies ?? []) as FamilyWithMembers[]) {
      const { count: photoCount } = await supabase
        .from("journal_photos")
        .select("*", { count: "exact", head: true })
        .eq("family_id", family.id);

      if (photoCount !== 0) continue;

      const owner = family.family_members.find((m) => m.user_id);
      if (!owner?.contact_email) continue;

      const { data: existingCampaign } = await supabase
        .from("email_campaigns")
        .select("id")
        .eq("family_member_id", owner.id)
        .eq("campaign_type", "day1_nudge")
        .single();
      if (existingCampaign) continue;

      try {
        await resend.emails.send({
          from: fromEmail,
          to: owner.contact_email,
          subject: "Your family's story starts with one photo 📷",
          html: day1ActivationEmailHtml(owner.name),
        });
        await supabase.from("email_campaigns").insert({
          family_member_id: owner.id,
          campaign_type: "day1_nudge",
        });
        results.day1Nudges++;
      } catch (err) {
        results.errors.push(`Day 1 email to ${owner.contact_email}: ${err}`);
      }
    }
  } catch (err) {
    results.errors.push(`Day 1 campaign: ${err}`);
  }

  // Day 3: Feature Discovery
  try {
    const threeDaysAgo = new Date(Date.now() - 73 * 60 * 60 * 1000).toISOString();
    const threeDaysAgoEnd = new Date(Date.now() - 71 * 60 * 60 * 1000).toISOString();

    const { data: day3Families } = await supabase
      .from("families")
      .select("id, name, family_members!inner(id, name, contact_email, user_id)")
      .gte("created_at", threeDaysAgo)
      .lte("created_at", threeDaysAgoEnd);

    for (const family of (day3Families ?? []) as FamilyWithMembers[]) {
      const owner = family.family_members.find((m) => m.user_id);
      if (!owner?.contact_email) continue;

      const { data: existing } = await supabase
        .from("email_campaigns")
        .select("id")
        .eq("family_member_id", owner.id)
        .eq("campaign_type", "day3_discovery")
        .single();
      if (existing) continue;

      try {
        await resend.emails.send({
          from: fromEmail,
          to: owner.contact_email,
          subject: "Did you know? Your Nest has these hidden gems ✨",
          html: day3DiscoveryEmailHtml(owner.name),
        });
        await supabase.from("email_campaigns").insert({
          family_member_id: owner.id,
          campaign_type: "day3_discovery",
        });
        results.day3Discovery++;
      } catch (err) {
        results.errors.push(`Day 3 email to ${owner.contact_email}: ${err}`);
      }
    }
  } catch (err) {
    results.errors.push(`Day 3 campaign: ${err}`);
  }

  // Day 5: Invite Encouragement for single-member families
  try {
    const fiveDaysAgo = new Date(Date.now() - 121 * 60 * 60 * 1000).toISOString();
    const fiveDaysAgoEnd = new Date(Date.now() - 119 * 60 * 60 * 1000).toISOString();

    const { data: day5Families } = await supabase
      .from("families")
      .select("id, name, family_members(id, name, contact_email, user_id)")
      .gte("created_at", fiveDaysAgo)
      .lte("created_at", fiveDaysAgoEnd);

    for (const family of (day5Families ?? []) as FamilyWithMembers[]) {
      if (family.family_members.length > 1) continue; // already has invitees
      const owner = family.family_members.find((m) => m.user_id);
      if (!owner?.contact_email) continue;

      const { data: existing } = await supabase
        .from("email_campaigns")
        .select("id")
        .eq("family_member_id", owner.id)
        .eq("campaign_type", "day5_invite")
        .single();
      if (existing) continue;

      try {
        await resend.emails.send({
          from: fromEmail,
          to: owner.contact_email,
          subject: "Your family is waiting to join 👋",
          html: day5InviteEmailHtml(owner.name),
        });
        await supabase.from("email_campaigns").insert({
          family_member_id: owner.id,
          campaign_type: "day5_invite",
        });
        results.day5Invites++;
      } catch (err) {
        results.errors.push(`Day 5 email to ${owner.contact_email}: ${err}`);
      }
    }
  } catch (err) {
    results.errors.push(`Day 5 campaign: ${err}`);
  }

  // Day 14: Upgrade Consideration for active Free-tier users
  try {
    const fourteenDaysAgo = new Date(Date.now() - 337 * 60 * 60 * 1000).toISOString();
    const fourteenDaysAgoEnd = new Date(Date.now() - 335 * 60 * 60 * 1000).toISOString();

    const { data: day14Families } = await supabase
      .from("families")
      .select("id, name, family_members!inner(id, name, contact_email, user_id)")
      .gte("created_at", fourteenDaysAgo)
      .lte("created_at", fourteenDaysAgoEnd);

    for (const family of (day14Families ?? []) as FamilyWithMembers[]) {
      const owner = family.family_members.find((m) => m.user_id);
      if (!owner?.contact_email) continue;

      const { data: existing } = await supabase
        .from("email_campaigns")
        .select("id")
        .eq("family_member_id", owner.id)
        .eq("campaign_type", "day14_upgrade")
        .single();
      if (existing) continue;

      const { count: journalCount } = await supabase
        .from("journal_entries")
        .select("id", { count: "exact", head: true })
        .eq("family_id", family.id);
      if ((journalCount ?? 0) < 3) continue; // only nudge active users

      try {
        await resend.emails.send({
          from: fromEmail,
          to: owner.contact_email,
          subject: "Ready to unlock unlimited memories? 🔓",
          html: day14UpgradeEmailHtml(owner.name),
        });
        await supabase.from("email_campaigns").insert({
          family_member_id: owner.id,
          campaign_type: "day14_upgrade",
        });
        results.day14Upgrades++;
      } catch (err) {
        results.errors.push(`Day 14 email to ${owner.contact_email}: ${err}`);
      }
    }
  } catch (err) {
    results.errors.push(`Day 14 campaign: ${err}`);
  }

  // Day 30: Re-engagement for dormant users
  try {
    const thirtyDaysAgo = new Date(Date.now() - 721 * 60 * 60 * 1000).toISOString();
    const thirtyDaysAgoEnd = new Date(Date.now() - 719 * 60 * 60 * 1000).toISOString();

    const { data: day30Families } = await supabase
      .from("families")
      .select("id, name, family_members!inner(id, name, contact_email, user_id)")
      .gte("created_at", thirtyDaysAgo)
      .lte("created_at", thirtyDaysAgoEnd);

    for (const family of (day30Families ?? []) as FamilyWithMembers[]) {
      const owner = family.family_members.find((m) => m.user_id);
      if (!owner?.contact_email) continue;

      const { data: existing } = await supabase
        .from("email_campaigns")
        .select("id")
        .eq("family_member_id", owner.id)
        .eq("campaign_type", "day30_reengagement")
        .single();
      if (existing) continue;

      try {
        await resend.emails.send({
          from: fromEmail,
          to: owner.contact_email,
          subject: "Your family misses you 💙",
          html: day30ReengagementEmailHtml(owner.name, family.name),
        });
        await supabase.from("email_campaigns").insert({
          family_member_id: owner.id,
          campaign_type: "day30_reengagement",
        });
        results.day30Reengagement++;
      } catch (err) {
        results.errors.push(`Day 30 email to ${owner.contact_email}: ${err}`);
      }
    }
  } catch (err) {
    results.errors.push(`Day 30 campaign: ${err}`);
  }

  // ── 4. Weekly digest (Sundays only) ──
  if (dayOfWeek === 0) {
    try {
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { data: families } = await supabase.from("families").select("id, name");

      for (const family of families ?? []) {
        const [journals, photos, voices, stories] = await Promise.all([
          supabase.from("journal_entries").select("id", { count: "exact", head: true }).eq("family_id", family.id).gte("created_at", weekAgo),
          supabase.from("home_mosaic_photos").select("id", { count: "exact", head: true }).eq("family_id", family.id).gte("created_at", weekAgo),
          supabase.from("voice_memos").select("id", { count: "exact", head: true }).eq("family_id", family.id).gte("created_at", weekAgo),
          supabase.from("family_stories").select("id", { count: "exact", head: true }).eq("family_id", family.id).gte("created_at", weekAgo),
        ]);

        const jCount = journals.count ?? 0;
        const pCount = photos.count ?? 0;
        const vCount = voices.count ?? 0;
        const sCount = stories.count ?? 0;
        if (jCount + pCount + vCount + sCount === 0) continue;

        const { data: members } = await supabase
          .from("family_members")
          .select("contact_email, name, nickname")
          .eq("family_id", family.id)
          .eq("email_notifications", true)
          .not("contact_email", "is", null);

        for (const m of members ?? []) {
          if (!m.contact_email) continue;
          try {
            await resend.emails.send({
              from: fromEmail,
              to: m.contact_email,
              subject: `This week in ${esc(family.name)} Nest`,
              html: digestEmailHtml(
                m.nickname?.trim() || m.name,
                family.name,
                { journals: jCount, photos: pCount, voices: vCount, stories: sCount }
              ),
            });
            results.weeklyDigests++;
          } catch (err) {
            results.errors.push(`Digest email to ${m.contact_email}: ${err}`);
          }
        }
      }
    } catch (err) {
      results.errors.push(`Weekly digest: ${err}`);
    }
  }

  return NextResponse.json(results);
}
