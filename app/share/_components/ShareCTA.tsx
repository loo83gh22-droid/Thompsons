import Link from "next/link";

/**
 * ShareCTA — the conversion block shown at the bottom of every public
 * `/share/*` page. A non-member has just read a real memory from a real
 * family; this is the single highest-intent moment we get to turn a
 * viewer into a signup. Keep it warm, specific, and free-first.
 *
 * Used by all five share pages (journal, story, recipe, artwork, memo)
 * so the conversion surface stays consistent and is improved in one place.
 */
export function ShareCTA({
  familyName,
  contentType,
}: {
  /** The sharing family's name, e.g. "Thompson". */
  familyName: string;
  /** What they just viewed, lowercase singular: "memory", "story", "recipe", "drawing", "voice memo". */
  contentType: string;
}) {
  const fam = familyName && familyName !== "A Family" ? `the ${familyName} family` : "this family";

  return (
    <section className="mt-12">
      <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)]">
        <div className="h-1 w-full bg-gradient-to-r from-[var(--primary)] via-[var(--accent)] to-[var(--primary)]" />
        <div className="px-6 py-8 text-center sm:px-10 sm:py-10">
          <p className="text-sm font-medium text-[var(--accent)]">
            You just saw a {contentType} from {fam}.
          </p>
          <h2 className="mt-2 font-display text-2xl font-bold leading-tight text-[var(--foreground)] sm:text-3xl">
            Your family has moments worth keeping too.
          </h2>
          <p className="mx-auto mt-3 max-w-md text-[var(--muted)]">
            Family Nest is a private home for your family&apos;s photos, stories,
            recipes, and voices — the moments a camera roll quietly loses.
          </p>

          {/* Benefit bullets — the part that's genuinely hard to copy: privacy + permanence */}
          <ul className="mx-auto mt-5 flex max-w-md flex-col gap-2 text-left text-sm text-[var(--foreground)]/85">
            <li className="flex items-start gap-2">
              <span aria-hidden className="text-[var(--accent)]">✓</span>
              Private by default — no ads, no algorithm, no audience.
            </li>
            <li className="flex items-start gap-2">
              <span aria-hidden className="text-[var(--accent)]">✓</span>
              Keep voices and handwriting, not just photos.
            </li>
            <li className="flex items-start gap-2">
              <span aria-hidden className="text-[var(--accent)]">✓</span>
              Free to start. Your whole household in one place.
            </li>
          </ul>

          <Link
            href="/login?mode=signup"
            className="mt-6 inline-block rounded-full bg-[var(--primary)] px-8 py-3 font-semibold text-[var(--primary-foreground)] shadow-sm transition-opacity hover:opacity-90"
          >
            Start your family&apos;s Nest — free
          </Link>

          {familyName && familyName !== "A Family" && (
            <p className="mt-4 text-xs text-[var(--muted)]">
              Already part of the {familyName} family?{" "}
              Ask them to send you an invite link so you join their Nest.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
