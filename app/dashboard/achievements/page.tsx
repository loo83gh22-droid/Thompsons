import { createClient } from "@/src/lib/supabase/server";
import { getActiveFamilyId } from "@/src/lib/family";
import { AchievementsGallery } from "./AchievementsGallery";
import { AddAchievement } from "./AddAchievement";

export default async function AchievementsPage() {
  const supabase = await createClient();
  const { activeFamilyId } = await getActiveFamilyId(supabase);
  if (!activeFamilyId) return null;

  const [{ data: achievements }, { data: members }] = await Promise.all([
    supabase
      .from("achievements")
      .select("id, what, achievement_date, location, description, attachment_url, family_members(name)")
      .eq("family_id", activeFamilyId)
      .order("sort_order"),
    supabase.from("family_members").select("id, name").eq("family_id", activeFamilyId).order("name"),
  ]);

  return (
    <div className="sports-page rounded-2xl border-2 border-[var(--sports-gold)] bg-[var(--sports-cream)] p-8 shadow-xl">
      <div className="mb-12 text-center">
        <h1 className="sports-title font-display text-4xl font-bold tracking-wide md:text-5xl">
          Achievements
        </h1>
        <p className="mt-3 text-lg text-[var(--sports-muted)]">
          Log cool achievements and team photos.
        </p>
      </div>

      <div className="mb-8 flex justify-center">
        <AddAchievement members={members || []} />
      </div>

      <div className="sports-trophy-case bg-white/30">
        <div className="sports-pennant mb-6 inline-block">
          <span className="text-sm font-semibold uppercase tracking-widest text-[var(--sports-gold)]">
            Achievements
          </span>
        </div>
        <AchievementsGallery achievements={achievements || []} />
      </div>
    </div>
  );
}
