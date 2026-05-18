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
import { digestEmailHtml, type DigestSection } from "@/app/api/emails/templates/digest";
import {
  day0WelcomeEmailHtml,
  day1ActivationEmailHtml,
  day3DiscoveryEmailHtml,
  day5InviteEmailHtml,
  day14UpgradeEmailHtml,
  day30ReengagementEmailHtml,
} from "@/app/api/emails/templates/drip";
import { esc, emailWrapper, card, ctaButton, appUrl } from "@/app/api/emails/templates/shared";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const resendKey = process.env.RESEND_API_KEY;
const cronSecret = process.env.CRON_SECRET;
const fromEmail = process.env.RESEND_FROM_EMAIL || "Family Nest <hello@send.familynest.io>";

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
  // Fail loudly if CRON_SECRET is not configured — prevents silent cron failures.
  if (!cronSecret) {
    console.error("CRON_SECRET is not set. Notification cron is disabled.");
    return NextResponse.json({ error: "Cron not configured" }, { status: 503 });
  }

  // Auth check — Vercel Cron sends Authorization: Bearer <CRON_SECRET> automatically.
  // Never accept the secret via query params — they appear in server logs and Referer headers.
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${cronSecret}`) {
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
  // R4: One extra day gives a retry window if the cron failed the previous day.
  const fourDaysOut = new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const yesterdayStr = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const results = {
    birthdayReminders: 0,
    capsuleUnlocks: 0,
    scheduledMessages: 0,
    weeklyDigests: 0,
    day0Welcomes: 0,
    day1Nudges: 0,
    day3Discovery: 0,
    day5Invites: 0,
    day14Upgrades: 0,
    day30Reengagement: 0,
    graceReminders: 0,
    graceEnforced: 0,
    storageWarnings: 0,
    errors: [] as string[],
  };

  // ── 1. Birthday reminders (3 days before) ──
  try {
    const { data: allMembers } = await supabase
      .from("family_members")
      .select("id, name, nickname, birth_date, family_id")
      .not("birth_date", "is", null);

    // R4: Match 3-4 days out (MM-DD only) so a missed cron day still delivers the reminder.
    // Deduplication below (via email_campaigns) prevents duplicate sends.
    const birthdayMembers = (allMembers ?? []).filter((m) => {
      if (!m.birth_date) return false;
      const mmdd = m.birth_date.slice(5);
      return mmdd === threeDaysOut.slice(5) || mmdd === fourDaysOut.slice(5);
    });

    for (const bm of birthdayMembers) {
      const { data: familyMembers } = await supabase
        .from("family_members")
        .select("id, contact_email, name")
        .eq("family_id", bm.family_id)
        .eq("email_notifications", true)
        .in("role", ["owner", "adult"])
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

      // R4: Deduplicate per recipient per birthday-year so the 3→4 day retry window
      // never sends twice even if Resend succeeds on both days.
      const campaignType = `birthday_${today.getFullYear()}_${bm.id}`;

      for (const fm of familyMembers ?? []) {
        if (!fm.contact_email) continue;
        // Check if we already sent this birthday reminder to this recipient
        const { data: alreadySent } = await supabase
          .from("email_campaigns")
          .select("id")
          .eq("family_member_id", fm.id)
          .eq("campaign_type", campaignType)
          .maybeSingle();
        if (alreadySent) continue;

        try {
          await resend.emails.send({
            from: fromEmail,
            to: fm.contact_email,
            subject: `🎂 ${esc(displayName)}'s birthday is in 3 days!`,
            html: birthdayEmailHtml(displayName, ageText, fm.name),
          });
          await supabase.from("email_campaigns").insert({
            family_member_id: fm.id,
            campaign_type: campaignType,
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
    // R4: Also pick up yesterday's unlocks in case the cron missed a run.
    // Deduplication via email_campaigns prevents double-sends.
    const { data: capsules } = await supabase
      .from("time_capsules")
      .select("id, title, family_id, to_family_member_id, from_family_member_id, unlock_date")
      .in("unlock_date", [todayStr, yesterdayStr]);

    for (const cap of capsules ?? []) {
      const { data: recipient } = await supabase
        .from("family_members")
        .select("name, nickname, contact_email")
        .eq("id", cap.to_family_member_id)
        .single();

      if (!recipient?.contact_email) continue;

      // R4: Dedup — skip if we already notified this recipient about this capsule.
      const capsuleCampaignType = `capsule_unlock_${cap.id}`;
      const { data: capsuleAlreadySent } = await supabase
        .from("email_campaigns")
        .select("id")
        .eq("family_member_id", cap.to_family_member_id)
        .eq("campaign_type", capsuleCampaignType)
        .maybeSingle();
      if (capsuleAlreadySent) continue;

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
        await supabase.from("email_campaigns").insert({
          family_member_id: cap.to_family_member_id,
          campaign_type: capsuleCampaignType,
        });
        results.capsuleUnlocks++;
      } catch (err) {
        results.errors.push(`Capsule email to ${recipient.contact_email}: ${err}`);
      }
    }
  } catch (err) {
    results.errors.push(`Capsule check: ${err}`);
  }

  // ── 3. Scheduled family message delivery ──
  // Send email for messages whose show_on_date is today and haven't been emailed yet.
  const scheduledMessagesSent = { count: 0 };
  try {
    const { data: scheduledMessages } = await supabase
      .from("family_messages")
      .select("id, title, content, sender_id, family_id")
      .eq("show_on_date", todayStr)
      .is("email_sent_at", null);

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://familynest.io";
    const fromEmail2 = process.env.RESEND_FROM_EMAIL || fromEmail;

    for (const msg of scheduledMessages ?? []) {
      // Get sender name
      let senderName = "";
      if (msg.sender_id) {
        const { data: sender } = await supabase
          .from("family_members")
          .select("name")
          .eq("id", msg.sender_id)
          .single();
        if (sender) senderName = sender.name;
      }

      // Get recipient IDs (specific recipients, or all family members)
      const { data: recipientRows } = await supabase
        .from("family_message_recipients")
        .select("family_member_id")
        .eq("message_id", msg.id);

      let memberIds: string[] = (recipientRows ?? []).map((r) => r.family_member_id);
      if (memberIds.length === 0) {
        const { data: all } = await supabase
          .from("family_members")
          .select("id")
          .eq("family_id", msg.family_id);
        memberIds = (all ?? []).map((m) => m.id);
      }

      const { data: members } = await supabase
        .from("family_members")
        .select("contact_email")
        .in("id", memberIds);

      const emails = (members ?? []).map((m) => m.contact_email).filter(Boolean) as string[];
      if (emails.length === 0) {
        // Mark sent anyway so cron doesn't keep retrying
        await supabase.from("family_messages").update({ email_sent_at: todayStr }).eq("id", msg.id);
        continue;
      }

      const safeTitle = esc(msg.title);
      const safeContent = msg.content.replace(/</g, "&lt;").replace(/>/g, "&gt;");
      const safeSender = esc(senderName);
      const html = `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;padding:32px 20px;">
<tr><td style="text-align:center;padding-bottom:24px;">
  <span style="font-size:28px;color:#D4A843;font-weight:700;">Family Nest</span>
</td></tr>
<tr><td style="background:#1e293b;border-radius:12px;padding:32px 24px;border:1px solid #334155;">
  <h1 style="margin:0 0 8px;font-size:22px;color:#f8fafc;">💬 ${safeTitle}</h1>
  ${safeSender ? `<p style="margin:0 0 16px;color:#64748b;font-size:13px;">From ${safeSender}</p>` : ""}
  <div style="margin:0 0 24px;color:#94a3b8;font-size:15px;line-height:1.6;white-space:pre-wrap;">${safeContent}</div>
  <a href="${appUrl}/dashboard" style="display:inline-block;background:#D4A843;color:#0f172a;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">
    View in Family Nest
  </a>
</td></tr>
<tr><td style="text-align:center;padding-top:24px;">
  <p style="color:#64748b;font-size:12px;margin:0;">Family Nest &middot; <a href="${appUrl}/dashboard/settings" style="color:#64748b;">Manage notifications</a></p>
</td></tr>
</table>
</body></html>`;

      let sent = 0;
      for (const to of emails) {
        try {
          await resend.emails.send({ from: fromEmail2, to, subject: `Family message: ${safeTitle}`, html });
          sent++;
          scheduledMessagesSent.count++;
        } catch (err) {
          results.errors.push(`Scheduled message email to ${to}: ${err}`);
        }
      }

      if (sent > 0) {
        await supabase.from("family_messages").update({ email_sent_at: new Date().toISOString() }).eq("id", msg.id);
      }
    }
    results.scheduledMessages = scheduledMessagesSent.count;
  } catch (err) {
    results.errors.push(`Scheduled messages: ${err}`);
  }

  // ── 4. Activation Drip Campaigns ──
  //
  // Windowing notes — each drip looks at families created within a
  // multi-day window (not a 2-hour slice) so a missed cron run still
  // delivers the email the next day. Deduplication is enforced by the
  // `email_campaigns` table — once a campaign type is logged for a
  // family_member_id, we never send it again. This means:
  //   - The lower bound (`now() - N days`) is when the campaign first
  //     becomes eligible.
  //   - The upper bound (`now() - M days`) prevents us from blasting
  //     stale drips to families that signed up long before this
  //     codepath worked correctly.

  // Day 0: Welcome email — fires within the first ~24h of signup. Sets
  // expectations for the rest of the lifecycle emails and lands the
  // hello@send.familynest.io sender address in the recipient's inbox
  // before the Day-1 nudge so it's less likely to be marked as spam.
  try {
    // Only catch families created in the past 2 days. Older families
    // shouldn't get a "welcome" email weeks after the fact.
    const day0LowerBound = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();

    const { data: day0NewFamilies } = await supabase
      .from("families")
      .select("id, name, family_members!inner(id, name, contact_email, user_id, role)")
      .gte("created_at", day0LowerBound);

    type Day0Family = { id: string; name: string; family_members: (DripMember & { role: string })[] };

    for (const family of (day0NewFamilies ?? []) as Day0Family[]) {
      const owner = family.family_members.find((m) => m.user_id && m.role === "owner");
      if (!owner?.contact_email) continue;

      const { data: day0Existing } = await supabase
        .from("email_campaigns")
        .select("id")
        .eq("family_member_id", owner.id)
        .eq("campaign_type", "day0_welcome")
        .maybeSingle();
      if (day0Existing) continue;

      try {
        await resend.emails.send({
          from: fromEmail,
          to: owner.contact_email,
          subject: "Welcome to Family Nest",
          html: day0WelcomeEmailHtml(owner.name, family.name),
        });
        await supabase.from("email_campaigns").insert({
          family_member_id: owner.id,
          campaign_type: "day0_welcome",
        });
        results.day0Welcomes++;
      } catch (err) {
        results.errors.push(`Day 0 welcome email to ${owner.contact_email}: ${err}`);
      }
    }
  } catch (err) {
    results.errors.push(`Day 0 campaign: ${err}`);
  }

  // Day 1: Write-first nudge for families with zero entries.
  try {
    const lowerBound = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString();
    const upperBound = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data: newFamilies } = await supabase
      .from("families")
      .select("id, name, family_members!inner(id, name, contact_email, user_id)")
      .gte("created_at", lowerBound)
      .lte("created_at", upperBound);

    for (const family of (newFamilies ?? []) as FamilyWithMembers[]) {
      // "Activated" = any kind of entry, not just photos. After the
      // write-first onboarding pivot (PR 122), journal entries are
      // the most common first action — checking only photos was
      // sending unnecessary emails to users who already engaged.
      const [{ count: journalCount }, { count: photoCount }, { count: voiceCount }] = await Promise.all([
        supabase.from("journal_entries").select("id", { count: "exact", head: true }).eq("family_id", family.id),
        supabase.from("home_mosaic_photos").select("id", { count: "exact", head: true }).eq("family_id", family.id),
        supabase.from("voice_memos").select("id", { count: "exact", head: true }).eq("family_id", family.id),
      ]);
      const totalEntries = (journalCount ?? 0) + (photoCount ?? 0) + (voiceCount ?? 0);
      if (totalEntries > 0) continue;

      const owner = family.family_members.find((m) => m.user_id);
      if (!owner?.contact_email) continue;

      const { data: existingCampaign } = await supabase
        .from("email_campaigns")
        .select("id")
        .eq("family_member_id", owner.id)
        .eq("campaign_type", "day1_nudge")
        .maybeSingle();
      if (existingCampaign) continue;

      try {
        await resend.emails.send({
          from: fromEmail,
          to: owner.contact_email,
          subject: "Your first line takes 30 seconds",
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
    const lowerBound = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const upperBound = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();

    const { data: day3Families } = await supabase
      .from("families")
      .select("id, name, family_members!inner(id, name, contact_email, user_id)")
      .gte("created_at", lowerBound)
      .lte("created_at", upperBound);

    for (const family of (day3Families ?? []) as FamilyWithMembers[]) {
      const owner = family.family_members.find((m) => m.user_id);
      if (!owner?.contact_email) continue;

      const { data: existing } = await supabase
        .from("email_campaigns")
        .select("id")
        .eq("family_member_id", owner.id)
        .eq("campaign_type", "day3_discovery")
        .maybeSingle();
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
    const lowerBound = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString();
    const upperBound = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();

    const { data: day5Families } = await supabase
      .from("families")
      .select("id, name, family_members(id, name, contact_email, user_id)")
      .gte("created_at", lowerBound)
      .lte("created_at", upperBound);

    for (const family of (day5Families ?? []) as FamilyWithMembers[]) {
      if (family.family_members.length > 1) continue; // already has invitees
      const owner = family.family_members.find((m) => m.user_id);
      if (!owner?.contact_email) continue;

      const { data: existing } = await supabase
        .from("email_campaigns")
        .select("id")
        .eq("family_member_id", owner.id)
        .eq("campaign_type", "day5_invite")
        .maybeSingle();
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
    const lowerBound = new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString();
    const upperBound = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();

    const { data: day14Families } = await supabase
      .from("families")
      .select("id, name, plan_type, family_members!inner(id, name, contact_email, user_id)")
      .gte("created_at", lowerBound)
      .lte("created_at", upperBound);

    for (const family of (day14Families ?? []) as FamilyWithMembers[] & { plan_type?: string }[]) {
      // Skip families that already upgraded — no need to push them on
      // pricing when they're already on a paid tier.
      if ((family as { plan_type?: string }).plan_type && (family as { plan_type?: string }).plan_type !== "free") continue;

      const owner = family.family_members.find((m) => m.user_id);
      if (!owner?.contact_email) continue;

      const { data: existing } = await supabase
        .from("email_campaigns")
        .select("id")
        .eq("family_member_id", owner.id)
        .eq("campaign_type", "day14_upgrade")
        .maybeSingle();
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
    const lowerBound = new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString();
    const upperBound = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const { data: day30Families } = await supabase
      .from("families")
      .select("id, name, family_members!inner(id, name, contact_email, user_id)")
      .gte("created_at", lowerBound)
      .lte("created_at", upperBound);

    for (const family of (day30Families ?? []) as FamilyWithMembers[]) {
      const owner = family.family_members.find((m) => m.user_id);
      if (!owner?.contact_email) continue;

      const { data: existing } = await supabase
        .from("email_campaigns")
        .select("id")
        .eq("family_member_id", owner.id)
        .eq("campaign_type", "day30_reengagement")
        .maybeSingle();
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

  // ── 5. Weekly digest (Sundays only, or force_digest=1 for testing) ──
  const forceDigest = new URL(request.url).searchParams.get("force_digest") === "1";
  if (dayOfWeek === 0 || forceDigest) {
    try {
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

      // ISO week key for deduplication (e.g. "weekly_digest_2026-W12")
      const isoWeek = (() => {
        const d = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
        const dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
        return `weekly_digest_${d.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
      })();

      const { data: families } = await supabase
        .from("families")
        .select("id, name, plan_type");

      const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      const ITEMS_PER_SECTION = 3;

      for (const family of families ?? []) {
        // ── Fetch this week's content in parallel ──
        const [journalRes, voiceRes, storyRes, recipeRes] = await Promise.all([
          supabase
            .from("journal_entries")
            .select("id, title, created_at, family_members!author_id(name), journal_photos!entry_id(url, sort_order)")
            .eq("family_id", family.id)
            .gte("created_at", weekAgo)
            .order("created_at", { ascending: false })
            .limit(ITEMS_PER_SECTION),
          supabase
            .from("voice_memos")
            .select("id, title, created_at, family_members!family_member_id(name)")
            .eq("family_id", family.id)
            .gte("created_at", weekAgo)
            .order("created_at", { ascending: false })
            .limit(ITEMS_PER_SECTION),
          supabase
            .from("family_stories")
            .select("id, title, created_at, cover_url, family_members!author_family_member_id(name)")
            .eq("family_id", family.id)
            .eq("published", true)
            .gte("created_at", weekAgo)
            .order("created_at", { ascending: false })
            .limit(ITEMS_PER_SECTION),
          supabase
            .from("family_recipes")
            .select("id, title, created_at, family_members!author_id(name)")
            .eq("family_id", family.id)
            .gte("created_at", weekAgo)
            .order("created_at", { ascending: false })
            .limit(ITEMS_PER_SECTION),
        ]);

        // ── Upcoming birthdays (next 7 days) ──
        const { data: allMembersForBirthday } = await supabase
          .from("family_members")
          .select("name, birth_date")
          .eq("family_id", family.id)
          .not("birth_date", "is", null);

        const todayLocal = new Date();
        todayLocal.setHours(0, 0, 0, 0);
        const upcomingBirthdays = (allMembersForBirthday ?? [])
          .map((m: { name: string; birth_date: string }) => {
            const bd = new Date(m.birth_date + "T12:00:00");
            const thisYear = new Date(todayLocal.getFullYear(), bd.getMonth(), bd.getDate());
            const next = thisYear < todayLocal
              ? new Date(todayLocal.getFullYear() + 1, bd.getMonth(), bd.getDate())
              : thisYear;
            const daysUntil = Math.round((next.getTime() - todayLocal.getTime()) / 86_400_000);
            const turningAge = bd.getFullYear() > 1900 ? next.getFullYear() - bd.getFullYear() : null;
            return { name: m.name, daysUntil, turningAge };
          })
          .filter((b: { daysUntil: number }) => b.daysUntil <= 7)
          .sort((a: { daysUntil: number }, b: { daysUntil: number }) => a.daysUntil - b.daysUntil);

        // ── On This Day (same MM-DD in prior years, 1 item) ──
        const { data: allJournal } = await supabase
          .from("journal_entries")
          .select("id, title, created_at")
          .eq("family_id", family.id)
          .order("created_at", { ascending: false })
          .limit(300);

        const todayMonth = todayLocal.getMonth();
        const todayDay = todayLocal.getDate();
        const todayYear = todayLocal.getFullYear();
        const onThisDayItem = ((allJournal ?? []) as { id: string; title: string; created_at: string }[])
          .filter((j) => {
            const d = new Date(j.created_at);
            return d.getMonth() === todayMonth && d.getDate() === todayDay && d.getFullYear() < todayYear;
          })
          .map((j) => ({
            title: j.title,
            yearsAgo: todayYear - new Date(j.created_at).getFullYear(),
            href: `/dashboard/journal/${j.id}`,
          }))
          .sort((a, b) => a.yearsAgo - b.yearsAgo)[0] ?? null;

        // ── Build content sections ──
        type MemberJoin = { name: string } | { name: string }[] | null;
        const resolveMember = (m: MemberJoin): string => {
          if (!m) return "Family";
          const mem = Array.isArray(m) ? m[0] : m;
          return mem?.name?.split(" ")[0] ?? "Family";
        };

        const sections: DigestSection[] = [];

        const journalItems = (journalRes.data ?? []).map((j: {
          id: string; title: string; created_at: string;
          family_members: MemberJoin;
          journal_photos: { url: string; sort_order: number | null }[] | { url: string; sort_order: number | null } | null;
        }) => ({
          title: j.title,
          authorName: resolveMember(j.family_members),
          thumbnailUrl: null,
          href: `/dashboard/journal/${j.id}`,
          dateLabel: DAYS[new Date(j.created_at).getDay()],
        }));
        if (journalItems.length > 0) sections.push({ label: "Journal", icon: "📓", items: journalItems });

        const voiceItems = (voiceRes.data ?? []).map((v: {
          id: string; title: string; created_at: string; family_members: MemberJoin;
        }) => ({
          title: v.title,
          authorName: resolveMember(v.family_members),
          thumbnailUrl: null,
          href: `/dashboard/voice-memos`,
          dateLabel: DAYS[new Date(v.created_at).getDay()],
        }));
        if (voiceItems.length > 0) sections.push({ label: "Voice Memos", icon: "🎙️", items: voiceItems });

        const storyItems = (storyRes.data ?? []).map((s: {
          id: string; title: string; created_at: string; cover_url: string | null; family_members: MemberJoin;
        }) => ({
          title: s.title,
          authorName: resolveMember(s.family_members),
          thumbnailUrl: null,
          href: `/dashboard/stories/${s.id}`,
          dateLabel: DAYS[new Date(s.created_at).getDay()],
        }));
        if (storyItems.length > 0) sections.push({ label: "Stories", icon: "📖", items: storyItems });

        const recipeItems = (recipeRes.data ?? []).map((r: {
          id: string; title: string; created_at: string; family_members: MemberJoin;
        }) => ({
          title: r.title,
          authorName: resolveMember(r.family_members),
          thumbnailUrl: null,
          href: `/dashboard/recipes`,
          dateLabel: DAYS[new Date(r.created_at).getDay()],
        }));
        if (recipeItems.length > 0) sections.push({ label: "Recipes", icon: "🍳", items: recipeItems });

        // Skip families with nothing to report
        if (sections.length === 0 && upcomingBirthdays.length === 0 && !onThisDayItem) continue;

        // ── Format date range label ──
        const weekStart = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000);
        const weekStartLabel = weekStart.toLocaleDateString("en-US", { month: "long", day: "numeric" });
        const weekEndLabel = todayLocal.toLocaleDateString("en-US", { month: "long", day: "numeric" });

        // ── Send one personalised email per subscribed member ──
        const { data: members } = await supabase
          .from("family_members")
          .select("id, name, nickname, contact_email")
          .eq("family_id", family.id)
          .eq("email_notifications", true)
          .not("contact_email", "is", null);

        for (const m of members ?? []) {
          if (!m.contact_email) continue;

          // Dedup: skip if we already sent this week's digest to this member
          const { data: alreadySent } = await supabase
            .from("email_campaigns")
            .select("id")
            .eq("family_member_id", m.id)
            .eq("campaign_type", isoWeek)
            .maybeSingle();
          if (alreadySent) continue;

          try {
            await resend.emails.send({
              from: fromEmail,
              to: m.contact_email,
              subject: `This week in ${esc(family.name)} Nest`,
              html: digestEmailHtml({
                familyName: family.name,
                recipientName: m.nickname?.trim() || m.name,
                weekStart: weekStartLabel,
                weekEnd: weekEndLabel,
                sections,
                upcomingBirthdays,
                onThisDayItem,
              }),
            });
            await supabase.from("email_campaigns").insert({
              family_member_id: m.id,
              campaign_type: isoWeek,
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

  // ── 6. Storage add-on grace period: reminders + enforcement ──────────────
  try {
    const now = new Date();
    const nowIso = now.toISOString();

    // Fetch all cancelling add-ons
    const { data: cancellingAddons } = await supabase
      .from("storage_addons")
      .select("id, family_id, bytes_added, label, grace_until, grace_email_sent_at")
      .eq("status", "cancelling")
      .not("grace_until", "is", null);

    for (const addon of cancellingAddons ?? []) {
      const graceUntil = new Date(addon.grace_until);
      const daysLeft = Math.ceil((graceUntil.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      // ── Reminder emails at 15, 7, and 1 days remaining ──
      const shouldRemind = [15, 7, 1].includes(daysLeft);
      if (shouldRemind) {
        const lastSent = addon.grace_email_sent_at ? new Date(addon.grace_email_sent_at) : null;
        const alreadySentToday = lastSent && lastSent.toISOString().slice(0, 10) === todayStr;
        if (!alreadySentToday) {
          const { data: family } = await supabase
            .from("families")
            .select("name, storage_used_bytes, storage_limit_bytes")
            .eq("id", addon.family_id)
            .single();

          const { data: members } = await supabase
            .from("family_members")
            .select("contact_email")
            .eq("family_id", addon.family_id)
            .in("role", ["owner", "adult"])
            .not("contact_email", "is", null);

          const emails = (members ?? []).map((m) => m.contact_email as string).filter(Boolean);

          if (family && emails.length > 0) {
            const newLimit = family.storage_limit_bytes - addon.bytes_added;
            const overBy = family.storage_used_bytes - newLimit;
            if (overBy > 0) {
              const overGb = (overBy / (1024 ** 3)).toFixed(1);
              const newLimitGb = (newLimit / (1024 ** 3)).toFixed(0);
              const urgency = daysLeft === 1 ? "🚨 Final warning" : daysLeft <= 7 ? "⚠️ Urgent" : "📦 Reminder";
              const subject = `${urgency}: ${daysLeft} day${daysLeft === 1 ? "" : "s"} to reduce storage in ${family.name}`;
              const html = `
                <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px">
                  <h2 style="color:#c53030">${urgency}: Storage reduction needed</h2>
                  <p>Your <strong>${addon.label}</strong> storage add-on for <strong>${family.name}</strong> has been cancelled.</p>
                  <p>You are <strong>${overGb} GB over</strong> your new limit of ${newLimitGb} GB.
                  You have <strong>${daysLeft} day${daysLeft === 1 ? "" : "s"}</strong> to remove files.</p>
                  <p>After ${graceUntil.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })},
                  Family Nest will automatically remove your largest media files to bring your account within its limit.
                  <strong>Journal entries, stories, and recipes will never be deleted.</strong></p>
                  <p><a href="https://www.familynest.io/dashboard/settings"
                    style="background:#e53e3e;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;display:inline-block">
                    Manage my storage
                  </a></p>
                  <p style="color:#666;font-size:13px;margin-top:24px">The Family Nest Team</p>
                </div>
              `;
              // Send individually — avoids exposing the full recipient list to
              // Resend in a single call (which would reveal family membership).
              let anySent = false;
              for (const to of emails) {
                try {
                  await resend.emails.send({ from: fromEmail, to, subject, html });
                  anySent = true;
                } catch (err) {
                  results.errors.push(`Grace reminder email to ${to} for addon ${addon.id}: ${err}`);
                }
              }
              if (anySent) {
                await supabase
                  .from("storage_addons")
                  .update({ grace_email_sent_at: nowIso })
                  .eq("id", addon.id);
                results.graceReminders++;
              }
            }
          }
        }
      }

      // ── Enforcement: grace period has expired ──
      if (daysLeft <= 0) {
        try {
          const { data: family } = await supabase
            .from("families")
            .select("name, storage_used_bytes, storage_limit_bytes")
            .eq("id", addon.family_id)
            .single();

          if (!family) continue;

          const newLimitBytes = family.storage_limit_bytes - addon.bytes_added;
          let bytesToFree = family.storage_used_bytes - newLimitBytes;

          // Media buckets that use {family_id}/ path prefix
          const mediaBuckets = [
            "journal-videos",
            "journal-photos",
            "voice-memos",
            "sports-photos",
            "artwork-photos",
            "pet-photos",
            "story-covers",
            "favourite-photos",
            "achievements",
            "award-files",
          ];

          if (bytesToFree > 0) {
            // Find all media files for this family sorted by size DESC
            const { data: objects } = await supabase
              .schema("storage" as never)
              .from("objects")
              .select("id, bucket_id, name, metadata")
              .in("bucket_id", mediaBuckets)
              .like("name", `${addon.family_id}/%`)
              .order("metadata->size" as never, { ascending: false });

            for (const obj of objects ?? []) {
              if (bytesToFree <= 0) break;
              const fileSize = Number((obj.metadata as Record<string, unknown>)?.size ?? 0);
              try {
                await supabase.storage.from(obj.bucket_id).remove([obj.name]);
                await supabase.rpc("decrement_storage_used", {
                  fid: addon.family_id,
                  bytes_to_subtract: fileSize,
                });
                bytesToFree -= fileSize;
              } catch (err) {
                results.errors.push(`Delete file ${obj.bucket_id}/${obj.name}: ${err}`);
              }
            }
          }

          // Mark add-on as cancelled and reduce storage limit
          await supabase
            .from("storage_addons")
            .update({ status: "cancelled" })
            .eq("id", addon.id);

          await supabase.rpc("decrement_storage_limit", {
            fid: addon.family_id,
            bytes_to_subtract: addon.bytes_added,
          });

          // Send final notification email
          const { data: members } = await supabase
            .from("family_members")
            .select("contact_email")
            .eq("family_id", addon.family_id)
            .in("role", ["owner", "adult"])
            .not("contact_email", "is", null);

          const emails = (members ?? []).map((m) => m.contact_email as string).filter(Boolean);
          if (emails.length > 0) {
            const filesRemoved = family.storage_used_bytes > newLimitBytes;
            const enforcementHtml = `
              <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px">
                <h2 style="color:#1a1a1a">Your storage add-on grace period has ended</h2>
                <p>Your <strong>${addon.label}</strong> add-on for <strong>${family.name}</strong> has been fully removed.</p>
                ${filesRemoved
                  ? `<p>Some media files were removed to bring your account within your storage limit.
                     Journal entries, stories, and recipes were not affected.</p>
                     <p>You can re-add storage at any time from your <a href="https://www.familynest.io/dashboard/settings">account settings</a>.</p>`
                  : `<p>Your usage was already within your new limit — no files were removed.</p>`
                }
                <p style="color:#666;font-size:13px;margin-top:24px">The Family Nest Team</p>
              </div>
            `;
            // Send individually — avoids exposing the full recipient list to
            // Resend in a single call (which would reveal family membership).
            for (const to of emails) {
              try {
                await resend.emails.send({
                  from: fromEmail,
                  to,
                  subject: `Storage update for ${family.name}`,
                  html: enforcementHtml,
                });
              } catch (err) {
                results.errors.push(`Grace enforcement email to ${to} for addon ${addon.id}: ${err}`);
              }
            }
          }

          results.graceEnforced++;
        } catch (err) {
          results.errors.push(`Grace enforcement for addon ${addon.id}: ${err}`);
        }
      }
    }
  } catch (err) {
    results.errors.push(`Storage grace period handler: ${err}`);
  }

  // ── 7. Storage capacity warnings (80% and 90% thresholds) ────────────────
  try {
    const yearMonth = todayStr.slice(0, 7); // YYYY-MM — dedup once per month per tier

    const { data: allFamilies } = await supabase
      .from("families")
      .select("id, name, storage_used_bytes, storage_limit_bytes")
      .gt("storage_limit_bytes", 0);

    for (const family of allFamilies ?? []) {
      const ratio = family.storage_used_bytes / family.storage_limit_bytes;
      if (ratio < 0.8) continue;

      const tier = ratio >= 0.9 ? 90 : 80;
      const campaignType = `storage_warning_${tier}_${yearMonth}`;

      const { data: owners } = await supabase
        .from("family_members")
        .select("id, contact_email, name")
        .eq("family_id", family.id)
        .eq("role", "owner")
        .not("contact_email", "is", null);

      for (const owner of owners ?? []) {
        if (!owner.contact_email) continue;

        const { data: existing } = await supabase
          .from("email_campaigns")
          .select("id")
          .eq("family_member_id", owner.id)
          .eq("campaign_type", campaignType)
          .maybeSingle();

        if (existing) continue;

        const usedPercent = Math.round(ratio * 100);
        const usedGb = (family.storage_used_bytes / (1024 ** 3)).toFixed(1);
        const limitGb = (family.storage_limit_bytes / (1024 ** 3)).toFixed(0);
        const urgencyLabel = tier >= 90 ? "⚠️ Almost full" : "📦 Storage heads-up";
        const accentColor = tier >= 90 ? "#f87171" : "#fbbf24";

        const html = emailWrapper(card(`
          <h2 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#f0f2f8;">${esc(urgencyLabel)}: ${usedPercent}% storage used</h2>
          <p style="margin:0 0 16px;font-size:15px;color:#94a3b8;line-height:1.6;">
            Hi ${esc(owner.name ?? "there")} — <strong style="color:#D4A843;">${esc(family.name)}</strong>'s Nest is using
            <strong style="color:${accentColor};">${usedGb} GB</strong> of your ${limitGb} GB limit.
          </p>
          ${tier >= 90
            ? `<p style="margin:0 0 20px;font-size:14px;color:#94a3b8;line-height:1.6;">You're almost at the limit. Consider upgrading your plan or removing older media so you can keep capturing memories without interruption.</p>`
            : `<p style="margin:0 0 20px;font-size:14px;color:#94a3b8;line-height:1.6;">You're in good shape for now — just keeping you in the loop so there are no surprises.</p>`}
          ${ctaButton("Manage storage", `${appUrl}/dashboard/settings`)}
        `));

        try {
          await resend.emails.send({
            from: fromEmail,
            to: owner.contact_email,
            subject: `${urgencyLabel}: ${family.name}'s Nest is ${usedPercent}% full`,
            html,
          });
          await supabase.from("email_campaigns").insert({
            family_member_id: owner.id,
            campaign_type: campaignType,
          });
          results.storageWarnings++;
        } catch (err) {
          results.errors.push(`Storage warning email for family ${family.id}: ${err}`);
        }
      }
    }
  } catch (err) {
    results.errors.push(`Storage capacity warnings: ${err}`);
  }

  if (results.errors.length > 0) {
    console.error(`[notifications cron] Completed with ${results.errors.length} error(s):`, results.errors);
    return NextResponse.json(results, { status: 500 });
  }

  return NextResponse.json(results);
}
