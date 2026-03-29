import { createClient } from "@/src/lib/supabase/server";
import { getActiveFamilyId } from "@/src/lib/family";
import { redirect } from "next/navigation";
import { DigestCuratorClient } from "./DigestCuratorClient";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Send a Family Update | Family Nest" };

const TWENTY_ONE_DAYS_AGO = new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString();

export default async function DigestPage() {
  const supabase = await createClient();
  const { activeFamilyId } = await getActiveFamilyId(supabase);
  if (!activeFamilyId) redirect("/dashboard");

  const [journalRes, memosRes, storiesRes, contactsRes] = await Promise.all([
    supabase
      .from("journal_entries")
      .select("id, title, trip_date, created_at, is_public, share_token")
      .eq("family_id", activeFamilyId)
      .gte("created_at", TWENTY_ONE_DAYS_AGO)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("voice_memos")
      .select("id, title, recorded_date, created_at, is_public, share_token")
      .eq("family_id", activeFamilyId)
      .gte("created_at", TWENTY_ONE_DAYS_AGO)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("family_stories")
      .select("id, title, created_at, is_public, share_token")
      .eq("family_id", activeFamilyId)
      .eq("published", true)
      .gte("created_at", TWENTY_ONE_DAYS_AGO)
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("family_contacts")
      .select("id, name, email, relationship")
      .eq("family_id", activeFamilyId)
      .order("name"),
  ]);

  type DigestItem = {
    id: string;
    type: "journal" | "memo" | "story";
    title: string;
    date: string;
    isPublic: boolean;
    shareToken: string | null;
  };

  const items: DigestItem[] = [
    ...(journalRes.data ?? []).map((e) => ({
      id: e.id,
      type: "journal" as const,
      title: e.title ?? "Untitled entry",
      date: e.trip_date ?? e.created_at,
      isPublic: e.is_public ?? false,
      shareToken: e.share_token ?? null,
    })),
    ...(memosRes.data ?? []).map((m) => ({
      id: m.id,
      type: "memo" as const,
      title: m.title ?? "Untitled memo",
      date: m.recorded_date ?? m.created_at,
      isPublic: m.is_public ?? false,
      shareToken: m.share_token ?? null,
    })),
    ...(storiesRes.data ?? []).map((s) => ({
      id: s.id,
      type: "story" as const,
      title: s.title ?? "Untitled story",
      date: s.created_at,
      isPublic: s.is_public ?? false,
      shareToken: s.share_token ?? null,
    })),
  ];

  const contacts = (contactsRes.data ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    email: c.email ?? null,
    relationship: c.relationship ?? null,
  }));

  return <DigestCuratorClient items={items} contacts={contacts} />;
}
