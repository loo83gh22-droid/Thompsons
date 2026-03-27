import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/src/lib/supabase/server";
import { getActiveFamilyId } from "@/src/lib/family";
import { EditHomeForm } from "./EditHomeForm";

export const metadata: Metadata = { title: "Edit Home | Family Nest" };

type Props = { params: Promise<{ id: string }> };

export default async function EditHomePage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const { activeFamilyId } = await getActiveFamilyId(supabase);
  if (!activeFamilyId) return null;

  const [homeRes, membersRes] = await Promise.all([
    supabase
      .from("family_homes")
      .select("id, address, city, from_year, to_year, notes, family_home_members(member_id)")
      .eq("id", id)
      .eq("family_id", activeFamilyId)
      .single(),
    supabase
      .from("family_members")
      .select("id, name, nickname, color")
      .eq("family_id", activeFamilyId)
      .eq("is_remembered", false)
      .order("name"),
  ]);

  if (!homeRes.data) notFound();

  const existingMemberIds = (homeRes.data.family_home_members ?? []).map((hm: { member_id: string }) => hm.member_id);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Link href={`/dashboard/homes/${id}`} className="text-sm text-[var(--muted)] hover:text-[var(--foreground)]">
        ← Back
      </Link>
      <h1 className="mt-4 font-display text-2xl font-bold text-[var(--foreground)]">Edit home</h1>
      <EditHomeForm
        homeId={id}
        home={homeRes.data}
        members={membersRes.data ?? []}
        existingMemberIds={existingMemberIds}
      />
    </div>
  );
}
