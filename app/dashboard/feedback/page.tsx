import { createClient } from "@/src/lib/supabase/server";
import { getActiveFamilyId } from "@/src/lib/family";
import { FeedbackForm } from "./FeedbackForm";
import { FeedbackList } from "./FeedbackList";

export const metadata = { title: "Feedback | Family Nest" };

export default async function FeedbackPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { activeFamilyId } = await getActiveFamilyId(supabase);
  if (!activeFamilyId) return null;

  // Check if user is owner
  const { data: myMember } = await supabase
    .from("family_members")
    .select("id, role")
    .eq("user_id", user.id)
    .eq("family_id", activeFamilyId)
    .single();

  const isOwner = myMember?.role === "owner";

  // Fetch feedback - owners see all, others see own
  let query = supabase
    .from("feedback")
    .select("*, family_members(display_name, photo_url)")
    .eq("family_id", activeFamilyId)
    .order("created_at", { ascending: false });

  if (!isOwner) {
    query = query.eq("user_id", user.id);
  }

  const { data: feedbackItems } = await query;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl font-bold text-[var(--foreground)]">
          Feedback
        </h1>
        <p className="mt-2 text-[var(--muted)]">
          Help us make your family site even better
        </p>
      </div>

      {/* Submit form */}
      <section>
        <h2 className="mb-4 font-display text-lg font-semibold text-[var(--foreground)]">
          Share Your Thoughts
        </h2>
        <FeedbackForm />
      </section>

      {/* Feedback list */}
      <section>
        <h2 className="mb-4 font-display text-lg font-semibold text-[var(--foreground)]">
          {isOwner ? "All Family Feedback" : "Your Feedback"}
        </h2>
        <FeedbackList items={feedbackItems ?? []} isOwner={isOwner} />
      </section>
    </div>
  );
}
