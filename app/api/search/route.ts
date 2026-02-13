import { createClient } from "@/src/lib/supabase/server";
import { getActiveFamilyId } from "@/src/lib/family";
import { NextResponse } from "next/server";

export type SearchResult = {
  type: "journal" | "story" | "recipe" | "tradition" | "voice_memo" | "time_capsule" | "member" | "event";
  id: string;
  title: string;
  snippet: string;
  href: string;
  icon: string;
  date: string | null;
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();

  if (!q || q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { activeFamilyId } = await getActiveFamilyId(supabase);
  if (!activeFamilyId) return NextResponse.json({ results: [] });

  const pattern = `%${q}%`;
  const results: SearchResult[] = [];

  // Search in parallel across all content types
  const [
    journalRes,
    storyRes,
    recipeRes,
    traditionRes,
    voiceRes,
    capsuleRes,
    memberRes,
    eventRes,
  ] = await Promise.all([
    // Journal entries
    supabase
      .from("journal_entries")
      .select("id, title, content, trip_date, created_at")
      .eq("family_id", activeFamilyId)
      .or(`title.ilike.${pattern},content.ilike.${pattern},location.ilike.${pattern}`)
      .order("created_at", { ascending: false })
      .limit(5),
    // Stories
    supabase
      .from("family_stories")
      .select("id, title, content, created_at")
      .eq("family_id", activeFamilyId)
      .or(`title.ilike.${pattern},content.ilike.${pattern}`)
      .order("created_at", { ascending: false })
      .limit(5),
    // Recipes
    supabase
      .from("recipes")
      .select("id, title, story, ingredients, created_at")
      .eq("family_id", activeFamilyId)
      .or(`title.ilike.${pattern},story.ilike.${pattern},ingredients.ilike.${pattern}`)
      .order("created_at", { ascending: false })
      .limit(5),
    // Traditions
    supabase
      .from("family_traditions")
      .select("id, title, description, created_at")
      .eq("family_id", activeFamilyId)
      .or(`title.ilike.${pattern},description.ilike.${pattern}`)
      .order("created_at", { ascending: false })
      .limit(5),
    // Voice memos
    supabase
      .from("voice_memos")
      .select("id, title, description, created_at")
      .eq("family_id", activeFamilyId)
      .or(`title.ilike.${pattern},description.ilike.${pattern}`)
      .order("created_at", { ascending: false })
      .limit(5),
    // Time capsules
    supabase
      .from("time_capsules")
      .select("id, title, content, unlock_date, created_at")
      .eq("family_id", activeFamilyId)
      .or(`title.ilike.${pattern},content.ilike.${pattern}`)
      .order("created_at", { ascending: false })
      .limit(5),
    // Family members
    supabase
      .from("family_members")
      .select("id, name, nickname, relationship, birth_place")
      .eq("family_id", activeFamilyId)
      .or(`name.ilike.${pattern},nickname.ilike.${pattern},relationship.ilike.${pattern},birth_place.ilike.${pattern}`)
      .limit(5),
    // Events
    supabase
      .from("family_events")
      .select("id, title, event_date, category")
      .eq("family_id", activeFamilyId)
      .ilike("title", pattern)
      .order("event_date", { ascending: false })
      .limit(5),
  ]);

  function snippet(text: string | null, maxLen = 80): string {
    if (!text) return "";
    const lower = text.toLowerCase();
    const idx = lower.indexOf(q.toLowerCase());
    if (idx === -1) return text.slice(0, maxLen) + (text.length > maxLen ? "..." : "");
    const start = Math.max(0, idx - 30);
    const end = Math.min(text.length, idx + q.length + 50);
    let s = (start > 0 ? "..." : "") + text.slice(start, end) + (end < text.length ? "..." : "");
    return s;
  }

  for (const j of journalRes.data ?? []) {
    results.push({
      type: "journal", id: j.id, title: j.title,
      snippet: snippet(j.content),
      href: `/dashboard/journal/${j.id}/edit`,
      icon: "📔", date: j.trip_date || j.created_at,
    });
  }
  for (const s of storyRes.data ?? []) {
    results.push({
      type: "story", id: s.id, title: s.title,
      snippet: snippet(s.content),
      href: `/dashboard/stories/${s.id}`,
      icon: "📖", date: s.created_at,
    });
  }
  for (const r of recipeRes.data ?? []) {
    results.push({
      type: "recipe", id: r.id, title: r.title,
      snippet: snippet(r.story || r.ingredients),
      href: `/dashboard/recipes/${r.id}`,
      icon: "🍳", date: r.created_at,
    });
  }
  for (const t of traditionRes.data ?? []) {
    results.push({
      type: "tradition", id: t.id, title: t.title,
      snippet: snippet(t.description),
      href: "/dashboard/traditions",
      icon: "🏠", date: t.created_at,
    });
  }
  for (const v of voiceRes.data ?? []) {
    results.push({
      type: "voice_memo", id: v.id, title: v.title,
      snippet: snippet(v.description),
      href: "/dashboard/voice-memos",
      icon: "🎙️", date: v.created_at,
    });
  }
  for (const c of capsuleRes.data ?? []) {
    results.push({
      type: "time_capsule", id: c.id, title: c.title,
      snippet: snippet(c.content),
      href: `/dashboard/time-capsules/${c.id}`,
      icon: "💌", date: c.unlock_date || c.created_at,
    });
  }
  for (const m of memberRes.data ?? []) {
    results.push({
      type: "member", id: m.id, title: m.nickname?.trim() || m.name,
      snippet: [m.relationship, m.birth_place].filter(Boolean).join(" · "),
      href: `/dashboard/members/${m.id}`,
      icon: "👤", date: null,
    });
  }
  for (const ev of eventRes.data ?? []) {
    results.push({
      type: "event", id: ev.id, title: ev.title,
      snippet: ev.category || "",
      href: "/dashboard/events",
      icon: "🎂", date: ev.event_date,
    });
  }

  // Sort by relevance (exact title matches first) then date
  results.sort((a, b) => {
    const aExact = a.title.toLowerCase().includes(q.toLowerCase()) ? 1 : 0;
    const bExact = b.title.toLowerCase().includes(q.toLowerCase()) ? 1 : 0;
    if (aExact !== bExact) return bExact - aExact;
    if (a.date && b.date) return new Date(b.date).getTime() - new Date(a.date).getTime();
    return 0;
  });

  return NextResponse.json({ results: results.slice(0, 20) });
}
