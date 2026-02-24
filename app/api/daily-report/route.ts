/**
 * Daily admin report cron endpoint.
 * Schedule: 0 7 * * * (7:00 AM UTC, every day)
 * Secured by CRON_SECRET — same pattern as /api/notifications.
 *
 * Sends a platform statistics email to ADMIN_REPORT_EMAIL (or falls back to
 * ADMIN_NOTIFICATION_EMAIL).
 */

import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { NextResponse } from "next/server";
import { adminReportEmailHtml, AdminReportStats } from "@/app/api/emails/templates/admin-report";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const resendKey = process.env.RESEND_API_KEY;
const cronSecret = process.env.CRON_SECRET;
const fromEmail =
  process.env.RESEND_FROM_EMAIL || "Family Nest <notifications@resend.dev>";

// Destination for the daily report — explicit env var or fall back to admin notification email.
const REPORT_EMAIL = "waterloo1983hawk22@gmail.com";

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (!bytes || bytes === 0) return "0 B";
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${parseFloat((bytes / Math.pow(1024, i)).toFixed(1))} ${sizes[i]}`;
}

function timeAgo(date: string | null | undefined): string {
  if (!date) return "Never";
  const diff = Date.now() - new Date(date).getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function GET(request: Request) {
  // ── Auth check ──────────────────────────────────────────────────────────────
  if (!cronSecret) {
    console.error("CRON_SECRET not set. Daily report cron is disabled.");
    return NextResponse.json({ error: "Cron not configured" }, { status: 503 });
  }

  const authHeader = request.headers.get("authorization");
  const { searchParams } = new URL(request.url);
  const queryKey = searchParams.get("key");
  const validBearer = authHeader === `Bearer ${cronSecret}`;
  const validQuery = queryKey === cronSecret;
  if (!validBearer && !validQuery) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!resendKey) {
    return NextResponse.json(
      { error: "RESEND_API_KEY not configured" },
      { status: 500 }
    );
  }
  if (!supabaseServiceKey) {
    return NextResponse.json(
      { error: "SUPABASE_SERVICE_ROLE_KEY not configured" },
      { status: 500 }
    );
  }

  // ── Setup ────────────────────────────────────────────────────────────────────
  const resend = new Resend(resendKey);
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const now = new Date();
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const sevenDaysAgo = new Date(Date.now() - 7 * 86_400_000).toISOString();
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86_400_000).toISOString();

  // ── Parallel data fetch ───────────────────────────────────────────────────────
  const [
    { data: families },
    { data: allMembers },
    { count: journalCount },
    { count: photoCount },
    { count: storyCount },
    { count: voiceMemoCount },
    { count: recipeCount },
    { count: eventCount },
    { count: capsuleCount },
    { count: achievementCount },
    { count: artworkCount },
    // 24h new counts
    { count: newFamilies24h },
    { count: newMembers24h },
    { count: newJournal24h },
    { count: newStories24h },
    { count: newVoice24h },
    { count: newRecipes24h },
    { count: newArtwork24h },
    // 7d new counts
    { count: newFamilies7d },
    { count: newFamilies30d },
    { count: newMembers7d },
    { count: newJournal7d },
    { count: newStories7d },
    { count: newVoice7d },
    { count: newRecipes7d },
    { count: newArtwork7d },
  ] = await Promise.all([
    supabase.from("families").select("*").order("created_at", { ascending: false }),
    supabase.from("family_members").select("family_id, user_id, role, created_at, name"),
    supabase.from("journal_entries").select("*", { count: "exact", head: true }),
    supabase.from("journal_photos").select("*", { count: "exact", head: true }),
    supabase.from("family_stories").select("*", { count: "exact", head: true }),
    supabase.from("voice_memos").select("*", { count: "exact", head: true }),
    supabase.from("recipes").select("*", { count: "exact", head: true }),
    supabase.from("family_events").select("*", { count: "exact", head: true }),
    supabase.from("time_capsules").select("*", { count: "exact", head: true }),
    supabase.from("achievements").select("*", { count: "exact", head: true }),
    supabase.from("artwork_pieces").select("*", { count: "exact", head: true }),
    // 24 h
    supabase.from("families").select("*", { count: "exact", head: true }).gte("created_at", oneDayAgo),
    supabase.from("family_members").select("*", { count: "exact", head: true }).gte("created_at", oneDayAgo),
    supabase.from("journal_entries").select("*", { count: "exact", head: true }).gte("created_at", oneDayAgo),
    supabase.from("family_stories").select("*", { count: "exact", head: true }).gte("created_at", oneDayAgo),
    supabase.from("voice_memos").select("*", { count: "exact", head: true }).gte("created_at", oneDayAgo),
    supabase.from("recipes").select("*", { count: "exact", head: true }).gte("created_at", oneDayAgo),
    supabase.from("artwork_pieces").select("*", { count: "exact", head: true }).gte("created_at", oneDayAgo),
    // 7 d
    supabase.from("families").select("*", { count: "exact", head: true }).gte("created_at", sevenDaysAgo),
    supabase.from("families").select("*", { count: "exact", head: true }).gte("created_at", thirtyDaysAgo),
    supabase.from("family_members").select("*", { count: "exact", head: true }).gte("created_at", sevenDaysAgo),
    supabase.from("journal_entries").select("*", { count: "exact", head: true }).gte("created_at", sevenDaysAgo),
    supabase.from("family_stories").select("*", { count: "exact", head: true }).gte("created_at", sevenDaysAgo),
    supabase.from("voice_memos").select("*", { count: "exact", head: true }).gte("created_at", sevenDaysAgo),
    supabase.from("recipes").select("*", { count: "exact", head: true }).gte("created_at", sevenDaysAgo),
    supabase.from("artwork_pieces").select("*", { count: "exact", head: true }).gte("created_at", sevenDaysAgo),
  ]);

  // ── Derived stats ─────────────────────────────────────────────────────────────
  const totalFamilies = families?.length ?? 0;
  const totalMembers = allMembers?.length ?? 0;
  const membersWithAccounts = allMembers?.filter((m) => m.user_id).length ?? 0;

  const planBreakdown = {
    free: families?.filter((f) => f.plan_type === "free").length ?? 0,
    annual: families?.filter((f) => f.plan_type === "annual").length ?? 0,
    legacy: families?.filter((f) => f.plan_type === "legacy").length ?? 0,
  };
  const paidFamilies = planBreakdown.annual + planBreakdown.legacy;
  const conversionPct =
    totalFamilies > 0 ? Math.round((paidFamilies / totalFamilies) * 100) : 0;

  const totalStorageBytes =
    families?.reduce((sum, f) => sum + (f.storage_used_bytes ?? 0), 0) ?? 0;

  const newContent24h =
    (newJournal24h ?? 0) +
    (newStories24h ?? 0) +
    (newVoice24h ?? 0) +
    (newRecipes24h ?? 0) +
    (newArtwork24h ?? 0);

  const newContent7d =
    (newJournal7d ?? 0) +
    (newStories7d ?? 0) +
    (newVoice7d ?? 0) +
    (newRecipes7d ?? 0) +
    (newArtwork7d ?? 0);

  const totalContentItems =
    (journalCount ?? 0) +
    (storyCount ?? 0) +
    (voiceMemoCount ?? 0) +
    (recipeCount ?? 0) +
    (eventCount ?? 0) +
    (capsuleCount ?? 0) +
    (achievementCount ?? 0) +
    (artworkCount ?? 0);

  const membersByFamily =
    allMembers?.reduce(
      (acc, m) => {
        acc[m.family_id] = (acc[m.family_id] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    ) ?? {};

  // ── Build stats payload ───────────────────────────────────────────────────────
  const stats: AdminReportStats = {
    date: now.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
    totalFamilies,
    paidFamilies,
    freeFamilies: planBreakdown.free,
    annualFamilies: planBreakdown.annual,
    legacyFamilies: planBreakdown.legacy,
    totalMembers,
    membersWithAccounts,
    conversionPct,
    totalStorageGB: formatBytes(totalStorageBytes),
    newFamilies24h: newFamilies24h ?? 0,
    newMembers24h: newMembers24h ?? 0,
    newContent24h,
    newFamilies7d: newFamilies7d ?? 0,
    newMembers7d: newMembers7d ?? 0,
    newContent7d,
    newFamilies30d: newFamilies30d ?? 0,
    journalEntries: journalCount ?? 0,
    photos: photoCount ?? 0,
    stories: storyCount ?? 0,
    voiceMemos: voiceMemoCount ?? 0,
    recipes: recipeCount ?? 0,
    events: eventCount ?? 0,
    timeCapsules: capsuleCount ?? 0,
    achievements: achievementCount ?? 0,
    artwork: artworkCount ?? 0,
    totalContentItems,
    families: (families ?? []).map((f) => ({
      name: f.name,
      plan: f.plan_type,
      memberCount: membersByFamily[f.id] ?? 0,
      storageUsed: formatBytes(f.storage_used_bytes ?? 0),
      storageLimit: formatBytes(f.storage_limit_bytes ?? 0),
      joinedAgo: timeAgo(f.created_at),
    })),
  };

  // ── Send email ────────────────────────────────────────────────────────────────
  try {
    await resend.emails.send({
      from: fromEmail,
      to: REPORT_EMAIL,
      subject: `📊 FamilyNest Daily Report — ${stats.date}`,
      html: adminReportEmailHtml(stats),
    });
  } catch (err) {
    console.error("Failed to send daily admin report email:", err);
    return NextResponse.json(
      { error: "Email send failed", details: String(err) },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    sentTo: REPORT_EMAIL,
    stats: {
      totalFamilies,
      paidFamilies,
      totalMembers,
      newFamilies24h: stats.newFamilies24h,
      newContent24h: stats.newContent24h,
      totalContentItems,
    },
  });
}
