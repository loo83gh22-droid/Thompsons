import { redirect } from "next/navigation";
import { createClient } from "@/src/lib/supabase/server";
import { createAdminClient } from "@/src/lib/supabase/admin";
import { getActiveFamilyId, getActiveFamilyName } from "@/src/lib/family";
import { Nav } from "@/app/dashboard/Nav";
import { MusicPlayer } from "@/app/dashboard/MusicPlayer";
import { UnreadMessagesFetcher } from "@/app/dashboard/UnreadMessagesFetcher";
import { FamilyProvider } from "@/app/dashboard/FamilyContext";
import { WelcomeModal } from "@/app/dashboard/WelcomeModal";
import { AgeTransitionBanner } from "@/app/dashboard/AgeTransitionBanner";
import { BirthdayPrompt } from "@/app/dashboard/BirthdayPrompt";
import { FeedbackPromptModal } from "@/app/dashboard/FeedbackPromptModal";
import { QuickEntryWidget } from "@/app/dashboard/QuickEntryWidget";
import { PWAInstallBanner } from "@/app/dashboard/PWAInstallBanner";
import { MobileBottomNav } from "@/app/components/MobileBottomNav";
import { WhatsNewBanner } from "@/app/dashboard/WhatsNewBanner";
import { QuickCapture } from "@/app/components/QuickCapture";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  try {
    // Get or create family member for this user
    let { data: myMembers } = await supabase
      .from("family_members")
      .select("id, family_id, contact_email, relationship")
      .eq("user_id", user.id);

    // Always link any pending invites (family_member rows with matching email and no user_id).
    // This runs whether the user is brand-new OR already has existing family memberships,
    // so existing users who accept an invite after they already had an account get linked too.
    // Uses the admin client to bypass RLS — invited users can't read rows they're not yet
    // linked to, so the regular client silently returns nothing and "Our Family" gets created.
    if (user.email) {
      const adminClient = createAdminClient();
      const { data: pendingInvites } = await adminClient
        .from("family_members")
        .select("id, family_id")
        .eq("contact_email", user.email)
        .is("user_id", null);

      if (pendingInvites?.length) {
        await adminClient
          .from("family_members")
          .update({ user_id: user.id })
          .in("id", pendingInvites.map((p) => p.id));

        // Re-fetch the full member list now that new rows are linked
        const { data: refreshed } = await supabase
          .from("family_members")
          .select("id, family_id, contact_email, relationship")
          .eq("user_id", user.id);
        if (refreshed?.length) myMembers = refreshed;

        // Belt-and-suspenders: clean up any "Our Family" that a DB trigger may have
        // auto-created at signup time before this user confirmed their email.
        // Safe to do here because we just confirmed the user has a real invited family.
        if (myMembers && myMembers.length > 1 && user.created_at) {
          const userCreatedAt = new Date(user.created_at).getTime();
          const invitedFamilyIds = new Set(pendingInvites.map((p) => p.family_id));
          const candidateIds = myMembers
            .filter((m) => !invitedFamilyIds.has(m.family_id))
            .map((m) => m.family_id);

          const toClean: string[] = [];

          if (candidateIds.length > 0) {
            // Batch-fetch family rows and member counts in two queries instead of N
            const [{ data: families }, { data: memberCounts }] = await Promise.all([
              adminClient
                .from("families")
                .select("id, created_at")
                .in("id", candidateIds),
              adminClient
                .from("family_members")
                .select("family_id")
                .in("family_id", candidateIds),
            ]);

            const familyMap = new Map((families ?? []).map((f) => [f.id, f]));
            const countMap = new Map<string, number>();
            for (const row of memberCounts ?? []) {
              countMap.set(row.family_id, (countMap.get(row.family_id) ?? 0) + 1);
            }

            for (const famId of candidateIds) {
              const fam = familyMap.get(famId);
              if (!fam) continue;
              const familyAge = Math.abs(new Date(fam.created_at).getTime() - userCreatedAt);
              if (familyAge > 60_000) continue;
              if ((countMap.get(famId) ?? 0) !== 1) continue;
              toClean.push(famId);
            }
          }

          for (const famId of toClean) {
            await adminClient.from("family_settings").delete().eq("family_id", famId);
            await adminClient.from("family_members").delete().eq("family_id", famId);
            await adminClient.from("families").delete().eq("id", famId);
          }

          if (toClean.length) {
            // Re-fetch after cleanup
            const { data: cleaned } = await supabase
              .from("family_members")
              .select("id, family_id, contact_email, relationship")
              .eq("user_id", user.id);
            if (cleaned?.length) myMembers = cleaned;
          }
        }
      }
    }

    if (!myMembers?.length) {
      // New signup with no matching invite: create their own family
      const meta = user.user_metadata as {
        full_name?: string;
        relationship?: string;
        family_name?: string;
      };
      const familyName =
        meta?.family_name?.trim() || user.email?.split("@")[0] || "Our Family";

      const { data: newFamily } = await supabase
        .from("families")
        .insert({ name: familyName })
        .select("id")
        .single();

      if (!newFamily) throw new Error("Failed to create family");

      const { data: created } = await supabase
        .from("family_members")
        .insert({
          family_id: newFamily.id,
          user_id: user.id,
          name: meta?.full_name || user.email?.split("@")[0] || "Family Member",
          relationship: meta?.relationship || null,
          contact_email: user.email || null,
          role: "owner",
        })
        .select("id, family_id, contact_email, relationship")
        .single();

      if (created) {
        await supabase.from("family_settings").insert({
          family_id: newFamily.id,
          family_name: familyName,
        });
        myMembers = [created];
      }
    }

    // Update contact_email if missing
    if (myMembers?.length && user.email) {
      for (const m of myMembers) {
        if (!m.contact_email) {
          await supabase
            .from("family_members")
            .update({ contact_email: user.email })
            .eq("id", m.id);
        }
      }
    }

    const { activeFamilyId, families } = await getActiveFamilyId(supabase);
    const familyName = await getActiveFamilyName(supabase);

    // Get current user's role in the active family.
    // Default to "teen" (least-privilege for a logged-in user) so that any
    // lookup failure denies access rather than silently granting adult rights.
    let currentUserRole: "owner" | "adult" | "teen" | "child" = "teen";
    let currentMemberId: string | null = null;
    let planType: "free" | "annual" | "legacy" = "free";
    let playlistId: string | null = null;
    let welcomeMemberCount = 0;
    let welcomeJournalCount = 0;

    if (activeFamilyId) {
      // Run all independent queries in parallel to avoid waterfall
      const [myMemberRes, familyRowRes, membRes, jrnlRes] = await Promise.all([
        supabase
          .from("family_members")
          .select("id, role")
          .eq("user_id", user.id)
          .eq("family_id", activeFamilyId)
          .single(),
        supabase
          .from("families")
          .select("plan_type, spotify_playlist_id")
          .eq("id", activeFamilyId)
          .single(),
        supabase.from("family_members").select("id", { count: "exact", head: true }).eq("family_id", activeFamilyId),
        supabase.from("journal_entries").select("id", { count: "exact", head: true }).eq("family_id", activeFamilyId),
      ]);

      if (myMemberRes.data) {
        currentUserRole = (myMemberRes.data.role as typeof currentUserRole) || "teen";
        currentMemberId = myMemberRes.data.id;
      }
      if (familyRowRes.data?.plan_type) planType = familyRowRes.data.plan_type as typeof planType;
      playlistId = familyRowRes.data?.spotify_playlist_id?.trim() || null;
      welcomeMemberCount = membRes.count ?? 0;
      welcomeJournalCount = jrnlRes.count ?? 0;
    }

    return (
      <FamilyProvider activeFamilyId={activeFamilyId} families={families} currentUserRole={currentUserRole} currentMemberId={currentMemberId} planType={planType}>
        <WelcomeModal familyName={familyName} memberCount={welcomeMemberCount} journalCount={welcomeJournalCount} />
        <BirthdayPrompt />
        <FeedbackPromptModal />
        {/* Quick entry widget: desktop only — mobile uses MobileBottomNav FAB instead */}
        <div className="hidden min-[768px]:block">
          <QuickEntryWidget />
        </div>
        <MobileBottomNav />
        <div className="min-h-screen">
          <Nav
            user={user}
            familyName={familyName}
            families={families}
            activeFamilyId={activeFamilyId}
          />
          <PWAInstallBanner />
          <WhatsNewBanner />
          <div className="mx-auto max-w-6xl px-4 pt-4 sm:px-6">
            <AgeTransitionBanner />
          </div>
          {/* pb-20 on mobile reserves space above the fixed bottom nav */}
          <main id="main-content" className="mx-auto max-w-6xl min-w-0 overflow-x-hidden px-4 py-6 pb-24 sm:px-6 sm:py-8 min-[768px]:pb-8" tabIndex={-1}>{children}</main>
          {playlistId && <MusicPlayer playlistId={playlistId} />}
          <QuickCapture />
          <UnreadMessagesFetcher />
        </div>
      </FamilyProvider>
    );
  } catch (err) {
    // Only redirect to login for auth-related failures. Re-throw everything
    // else so the nearest error.tsx boundary can handle it gracefully without
    // kicking authenticated users back to the login page.
    const message = err instanceof Error ? err.message : String(err);
    if (
      message.includes("Auth") ||
      message.includes("JWT") ||
      message.includes("session") ||
      message.includes("token") ||
      message.includes("unauthorized") ||
      message.includes("unauthenticated")
    ) {
      redirect("/login");
    }
    throw err;
  }
}
