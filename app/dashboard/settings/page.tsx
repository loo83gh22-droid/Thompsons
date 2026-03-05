import { redirect } from "next/navigation";
import { Suspense } from "react";
import { createClient } from "@/src/lib/supabase/server";
import { getActiveFamilyId } from "@/src/lib/family";
import Link from "next/link";
import { ExportNest } from "./ExportNest";
import { FamilyNameEditor } from "./FamilyNameEditor";
import { ManageBilling } from "./ManageBilling";
import { PaymentSuccessBanner } from "./PaymentSuccessBanner";
import { EmailNotificationsToggle } from "./EmailNotificationsToggle";
import { StorageAddons } from "./StorageAddons";
import { SpotifyPlaylistEditor } from "./SpotifyPlaylistEditor";

type PlanType = "free" | "annual" | "legacy";

const PLAN_DISPLAY: Record<
  PlanType,
  { name: string; color: string; badge: string }
> = {
  free: { name: "The Nest", color: "text-[var(--muted)]", badge: "Free" },
  annual: {
    name: "The Full Nest",
    color: "text-[var(--primary)]",
    badge: "$79/year",
  },
  legacy: {
    name: "The Legacy",
    color: "text-[var(--accent)]",
    badge: "Lifetime",
  },
};

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 MB";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function StorageBar({
  used,
  limit,
}: {
  used: number;
  limit: number;
}) {
  const pct = limit > 0 ? Math.min((used / limit) * 100, 100) : 0;
  const barColor =
    pct > 95
      ? "bg-[var(--error)]"
      : pct > 80
        ? "bg-[var(--warning)]"
        : "bg-[var(--accent)]";

  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between text-sm">
        <span className="text-[var(--foreground)]">Storage</span>
        <span className="text-[var(--muted)]">
          {formatBytes(used)} / {formatBytes(limit)}
        </span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-[var(--border)]">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${Math.max(pct, 0.5)}%` }}
        />
      </div>
      {pct > 80 && (
        <p className={`text-xs ${pct > 95 ? "text-[var(--error)]" : "text-[var(--warning)]"}`}>
          {pct > 95
            ? "Storage almost full — consider upgrading your plan."
            : "Storage getting full — you may want to upgrade soon."}
        </p>
      )}
    </div>
  );
}

export const metadata = { title: "Settings | Family Nest" };

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { activeFamilyId } = await getActiveFamilyId(supabase);
  if (!activeFamilyId) redirect("/dashboard");

  // Fetch family plan info
  const { data: family } = await supabase
    .from("families")
    .select(
      "name, plan_type, plan_started_at, plan_expires_at, storage_used_bytes, storage_limit_bytes, spotify_playlist_id"
    )
    .eq("id", activeFamilyId)
    .single();

  const planType: PlanType = (family?.plan_type as PlanType) || "free";
  const plan = PLAN_DISPLAY[planType];
  const storageUsed: number = family?.storage_used_bytes ?? 0;
  const storageLimit: number = family?.storage_limit_bytes ?? 524288000;
  const planStarted: string | null = family?.plan_started_at ?? null;
  const planExpires: string | null = family?.plan_expires_at ?? null;

  // Fetch current member for email notification preference and role
  const { data: currentMember } = await supabase
    .from("family_members")
    .select("id, email_notifications, role")
    .eq("user_id", user.id)
    .eq("family_id", activeFamilyId)
    .single();

  const canEditPlaylist = currentMember?.role === "owner" || currentMember?.role === "adult";

  // Fetch active + cancelling storage add-ons (paid plans only)
  const { data: activeAddonsRaw } = planType !== "free"
    ? await supabase
        .from("storage_addons")
        .select("id, label, bytes_added, price_per_year_usd, status, grace_until")
        .eq("family_id", activeFamilyId)
        .in("status", ["active", "cancelling"])
        .order("created_at")
    : { data: [] };
  const activeAddons = activeAddonsRaw ?? [];
  const cancellingAddons = activeAddons.filter((a) => a.status === "cancelling");
  const nowMs = new Date().getTime();

  // Count journal entries for free tier limit display
  let journalCount = 0;
  if (planType === "free") {
    const { count } = await supabase
      .from("journal_entries")
      .select("id", { count: "exact", head: true })
      .eq("family_id", activeFamilyId);
    journalCount = count ?? 0;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <Suspense>
        <PaymentSuccessBanner planName={plan.name} />
      </Suspense>

      {/* Storage grace period warning banner */}
      {cancellingAddons.length > 0 && (
        <div className="rounded-2xl border border-[var(--warning)] bg-[var(--warning)]/10 px-6 py-4 space-y-2">
          <p className="font-semibold text-[var(--warning)]">⚠️ Storage add-on cancellation in progress</p>
          {cancellingAddons.map((addon) => {
            const graceDate = addon.grace_until
              ? new Date(addon.grace_until).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
              : null;
            const daysLeft = addon.grace_until
              ? Math.ceil((new Date(addon.grace_until).getTime() - nowMs) / (1000 * 60 * 60 * 24))
              : null;
            return (
              <p key={addon.id} className="text-sm text-[var(--foreground)]">
                Your <strong>{addon.label}</strong> add-on was cancelled.
                {graceDate && daysLeft !== null && daysLeft > 0 && (
                  <> Please reduce your storage before <strong>{graceDate}</strong> ({daysLeft} day{daysLeft === 1 ? "" : "s"} left).</>
                )}
                {daysLeft !== null && daysLeft <= 0 && (
                  <> Grace period has ended — files may be removed shortly.</>
                )}
              </p>
            );
          })}
          <p className="text-xs text-[var(--muted)]">
            Journal entries, stories, and recipes will never be deleted. Only media files (photos, videos, audio) may be removed.
          </p>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="font-display text-3xl font-bold">Account Settings</h1>
      </div>

      {/* Family Name */}
      <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
        <div className="border-b border-[var(--border)] px-6 py-4">
          <h2 className="font-display text-xl font-semibold">Family Name</h2>
        </div>
        <div className="px-6 py-5">
          <FamilyNameEditor
            familyId={activeFamilyId}
            currentName={family?.name ?? "Our Family"}
          />
        </div>
      </section>

      {/* Spotify Playlist — owners and adults only */}
      {canEditPlaylist && (
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
          <div className="border-b border-[var(--border)] px-6 py-4">
            <h2 className="font-display text-xl font-semibold">Family Music</h2>
          </div>
          <div className="px-6 py-5">
            <SpotifyPlaylistEditor
              currentPlaylistId={family?.spotify_playlist_id ?? null}
            />
          </div>
        </section>
      )}

      {/* Your Plan card */}
      <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
        <div className="border-b border-[var(--border)] px-6 py-4">
          <h2 className="font-display text-xl font-semibold">Your Plan</h2>
        </div>

        <div className="space-y-6 px-6 py-5">
          {/* Plan name & badge */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className={`text-xl font-bold ${plan.color}`}>
                {plan.name}
              </span>
              <span className="rounded-full border border-[var(--border)] px-2.5 py-0.5 text-xs font-medium text-[var(--muted)]">
                {plan.badge}
              </span>
            </div>
            {planType === "legacy" && (
              <span className="rounded-full bg-[var(--accent)]/15 px-3 py-1 text-xs font-semibold text-[var(--accent)]">
                Lifetime &mdash; You&apos;re all set
              </span>
            )}
          </div>

          {/* Plan details depending on tier */}
          {planType === "free" && (
            <div className="space-y-4">
              {/* Journal limit */}
              <div className="space-y-1.5">
                <div className="flex items-baseline justify-between text-sm">
                  <span className="text-[var(--foreground)]">
                    Journal Entries
                  </span>
                  <span className="text-[var(--muted)]">
                    {journalCount} / 10
                  </span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-[var(--border)]">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      journalCount >= 10
                        ? "bg-[var(--error)]"
                        : journalCount >= 8
                          ? "bg-[var(--warning)]"
                          : "bg-[var(--accent)]"
                    }`}
                    style={{
                      width: `${Math.max((journalCount / 10) * 100, 0.5)}%`,
                    }}
                  />
                </div>
                {journalCount >= 10 && (
                  <p className="text-xs text-[var(--error)]">
                    Journal entry limit reached. Upgrade to unlock unlimited
                    entries.
                  </p>
                )}
              </div>

              {/* Storage */}
              <StorageBar used={storageUsed} limit={storageLimit} />

              {/* Map note */}
              <p className="text-sm text-[var(--muted)]">
                Family Map is view-only on the free plan. Upgrade to add
                locations.
              </p>

              {/* Upgrade CTA */}
              <Link
                href="/pricing"
                className="inline-flex items-center gap-2 rounded-full bg-[var(--primary)] px-5 py-2.5 text-sm font-medium text-[var(--primary-foreground)] transition-colors hover:opacity-90"
              >
                Upgrade Plan
                <span aria-hidden="true">&rarr;</span>
              </Link>
            </div>
          )}

          {planType === "annual" && (
            <div className="space-y-4">
              {/* Renewal date */}
              {planExpires && (
                <div className="flex items-baseline justify-between text-sm">
                  <span className="text-[var(--foreground)]">Renews on</span>
                  <span className="text-[var(--muted)]">
                    {new Date(planExpires).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                </div>
              )}

              {/* Storage */}
              <StorageBar used={storageUsed} limit={storageLimit} />

              {/* Active since */}
              {planStarted && (
                <p className="text-xs text-[var(--muted)]">
                  Active since{" "}
                  {new Date(planStarted).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              )}

              {/* Upgrade CTA + Billing */}
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/pricing"
                  className="inline-flex items-center gap-2 rounded-lg border border-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-[var(--accent)] transition-colors hover:bg-[var(--accent)]/10"
                >
                  Upgrade to Legacy
                  <span aria-hidden="true">&rarr;</span>
                </Link>
                <ManageBilling />
              </div>
            </div>
          )}

          {planType === "legacy" && (
            <div className="space-y-4">
              {/* Storage */}
              <StorageBar used={storageUsed} limit={storageLimit} />

              {/* Active since */}
              {planStarted && (
                <p className="text-xs text-[var(--muted)]">
                  Legacy member since{" "}
                  {new Date(planStarted).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              )}

              {/* Nest Keepers + Manage Billing (if has add-ons) */}
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/dashboard/settings/nest-keepers"
                  className="inline-flex items-center gap-2 rounded-lg border border-[var(--accent)]/40 bg-[var(--accent)]/5 px-5 py-2.5 text-sm font-semibold text-[var(--accent)] transition-colors hover:bg-[var(--accent)]/10"
                >
                  Manage Nest Keepers
                  <span aria-hidden="true">&rarr;</span>
                </Link>
                {activeAddons.length > 0 && <ManageBilling />}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Storage Add-ons — paid plans only */}
      {planType !== "free" && <StorageAddons activeAddons={activeAddons} />}

      {/* Export — Legacy plan only */}
      {planType === "legacy" && <ExportNest />}

      {/* Import */}
      <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
        <div className="border-b border-[var(--border)] px-6 py-4">
          <h2 className="font-display text-xl font-semibold">Import Content</h2>
        </div>
        <div className="space-y-3 px-6 py-5">
          <p className="text-sm text-[var(--muted)]">
            Import journal entries, stories, recipes, or events from a{" "}
            <strong>.json</strong> file or a <strong>.zip</strong> archive
            exported from this app.
          </p>
          <Link
            href="/dashboard/import"
            className="inline-flex items-center gap-2 rounded-lg border border-[var(--accent)]/40 bg-[var(--accent)]/5 px-5 py-2.5 text-sm font-semibold text-[var(--accent)] transition-colors hover:bg-[var(--accent)]/10"
          >
            Import Content
            <span aria-hidden="true">&uarr;</span>
          </Link>
        </div>
      </section>

      {/* Quick links */}
      <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
        <div className="border-b border-[var(--border)] px-6 py-4">
          <h2 className="font-display text-xl font-semibold">Account</h2>
        </div>
        <div className="divide-y divide-[var(--border)]">
          <Link
            href="/dashboard/settings/nest-keepers"
            className="flex items-center justify-between px-6 py-4 text-sm transition-colors hover:bg-[var(--surface-hover)]"
          >
            <div>
              <p className="font-medium text-[var(--foreground)]">
                Nest Keepers
              </p>
              <p className="text-[var(--muted)]">
                Designate successors for your Family Nest
              </p>
            </div>
            <span className="text-[var(--muted)]">&rsaquo;</span>
          </Link>
          <Link
            href="/pricing"
            className="flex items-center justify-between px-6 py-4 text-sm transition-colors hover:bg-[var(--surface-hover)]"
          >
            <div>
              <p className="font-medium text-[var(--foreground)]">
                View Plans & Pricing
              </p>
              <p className="text-[var(--muted)]">
                Compare features across all tiers
              </p>
            </div>
            <span className="text-[var(--muted)]">&rsaquo;</span>
          </Link>
          <Link
            href="/forgot-password"
            className="flex items-center justify-between px-6 py-4 text-sm transition-colors hover:bg-[var(--surface-hover)]"
          >
            <div>
              <p className="font-medium text-[var(--foreground)]">
                Change Password
              </p>
              <p className="text-[var(--muted)]">
                Update your login credentials
              </p>
            </div>
            <span className="text-[var(--muted)]">&rsaquo;</span>
          </Link>
          <div className="px-6 py-4 text-sm">
            <p className="text-[var(--muted)]">
              Signed in as{" "}
              <span className="font-medium text-[var(--foreground)]">
                {user.email}
              </span>
            </p>
          </div>
        </div>
      </section>

      {/* Notifications */}
      {currentMember && (
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
          <div className="border-b border-[var(--border)] px-6 py-4">
            <h2 className="font-display text-xl font-semibold">Notifications</h2>
          </div>
          <div className="px-6 py-5">
            <EmailNotificationsToggle
              enabled={currentMember.email_notifications ?? true}
              memberId={currentMember.id}
            />
          </div>
        </section>
      )}

      {/* Legal */}
      <div className="flex gap-4 pb-4 text-xs text-[var(--muted)]">
        <Link href="/privacy" className="hover:text-[var(--foreground)]">
          Privacy Policy
        </Link>
        <Link href="/terms" className="hover:text-[var(--foreground)]">
          Terms of Service
        </Link>
      </div>
    </div>
  );
}
