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

  // Sync current user's email to their family member for message notifications
  const { data: myMember } = await supabase
    .from("family_members")
    .select("id, contact_email")
    .eq("user_id", user.id)
    .single();
  if (myMember && !myMember.contact_email && user.email) {
    await supabase
      .from("family_members")
      .update({ contact_email: user.email })
      .eq("id", myMember.id);
  }

  const playlistId =
    process.env.NEXT_PUBLIC_SPOTIFY_PLAYLIST_ID || "3mytLIeQgN9nJdRhS5Hu5w";

  return (
    <div className="min-h-screen">
      <Nav user={user} />
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
      <MusicPlayer playlistId={playlistId} />
      <UnreadMessagesFetcher />
    </div>
  );
}
