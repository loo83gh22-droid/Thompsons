import { redirect } from "next/navigation";
import { createClient } from "@/src/lib/supabase/server";
import { Nav } from "@/app/dashboard/Nav";
import { MusicPlayer } from "@/app/dashboard/MusicPlayer";
import { UnreadMessagesFetcher } from "@/app/dashboard/UnreadMessagesFetcher";

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

  // Get or create family member for this user
  let { data: myMember } = await supabase
    .from("family_members")
    .select("id, contact_email, relationship")
    .eq("user_id", user.id)
    .single();

  if (!myMember) {
    // Check if they were invited (family_member exists with their email, no user_id)
    const { data: invited } = await supabase
      .from("family_members")
      .select("id")
      .eq("contact_email", user.email ?? "")
      .is("user_id", null)
      .limit(1)
      .single();
    if (invited) {
      await supabase.from("family_members").update({ user_id: user.id }).eq("id", invited.id);
      const { data: linked } = await supabase.from("family_members").select("id, contact_email, relationship").eq("id", invited.id).single();
      myMember = linked;
    } else {
      // New signup: create family_member from auth metadata
      const meta = user.user_metadata as { full_name?: string; relationship?: string; family_name?: string };
      const { data: created } = await supabase
        .from("family_members")
        .insert({
          user_id: user.id,
          name: meta?.full_name || user.email?.split("@")[0] || "Family Member",
          relationship: meta?.relationship || null,
          contact_email: user.email || null,
        })
        .select("id, contact_email, relationship")
        .single();
      myMember = created;
      // Set family name for branding (e.g. "Thompsons Nest")
      if (meta?.family_name?.trim()) {
        const { data: existing } = await supabase.from("family_settings").select("id").limit(1).single();
        if (existing) {
          await supabase.from("family_settings").update({ family_name: meta.family_name.trim(), updated_at: new Date().toISOString() }).eq("id", existing.id);
        } else {
          await supabase.from("family_settings").insert({ family_name: meta.family_name.trim() });
        }
      }
    }
  } else if (!myMember.contact_email && user.email) {
    await supabase.from("family_members").update({ contact_email: user.email }).eq("id", myMember.id);
  }

  const playlistId =
    process.env.NEXT_PUBLIC_SPOTIFY_PLAYLIST_ID || "3mytLIeQgN9nJdRhS5Hu5w";

  let { data: settings } = await supabase.from("family_settings").select("family_name").limit(1).single();
  if (!settings) {
    await supabase.from("family_settings").insert({ family_name: "My Family" });
    settings = { family_name: "My Family" };
  }
  const familyName = settings?.family_name?.trim() || "My Family";

  return (
    <div className="min-h-screen">
      <Nav user={user} familyName={familyName} />
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
      <MusicPlayer playlistId={playlistId} />
      <UnreadMessagesFetcher />
    </div>
  );
}
