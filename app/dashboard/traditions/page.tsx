import { createClient } from "@/src/lib/supabase/server";
import { getActiveFamilyId } from "@/src/lib/family";
import { AddTraditionForm } from "./AddTraditionForm";
import { TraditionList } from "./TraditionList";
import { PlanLimitBadge } from "@/app/dashboard/components/PlanLimitBadge";
import { PLAN_LIMITS } from "@/src/lib/constants";
import { FamilyRequired } from "@/app/components/FamilyRequired";

export const metadata = { title: "Family Traditions | Family Nest" };

export default async function TraditionsPage() {
  const supabase = await createClient();
  const { activeFamilyId } = await getActiveFamilyId(supabase);
  if (!activeFamilyId) return <FamilyRequired />;

  const { data: familyPlan } = await supabase
    .from("families")
    .select("plan_type")
    .eq("id", activeFamilyId)
    .single();
  const planType = (familyPlan?.plan_type as "free" | "annual" | "legacy") ?? "free";

  const { data: traditions } = await supabase
    .from("family_traditions")
    .select(`
      id,
      title,
      description,
      when_it_happens,
      added_by,
      photo_url,
      added_by_member:family_members!added_by(name)
    `)
    .eq("family_id", activeFamilyId)
    .order("sort_order");

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-[var(--foreground)]">
            Family Traditions
          </h1>
          <p className="mt-2 text-[var(--muted)]">
            Taco Tuesday chants, holiday rituals, inside jokes. The cultural DNA that gets lost between generations.
          </p>
          {planType === "free" && (
            <div className="mt-2">
              <PlanLimitBadge used={traditions?.length ?? 0} limit={PLAN_LIMITS.free.traditions} label="traditions" />
            </div>
          )}
        </div>
        <AddTraditionForm />
      </div>

      <TraditionList
        traditions={(traditions ?? []) as Parameters<typeof TraditionList>[0]["traditions"]}
      />
    </div>
  );
}
