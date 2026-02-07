import Link from "next/link";
import { createClient } from "@/src/lib/supabase/server";
import { getActiveFamilyId } from "@/src/lib/family";
import { AddTraditionForm } from "./AddTraditionForm";
import { TraditionList } from "./TraditionList";

export default async function TraditionsPage() {
  const supabase = await createClient();
  const { activeFamilyId } = await getActiveFamilyId(supabase);
  if (!activeFamilyId) return null;

  const { data: traditions } = await supabase
    .from("family_traditions")
    .select(`
      id,
      title,
      description,
      when_it_happens,
      added_by,
      added_by_member:family_members!added_by(name)
    `)
    .eq("family_id", activeFamilyId)
    .order("sort_order");

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link
            href="/dashboard"
            className="text-sm text-[var(--muted)] hover:text-[var(--foreground)]"
          >
            ← Home
          </Link>
          <h1 className="mt-2 font-display text-4xl font-bold text-[var(--foreground)]">
            Family Traditions
          </h1>
          <p className="mt-2 text-lg text-[var(--muted)]">
            Taco Tuesday chants, holiday rituals, inside jokes — the cultural DNA that gets lost between generations.
          </p>
        </div>
        <AddTraditionForm />
      </div>

      <TraditionList
        traditions={(traditions ?? []) as Parameters<typeof TraditionList>[0]["traditions"]}
      />
    </div>
  );
}
