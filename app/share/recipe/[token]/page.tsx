import { createClient } from "@/src/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";

type Props = { params: Promise<{ token: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token } = await params;
  const supabase = await createClient();
  const { data: recipe } = await supabase
    .from("recipes")
    .select("title, story")
    .eq("share_token", token)
    .eq("is_public", true)
    .single();

  if (!recipe) return { title: "Recipe Not Found" };

  return {
    title: `${recipe.title} — Family Nest`,
    description: recipe.story?.slice(0, 160) || `A family recipe shared from Family Nest.`,
    openGraph: {
      title: recipe.title,
      description: recipe.story?.slice(0, 160) || "A family recipe shared from Family Nest.",
      type: "article",
    },
  };
}

export default async function PublicRecipePage({ params }: Props) {
  const { token } = await params;
  const supabase = await createClient();

  const { data: recipe } = await supabase
    .from("recipes")
    .select("id, title, story, ingredients, instructions, occasions, taught_by, added_by, family_id, created_at")
    .eq("share_token", token)
    .eq("is_public", true)
    .single();

  if (!recipe) return notFound();

  // Get taught_by name
  let taughtByName: string | null = null;
  if (recipe.taught_by) {
    const { data: teacher } = await supabase
      .from("family_members")
      .select("name, nickname")
      .eq("id", recipe.taught_by)
      .single();
    if (teacher) taughtByName = teacher.nickname?.trim() || teacher.name;
  }

  // Get family name
  const { data: family } = await supabase
    .from("families")
    .select("name")
    .eq("id", recipe.family_id)
    .single();

  const familyName = family?.name || "A Family";

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <header className="border-b border-[var(--border)] bg-[var(--background)]/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/" className="font-display text-lg font-semibold text-[var(--primary)]">
            Family Nest
          </Link>
          <Link
            href="/login"
            className="rounded-full bg-[var(--primary)] px-5 py-2 text-sm font-medium text-[var(--primary-foreground)] hover:opacity-90"
          >
            Start YFamily Nest
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <div className="mb-8">
          <p className="text-sm font-medium text-[var(--accent)]">
            From the {familyName} Kitchen
          </p>
          <h1 className="mt-2 font-display text-3xl font-bold leading-tight text-[var(--foreground)] sm:text-4xl">
            {recipe.title}
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-[var(--muted)]">
            {taughtByName && <span>Taught by {taughtByName}</span>}
            {recipe.occasions && (
              <>
                {taughtByName && <span>&middot;</span>}
                <span>{recipe.occasions}</span>
              </>
            )}
          </div>
        </div>

        {/* Story behind the recipe */}
        {recipe.story && (
          <div className="mb-8 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--accent)]">
              The Story
            </h2>
            <p className="mt-2 text-[var(--muted)] leading-relaxed whitespace-pre-wrap">
              {recipe.story}
            </p>
          </div>
        )}

        <div className="grid gap-8 sm:grid-cols-2">
          {/* Ingredients */}
          {recipe.ingredients && (
            <div>
              <h2 className="font-display text-lg font-bold text-[var(--foreground)]">
                Ingredients
              </h2>
              <div className="mt-3 whitespace-pre-wrap text-sm text-[var(--muted)] leading-relaxed">
                {recipe.ingredients}
              </div>
            </div>
          )}

          {/* Instructions */}
          {recipe.instructions && (
            <div>
              <h2 className="font-display text-lg font-bold text-[var(--foreground)]">
                Instructions
              </h2>
              <div className="mt-3 whitespace-pre-wrap text-sm text-[var(--muted)] leading-relaxed">
                {recipe.instructions}
              </div>
            </div>
          )}
        </div>

        {/* CTA */}
        <div className="mt-12 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 text-center sm:p-8">
          <h2 className="font-display text-xl font-bold text-[var(--foreground)]">
            Your family has recipes worth saving too.
          </h2>
          <p className="mt-2 text-[var(--muted)]">
            Family Nest helps you preserve the stories behind your food &mdash; who taught it, when you make it, and the memories around the table.
          </p>
          <Link
            href="/login"
            className="mt-4 inline-block rounded-full bg-[var(--primary)] px-8 py-3 font-medium text-[var(--primary-foreground)] hover:opacity-90"
          >
            Start YFamily Nest &mdash; Free
          </Link>
        </div>
      </main>
    </div>
  );
}
