import Link from "next/link";

const features = [
  {
    icon: "📔",
    title: "Journal with Photos & Video",
    description:
      "Write about trips, milestones, and everyday moments. Attach photos and short videos — the gems, not everything.",
  },
  {
    icon: "🗺️",
    title: "Family Travel Map",
    description:
      "Pin everywhere your family has been. Vacations, homes, birthplaces — watch your map fill up over the years.",
  },
  {
    icon: "🎙️",
    title: "Voice Memos",
    description:
      "Record grandma's stories, a child's first words, or a bedtime tradition. Voices fade — these won't.",
  },
  {
    icon: "💊",
    title: "Time Capsules",
    description:
      "Write a letter to your future self — or your kids. Seal it and set an unlock date. They'll open it years from now.",
  },
  {
    icon: "📖",
    title: "Stories & Recipes",
    description:
      "Capture family stories that would otherwise only live in someone's memory. Save grandma's recipes with the story behind them.",
  },
  {
    icon: "🌳",
    title: "Family Tree & Profiles",
    description:
      "Map your family. Every member gets a profile with photos, birthdays, and their role in the family story.",
  },
];

const steps = [
  {
    number: "1",
    title: "Create your Nest",
    description: "Sign up in 30 seconds. Name your family. You're in.",
  },
  {
    number: "2",
    title: "Invite your family",
    description:
      "Send invites to family members — parents, siblings, grandparents, the cousin overseas.",
  },
  {
    number: "3",
    title: "Start capturing",
    description:
      "Journal a trip. Upload photos. Record a voice memo. Everyone contributes, everyone sees it.",
  },
];

export default function HomePage() {
  return (
    <div className="relative">
      {/* ─── Hero ─────────────────────────────────────────── */}
      <section className="relative flex min-h-[90vh] flex-col items-center justify-center px-6 py-24">
        <div className="mx-auto max-w-4xl text-center">
          <p className="font-display text-sm font-medium uppercase tracking-[0.2em] text-[var(--accent)]">
            Our Family Nest
          </p>

          <h1 className="mt-6 font-display text-4xl font-bold leading-tight tracking-tight text-[var(--foreground)] sm:text-6xl md:text-7xl">
            The private place where
            <br />
            <span className="text-[var(--accent)]">family memories live forever</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-[var(--muted)] sm:text-xl">
            Not social media. Not a shared drive. A beautiful, private space to
            document your family&apos;s life — journals, photos, videos, voice
            memos, recipes, and more. You start it. Your kids take it over.
          </p>

          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/login?mode=signup"
              className="inline-flex items-center justify-center rounded-lg bg-[var(--accent)] px-8 py-4 text-lg font-semibold text-[var(--background)] transition-all hover:bg-[var(--accent-muted)] hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(212,168,83,0.3)]"
            >
              Get Started Free
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center justify-center rounded-lg border border-[var(--border)] px-8 py-4 text-lg font-medium text-[var(--muted)] transition-colors hover:border-[var(--accent)] hover:text-[var(--foreground)]"
            >
              See Plans
            </Link>
          </div>

          <p className="mt-4 text-sm text-[var(--muted)]">
            Free forever for up to 10 journal entries. No credit card needed.
          </p>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-10 flex flex-col items-center gap-2 text-[var(--muted)]">
          <span className="text-xs uppercase tracking-widest">Scroll</span>
          <svg
            className="h-5 w-5 animate-bounce"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 14l-7 7m0 0l-7-7m7 7V3"
            />
          </svg>
        </div>
      </section>

      {/* ─── Trust bar ────────────────────────────────────── */}
      <section className="border-y border-[var(--border)] bg-[var(--surface)]/40 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-x-8 gap-y-3 px-6 py-5 text-sm text-[var(--muted)]">
          <span className="flex items-center gap-2">
            <span className="text-[var(--accent)]">&#x2713;</span> Private &
            family-only
          </span>
          <span className="flex items-center gap-2">
            <span className="text-[var(--accent)]">&#x2713;</span> No ads, no
            algorithms
          </span>
          <span className="flex items-center gap-2">
            <span className="text-[var(--accent)]">&#x2713;</span> Your data
            stays yours
          </span>
          <span className="flex items-center gap-2">
            <span className="text-[var(--accent)]">&#x2713;</span> Works on
            every device
          </span>
        </div>
      </section>

      {/* ─── How it works ─────────────────────────────────── */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <h2 className="font-display text-3xl font-bold text-[var(--foreground)] sm:text-4xl">
              Up and running in minutes
            </h2>
            <p className="mt-3 text-[var(--muted)]">
              No complicated setup. No learning curve.
            </p>
          </div>

          <div className="mt-16 grid gap-8 sm:grid-cols-3">
            {steps.map((step) => (
              <div key={step.number} className="text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--accent)]/15 text-xl font-bold text-[var(--accent)]">
                  {step.number}
                </div>
                <h3 className="mt-5 font-display text-xl font-semibold text-[var(--foreground)]">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Feature showcase ─────────────────────────────── */}
      <section className="border-t border-[var(--border)] bg-[var(--surface)]/20 px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <h2 className="font-display text-3xl font-bold text-[var(--foreground)] sm:text-4xl">
              Everything your family needs, nothing it doesn&apos;t
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-[var(--muted)]">
              Built for real families — not influencers. Every feature exists
              because a family asked for it.
            </p>
          </div>

          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group rounded-xl border border-[var(--border)] bg-[var(--surface)]/50 p-6 transition-all hover:border-[var(--accent)]/40 hover:shadow-[0_0_30px_rgba(212,168,83,0.06)]"
              >
                <span className="text-3xl">{feature.icon}</span>
                <h3 className="mt-4 font-display text-lg font-semibold text-[var(--foreground)]">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>

          {/* Extra features row */}
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            {[
              "Family Messages",
              "Sports & Activities",
              "Family Traditions",
              "Birthday Reminders",
              "Global Search",
              "Shareable Links",
              "Kid Accounts",
              "Family Spotify",
              "Da Box",
            ].map((f) => (
              <span
                key={f}
                className="rounded-full border border-[var(--border)] bg-[var(--surface)]/40 px-4 py-1.5 text-xs text-[var(--muted)]"
              >
                {f}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ─── The emotional "why" ──────────────────────────── */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-display text-3xl font-bold text-[var(--foreground)] sm:text-4xl">
            Because memories don&apos;t belong on social media
          </h2>
          <div className="mt-8 space-y-6 text-lg leading-relaxed text-[var(--muted)]">
            <p>
              Your family&apos;s story is scattered across Instagram, iCloud,
              WhatsApp, and a dozen other apps. Half your relatives never see it.
              The other half sees it between ads and strangers&apos; content.
            </p>
            <p>
              Our Family Nest is different. It&apos;s private. It&apos;s
              permanent. Everyone in the family can contribute — parents,
              grandparents, even the kids. And one day, when you hand it over,
              it becomes{" "}
              <span className="text-[var(--accent)]">their inheritance</span>.
            </p>
            <p className="font-display text-xl italic text-[var(--foreground)]">
              Not money. Not things. The story of where they came from.
            </p>
          </div>
        </div>
      </section>

      {/* ─── Pricing preview ──────────────────────────────── */}
      <section className="border-t border-[var(--border)] bg-[var(--surface)]/20 px-6 py-24">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="font-display text-3xl font-bold text-[var(--foreground)] sm:text-4xl">
            Simple, honest pricing
          </h2>
          <p className="mt-3 text-[var(--muted)]">
            Start free. Upgrade when your family outgrows it.
          </p>

          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)]/50 p-6">
              <p className="font-display text-lg font-semibold text-[var(--foreground)]">
                The Nest
              </p>
              <p className="mt-2 font-display text-3xl font-bold text-[var(--accent)]">
                Free
              </p>
              <p className="mt-2 text-sm text-[var(--muted)]">
                10 journal entries, 500 MB storage, family tree, map view
              </p>
            </div>
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)]/50 p-6">
              <p className="font-display text-lg font-semibold text-[var(--foreground)]">
                The Full Nest
              </p>
              <p className="mt-2 font-display text-3xl font-bold text-[var(--accent)]">
                $49<span className="text-base font-normal text-[var(--muted)]">/yr</span>
              </p>
              <p className="mt-2 text-sm text-[var(--muted)]">
                Unlimited everything, videos, voice memos, 10 GB
              </p>
            </div>
            <div className="relative rounded-xl border border-[var(--accent)]/50 bg-[var(--surface)]/50 p-6 shadow-[0_0_30px_rgba(212,168,83,0.08)]">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[var(--accent)] px-3 py-0.5 text-xs font-semibold text-[var(--background)]">
                Recommended
              </span>
              <p className="font-display text-lg font-semibold text-[var(--foreground)]">
                The Legacy
              </p>
              <p className="mt-2 font-display text-3xl font-bold text-[var(--accent)]">
                $349<span className="text-base font-normal text-[var(--muted)]"> once</span>
              </p>
              <p className="mt-2 text-sm text-[var(--muted)]">
                Lifetime access. 50 GB. Ownership transfer. Data export.
              </p>
            </div>
          </div>

          <Link
            href="/pricing"
            className="mt-8 inline-flex items-center gap-1 text-sm font-medium text-[var(--accent)] hover:underline"
          >
            Compare all features
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </section>

      {/* ─── Final CTA ────────────────────────────────────── */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-display text-3xl font-bold text-[var(--foreground)] sm:text-4xl">
            Your family&apos;s story starts here
          </h2>
          <p className="mt-4 text-lg text-[var(--muted)]">
            It takes 30 seconds to create your Nest. Invite your family today
            and start building something they&apos;ll thank you for later.
          </p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/login?mode=signup"
              className="inline-flex items-center justify-center rounded-lg bg-[var(--accent)] px-8 py-4 text-lg font-semibold text-[var(--background)] transition-all hover:bg-[var(--accent-muted)] hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(212,168,83,0.3)]"
            >
              Get Started Free
            </Link>
            <Link
              href="/login"
              className="text-sm text-[var(--muted)] hover:text-[var(--foreground)]"
            >
              Already have an account? Sign in
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Footer ───────────────────────────────────────── */}
      <footer className="border-t border-[var(--border)] bg-[var(--surface)]/20 px-6 py-10">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-6 sm:flex-row sm:justify-between">
          <div className="text-center sm:text-left">
            <p className="font-display text-lg font-semibold text-[var(--foreground)]">
              Our Family Nest
            </p>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Private. Permanent. Yours.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-[var(--muted)]">
            <Link href="/pricing" className="hover:text-[var(--foreground)]">
              Pricing
            </Link>
            <Link href="/terms" className="hover:text-[var(--foreground)]">
              Terms
            </Link>
            <Link href="/privacy" className="hover:text-[var(--foreground)]">
              Privacy
            </Link>
            <Link href="/login" className="hover:text-[var(--foreground)]">
              Sign in
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
