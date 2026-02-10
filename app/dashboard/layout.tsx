import { redirect } from "next/navigation";
import { createClient } from "@/src/lib/supabase/server";
import { getActiveFamilyId, getActiveFamilyName } from "@/src/lib/family";
import { Nav } from "@/app/dashboard/Nav";
import { MusicPlayer } from "@/app/dashboard/MusicPlayer";
import { UnreadMessagesFetcher } from "@/app/dashboard/UnreadMessagesFetcher";
import { FamilyProvider } from "@/app/dashboard/FamilyContext";
import { WelcomeModal } from "@/app/dashboard/WelcomeModal";

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

    if (!myMembers?.length) {
      // Check if they were invited (family_member exists with their email, no user_id)
      const { data: invited } = await supabase
        .from("family_members")
        .select("id, family_id")
        .eq("contact_email", user.email ?? "")
        .is("user_id", null)
        .limit(1)
        .single();

      if (invited) {
        await supabase
          .from("family_members")
          .update({ user_id: user.id })
          .eq("id", invited.id);
        const { data: linked } = await supabase
          .from("family_members")
          .select("id, family_id, contact_email, relationship")
          .eq("id", invited.id)
          .single();
        myMembers = linked ? [linked] : [];
      } else {
        // New signup: create family, then family_member
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

    const playlistId =
      process.env.NEXT_PUBLIC_SPOTIFY_PLAYLIST_ID || "3mytLIeQgN9nJdRhS5Hu5w";

    return (
      <FamilyProvider activeFamilyId={activeFamilyId} families={families}>
        <WelcomeModal familyName={familyName} />
        <div className="min-h-screen">
          <Nav
            user={user}
            familyName={familyName}
            families={families}
            activeFamilyId={activeFamilyId}
          />
          <main id="main-content" className="mx-auto max-w-6xl min-w-0 overflow-x-hidden px-4 py-6 sm:px-6 sm:py-8" tabIndex={-1}>{children}</main>
          <MusicPlayer playlistId={playlistId} />
          <UnreadMessagesFetcher />
        </div>
      </FamilyProvider>
    );
  } catch {
    redirect("/login");
  }
}
