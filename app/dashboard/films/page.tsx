import type { Metadata } from "next";
import { createClient } from "@/src/lib/supabase/server";
import { getActiveFamilyId } from "@/src/lib/family";
import { FilmsClient } from "./FilmsClient";
import { FamilyRequired } from "@/app/components/FamilyRequired";

export const metadata: Metadata = { title: "Family Films | Family Nest" };

export default async function FilmsPage() {
  const supabase = await createClient();
  const { activeFamilyId } = await getActiveFamilyId(supabase);
  if (!activeFamilyId) return <FamilyRequired />;

  const { data: { user } } = await supabase.auth.getUser();

  const [filmsRes, membersRes, myMemberRes] = await Promise.all([
    supabase
      .from("family_films")
      .select("id, title, type, status, is_family_pick, rating, notes, added_by, family_members!added_by(id, name, nickname, color)")
      .eq("family_id", activeFamilyId)
      .order("is_family_pick", { ascending: false })
      .order("created_at", { ascending: false }),
    supabase
      .from("family_members")
      .select("id, name, nickname, color")
      .eq("family_id", activeFamilyId)
      .eq("is_remembered", false)
      .order("name"),
    user
      ? supabase.from("family_members").select("id, role").eq("user_id", user.id).eq("family_id", activeFamilyId).single()
      : Promise.resolve({ data: null }),
  ]);

  type MemberJoin = { id: string; name: string; nickname: string | null; color: string | null } | { id: string; name: string; nickname: string | null; color: string | null }[] | null;
  type RawFilm = { id: string; title: string; type: string; status: string; is_family_pick: boolean; rating: number | null; notes: string | null; added_by: string | null; family_members: MemberJoin };

  const films = ((filmsRes.data ?? []) as unknown as RawFilm[]).map(f => {
    const m = Array.isArray(f.family_members) ? f.family_members[0] : f.family_members;
    return {
      id: f.id,
      title: f.title,
      type: f.type as "movie" | "series",
      status: f.status as "want_to_watch" | "watching" | "watched",
      is_family_pick: f.is_family_pick,
      rating: f.rating,
      notes: f.notes,
      added_by: f.added_by,
      addedByMember: m ?? null,
    };
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-2">
        <h1 className="font-display text-3xl font-bold text-[var(--foreground)]">Family Films</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Movies and series — what you want to watch, are watching, and have seen.
        </p>
      </div>
      <FilmsClient
        films={films}
        members={membersRes.data ?? []}
        myRole={myMemberRes.data?.role ?? "teen"}
      />
    </div>
  );
}
