import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/src/lib/supabase/server";
import { getActiveFamilyId } from "@/src/lib/family";
import { NewHomeForm } from "./NewHomeForm";
import { FamilyRequired } from "@/app/components/FamilyRequired";

export const metadata: Metadata = { title: "Add Home | Family Nest" };

export default async function NewHomePage() {
  const supabase = await createClient();
  const { activeFamilyId } = await getActiveFamilyId(supabase);
  if (!activeFamilyId) return <FamilyRequired />;

  const { data: members } = await supabase
    .from("family_members")
    .select("id, name, nickname, color")
    .eq("family_id", activeFamilyId)
    .eq("is_remembered", false)
    .order("name");

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Link href="/dashboard/homes" className="text-sm text-[var(--muted)] hover:text-[var(--foreground)]">
        ← Our Homes
      </Link>
      <h1 className="mt-4 font-display text-2xl font-bold text-[var(--foreground)]">Add a home</h1>
      <p className="mt-1 text-sm text-[var(--muted)]">Document a place your family lived — past or present.</p>
      <NewHomeForm members={members ?? []} />
    </div>
  );
}
