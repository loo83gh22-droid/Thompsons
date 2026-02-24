/**
 * Admin statistics dashboard — accessible only to the ADMIN_NOTIFICATION_EMAIL address.
 * Redirects everyone else to /dashboard.
 */

import { redirect } from "next/navigation";
import { createClient as createSSRClient } from "@/src/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";

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

function fmtDate(date: string | null | undefined): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function AdminPage() {
  // ── Auth guard ──────────────────────────────────────────────────────────────
  const ssr = await createSSRClient();
  const {
    data: { user },
  } = await ssr.auth.getUser();

  const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL;
  if (!user || user.email !== adminEmail) {
    redirect("/dashboard");
  }

  // ── Service-role client (bypasses RLS for cross-family queries) ─────────────
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const now = new Date();
  const sevenDaysAgo = new Date(Date.now() - 7 * 86_400_000).toISOString();
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86_400_000).toISOString();

  // ── Parallel data fetches ───────────────────────────────────────────────────
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
    { count: newFamilies7d },
    { count: newFamilies30d },
    { count: newMembers7d },
    { data: recentJournal },
    { data: recentStories },
    { data: recentVoice },
    { data: recentRecipes },
    { data: recentArtwork },
    { data: feedbackItems },
    { data: campaignStats },
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
    supabase
      .from("families")
      .select("*", { count: "exact", head: true })
      .gte("created_at", sevenDaysAgo),
    supabase
      .from("families")
      .select("*", { count: "exact", head: true })
      .gte("created_at", thirtyDaysAgo),
    supabase
      .from("family_members")
      .select("*", { count: "exact", head: true })
      .gte("created_at", sevenDaysAgo),
    supabase
      .from("journal_entries")
      .select("family_id, created_at")
      .gte("created_at", sevenDaysAgo),
    supabase
      .from("family_stories")
      .select("family_id, created_at")
      .gte("created_at", sevenDaysAgo),
    supabase
      .from("voice_memos")
      .select("family_id, created_at")
      .gte("created_at", sevenDaysAgo),
    supabase
      .from("recipes")
      .select("family_id, created_at")
      .gte("created_at", sevenDaysAgo),
    supabase
      .from("artwork_pieces")
      .select("family_id, created_at")
      .gte("created_at", sevenDaysAgo),
    supabase
      .from("feedback")
      .select("id, category, status, subject, created_at, rating")
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("email_campaigns")
      .select("campaign_type")
      .gte("sent_at", thirtyDaysAgo),
  ]);

  // ── Derived stats ───────────────────────────────────────────────────────────
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
    totalFamilies > 0
      ? Math.round((paidFamilies / totalFamilies) * 100)
      : 0;

  const totalStorageBytes =
    families?.reduce((sum, f) => sum + (f.storage_used_bytes ?? 0), 0) ?? 0;

  const newContent7d =
    (recentJournal?.length ?? 0) +
    (recentStories?.length ?? 0) +
    (recentVoice?.length ?? 0) +
    (recentRecipes?.length ?? 0) +
    (recentArtwork?.length ?? 0);

  const totalContentItems =
    (journalCount ?? 0) +
    (storyCount ?? 0) +
    (voiceMemoCount ?? 0) +
    (recipeCount ?? 0) +
    (eventCount ?? 0) +
    (capsuleCount ?? 0) +
    (achievementCount ?? 0) +
    (artworkCount ?? 0);

  // Members per family map
  const membersByFamily =
    allMembers?.reduce(
      (acc, m) => {
        acc[m.family_id] = (acc[m.family_id] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    ) ?? {};

  // Campaign counts
  const campaignCounts =
    campaignStats?.reduce(
      (acc, c) => {
        acc[c.campaign_type] = (acc[c.campaign_type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    ) ?? {};

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        {/* ── Header ── */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              🪺 FamilyNest Admin
            </h1>
            <p className="text-slate-500 mt-1">
              Platform overview &middot;{" "}
              {now.toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
          <a
            href="/dashboard"
            className="text-sm text-slate-500 hover:text-slate-800 underline"
          >
            ← Back to dashboard
          </a>
        </div>

        {/* ── Top KPI cards ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <KpiCard
            label="Total Families"
            value={totalFamilies}
            icon="🏠"
          />
          <KpiCard
            label="Paid Families"
            value={paidFamilies}
            sub={`${conversionPct}% conversion`}
            icon="💰"
            accent="indigo"
          />
          <KpiCard
            label="Members (linked)"
            value={`${membersWithAccounts} / ${totalMembers}`}
            sub="with login / total"
            icon="👥"
          />
          <KpiCard
            label="Total Storage Used"
            value={formatBytes(totalStorageBytes)}
            icon="💾"
          />
        </div>

        {/* ── Activity this week ── */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">
              New Families
            </p>
            <p className="text-4xl font-bold text-indigo-600">
              {newFamilies7d ?? 0}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              last 7 days &middot; {newFamilies30d ?? 0} last 30d
            </p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">
              New Members
            </p>
            <p className="text-4xl font-bold text-emerald-600">
              {newMembers7d ?? 0}
            </p>
            <p className="text-xs text-slate-400 mt-1">last 7 days</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">
              New Content Items
            </p>
            <p className="text-4xl font-bold text-purple-600">{newContent7d}</p>
            <p className="text-xs text-slate-400 mt-1">
              journal · stories · voice · recipes · art
            </p>
          </div>
        </div>

        {/* ── Plan breakdown + Content library ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Plan breakdown */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-base font-semibold text-slate-800 mb-4">
              Plan Breakdown
            </h2>
            <div className="space-y-4">
              <PlanBar
                label="Free"
                count={planBreakdown.free}
                total={totalFamilies}
                color="bg-slate-400"
              />
              <PlanBar
                label="Annual — $49 / yr"
                count={planBreakdown.annual}
                total={totalFamilies}
                color="bg-indigo-500"
              />
              <PlanBar
                label="Legacy — Lifetime"
                count={planBreakdown.legacy}
                total={totalFamilies}
                color="bg-amber-400"
              />
            </div>
          </div>

          {/* Content library */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-base font-semibold text-slate-800 mb-4">
              Content Library
            </h2>
            <div className="grid grid-cols-2 gap-x-6">
              <ContentRow emoji="📔" label="Journal Entries" value={journalCount ?? 0} />
              <ContentRow emoji="🖼️" label="Photos" value={photoCount ?? 0} />
              <ContentRow emoji="📖" label="Stories" value={storyCount ?? 0} />
              <ContentRow emoji="🎙️" label="Voice Memos" value={voiceMemoCount ?? 0} />
              <ContentRow emoji="🍽️" label="Recipes" value={recipeCount ?? 0} />
              <ContentRow emoji="📅" label="Events" value={eventCount ?? 0} />
              <ContentRow emoji="💌" label="Time Capsules" value={capsuleCount ?? 0} />
              <ContentRow emoji="🏆" label="Achievements" value={achievementCount ?? 0} />
              <ContentRow emoji="🎨" label="Artwork" value={artworkCount ?? 0} />
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100 flex justify-between text-sm font-semibold text-slate-700">
              <span>Total content items</span>
              <span>{totalContentItems.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* ── Email campaigns (last 30d) ── */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
          <h2 className="text-base font-semibold text-slate-800 mb-4">
            Email Campaigns sent (last 30 days)
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
            {[
              { key: "welcome", label: "Welcome" },
              { key: "day1_nudge", label: "Day 1 Nudge" },
              { key: "day3_discovery", label: "Day 3 Discovery" },
              { key: "day5_invite", label: "Day 5 Invite" },
              { key: "day14_upgrade", label: "Day 14 Upgrade" },
              { key: "day30_reengagement", label: "Day 30 Re-engage" },
            ].map(({ key, label }) => (
              <div
                key={key}
                className="text-center bg-slate-50 rounded-lg p-3"
              >
                <p className="text-2xl font-bold text-slate-800">
                  {campaignCounts[key] ?? 0}
                </p>
                <p className="text-xs text-slate-500 mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Families table ── */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-800">
              All Families
            </h2>
            <span className="text-xs text-slate-400">{totalFamilies} total</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  <th className="px-6 py-3">Family</th>
                  <th className="px-6 py-3">Plan</th>
                  <th className="px-6 py-3">Members</th>
                  <th className="px-6 py-3">Storage</th>
                  <th className="px-6 py-3">Joined</th>
                  <th className="px-6 py-3">Stripe</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {families?.map((f) => (
                  <tr key={f.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900">
                      {f.name}
                    </td>
                    <td className="px-6 py-4">
                      <PlanBadge plan={f.plan_type} />
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {membersByFamily[f.id] ?? 0}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      <span>{formatBytes(f.storage_used_bytes ?? 0)}</span>
                      <span className="text-slate-400">
                        {" "}
                        / {formatBytes(f.storage_limit_bytes ?? 0)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {fmtDate(f.created_at)}
                      <span className="text-slate-400 ml-1 text-xs">
                        ({timeAgo(f.created_at)})
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-400 text-xs font-mono">
                      {f.stripe_customer_id
                        ? f.stripe_customer_id.slice(0, 14) + "…"
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Recent feedback ── */}
        {feedbackItems && feedbackItems.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden mb-6">
            <div className="px-6 py-4 border-b border-slate-100">
              <h2 className="text-base font-semibold text-slate-800">
                Recent Feedback
              </h2>
            </div>
            <div className="divide-y divide-slate-100">
              {feedbackItems.map((fb) => (
                <div key={fb.id} className="px-6 py-3 flex items-start gap-3">
                  <CategoryBadge category={fb.category} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">
                      {fb.subject}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {timeAgo(fb.created_at)}
                      {fb.rating && (
                        <span className="ml-2">
                          {"⭐".repeat(fb.rating)}
                        </span>
                      )}
                    </p>
                  </div>
                  <StatusBadge status={fb.status} />
                </div>
              ))}
            </div>
          </div>
        )}

        <p className="text-xs text-center text-slate-400 pb-4">
          FamilyNest Admin · Data pulled live from Supabase ·{" "}
          {now.toISOString()}
        </p>
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function KpiCard({
  label,
  value,
  sub,
  icon,
  accent,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: string;
  accent?: "indigo";
}) {
  return (
    <div
      className={`rounded-xl border p-5 ${accent === "indigo" ? "bg-indigo-50 border-indigo-200" : "bg-white border-slate-200"}`}
    >
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
          {label}
        </p>
        <span className="text-lg">{icon}</span>
      </div>
      <p
        className={`text-2xl font-bold ${accent === "indigo" ? "text-indigo-700" : "text-slate-900"}`}
      >
        {value}
      </p>
      {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
    </div>
  );
}

function PlanBar({
  label,
  count,
  total,
  color,
}: {
  label: string;
  count: number;
  total: number;
  color: string;
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div>
      <div className="flex justify-between text-sm mb-1.5">
        <span className="text-slate-700">{label}</span>
        <span className="font-semibold text-slate-900">
          {count}{" "}
          <span className="text-slate-400 font-normal text-xs">({pct}%)</span>
        </span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function ContentRow({
  emoji,
  label,
  value,
}: {
  emoji: string;
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center justify-between py-1.5 text-sm border-b border-slate-50">
      <span className="text-slate-500">
        <span className="mr-1.5">{emoji}</span>
        {label}
      </span>
      <span className="font-semibold text-slate-800">{value.toLocaleString()}</span>
    </div>
  );
}

function PlanBadge({ plan }: { plan: string }) {
  const styles: Record<string, string> = {
    free: "bg-slate-100 text-slate-600",
    annual: "bg-indigo-100 text-indigo-700",
    legacy: "bg-amber-100 text-amber-700",
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${styles[plan] ?? "bg-slate-100 text-slate-600"}`}
    >
      {plan}
    </span>
  );
}

function CategoryBadge({ category }: { category: string }) {
  const styles: Record<string, string> = {
    feature_request: "bg-blue-100 text-blue-700",
    bug_report: "bg-red-100 text-red-700",
    question: "bg-yellow-100 text-yellow-700",
    compliment: "bg-green-100 text-green-700",
    other: "bg-slate-100 text-slate-600",
  };
  const labels: Record<string, string> = {
    feature_request: "Feature",
    bug_report: "Bug",
    question: "Question",
    compliment: "Compliment",
    other: "Other",
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium shrink-0 ${styles[category] ?? "bg-slate-100 text-slate-600"}`}
    >
      {labels[category] ?? category}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    new: "bg-orange-100 text-orange-700",
    read: "bg-slate-100 text-slate-600",
    in_progress: "bg-blue-100 text-blue-700",
    resolved: "bg-green-100 text-green-700",
    wont_fix: "bg-slate-100 text-slate-400",
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium shrink-0 ${styles[status] ?? "bg-slate-100 text-slate-600"}`}
    >
      {status.replace("_", " ")}
    </span>
  );
}
