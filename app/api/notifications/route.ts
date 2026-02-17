/**
 * Notification cron endpoint.
 * Call via Vercel Cron or external scheduler: GET /api/notifications?key=SECRET
 *
 * Handles:
 *   1. Birthday reminders (3 days before)
 *   2. Time capsule unlock notifications (on unlock date)
 *   3. Weekly digest (Sundays)
 */

import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const resendKey = process.env.RESEND_API_KEY;
const cronSecret = process.env.CRON_SECRET;
const fromEmail = process.env.RESEND_FROM_EMAIL || "Our Family Nest <notifications@resend.dev>";
const appUrl = process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://localhost:3000");

function e(s: string): string {
  return s.replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function emailFooter(): string {
  return `<tr><td style="text-align:center;padding-top:24px;">
  <p style="color:#64748b;font-size:12px;margin:0;">Our Family Nest &middot; <a href="${appUrl}/dashboard/settings" style="color:#64748b;">Manage notifications</a></p>
  <p style="color:#475569;font-size:11px;margin:8px 0 0;">
    <a href="${appUrl}/dashboard/settings" style="color:#475569;text-decoration:underline;">Unsubscribe</a> from these emails
  </p>
</td></tr>`;
}

export async function GET(request: Request) {
  // Auth check
  const { searchParams } = new URL(request.url);
  const key = searchParams.get("key");
  if (cronSecret && key !== cronSecret) {
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
    errors: [] as string[]
  };

  // ── 1. Birthday reminders (3 days before) ──
  try {
    // Find members whose birthday is 3 days from now (match month + day)
    const { data: allMembers } = await supabase
      .from("family_members")
      .select("id, name, nickname, birth_date, family_id")
      .not("birth_date", "is", null);

    const birthdayMembers = (allMembers ?? []).filter((m) => {
      if (!m.birth_date) return false;
      const bd = m.birth_date.slice(5); // MM-DD
      const target = threeDaysOut.slice(5);
      return bd === target;
    });

    for (const bm of birthdayMembers) {
      // Get all family members with emails in this family
      const { data: familyMembers } = await supabase
        .from("family_members")
        .select("contact_email, name")
        .eq("family_id", bm.family_id)
        .not("contact_email", "is", null)
        .neq("id", bm.id);

      const displayName = bm.nickname?.trim() || bm.name;
      const birthYear = bm.birth_date ? new Date(bm.birth_date + "T12:00:00").getFullYear() : null;
      const turningAge = birthYear ? today.getFullYear() - birthYear + (threeDaysOut.slice(5) < todayStr.slice(5) ? 1 : 0) : null;
      const ageText = turningAge ? ` (turning ${turningAge})` : "";

      for (const fm of familyMembers ?? []) {
        if (!fm.contact_email) continue;
        try {
          await resend.emails.send({
            from: fromEmail,
            to: fm.contact_email,
            subject: `🎂 ${e(displayName)}'s birthday is in 3 days!`,
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
      // Get the recipient
      const { data: recipient } = await supabase
        .from("family_members")
        .select("name, nickname, contact_email")
        .eq("id", cap.to_family_member_id)
        .single();

      if (!recipient?.contact_email) continue;

      // Get sender name
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
      .from('families')
      .select('id, name, family_members!inner(id, name, contact_email, user_id)')
      .gte('created_at', oneDayAgo)
      .lte('created_at', oneDayAgoEnd);

    for (const family of newFamilies ?? []) {
      const { count: photoCount } = await supabase
        .from('journal_photos')
        .select('*', { count: 'exact', head: true })
        .eq('family_id', family.id);

      if (photoCount === 0) {
        const owner = (family.family_members as any[]).find((m: any) => m.user_id);
        if (!owner?.contact_email) continue;

        const { data: existingCampaign } = await supabase
          .from('email_campaigns')
          .select('id')
          .eq('family_member_id', owner.id)
          .eq('campaign_type', 'day1_nudge')
          .single();

        if (existingCampaign) continue;

        try {
          await resend.emails.send({
            from: fromEmail,
            to: owner.contact_email,
            subject: "Your family's story starts with one photo 📷",
            html: day1ActivationEmailHtml(owner.name),
          });

          await supabase.from('email_campaigns').insert({
            family_member_id: owner.id,
            campaign_type: 'day1_nudge',
          });

          results.day1Nudges++;
        } catch (err) {
          results.errors.push(`Day 1 email to ${owner.contact_email}: ${err}`);
        }
      }
    }
  } catch (err) {
    results.errors.push(`Day 1 campaign: ${err}`);
  }

  // Day 3: Feature Discovery for users with < 3 features used
  try {
    const threeDaysAgo = new Date(Date.now() - 73 * 60 * 60 * 1000).toISOString();
    const threeDaysAgoEnd = new Date(Date.now() - 71 * 60 * 60 * 1000).toISOString();

    const { data: day3Families } = await supabase
      .from('families')
      .select('id, name, family_members!inner(id, name, contact_email, user_id)')
      .gte('created_at', threeDaysAgo)
      .lte('created_at', threeDaysAgoEnd);

    for (const family of day3Families ?? []) {
      const owner = (family.family_members as any[]).find((m: any) => m.user_id);
      if (!owner?.contact_email) continue;

      const { data: existing } = await supabase.from('email_campaigns').select('id').eq('family_member_id', owner.id).eq('campaign_type', 'day3_discovery').single();
      if (existing) continue;

      try {
        await resend.emails.send({
          from: fromEmail, to: owner.contact_email,
          subject: 'Did you know? Your Nest has these hidden gems ✨',
          html: day3DiscoveryEmailHtml(owner.name),
        });
        await supabase.from('email_campaigns').insert({ family_member_id: owner.id, campaign_type: 'day3_discovery' });
        results.day3Discovery++;
      } catch (err) { results.errors.push(`Day 3 email to ${owner.contact_email}: ${err}`); }
    }
  } catch (err) { results.errors.push(`Day 3 campaign: ${err}`); }

  // Day 5: Invite Encouragement for single-member families
  try {
    const fiveDaysAgo = new Date(Date.now() - 121 * 60 * 60 * 1000).toISOString();
    const fiveDaysAgoEnd = new Date(Date.now() - 119 * 60 * 60 * 1000).toISOString();

    const { data: day5Families } = await supabase
      .from('families')
      .select('id, name, family_members(id, name, contact_email, user_id)')
      .gte('created_at', fiveDaysAgo)
      .lte('created_at', fiveDaysAgoEnd);

    for (const family of day5Families ?? []) {
      const members = family.family_members as any[];
      if (members.length > 1) continue; // already invited someone
      const owner = members.find((m: any) => m.user_id);
      if (!owner?.contact_email) continue;

      const { data: existing } = await supabase.from('email_campaigns').select('id').eq('family_member_id', owner.id).eq('campaign_type', 'day5_invite').single();
      if (existing) continue;

      try {
        await resend.emails.send({
          from: fromEmail, to: owner.contact_email,
          subject: 'Your family is waiting to join 👋',
          html: day5InviteEmailHtml(owner.name),
        });
        await supabase.from('email_campaigns').insert({ family_member_id: owner.id, campaign_type: 'day5_invite' });
        results.day5Invites++;
      } catch (err) { results.errors.push(`Day 5 email to ${owner.contact_email}: ${err}`); }
    }
  } catch (err) { results.errors.push(`Day 5 campaign: ${err}`); }

  // Day 14: Upgrade Consideration for active Free tier users
  try {
    const fourteenDaysAgo = new Date(Date.now() - 337 * 60 * 60 * 1000).toISOString();
    const fourteenDaysAgoEnd = new Date(Date.now() - 335 * 60 * 60 * 1000).toISOString();

    const { data: day14Families } = await supabase
      .from('families')
      .select('id, name, family_members!inner(id, name, contact_email, user_id)')
      .gte('created_at', fourteenDaysAgo)
      .lte('created_at', fourteenDaysAgoEnd);

    for (const family of day14Families ?? []) {
      const owner = (family.family_members as any[]).find((m: any) => m.user_id);
      if (!owner?.contact_email) continue;

      const { data: existing } = await supabase.from('email_campaigns').select('id').eq('family_member_id', owner.id).eq('campaign_type', 'day14_upgrade').single();
      if (existing) continue;

      const { count: journalCount } = await supabase.from('journal_entries').select('id', { count: 'exact', head: true }).eq('family_id', family.id);
      if ((journalCount ?? 0) < 3) continue; // only nudge active users

      try {
        await resend.emails.send({
          from: fromEmail, to: owner.contact_email,
          subject: 'Ready to unlock unlimited memories? 🔓',
          html: day14UpgradeEmailHtml(owner.name),
        });
        await supabase.from('email_campaigns').insert({ family_member_id: owner.id, campaign_type: 'day14_upgrade' });
        results.day14Upgrades++;
      } catch (err) { results.errors.push(`Day 14 email to ${owner.contact_email}: ${err}`); }
    }
  } catch (err) { results.errors.push(`Day 14 campaign: ${err}`); }

  // Day 30: Re-engagement for dormant users
  try {
    const thirtyDaysAgo = new Date(Date.now() - 721 * 60 * 60 * 1000).toISOString();
    const thirtyDaysAgoEnd = new Date(Date.now() - 719 * 60 * 60 * 1000).toISOString();

    const { data: day30Families } = await supabase
      .from('families')
      .select('id, name, family_members!inner(id, name, contact_email, user_id)')
      .gte('created_at', thirtyDaysAgo)
      .lte('created_at', thirtyDaysAgoEnd);

    for (const family of day30Families ?? []) {
      const owner = (family.family_members as any[]).find((m: any) => m.user_id);
      if (!owner?.contact_email) continue;

      const { data: existing } = await supabase.from('email_campaigns').select('id').eq('family_member_id', owner.id).eq('campaign_type', 'day30_reengagement').single();
      if (existing) continue;

      try {
        await resend.emails.send({
          from: fromEmail, to: owner.contact_email,
          subject: 'Your family misses you 💙',
          html: day30ReengagementEmailHtml(owner.name, family.name),
        });
        await supabase.from('email_campaigns').insert({ family_member_id: owner.id, campaign_type: 'day30_reengagement' });
        results.day30Reengagement++;
      } catch (err) { results.errors.push(`Day 30 email to ${owner.contact_email}: ${err}`); }
    }
  } catch (err) { results.errors.push(`Day 30 campaign: ${err}`); }

  // ── 4. Weekly digest (Sundays only) ──
  if (dayOfWeek === 0) {
    try {
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

      // Get all families
      const { data: families } = await supabase.from("families").select("id, name");

      for (const family of families ?? []) {
        // Count activity this week
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
        const total = jCount + pCount + vCount + sCount;

        if (total === 0) continue; // Skip families with no activity

        // Get family members with emails
        const { data: members } = await supabase
          .from("family_members")
          .select("contact_email, name, nickname")
          .eq("family_id", family.id)
          .not("contact_email", "is", null);

        for (const m of members ?? []) {
          if (!m.contact_email) continue;
          try {
            await resend.emails.send({
              from: fromEmail,
              to: m.contact_email,
              subject: `This week in ${e(family.name)} Nest`,
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

// ── Email Templates ──

function birthdayEmailHtml(name: string, ageText: string, recipientName: string): string {
  return `
<!DOCTYPE html><html><body style="margin:0;padding:0;background:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;padding:32px 20px;">
<tr><td style="text-align:center;padding-bottom:24px;">
  <span style="font-size:48px;">🎂</span>
</td></tr>
<tr><td style="background:#1e293b;border-radius:12px;padding:32px 24px;border:1px solid #334155;">
  <h1 style="margin:0 0 8px;font-size:22px;color:#f8fafc;">${e(name)}'s birthday is in 3 days!${ageText}</h1>
  <p style="margin:0 0 20px;color:#94a3b8;font-size:15px;line-height:1.5;">
    Hi ${e(recipientName)}, just a heads up — ${e(name)}'s birthday is coming up. 
    Maybe write them a time capsule, share a memory, or send a message?
  </p>
  <a href="${appUrl}/dashboard/time-capsules" style="display:inline-block;background:#D4A843;color:#0f172a;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">
    Write them a time capsule
  </a>
</td></tr>
${emailFooter()}
</table></body></html>`;
}

function capsuleEmailHtml(recipientName: string, senderName: string, title: string): string {
  return `
<!DOCTYPE html><html><body style="margin:0;padding:0;background:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;padding:32px 20px;">
<tr><td style="text-align:center;padding-bottom:24px;">
  <span style="font-size:48px;">💌</span>
</td></tr>
<tr><td style="background:#1e293b;border-radius:12px;padding:32px 24px;border:1px solid #334155;">
  <h1 style="margin:0 0 8px;font-size:22px;color:#f8fafc;">A time capsule has been unlocked!</h1>
  <p style="margin:0 0 8px;color:#94a3b8;font-size:15px;line-height:1.5;">
    Hi ${e(recipientName)},
  </p>
  <p style="margin:0 0 20px;color:#94a3b8;font-size:15px;line-height:1.5;">
    ${e(senderName)} wrote you a letter called <strong style="color:#f8fafc;">"${e(title)}"</strong> and today is the day it was meant to be opened. 
  </p>
  <a href="${appUrl}/dashboard/time-capsules" style="display:inline-block;background:#D4A843;color:#0f172a;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">
    Read your letter
  </a>
</td></tr>
${emailFooter()}
</table></body></html>`;
}

function digestEmailHtml(
  name: string,
  familyName: string,
  counts: { journals: number; photos: number; voices: number; stories: number }
): string {
  const items: string[] = [];
  if (counts.journals) items.push(`${counts.journals} journal ${counts.journals === 1 ? "entry" : "entries"}`);
  if (counts.photos) items.push(`${counts.photos} photo${counts.photos === 1 ? "" : "s"}`);
  if (counts.voices) items.push(`${counts.voices} voice memo${counts.voices === 1 ? "" : "s"}`);
  if (counts.stories) items.push(`${counts.stories} ${counts.stories === 1 ? "story" : "stories"}`);
  const summary = items.join(", ");

  return `
<!DOCTYPE html><html><body style="margin:0;padding:0;background:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;padding:32px 20px;">
<tr><td style="text-align:center;padding-bottom:24px;">
  <span style="font-size:28px;color:#D4A843;font-weight:700;">${e(familyName)} Nest</span>
</td></tr>
<tr><td style="background:#1e293b;border-radius:12px;padding:32px 24px;border:1px solid #334155;">
  <h1 style="margin:0 0 8px;font-size:22px;color:#f8fafc;">This week in your Family Nest</h1>
  <p style="margin:0 0 4px;color:#94a3b8;font-size:15px;">Hi ${e(name)},</p>
  <p style="margin:0 0 20px;color:#94a3b8;font-size:15px;line-height:1.5;">
    Your family added <strong style="color:#f8fafc;">${summary}</strong> this week. Don't miss out!
  </p>
  <a href="${appUrl}/dashboard" style="display:inline-block;background:#D4A843;color:#0f172a;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">
    See what's new
  </a>
</td></tr>
${emailFooter()}
</table></body></html>`;
}

// ── Activation Drip Campaign Email Templates ──

function day1ActivationEmailHtml(name: string): string {
  return `
<!DOCTYPE html><html><body style="margin:0;padding:0;background:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;padding:32px 20px;">
<tr><td style="text-align:center;padding-bottom:24px;"><span style="font-size:48px;">📷</span></td></tr>
<tr><td style="background:#1e293b;border-radius:12px;padding:32px 24px;border:1px solid #334155;">
  <h1 style="margin:0 0 8px;font-size:22px;color:#f8fafc;">Your family's story starts with one photo</h1>
  <p style="margin:0 0 12px;color:#94a3b8;font-size:15px;">Hi ${e(name)},</p>
  <p style="margin:0 0 12px;color:#94a3b8;font-size:15px;line-height:1.5;">Yesterday you created your Family Nest. We noticed you haven't uploaded your first photo yet!</p>
  <p style="margin:0 0 4px;color:#94a3b8;font-size:15px;"><strong style="color:#f8fafc;">Here's why your first photo matters:</strong></p>
  <ul style="margin:8px 0 20px;padding-left:20px;color:#94a3b8;font-size:15px;line-height:1.7;">
    <li>It kicks off your family timeline</li>
    <li>It becomes searchable and shareable</li>
    <li>It inspires others in your family to contribute</li>
  </ul>
  <a href="${appUrl}/dashboard/photos" style="display:inline-block;background:#D4A843;color:#0f172a;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">Upload Your First Photo Now</a>
</td></tr>
<tr><td style="text-align:center;padding-top:24px;"><p style="color:#64748b;font-size:12px;margin:0;">Our Family Nest</p></td></tr>
</table></body></html>`;
}

function day3DiscoveryEmailHtml(name: string): string {
  return `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;padding:32px 20px;">
<tr><td style="text-align:center;padding-bottom:24px;"><span style="font-size:48px;">✨</span></td></tr>
<tr><td style="background:#1e293b;border-radius:12px;padding:32px 24px;border:1px solid #334155;">
  <h1 style="margin:0 0 8px;font-size:22px;color:#f8fafc;">Did you know? Your Nest has these hidden gems</h1>
  <p style="margin:0 0 12px;color:#94a3b8;font-size:15px;">Hi ${e(name)},</p>
  <p style="margin:0 0 16px;color:#94a3b8;font-size:15px;line-height:1.5;">Your Family Nest can do so much more than store photos. Here are a few features worth exploring:</p>
  <ul style="margin:0 0 20px;padding-left:20px;color:#94a3b8;font-size:15px;line-height:1.7;">
    <li><strong style="color:#f8fafc;">Voice Memos</strong> — Record grandparents telling stories</li>
    <li><strong style="color:#f8fafc;">Recipes</strong> — Preserve family recipes with the story behind them</li>
    <li><strong style="color:#f8fafc;">Time Capsules</strong> — Write letters to future family members</li>
    <li><strong style="color:#f8fafc;">Family Map</strong> — Pin your family's important places</li>
  </ul>
  <a href="${appUrl}/dashboard" style="display:inline-block;background:#D4A843;color:#0f172a;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">Explore Features</a>
</td></tr>
<tr><td style="text-align:center;padding-top:24px;"><p style="color:#64748b;font-size:12px;margin:0;">Our Family Nest</p></td></tr>
</table></body></html>`;
}

function day5InviteEmailHtml(name: string): string {
  return `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;padding:32px 20px;">
<tr><td style="text-align:center;padding-bottom:24px;"><span style="font-size:48px;">👋</span></td></tr>
<tr><td style="background:#1e293b;border-radius:12px;padding:32px 24px;border:1px solid #334155;">
  <h1 style="margin:0 0 8px;font-size:22px;color:#f8fafc;">Your family is waiting to join!</h1>
  <p style="margin:0 0 12px;color:#94a3b8;font-size:15px;">Hi ${e(name)},</p>
  <p style="margin:0 0 16px;color:#94a3b8;font-size:15px;line-height:1.5;">A Family Nest is so much better when the whole family is involved. Imagine grandparents seeing photos the same day they happen, or cousins sharing memories from across the country.</p>
  <p style="margin:0 0 20px;color:#94a3b8;font-size:15px;line-height:1.5;">Inviting family takes just 30 seconds — share a link and they're in.</p>
  <a href="${appUrl}/dashboard/members" style="display:inline-block;background:#D4A843;color:#0f172a;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">Invite Your Family</a>
</td></tr>
<tr><td style="text-align:center;padding-top:24px;"><p style="color:#64748b;font-size:12px;margin:0;">Our Family Nest</p></td></tr>
</table></body></html>`;
}

function day14UpgradeEmailHtml(name: string): string {
  return `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;padding:32px 20px;">
<tr><td style="text-align:center;padding-bottom:24px;"><span style="font-size:48px;">🔓</span></td></tr>
<tr><td style="background:#1e293b;border-radius:12px;padding:32px 24px;border:1px solid #334155;">
  <h1 style="margin:0 0 8px;font-size:22px;color:#f8fafc;">Ready to unlock unlimited memories?</h1>
  <p style="margin:0 0 12px;color:#94a3b8;font-size:15px;">Hi ${e(name)},</p>
  <p style="margin:0 0 16px;color:#94a3b8;font-size:15px;line-height:1.5;">You've been using your Family Nest for two weeks now — that's amazing! You're approaching the Free plan limits, and there's so much more available:</p>
  <ul style="margin:0 0 20px;padding-left:20px;color:#94a3b8;font-size:15px;line-height:1.7;">
    <li><strong style="color:#f8fafc;">Unlimited journals</strong> with video uploads</li>
    <li><strong style="color:#f8fafc;">10 GB storage</strong> for photos + videos</li>
    <li><strong style="color:#f8fafc;">Voice memos, recipes, time capsules</strong></li>
    <li><strong style="color:#f8fafc;">Weekly digest</strong> + birthday reminders</li>
  </ul>
  <p style="margin:0 0 20px;color:#94a3b8;font-size:15px;">All for just <strong style="color:#f8fafc;">$4.08/month</strong> (billed $49/year) — or 13 cents a day.</p>
  <a href="${appUrl}/pricing" style="display:inline-block;background:#D4A843;color:#0f172a;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">See Plans &amp; Pricing</a>
</td></tr>
<tr><td style="text-align:center;padding-top:24px;"><p style="color:#64748b;font-size:12px;margin:0;">Our Family Nest</p></td></tr>
</table></body></html>`;
}

function day30ReengagementEmailHtml(name: string, familyName: string): string {
  return `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;padding:32px 20px;">
<tr><td style="text-align:center;padding-bottom:24px;"><span style="font-size:48px;">💙</span></td></tr>
<tr><td style="background:#1e293b;border-radius:12px;padding:32px 24px;border:1px solid #334155;">
  <h1 style="margin:0 0 8px;font-size:22px;color:#f8fafc;">Your family misses you</h1>
  <p style="margin:0 0 12px;color:#94a3b8;font-size:15px;">Hi ${e(name)},</p>
  <p style="margin:0 0 16px;color:#94a3b8;font-size:15px;line-height:1.5;">It's been a while since you've visited the ${e(familyName)} Nest. Every day is a chance to capture a memory that future generations will treasure.</p>
  <p style="margin:0 0 20px;color:#94a3b8;font-size:15px;line-height:1.5;">Even a single photo or a quick journal entry keeps the story going. Your family is counting on you.</p>
  <a href="${appUrl}/dashboard" style="display:inline-block;background:#D4A843;color:#0f172a;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">Visit Your Nest</a>
</td></tr>
<tr><td style="text-align:center;padding-top:24px;"><p style="color:#64748b;font-size:12px;margin:0;">Our Family Nest</p></td></tr>
</table></body></html>`;
}
