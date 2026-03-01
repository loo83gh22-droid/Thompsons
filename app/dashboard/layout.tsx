import { redirect } from "next/navigation";
import { createClient } from "@/src/lib/supabase/server";
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
    if (user.email) {
      const { data: pendingInvites } = await supabase
        .from("family_members")
        .select("id, family_id")
        .eq("contact_email", user.email)
        .is("user_id", null);

      if (pendingInvites?.length) {
        await supabase
          .from("family_members")
          .update({ user_id: user.id })
          .in("id", pendingInvites.map((p) => p.id));

        // Re-fetch the full member list now that new rows are linked
        const { data: refreshed } = await supabase
          .from("family_members")
          .select("id, family_id, contact_email, relationship")
          .eq("user_id", user.id);
        if (refreshed?.length) myMembers = refreshed;
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

    // Get current user's role in the active family
    let currentUserRole: "owner" | "adult" | "teen" | "child" = "adult";
    let currentMemberId: string | null = null;
    if (activeFamilyId) {
      const { data: myMember } = await supabase
        .from("family_members")
        .select("id, role")
        .eq("user_id", user.id)
        .eq("family_id", activeFamilyId)
        .single();
      if (myMember) {
        currentUserRole = (myMember.role as typeof currentUserRole) || "adult";
        currentMemberId = myMember.id;
      }
    }

    // Get family plan type
    let planType: "free" | "annual" | "legacy" = "free";
    if (activeFamilyId) {
      const { data: familyRow } = await supabase
        .from("families")
        .select("plan_type")
        .eq("id", activeFamilyId)
        .single();
      if (familyRow?.plan_type) planType = familyRow.plan_type as typeof planType;
    }

    const playlistId =
      process.env.NEXT_PUBLIC_SPOTIFY_PLAYLIST_ID?.trim() || null;

    return (
      <FamilyProvider activeFamilyId={activeFamilyId} families={families} currentUserRole={currentUserRole} currentMemberId={currentMemberId} planType={planType}>
        <WelcomeModal familyName={familyName} />
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
          <div className="mx-auto max-w-6xl px-4 pt-4 sm:px-6">
            <AgeTransitionBanner />
          </div>
          {/* pb-20 on mobile reserves space above the fixed bottom nav */}
          <main id="main-content" className="mx-auto max-w-6xl min-w-0 overflow-x-hidden px-4 py-6 pb-24 sm:px-6 sm:py-8 min-[768px]:pb-8" tabIndex={-1}>{children}</main>
          {playlistId && <MusicPlayer playlistId={playlistId} />}
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
