import type { Metadata } from "next";
import { createClient } from "@/src/lib/supabase/server";
import { getActiveFamilyId } from "@/src/lib/family";
import { GameNightClient } from "./GameNightClient";
import { FamilyRequired } from "@/app/components/FamilyRequired";

export const metadata: Metadata = { title: "Game Night Log | Family Nest" };

export default async function GameNightPage() {
  const supabase = await createClient();
  const { activeFamilyId } = await getActiveFamilyId(supabase);
  if (!activeFamilyId) return <FamilyRequired />;

  const { data: { user } } = await supabase.auth.getUser();

  const [sessionsRes, gamesRes, membersRes, myMemberRes] = await Promise.all([
    supabase
      .from("game_night_sessions")
      .select("id, game_id, played_on, winner_id, notes, family_members!winner_id(id, name, nickname, color), family_games!game_id(id, name)")
      .eq("family_id", activeFamilyId)
      .order("played_on", { ascending: false }),
    supabase
      .from("family_games")
      .select("id, name")
      .eq("family_id", activeFamilyId)
      .order("name"),
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
  type GameJoin = { id: string; name: string } | { id: string; name: string }[] | null;
  type RawSession = { id: string; game_id: string | null; played_on: string; winner_id: string | null; notes: string | null; family_members: MemberJoin; family_games: GameJoin };

  const sessions = ((sessionsRes.data ?? []) as unknown as RawSession[]).map(s => {
    const w = Array.isArray(s.family_members) ? s.family_members[0] : s.family_members;
    const g = Array.isArray(s.family_games) ? s.family_games[0] : s.family_games;
    return {
      id: s.id,
      game_id: s.game_id,
      gameName: g?.name ?? null,
      played_on: s.played_on,
      winner_id: s.winner_id,
      notes: s.notes,
      winner: w ?? null,
    };
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-2">
        <h1 className="font-display text-3xl font-bold text-[var(--foreground)]">Game Night Log 🎲</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Track every game night, who played, and who walked away victorious.
        </p>
      </div>
      <GameNightClient
        sessions={sessions}
        games={gamesRes.data ?? []}
        members={membersRes.data ?? []}
        myRole={myMemberRes.data?.role ?? "teen"}
      />
    </div>
  );
}
